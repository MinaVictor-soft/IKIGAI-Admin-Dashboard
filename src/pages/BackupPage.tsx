import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, RotateCcw, Play, AlertTriangle, X, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface Backup {
  filename: string;
  key: string;
  date: string;
  label: 'morning' | 'evening' | 'manual';
}

function LabelBadge({ label }: { label: Backup['label'] }) {
  if (label === 'morning') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        ☀️ Morning
      </span>
    );
  }
  if (label === 'evening') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        🌙 Evening
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      🔧 Manual
    </span>
  );
}

export default function BackupPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const res = await api.get('/admin/backup/list');
      return res.data.backups as Backup[];
    },
  });

  const triggerMutation = useMutation({
    mutationFn: () => api.post('/admin/backup/trigger'),
    onSuccess: (res) => {
      const sizeKb = res.data?.sizeKb;
      toast.success(`Backup saved${sizeKb ? ` (${sizeKb} KB)` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: () => toast.error('Backup failed. Please try again.'),
  });

  const isBusy = triggerMutation.isPending || restoring;

  const handleDownload = async (backup: Backup) => {
    setDownloading(backup.filename);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `https://ikigai-backend.replit.app/api/v1/admin/backup/${backup.filename}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      const res = await api.post(`/admin/backup/${restoreTarget.filename}/restore`);
      const total = res.data?.totalRecords;
      toast.success(`Database restored — ${total ?? '?'} records`);
      setRestoreTarget(null);
      logout();
      navigate('/login');
    } catch {
      toast.error('Restore failed. Please try again.');
      setRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Full-page restore overlay */}
      {restoring && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full" />
          <p className="text-white text-lg font-medium">Restoring database…</p>
          <p className="text-white/70 text-sm">This may take up to 60 seconds</p>
        </div>
      )}

      {/* Restore confirm modal */}
      {restoreTarget && !restoring && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Restore Database?</h2>
                <p className="mt-1 text-sm text-gray-600">
                  This will <span className="font-semibold text-red-600">ERASE all current data</span> and replace it
                  with the backup from <span className="font-medium">{restoreTarget.date}</span> (
                  <span className="capitalize">{restoreTarget.label}</span>).
                </p>
                <p className="mt-2 text-sm text-red-600 font-medium">This cannot be undone.</p>
              </div>
              <button
                onClick={() => setRestoreTarget(null)}
                className="ml-auto shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw size={15} />
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database size={24} className="text-indigo-600" />
            Backup &amp; Restore
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage database backups. SUPER_ADMIN only.
          </p>
        </div>
        <button
          onClick={() => triggerMutation.mutate()}
          disabled={isBusy}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {triggerMutation.isPending ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Play size={15} />
          )}
          {triggerMutation.isPending ? 'Running…' : 'Run Backup Now'}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
        <span className="text-lg leading-none mt-0.5">ℹ️</span>
        <span>
          Automatic backups run at <strong>07:00</strong> (morning) and <strong>19:00</strong> (evening) every day.
        </span>
      </div>

      {/* Backups table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
            <AlertTriangle size={32} className="text-red-400" />
            <p>Failed to load backups.</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['backups'] })}
              className="text-sm text-indigo-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Database size={32} />
            <p>No backups found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Label</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Filename</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((backup) => (
                <tr key={backup.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{backup.date}</td>
                  <td className="px-5 py-3.5">
                    <LabelBadge label={backup.label} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 font-mono text-xs truncate max-w-xs">
                    {backup.filename}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(backup)}
                        disabled={isBusy || downloading === backup.filename}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {downloading === backup.filename ? (
                          <span className="animate-spin w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full" />
                        ) : (
                          <Download size={13} />
                        )}
                        Download
                      </button>
                      <button
                        onClick={() => setRestoreTarget(backup)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <RotateCcw size={13} />
                        Restore
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
