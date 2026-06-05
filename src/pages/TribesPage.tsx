import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Users, Palette, Pencil } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function TribesPage() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [editTribe, setEditTribe] = useState<any>(null);

  const { data: tribes, isLoading } = useQuery({
    queryKey: ['tribes'],
    queryFn: () => api.get('/admin/tribes').then((r) => r.data),
  });

  const createTribe = useMutation({
    mutationFn: (data: any) => api.post('/admin/tribes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribes'] });
      setShowCreate(false);
      toast.success('Tribe created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to create tribe'),
  });

  const updateTribe = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/tribes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribes'] });
      setEditTribe(null);
      toast.success('Tribe updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update tribe'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('tribes')}</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> {t('createTribe')}
        </button>
      </div>

      {/* Tribes Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : tribes?.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>No tribes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tribes?.map((tribe: any) => (
            <div
              key={tribe.id}
              onClick={() => setEditTribe(tribe)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer relative group"
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: tribe.color || '#6366F1' }}
                >
                  {tribe.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tribe.name}</h3>
                  {tribe.color && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Palette size={10} />
                      {tribe.color}
                    </div>
                  )}
                </div>
              </div>

              {tribe.description && (
                <p className="text-sm text-gray-500 mb-3">{tribe.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-gray-900">
                    {tribe._count?.members ?? tribe.memberCount ?? 0}
                  </div>
                  <div className="text-xs text-gray-500">{t('members')}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-indigo-600">{tribe.totalXp}</div>
                  <div className="text-xs text-gray-500">{t('totalXp')}</div>
                </div>
              </div>

              {tribe.maxMembers && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('capacity')}</span>
                    <span>{tribe._count?.members ?? tribe.memberCount ?? 0} / {tribe.maxMembers}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((tribe._count?.members ?? tribe.memberCount ?? 0) / tribe.maxMembers) * 100)}%`,
                        backgroundColor: tribe.color || '#6366F1',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Tribe Modal */}
      {showCreate && (
        <CreateTribeModal
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createTribe.mutate(data)}
          loading={createTribe.isPending}
        />
      )}

      {/* Edit Tribe Modal */}
      {editTribe && (
        <EditTribeModal
          tribe={editTribe}
          onClose={() => setEditTribe(null)}
          onSubmit={(data) => updateTribe.mutate({ id: editTribe.id, data })}
          loading={updateTribe.isPending}
        />
      )}
    </div>
  );
}

function CreateTribeModal({ onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', description: '', color: '#6366F1', maxMembers: '' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const colors = ['#7C3AED', '#06B6D4', '#EAB308', '#22C55E', '#EF4444', '#F97316', '#EC4899', '#6366F1'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">{t('createTribe')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              name: form.name,
              description: form.description || undefined,
              color: form.color || undefined,
              maxMembers: form.maxMembers ? parseInt(form.maxMembers) : undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('tribeName')} *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Vision"
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxMembers')}</label>
            <input
              type="number"
              value={form.maxMembers}
              onChange={(e) => set('maxMembers', e.target.value)}
              placeholder={t('unlimited')}
              min={1}
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
              {loading ? '...' : t('createTribe')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTribeModal({ tribe, onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: tribe.name || '',
    description: tribe.description || '',
    color: tribe.color || '#6366F1',
    maxMembers: tribe.maxMembers?.toString() || '',
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const colors = ['#7C3AED', '#06B6D4', '#EAB308', '#22C55E', '#EF4444', '#F97316', '#EC4899', '#6366F1'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: form.color }}
          >
            {form.name.charAt(0)}
          </div>
          <h3 className="text-lg font-bold">Edit Tribe</h3>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xl font-bold text-gray-900">{tribe._count?.members ?? tribe.memberCount ?? 0}</div>
            <div className="text-xs text-gray-500">{t('members')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xl font-bold text-indigo-600">{tribe.totalXp}</div>
            <div className="text-xs text-gray-500">{t('totalXp')}</div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data: any = {};
            if (form.name !== tribe.name) data.name = form.name;
            if (form.description !== (tribe.description || '')) data.description = form.description || undefined;
            if (form.color !== (tribe.color || '')) data.color = form.color;
            const newMax = form.maxMembers ? parseInt(form.maxMembers) : null;
            if (newMax !== tribe.maxMembers) data.maxMembers = newMax;
            onSubmit(data);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('tribeName')}</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            />
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
              pattern="^#[0-9A-Fa-f]{6}$"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxMembers')}</label>
            <input
              type="number"
              value={form.maxMembers}
              onChange={(e) => set('maxMembers', e.target.value)}
              placeholder={t('unlimited')}
              min={1}
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
              {loading ? '...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
