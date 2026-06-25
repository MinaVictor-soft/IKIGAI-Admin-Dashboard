import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Play, Square, QrCode, Edit, Eye, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLang } from '../contexts/LangContext';
import PasswordConfirmModal from '../components/PasswordConfirmModal';

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [editSession, setEditSession] = useState<any>(null);
  const [viewAttendanceId, setViewAttendanceId] = useState<string | null>(null);
  const [viewQrSession, setViewQrSession] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/admin/sessions').then((r) => r.data),
  });

  const { data: attendance } = useQuery({
    queryKey: ['session-attendance', viewAttendanceId],
    queryFn: () => api.get(`/admin/sessions/${viewAttendanceId}`).then((r) => r.data),
    enabled: !!viewAttendanceId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/sessions/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const updateSession = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/admin/sessions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setEditSession(null);
      toast.success('Session updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const regenerateQr = useMutation({
    mutationFn: (id: string) => api.post(`/admin/sessions/${id}/regenerate-qr`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('QR token regenerated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const createSession = useMutation({
    mutationFn: (data: any) => api.post('/admin/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setShowCreate(false);
      toast.success('Session created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('sessions')}</h2>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> {t('newSession')}
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">{t('loading')}</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-400">Failed to load sessions. Please check your connection and try again.</div>
        ) : sessions?.length === 0 ? (
          <div className="text-center py-8 text-gray-400">{t('noSessionsYet')}</div>
        ) : (
          sessions?.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => setViewAttendanceId(s.id)}>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{s.speaker && `${t('speaker')}: ${s.speaker} • `}{s.location && `${s.location} • `}{new Date(s.startTime).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span>
                    <span className="text-xs text-indigo-600 font-medium underline">{t('attendees')}: {s._count?.attendance ?? 0}/{s.maxCapacity ?? '∞'}</span>
                    <span className="text-xs text-gray-400">XP: {s.xpReward}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditSession(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title={t('edit')}>
                    <Edit size={16} />
                  </button>
                  {s.status === 'SCHEDULED' && (
                    <button onClick={() => updateStatus.mutate({ id: s.id, status: 'ACTIVE' })} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title={t('activate')}>
                      <Play size={16} />
                    </button>
                  )}
                  {s.status === 'ACTIVE' && (
                    <button onClick={() => updateStatus.mutate({ id: s.id, status: 'COMPLETED' })} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title={t('complete')}>
                      <Square size={16} />
                    </button>
                  )}
                  <button onClick={() => setViewQrSession(s)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title={t('qrCode')}>
                    <QrCode size={16} />
                  </button>
                  <button onClick={() => setViewAttendanceId(s.id)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title={t('attendance')}>
                    <Eye size={16} />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: s.id, title: s.title })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete session">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && <SessionFormModal mode="create" onClose={() => setShowCreate(false)} onSubmit={(d) => createSession.mutate(d)} loading={createSession.isPending} />}

      {editSession && <SessionFormModal mode="edit" session={editSession} onClose={() => setEditSession(null)} onSubmit={(d) => updateSession.mutate({ id: editSession.id, data: d })} loading={updateSession.isPending} />}

      {/* QR Code Modal */}
      {viewQrSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewQrSession(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">{viewQrSession.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{viewQrSession.speaker}</p>
            <div className="bg-white p-4 rounded-xl border border-gray-100 inline-block mb-4">
              <QRCodeSVG value={viewQrSession.qrToken} size={200} level="H" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(viewQrSession.qrToken); toast.success(t('copiedToClipboard')); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">{t('copyToken')}</button>
              <button onClick={() => { regenerateQr.mutate(viewQrSession.id); setViewQrSession(null); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">{t('regenerateQr')}</button>
            </div>
            <button onClick={() => setViewQrSession(null)} className="w-full mt-2 py-2 text-gray-500 text-sm">{t('close')}</button>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {viewAttendanceId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewAttendanceId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-lg font-bold">{attendance?.title || t('attendance')}</h3>
              {attendance?.speaker && <p className="text-sm text-gray-500">{attendance.speaker}</p>}
            </div>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-700">{attendance?.attendance?.length ?? 0}</div>
                <div className="text-xs text-blue-600">{t('attendees')}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-700">{attendance?.maxCapacity ?? '∞'}</div>
                <div className="text-xs text-green-600">{t('capacity')}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-purple-700">{attendance?.xpReward ?? 0}</div>
                <div className="text-xs text-purple-600">{t('xp')}</div>
              </div>
            </div>
            {!attendance ? (
              <p className="text-center text-gray-400 py-4">{t('loading')}</p>
            ) : attendance.attendance?.length === 0 ? (
              <p className="text-center text-gray-400 py-4">{t('noOneAttendedYet')}</p>
            ) : (
              <div className="space-y-2">
                {attendance.attendance?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {a.user?.tribe && <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: a.user.tribe.color }} />}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{a.user?.email}{a.user?.tribe ? ` • ${a.user.tribe.name}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-gray-400">{new Date(a.scannedAt).toLocaleTimeString()}</p>
                      <p className="text-xs text-green-600">+{a.xpAwarded} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setViewAttendanceId(null)} className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm">{t('close')}</button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <PasswordConfirmModal
          title={`Delete "${deleteTarget.title}"?`}
          description="This will permanently delete this session and all its attendance records."
          confirmLabel="Delete Session"
          loading={deleting}
          danger
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            setDeleting(true);
            api.delete(`/admin/sessions/${deleteTarget.id}`)
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ['sessions'] });
                toast.success('Session deleted');
                setDeleteTarget(null);
              })
              .catch((e: any) => toast.error(e.response?.data?.error?.message || 'Failed'))
              .finally(() => setDeleting(false));
          }}
        />
      )}
    </div>
  );
}

function SessionFormModal({ mode, session, onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const isEdit = mode === 'edit';

  const getDateStr = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';
  const getTimeStr = (d: string) => d ? new Date(d).toTimeString().slice(0, 5) : '';

  const [form, setForm] = useState({
    title: session?.title || '',
    description: session?.description || '',
    speaker: session?.speaker || '',
    location: session?.location || '',
    sessionDate: isEdit ? getDateStr(session.sessionDate || session.startTime) : '',
    startTime: isEdit ? getTimeStr(session.startTime) : '',
    endTime: isEdit ? getTimeStr(session.endTime) : '',
    xpReward: session?.xpReward ?? 10,
    maxCapacity: session?.maxCapacity ?? 200,
  });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      title: form.title,
      description: form.description || undefined,
      speaker: form.speaker || undefined,
      location: form.location || undefined,
      xpReward: Number(form.xpReward),
      maxCapacity: Number(form.maxCapacity) || null,
    };
    if (form.sessionDate) {
      data.sessionDate = form.sessionDate;
      if (form.startTime) data.startTime = new Date(`${form.sessionDate}T${form.startTime}`).toISOString();
      if (form.endTime) data.endTime = new Date(`${form.sessionDate}T${form.endTime}`).toISOString();
    }
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">{isEdit ? t('editSession') : t('newSession')}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('sessionTitle')} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={t('description')} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.speaker} onChange={(e) => set('speaker', e.target.value)} placeholder={t('speaker')} className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder={t('location')} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">{t('date')} *</label>
              <input type="date" value={form.sessionDate} onChange={(e) => set('sessionDate', e.target.value)} required={!isEdit} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('startTime')} *</label>
              <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} required={!isEdit} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('endTime')} *</label>
              <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} required={!isEdit} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">{t('xpReward')}</label>
              <input type="number" value={form.xpReward} onChange={(e) => set('xpReward', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('maxCapacity')}</label>
              <input type="number" value={form.maxCapacity} onChange={(e) => set('maxCapacity', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : isEdit ? t('save') : t('create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
