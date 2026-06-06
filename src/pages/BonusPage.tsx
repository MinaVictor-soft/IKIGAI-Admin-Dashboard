import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, XCircle, Award, Eye } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLang } from '../contexts/LangContext';

export default function BonusPage() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [showStaffAward, setShowStaffAward] = useState(false);
  const [viewClaimsId, setViewClaimsId] = useState<string | null>(null);
  const [viewClaimsLabel, setViewClaimsLabel] = useState('');

  const { data: qrs, isLoading, isError } = useQuery({
    queryKey: ['bonus-qrs'],
    queryFn: () => api.get('/bonus/my-qrs').then((r) => r.data),
  });

  const { data: claims } = useQuery({
    queryKey: ['bonus-claims', viewClaimsId],
    queryFn: () => api.get(`/admin/bonus/${viewClaimsId}/claims`).then((r) => r.data),
    enabled: !!viewClaimsId,
  });

  const createQr = useMutation({
    mutationFn: (data: any) => api.post('/bonus/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-qrs'] });
      setShowCreate(false);
      toast.success(t('bonusCreated'));
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.patch(`/bonus/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-qrs'] });
      toast.success(t('deactivated'));
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const staffAward = useMutation({
    mutationFn: (data: any) => api.post('/bonus/staff-award', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowStaffAward(false);
      toast.success(t('xpAwarded'));
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('bonusQr')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowStaffAward(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            <Award size={16} /> {t('staffAward')}
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> {t('generateQr')}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400 col-span-full">{t('loading')}</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-400 col-span-full">Failed to load bonus QRs. Please check your connection and try again.</div>
        ) : qrs?.length === 0 ? (
          <div className="text-center py-8 text-gray-400 col-span-full">{t('noBonusYet')}</div>
        ) : (
          qrs?.map((qr: any) => (
            <div key={qr.id} className={`bg-white rounded-xl p-5 shadow-sm border ${qr.isActive ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{qr.label || t('bonusQr')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setViewClaimsId(qr.id); setViewClaimsLabel(qr.label || t('bonusQr')); }} className="p-1 text-indigo-500 hover:text-indigo-700" title={t('viewClaims')}>
                    <Eye size={16} />
                  </button>
                  {qr.isActive && (
                    <button onClick={() => deactivate.mutate(qr.id)} className="p-1 text-red-400 hover:text-red-600" title={t('deactivate')}>
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">XP: <span className="font-medium text-indigo-600">{qr.amount}</span></p>
                <p className="text-gray-600 cursor-pointer" onClick={() => { setViewClaimsId(qr.id); setViewClaimsLabel(qr.label || t('bonusQr')); }}>
                  <span className="text-indigo-600 font-medium underline">{t('claims')}: {qr.claimsCount}/{qr.maxClaims ?? '∞'}</span>
                </p>
                <p className={`text-xs ${qr.isActive ? 'text-green-600' : 'text-red-600'}`}>{qr.isActive ? t('active') : t('inactive')}</p>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg flex flex-col items-center">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <QRCodeSVG value={qr.token} size={140} level="H" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Claims Modal */}
      {viewClaimsId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewClaimsId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{viewClaimsLabel} - {t('claims')}</h3>
              <span className="text-sm text-gray-500">{claims?.length ?? 0} {t('users')}</span>
            </div>
            {!claims ? (
              <p className="text-center text-gray-400 py-4">{t('loading')}</p>
            ) : claims.length === 0 ? (
              <p className="text-center text-gray-400 py-4">{t('noClaimsYet')}</p>
            ) : (
              <div className="space-y-2">
                {claims.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.user?.name}</p>
                      <p className="text-xs text-gray-500">{c.user?.email}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(c.claimedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setViewClaimsId(null)} className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm">{t('close')}</button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{t('generateQr')}</h3>
            <CreateForm onClose={() => setShowCreate(false)} onSubmit={(d) => createQr.mutate(d)} loading={createQr.isPending} />
          </div>
        </div>
      )}

      {showStaffAward && (
        <StaffAwardModal
          onClose={() => setShowStaffAward(false)}
          onSubmit={(d) => staffAward.mutate(d)}
          loading={staffAward.isPending}
        />
      )}
    </div>
  );
}

function CreateForm({ onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({ amount: 25, label: '', maxClaims: 50 });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount), maxClaims: Number(form.maxClaims) || undefined }); }} className="space-y-3">
      <div>
        <label className="text-xs text-gray-500">{t('xpAmount')} *</label>
        <input type="number" min={1} max={500} value={form.amount} onChange={(e) => set('amount', e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>
      <div>
        <label className="text-xs text-gray-500">{t('label')}</label>
        <input value={form.label} onChange={(e) => set('label', e.target.value)} placeholder={t('bonusLabelPlaceholder')} className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>
      <div>
        <label className="text-xs text-gray-500">{t('maxClaims')}</label>
        <input type="number" min={1} value={form.maxClaims} onChange={(e) => set('maxClaims', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
        <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : t('generate')}</button>
      </div>
    </form>
  );
}

function StaffAwardModal({ onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({ userId: '', amount: 10, reason: '' });
  const [search, setSearch] = useState('');
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
  });

  const filtered = (users || []).filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users?.find((u: any) => u.id === form.userId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">{t('staffAward')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('staffAwardDesc')}</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ userId: form.userId, amount: Number(form.amount), reason: form.reason }); }} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">{t('selectUser')} *</label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
                <button type="button" onClick={() => set('userId', '')} className="text-red-400 hover:text-red-600"><XCircle size={18} /></button>
              </div>
            ) : (
              <div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchUsers')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg bg-white shadow-sm">
                  {usersLoading ? (
                    <p className="text-xs text-gray-400 p-2">{t('loading')}</p>
                  ) : filtered.length === 0 ? (
                    <p className="text-xs text-gray-400 p-2">{t('noResults')}</p>
                  ) : (
                    filtered.slice(0, 20).map((u: any) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { set('userId', u.id); setSearch(''); }}
                        className="w-full text-start px-3 py-2 hover:bg-indigo-50 border-b last:border-b-0"
                      >
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500">{t('xpAmount')} (1-500) *</label>
            <input type="number" min={1} max={500} value={form.amount} onChange={(e) => set('amount', e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">{t('reason')} *</label>
            <input value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder={t('reasonPlaceholder')} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
            <button type="submit" disabled={loading || !form.userId} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : t('awardXp')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
