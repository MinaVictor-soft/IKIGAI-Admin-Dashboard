import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Medal, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function LevelsPage() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [editLevel, setEditLevel] = useState<any>(null);

  const { data: levels, isLoading } = useQuery({
    queryKey: ['levels'],
    queryFn: () => api.get('/admin/levels').then((r) => r.data),
  });

  const createLevel = useMutation({
    mutationFn: (data: any) => api.post('/admin/levels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      setShowCreate(false);
      toast.success('Level created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to create level'),
  });

  const updateLevel = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/levels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      setEditLevel(null);
      toast.success('Level updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update level'),
  });

  const deleteLevel = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/levels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      setEditLevel(null);
      toast.success('Level deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to delete level'),
  });

  const recalculate = useMutation({
    mutationFn: () => api.post('/admin/levels/recalculate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success('Levels recalculated for all users');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900">{t('levels')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => recalculate.mutate()}
            disabled={recalculate.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={recalculate.isPending ? 'animate-spin' : ''} /> {t('recalculate')}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} /> {t('addLevel')}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('levelsDescription')}</p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : levels?.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Medal size={48} className="mx-auto mb-3 opacity-50" />
          <p>{t('noLevelsYet')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {levels?.map((level: any) => (
            <div
              key={level.id}
              onClick={() => setEditLevel(level)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer relative group"
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: level.color || '#6366F1' }}
                >
                  {level.displayOrder}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{level.name}</h3>
                  {level.color && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {level.color}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-gray-900">{level.minXp}</div>
                  <div className="text-xs text-gray-500">Min XP</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-indigo-600">{level.maxXp ?? '∞'}</div>
                  <div className="text-xs text-gray-500">Max XP</div>
                </div>
              </div>

              <div className="mt-3 bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-green-600">{level._count?.users ?? 0}</div>
                <div className="text-xs text-gray-500">{t('users')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <LevelModal
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createLevel.mutate(data)}
          loading={createLevel.isPending}
        />
      )}

      {editLevel && (
        <LevelModal
          level={editLevel}
          onClose={() => setEditLevel(null)}
          onSubmit={(data) => updateLevel.mutate({ id: editLevel.id, data })}
          onDelete={() => {
            if (confirm(t('confirmDeleteLevel'))) deleteLevel.mutate(editLevel.id);
          }}
          loading={updateLevel.isPending}
        />
      )}
    </div>
  );
}

function LevelModal({ level, onClose, onSubmit, onDelete, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: level?.name || '',
    displayOrder: level?.displayOrder?.toString() || '1',
    minXp: level?.minXp?.toString() || '0',
    maxXp: level?.maxXp?.toString() || '',
    color: level?.color || '#6366F1',
    badgeUrl: level?.badgeUrl || '',
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const colors = ['#CD7F32', '#C0C0C0', '#FFD700', '#7C3AED', '#06B6D4', '#22C55E', '#EF4444', '#EC4899'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{level ? 'Edit Level' : t('addLevel')}</h3>
          {level && onDelete && (
            <button onClick={onDelete} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              name: form.name,
              displayOrder: parseInt(form.displayOrder),
              minXp: parseInt(form.minXp),
              maxXp: form.maxXp ? parseInt(form.maxXp) : undefined,
              color: form.color || undefined,
              badgeUrl: form.badgeUrl || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={t('levelNamePlaceholder')}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order *</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => set('displayOrder', e.target.value)}
                min={1}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min XP *</label>
              <input
                type="number"
                value={form.minXp}
                onChange={(e) => set('minXp', e.target.value)}
                min={0}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max XP</label>
              <input
                type="number"
                value={form.maxXp}
                onChange={(e) => set('maxXp', e.target.value)}
                min={0}
                placeholder="∞"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('color')}</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
              placeholder="#HEX"
              pattern="^#[0-9A-Fa-f]{6}$"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge URL</label>
            <input
              value={form.badgeUrl}
              onChange={(e) => set('badgeUrl', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? '...' : level ? t('save') : t('addLevel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
