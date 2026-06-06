import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Trophy, Users, History, Star, Trash2, RefreshCw, Plus } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function XpPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<'individual' | 'tribes' | 'levels'>('individual');
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [historyUserName, setHistoryUserName] = useState('');

  const { data: leaderboard, isLoading: lbLoading, isError: lbError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/xp/leaderboard?limit=100').then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: tribes, isLoading: tribesLoading, isError: tribesError } = useQuery({
    queryKey: ['tribe-leaderboard'],
    queryFn: () => api.get('/xp/tribes').then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: xpHistory } = useQuery({
    queryKey: ['xp-history', historyUserId],
    queryFn: () => api.get(`/xp/history/${historyUserId}`).then((r) => r.data),
    enabled: !!historyUserId,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('xpLeaderboard')}</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button onClick={() => setTab('individual')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'individual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          <Trophy size={16} /> {t('individual')}
        </button>
        <button onClick={() => setTab('tribes')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'tribes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          <Users size={16} /> {t('tribes')}
        </button>
        <button onClick={() => setTab('levels')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'levels' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          <Star size={16} /> {t('levels')}
        </button>
      </div>

      {tab === 'individual' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-start px-4 py-3 font-medium text-gray-600 w-12">#</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('name')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">🏛️ {t('church')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('tribe')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('level')}</th>
                <th className="text-end px-4 py-3 font-medium text-gray-600">{t('conferenceXp')}</th>
                <th className="text-end px-4 py-3 font-medium text-gray-600">{t('sportsXp')}</th>
                <th className="text-end px-4 py-3 font-medium text-gray-600">{t('totalXp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lbLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : lbError ? (
                <tr><td colSpan={7} className="text-center py-8 text-red-400">Failed to load leaderboard. Please check your connection and try again.</td></tr>
              ) : leaderboard?.map((u: any, i: number) => (
                <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setHistoryUserId(u.id); setHistoryUserName(u.name); }}>
                  <td className="px-4 py-3 font-bold text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {u.church || u.diocese ? (
                      <span>{u.church}{u.diocese ? ` • ${u.diocese}` : ''}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.tribe ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: u.tribe.color + '20', color: u.tribe.color }}>{u.tribe.name}</span>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.level?.name || '—'}</td>
                  <td className="px-4 py-3 text-end text-sm text-gray-600">{u.conferenceXp ?? u.totalXp}</td>
                  <td className="px-4 py-3 text-end text-sm text-gray-600">{u.sportsXp ?? 0}</td>
                  <td className="px-4 py-3 text-end font-bold text-indigo-600">{u.totalXp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'tribes' && (
        <div className="grid gap-4">
          {tribesLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : tribesError ? (
            <div className="text-center py-8 text-red-400">Failed to load tribe leaderboard. Please check your connection and try again.</div>
          ) : tribes?.map((t: any, i: number) => (
            <div key={t.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-300 w-8">{i + 1}</div>
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: t.color }} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-sm text-gray-500">{t.memberCount} members</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-indigo-600">{t.totalXp}</p>
                <p className="text-xs text-gray-400">total XP</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'levels' && <LevelsTab />}



      {/* XP History Modal */}
      {historyUserId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setHistoryUserId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <History size={20} className="text-indigo-600" />
              <h3 className="text-lg font-bold">{historyUserName} - {t('xpHistory')}</h3>
            </div>
            {!xpHistory ? (
              <p className="text-center text-gray-400 py-4">Loading...</p>
            ) : xpHistory.length === 0 ? (
              <p className="text-center text-gray-400 py-4">No XP transactions yet</p>
            ) : (
              <div className="space-y-2">
                {xpHistory.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description || tx.sourceType}</p>
                      <p className="text-xs text-gray-500">{tx.sourceType} • {new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setHistoryUserId(null)} className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ LEVELS TAB ============ */
function LevelsTab() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: levels, isLoading } = useQuery({
    queryKey: ['admin-levels'],
    queryFn: () => api.get('/admin/levels').then((r) => r.data),
  });

  const createLevel = useMutation({
    mutationFn: (data: any) => api.post('/admin/levels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-levels'] });
      setShowCreate(false);
      toast.success('Level created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const updateLevel = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/levels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-levels'] });
      setEditingId(null);
      toast.success('Level updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const deleteLevel = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/levels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-levels'] });
      toast.success('Level deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const recalculate = useMutation({
    mutationFn: () => api.post('/admin/levels/recalculate'),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-levels'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success(`Levels recalculated for ${res.data.updated} users`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{t('levelsDescription')}</p>
        <div className="flex gap-2">
          <button onClick={() => recalculate.mutate()} disabled={recalculate.isPending} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50" title="Recalculate all user levels based on current XP">
            <RefreshCw size={14} className={recalculate.isPending ? 'animate-spin' : ''} /> {t('recalculate')}
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> {t('addLevel')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">{t('loading')}</div>
      ) : levels?.length === 0 ? (
        <div className="text-center py-8 text-gray-400">{t('noLevelsYet')}</div>
      ) : (
        <div className="space-y-3">
          {levels?.map((lv: any) => (
            <div key={lv.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              {editingId === lv.id ? (
                <LevelEditForm level={lv} onSave={(data) => updateLevel.mutate({ id: lv.id, data })} onCancel={() => setEditingId(null)} loading={updateLevel.isPending} />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: lv.color || '#6366f1' }}>
                    {lv.displayOrder}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{lv.name}</h4>
                    <p className="text-xs text-gray-500">
                      {lv.minXp} XP {lv.maxXp ? `→ ${lv.maxXp} XP` : '+'} • {lv._count?.users ?? 0} {t('users')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingId(lv.id)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">{t('edit')}</button>
                    <button onClick={() => { if (confirm(t('confirmDeleteLevel'))) deleteLevel.mutate(lv.id); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{t('addLevel')}</h3>
            <LevelForm onSubmit={(d) => createLevel.mutate(d)} onClose={() => setShowCreate(false)} loading={createLevel.isPending} />
          </div>
        </div>
      )}
    </div>
  );
}

function LevelForm({ onSubmit, onClose, loading, initial }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: initial?.name || '',
    displayOrder: initial?.displayOrder || 1,
    minXp: initial?.minXp || 0,
    maxXp: initial?.maxXp || '',
    color: initial?.color || '#6366f1',
    badgeUrl: initial?.badgeUrl || '',
  });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        name: form.name,
        displayOrder: Number(form.displayOrder),
        minXp: Number(form.minXp),
        maxXp: form.maxXp ? Number(form.maxXp) : null,
        color: form.color,
        badgeUrl: form.badgeUrl || null,
      });
    }} className="space-y-3">
      <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('levelNamePlaceholder') + ' *'} required className="w-full px-3 py-2 border rounded-lg text-sm" />
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs text-gray-500">{t('order')} *</label><input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs text-gray-500">Min XP *</label><input type="number" value={form.minXp} onChange={(e) => set('minXp', e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs text-gray-500">Max XP</label><input type="number" value={form.maxXp} onChange={(e) => set('maxXp', e.target.value)} placeholder="∞" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-500">{t('color')}</label><input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-full h-10 border rounded-lg" /></div>
        <div><label className="text-xs text-gray-500">Badge URL</label><input value={form.badgeUrl} onChange={(e) => set('badgeUrl', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
        <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : t('save')}</button>
      </div>
    </form>
  );
}

function LevelEditForm({ level, onSave, onCancel, loading }: any) {
  return <LevelForm initial={level} onSubmit={onSave} onClose={onCancel} loading={loading} />;
}
