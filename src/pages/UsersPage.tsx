import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, UserPlus, Trash2, Eye, Calendar, HelpCircle, Gift } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLang } from '../contexts/LangContext';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { t, lang } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => api.get('/admin/users', { params: { role: roleFilter || undefined } }).then((r) => r.data),
  });

  const { data: tribes } = useQuery({
    queryKey: ['tribes'],
    queryFn: () => api.get('/admin/tribes').then((r) => r.data),
  });

  const createUser = useMutation({
    mutationFn: (data: any) => api.post('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      toast.success('User created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const assignTribe = useMutation({
    mutationFn: ({ userId, tribeId }: { userId: string; tribeId: string | null }) =>
      api.patch(`/admin/users/${userId}/tribe`, { tribeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Tribe assigned');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const { data: userDetail } = useQuery({
    queryKey: ['user-detail', detailUserId],
    queryFn: () => api.get(`/admin/users/${detailUserId}`).then((r) => r.data),
    enabled: !!detailUserId,
  });

  const adjustXp = useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
      api.patch(`/admin/users/${userId}/xp`, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', detailUserId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('XP updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('users')}</h2>
        <div className="flex gap-2">
          <button onClick={() => {
            if (confirm(t('confirmDeleteAttendees'))) {
              api.delete('/admin/users/attendees').then(() => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('All attendees removed'); }).catch((e: any) => toast.error(e.response?.data?.error?.message || 'Failed'));
            }
          }} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            <Trash2 size={16} /> {t('removeAttendees')}
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <UserPlus size={16} /> {t('createUser')}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'ar' ? 'بحث بالاسم أو الإيميل أو الكنيسة...' : 'Search by name, email or church...'}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">{t('allRoles')}</option>
          <option value="ATTENDEE">{t('attendee')}</option>
          <option value="STAFF">{t('staff')}</option>
          <option value="ADMIN">{t('admin')}</option>
          <option value="SUPER_ADMIN">{t('superAdmin')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('name')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('email')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('role')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('tribe')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('conferenceXp')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('sportsXp')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('totalXp')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('level')}</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">{t('loading')}</td></tr>
              ) : users?.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">{t('noUsersFound')}</td></tr>
              ) : (
                users?.filter((u: any) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (u.name || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q) ||
                    (u.church || '').toLowerCase().includes(q);
                }).map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => setDetailUserId(u.id)}>{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                        u.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' :
                        u.role === 'STAFF' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.tribe && (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: tribes?.find((t: any) => t.id === u.tribe.id)?.color || '#6366F1' }}
                          />
                        )}
                        <select
                          value={u.tribe?.id || ''}
                          onChange={(e) => assignTribe.mutate({ userId: u.id, tribeId: e.target.value || null })}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="">{t('noTribe')}</option>
                          {tribes?.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.conferenceXp ?? u.totalXp}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.sportsXp ?? 0}</td>
                    <td className="px-4 py-3 font-medium text-indigo-600">{u.totalXp}</td>
                    <td className="px-4 py-3">
                      {u.level ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: u.level.color || '#6366f1' }}>{u.level.name}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailUserId(u.id)} className="p-1 text-gray-400 hover:text-indigo-600" title={t('viewDetails')}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {detailUserId && userDetail && (
        <UserDetailModal
          user={userDetail}
          onClose={() => setDetailUserId(null)}
          onAdjustXp={(amount: number, reason: string) => adjustXp.mutate({ userId: detailUserId, amount, reason })}
          adjustLoading={adjustXp.isPending}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateUserModal
          tribes={tribes || []}
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createUser.mutate(data)}
          loading={createUser.isPending}
        />
      )}
    </div>
  );
}

function CreateUserModal({ tribes, onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'ATTENDEE', church: '', diocese: '', tribeId: '' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">{t('createUser')}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, tribeId: form.tribeId || undefined }); }} className="space-y-3">
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('name')} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" placeholder={t('email')} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input value={form.password} onChange={(e) => set('password', e.target.value)} type="password" placeholder={t('password')} required minLength={8} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <select value={form.role} onChange={(e) => set('role', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="ATTENDEE">{t('attendee')}</option>
            <option value="STAFF">{t('staff')}</option>
            <option value="ADMIN">{t('admin')}</option>
            <option value="SUPER_ADMIN">{t('superAdmin')}</option>
          </select>
          <input value={form.church} onChange={(e) => set('church', e.target.value)} placeholder={t('church')} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input value={form.diocese} onChange={(e) => set('diocese', e.target.value)} placeholder={t('diocese')} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <select value={form.tribeId} onChange={(e) => set('tribeId', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">{t('noTribe')}</option>
            {tribes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : t('create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose, onAdjustXp, adjustLoading }: any) {
  const { t } = useLang();
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [activityTab, setActivityTab] = useState<'info' | 'sessions' | 'quizzes' | 'bonus' | 'sports'>('info');

  const { data: activity } = useQuery({
    queryKey: ['user-activity', user.id],
    queryFn: () => api.get(`/admin/users/${user.id}/activity`).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: user.tribe?.color || '#6366F1' }}
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4 overflow-x-auto">
          <button onClick={() => setActivityTab('info')} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activityTab === 'info' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            {t('info')}
          </button>
          <button onClick={() => setActivityTab('sessions')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activityTab === 'sessions' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <Calendar size={12} /> {t('sessions')} ({activity?.attendance?.length ?? 0})
          </button>
          <button onClick={() => setActivityTab('quizzes')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activityTab === 'quizzes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <HelpCircle size={12} /> {t('quizzes')} ({activity?.quizSubmissions?.length ?? 0})
          </button>
          <button onClick={() => setActivityTab('bonus')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activityTab === 'bonus' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <Gift size={12} /> {t('bonusQr')} ({(activity?.bonusClaims?.length ?? 0) + (activity?.staffAwards?.length ?? 0) + (activity?.adminAdjustments?.length ?? 0)})
          </button>
          <button onClick={() => setActivityTab('sports')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activityTab === 'sports' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            {t('sports')} ({activity?.sportsTransactions?.length ?? 0})
          </button>
        </div>

        {activityTab === 'info' && (
          <>
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t('role')}</p>
                <p className="font-semibold text-sm">{user.role}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t('totalXp')}</p>
                <p className="font-bold text-lg text-indigo-600">{user.totalXp}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t('conferenceXp')}</p>
                <p className="font-semibold text-sm text-gray-900">{user.conferenceXp ?? user.totalXp}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t('sportsXp')}</p>
                <p className="font-semibold text-sm text-gray-900">{user.sportsXp ?? 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t('tribe')}</p>
                <p className="font-semibold text-sm">{user.tribe?.name || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t('level')}</p>
                <p className="font-semibold text-sm">{user.level?.name || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t('church')}</p>
                <p className="font-semibold text-sm">{user.church || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t('diocese')}</p>
                <p className="font-semibold text-sm">{user.diocese || '—'}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-col items-center">
              <p className="text-xs font-medium text-indigo-700 mb-3">{t('qrToken')}</p>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <QRCodeSVG value={user.userQrToken} size={160} level="H" />
              </div>
            </div>

            {/* Last Login */}
            <div className="mb-4 text-xs text-gray-500">
              <p>{t('lastLogin')}: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</p>
              <p>{t('joined')}: {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Adjust XP */}
            {!showAdjust ? (
              <button
                onClick={() => setShowAdjust(true)}
                className="w-full py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-100"
              >
                {t('adjustXp')}
              </button>
            ) : (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-2">{t('adjustXp')}</p>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder={t('amount')}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  />
                  <input
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder={t('reason')}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAdjust(false)} className="flex-1 py-1.5 border border-gray-300 rounded-lg text-xs">{t('cancel')}</button>
                    <button
                      onClick={() => {
                        if (!adjustAmount || !adjustReason) { toast.error('Fill in amount and reason'); return; }
                        onAdjustXp(Number(adjustAmount), adjustReason);
                        setShowAdjust(false);
                        setAdjustAmount('');
                        setAdjustReason('');
                      }}
                      disabled={adjustLoading}
                      className="flex-1 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {adjustLoading ? '...' : t('save')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activityTab === 'sessions' && (
          <div className="space-y-2">
            {!activity ? (
              <p className="text-center text-gray-400 py-4">{t('loading')}</p>
            ) : activity.attendance?.length === 0 ? (
              <p className="text-center text-gray-400 py-4">{t('noSessionsAttended')}</p>
            ) : (
              activity.attendance.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.session?.title}</p>
                    <p className="text-xs text-gray-500">{a.session?.speaker} • {new Date(a.scannedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-bold text-green-600">+{a.xpAwarded} XP</p>
                    {a.isLate && <p className="text-xs text-yellow-600">Late</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activityTab === 'quizzes' && (
          <div className="space-y-2">
            {!activity ? (
              <p className="text-center text-gray-400 py-4">{t('loading')}</p>
            ) : activity.quizSubmissions?.length === 0 ? (
              <p className="text-center text-gray-400 py-4">{t('noQuizzesTaken')}</p>
            ) : (
              activity.quizSubmissions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.quiz?.title}</p>
                    <p className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleDateString()} {s.timeTakenSeconds ? `• ${s.timeTakenSeconds}s` : ''}</p>
                  </div>
                  <div className="text-end">
                    <p className={`text-sm font-bold ${s.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {s.score}/{s.maxScore} ({Number(s.percentage).toFixed(0)}%)
                    </p>
                    <p className="text-xs">{s.passed ? <span className="text-green-600">✓ {t('passed')}</span> : <span className="text-red-600">✗ {t('failed')}</span>} {s.xpAwarded > 0 && `• +${s.xpAwarded} XP`}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activityTab === 'bonus' && (
          <div className="space-y-2">
            {!activity ? (
              <p className="text-center text-gray-400 py-4">{t('loading')}</p>
            ) : (activity.bonusClaims?.length === 0 && activity.staffAwards?.length === 0 && activity.adminAdjustments?.length === 0) ? (
              <p className="text-center text-gray-400 py-4">{t('noBonusClaimed')}</p>
            ) : (
              <>
                {activity.adminAdjustments?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.description || 'Admin Adjustment'}</p>
                      <p className="text-xs text-gray-500">Admin • {new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                    <p className={`text-sm font-bold ${a.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{a.amount >= 0 ? '+' : ''}{a.amount} XP</p>
                  </div>
                ))}
                {activity.staffAwards?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.description || 'Staff Award'}</p>
                      <p className="text-xs text-gray-500">Staff Award • {new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">+{a.amount} XP</p>
                  </div>
                ))}
                {activity.bonusClaims?.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.bonusQr?.label || 'Bonus QR'}</p>
                      <p className="text-xs text-gray-500">QR Claim • {new Date(c.claimedAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">+{c.bonusQr?.amount ?? 0} XP</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activityTab === 'sports' && (
          <div className="space-y-2">
            {!activity ? (
              <p className="text-center text-gray-400 py-4">{t('loading')}</p>
            ) : activity.sportsTransactions?.length === 0 ? (
              <p className="text-center text-gray-400 py-4">No sports XP yet</p>
            ) : (
              activity.sportsTransactions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.description || 'Sports'}</p>
                    <p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">+{s.amount} XP</p>
                </div>
              ))
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm">{t('close')}</button>
      </div>
    </div>
  );
}
