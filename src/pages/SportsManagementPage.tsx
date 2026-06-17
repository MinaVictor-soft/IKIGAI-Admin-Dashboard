import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Play, Settings, Trophy, Users, Target } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { translations } from '../i18n/translations';
import TournamentConfigModal from '../components/TournamentConfigModal';
import CreateTournamentModal from '../components/CreateTournamentModal';

export default function SportsManagementPage() {
  const queryClient = useQueryClient();
  const { lang } = useLang();
  const t = (key: string) => translations[lang]?.[key] || key;
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState<string | null>(null);

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.get('/tournaments').then((r) => r.data),
  });

  const { data: standings } = useQuery({
    queryKey: ['standings', selectedTournament],
    queryFn: () => api.get(`/tournaments/${selectedTournament}/standings`).then((r) => r.data),
    enabled: !!selectedTournament,
  });

  const { data: bracket } = useQuery({
    queryKey: ['bracket', selectedTournament],
    queryFn: () => api.get(`/tournaments/${selectedTournament}/bracket`).then((r) => r.data),
    enabled: !!selectedTournament,
  });

  const advanceKnockout = useMutation({
    mutationFn: (id: string) => api.post(`/tournaments/${id}/advance-knockout`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments', selectedTournament] });
      toast.success('Knockout stage generated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const completeMatch = useMutation({
    mutationFn: ({ tournamentId, matchId, homeScore, awayScore }: any) =>
      api.post(`/tournaments/${tournamentId}/match/${matchId}/complete`, {
        homeScore,
        awayScore,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings', selectedTournament] });
      toast.success('Match score updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('sports')}</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={16} /> {t('createTournament')}
        </button>
      </div>

      {/* Tournament Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tournaments?.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            {t('noTournaments')}
          </div>
        ) : (
          tournaments?.map((t_item: any) => (
            <div
              key={t_item.id}
              onClick={() => setSelectedTournament(t_item.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedTournament === t_item.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">{lang === 'ar' ? t_item.nameAr || t_item.name : t_item.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('numberOfGroups')}: {t_item.numberOfGroups}</p>
              <p className="text-sm text-gray-500">{t('status')}: {t_item.status}</p>
              {t_item.memberRestrictionType && (
                <p className="text-sm text-blue-600 mt-1">
                  🔒 {t('memberRestrictions')}: {t_item.memberRestrictionType}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Tournament Details */}
      {selectedTournament && (
        <div className="space-y-6">
          {/* Group Standings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} /> {t('groupStandings')}
              </h3>
              <button
                onClick={() => setShowConfigModal(selectedTournament)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Settings size={14} /> {t('configure')}
              </button>
            </div>

            {standings && (
              <div className="space-y-6">
                {standings.map((group: any) => (
                  <div key={group.groupName} className="space-y-2">
                    <h4 className="font-semibold text-gray-900">{group.groupName}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left text-gray-600">{t('team')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('played')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('wins')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('draws')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('losses')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('goalsFor')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('goalsAgainst')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('goalDifference')}</th>
                            <th className="px-3 py-2 text-center text-gray-600">{t('points')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.teams.map((team: any, idx: number) => (
                            <tr
                              key={team.id}
                              className={`border-t ${idx === 0 || idx === 1 ? 'bg-green-50' : 'bg-white'}`}
                            >
                              <td className="px-3 py-2 font-medium text-gray-900">{team.team?.name}</td>
                              <td className="px-3 py-2 text-center">{team.matchesPlayed}</td>
                              <td className="px-3 py-2 text-center">{team.wins}</td>
                              <td className="px-3 py-2 text-center">{team.draws}</td>
                              <td className="px-3 py-2 text-center">{team.losses}</td>
                              <td className="px-3 py-2 text-center">{team.goalsFor}</td>
                              <td className="px-3 py-2 text-center">{team.goalsAgainst}</td>
                              <td className="px-3 py-2 text-center">{team.goalDifference}</td>
                              <td className="px-3 py-2 text-center font-bold">{team.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => advanceKnockout.mutate(selectedTournament)}
              disabled={advanceKnockout.isPending}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trophy size={16} />
              {t('generateKnockout')}
            </button>
          </div>

          {/* Knockout Bracket */}
          {bracket && bracket.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={20} /> {t('knockoutBracket')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bracket.map((match: any) => (
                  <div key={match.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">
                      {match.stageType === 'QUARTER_FINAL' ? t('quarterFinals') :
                       match.stageType === 'SEMI_FINAL' ? t('semiFinals') :
                       match.stageType === 'FINAL' ? t('final') : match.stageType}
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{match.homeTeam?.name}</p>
                      <p className="text-sm font-medium">{match.awayTeam?.name}</p>
                    </div>
                    {!match.homeScore && (
                      <div className="mt-2 flex gap-2">
                        <input type="number" placeholder="0" className="w-12 px-2 py-1 border rounded text-sm" />
                        <span className="text-sm">-</span>
                        <input type="number" placeholder="0" className="w-12 px-2 py-1 border rounded text-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <CreateTournamentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <TournamentConfigModal tournamentId={showConfigModal} onClose={() => setShowConfigModal(null)} />
      )}
    </div>
  );
}
