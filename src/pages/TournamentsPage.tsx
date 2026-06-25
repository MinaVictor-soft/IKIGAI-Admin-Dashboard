import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trophy, Users, Calendar, Settings, Trash2 } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { translations } from '../i18n/translations';
import CreateTournamentModal from '../components/CreateTournamentModal';
import PasswordConfirmModal from '../components/PasswordConfirmModal';

export default function TournamentsPage() {
  const { lang } = useLang();
  const t = (key: string) => translations[lang]?.[key] || key;
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isRTL = lang === 'ar';

  const { data: tournaments = [], isLoading, refetch } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.get('/tournaments').then((r) => r.data),
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      PLANNING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Planning' },
      RUNNING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Running' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    };
    const config = statusConfig[status] || statusConfig.PLANNING;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <main className={`flex-1 p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl font-bold text-gray-900">{t('tournaments') || 'Tournaments'}</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          {t('createTournament') || 'Create Tournament'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading tournaments...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No tournaments created yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Create Your First Tournament
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament: any) => (
            <div key={tournament.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {tournament.name}
                </h3>
                {getStatusBadge(tournament.status)}
              </div>

              {tournament.nameAr && (
                <p className="text-sm text-gray-600 mb-3 text-right" dir="rtl">
                  {tournament.nameAr}
                </p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>{tournament.numberOfGroups} groups ÔÇó {tournament.teamsPerGroup} teams per group</span>
                </div>

                {tournament.startDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>{formatDate(tournament.startDate)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy size={16} />
                  <span>{tournament.teamsAdvancingPerGroup} teams advance per group</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Win Points</span>
                    <p className="font-semibold text-gray-900">{tournament.pointsForWin}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Draw Points</span>
                    <p className="font-semibold text-gray-900">{tournament.pointsForDraw}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Loss Points</span>
                    <p className="font-semibold text-gray-900">{tournament.pointsForLoss}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Group Win XP</span>
                    <p className="font-semibold text-gray-900">{tournament.groupStageWinXp}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Settings size={16} />
                  Manage
                </button>
                <button onClick={() => setDeleteTarget({ id: tournament.id, name: tournament.name })} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete tournament">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTournamentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      {deleteTarget && (
        <PasswordConfirmModal
          title={`Delete Tournament "${deleteTarget.name}"?`}
          description="This will permanently delete the tournament, all its groups, teams, and matches."
          confirmLabel="Delete Tournament"
          loading={deleting}
          danger
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            setDeleting(true);
            api.delete(`/tournaments/${deleteTarget.id}`)
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ['tournaments'] });
                toast.success('Tournament deleted');
                setDeleteTarget(null);
              })
              .catch((e: any) => toast.error(e.response?.data?.error?.message || 'Failed'))
              .finally(() => setDeleting(false));
          }}
        />
      )}
    </main>
  );
}
