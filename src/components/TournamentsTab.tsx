import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, ChevronDown, Play } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function TournamentsTab() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLang();
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [expandedTournament, setExpandedTournament] = useState<string | null>(null);
  const [selectedMatchForEdit, setSelectedMatchForEdit] = useState<string | null>(null);

  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.get('/tournaments').then((r) => r.data || []),
  });

  const { data: teams } = useQuery({
    queryKey: ['sports-teams'],
    queryFn: () => api.get('/sports/teams').then((r) => r.data || []),
  });

  const advanceToKnockout = useMutation({
    mutationFn: (tournamentId: string) => api.post(`/tournaments/${tournamentId}/advance-knockout`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Advancing to knockout stage...');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const completeMatch = useMutation({
    mutationFn: ({ tournamentId, matchId, team1Goals, team2Goals }: any) =>
      api.post(`/tournaments/${tournamentId}/match/${matchId}/complete`, { team1Goals, team2Goals }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setSelectedMatchForEdit(null);
      toast.success('Match completed!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const generateNextRound = useMutation({
    mutationFn: (tournamentId: string) => api.post(`/tournaments/${tournamentId}/generate-next-round`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Next knockout round generated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate next round'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateTournament(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> {t('createTournament')}
        </button>
      </div>

      {tournamentsLoading ? (
        <div className="text-center py-8 text-gray-400">{t('loading')}</div>
      ) : !tournaments || tournaments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">{t('noTournamentsYet')}</div>
      ) : (
        <div className="space-y-4">
          {tournaments.map((tournament: any) => (
            <div
              key={tournament.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => setExpandedTournament(expandedTournament === tournament.id ? null : tournament.id)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{tournament.name || tournament.nameAr}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {tournament.status === 'GROUP_STAGE' && t('groupStage')}
                    {tournament.status === 'KNOCKOUT_STAGE' && t('knockoutStage')}
                    {tournament.status === 'COMPLETED' && 'Completed'}
                    {tournament.winner && ` • ${t('champion')}: ${tournament.winner?.name}`}
                  </p>
                </div>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${expandedTournament === tournament.id ? 'rotate-180' : ''}`}
                />
              </div>

              {expandedTournament === tournament.id && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">{t('numberOfGroups')}</p>
                      <p className="font-semibold">{tournament.numberOfGroups}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('teamsPerGroup')}</p>
                      <p className="font-semibold">{tournament.teamsPerGroup}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('pointsForWin')}</p>
                      <p className="font-semibold">{tournament.pointsForWin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('tournamentStatus')}</p>
                      <p className="font-semibold">{tournament.status}</p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    {t('viewDetails') || 'View Full Tournament Details'}
                  </button>

                  {/* Groups Section */}
                  {tournament.status === 'GROUP_STAGE' && tournament.groups && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">{t('groups')}</h4>
                      {tournament.groups.map((group: any) => (
                        <div key={group.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <p className="font-medium text-sm">{t('group')} {group.groupName}</p>
                          {group.teams && (
                            <div className="space-y-1">
                              {group.teams.map((tt: any, idx: number) => (
                                <div key={tt.id} className="text-xs flex justify-between items-center">
                                  <span>{idx + 1}. {tt.team?.name}</span>
                                  <span className="text-gray-500">
                                    {tt.points || 0}pts • W{tt.won || 0} D{tt.drawn || 0} L{tt.lost || 0}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {tournament.tournamentMatches && (
                            <div className="mt-3 space-y-1 border-t pt-2">
                              {tournament.tournamentMatches
                                .filter((match: any) => {
                                  const teamIds = group.teams?.map((t: any) => t.teamId) || [];
                                  return teamIds.includes(match.team1Id) && teamIds.includes(match.team2Id);
                                })
                                .map((match: any) => (
                                <div
                                  key={match.id}
                                  className="text-xs bg-white p-2 rounded flex justify-between items-center cursor-pointer hover:bg-indigo-50"
                                  onClick={() => setSelectedMatchForEdit(match.id)}
                                >
                                  <span className="flex-1">
                                    {match.team1?.name} vs {match.team2?.name}
                                  </span>
                                  <span className="font-bold text-gray-900 ml-2">
                                    {match.team1Goals ?? '-'} - {match.team2Goals ?? '-'}
                                  </span>
                                  {!match.completed && (
                                    <span className="text-yellow-600 ml-2">●</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Advance to Knockout Button */}
                      {tournament.status === 'GROUP_STAGE' &&
                        tournament.tournamentMatches?.every((m: any) => m.status === 'COMPLETED') && (
                        <button
                          onClick={() => advanceToKnockout.mutate(tournament.id)}
                          disabled={advanceToKnockout.isPending}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          <Play size={16} /> {t('advanceToKnockout')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Knockout Bracket */}
                  {(tournament.status === 'KNOCKOUT_STAGE' || tournament.status === 'KNOCKOUT' || tournament.status === 'COMPLETED') && tournament.tournamentMatches && (
                    <div className="space-y-3">
                      {['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].map((stage) => {
                        const stageMatches = tournament.tournamentMatches.filter((m: any) => m.stage === stage);
                        if (stageMatches.length === 0) return null;

                        const stageLabels: Record<string, string> = {
                          'ROUND_OF_16': t('roundOf16') || 'Round of 16',
                          'QUARTER_FINAL': t('quarterFinal') || 'Quarter Final',
                          'SEMI_FINAL': t('semiFinal') || 'Semi Final',
                          'FINAL': t('final') || 'Final'
                        };

                        return (
                          <div key={stage} className="space-y-2">
                            <h4 className="font-medium text-gray-700">{stageLabels[stage]}</h4>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                              {stageMatches.map((match: any) => (
                                <div
                                  key={match.id}
                                  className="text-sm bg-white p-2 rounded flex justify-between items-center cursor-pointer hover:bg-indigo-50"
                                  onClick={() => setSelectedMatchForEdit(match.id)}
                                >
                                  <span className="flex-1">
                                    {match.team1?.name} vs {match.team2?.name}
                                  </span>
                                  <span className="font-bold text-gray-900 ml-2">
                                    {match.team1Goals ?? '-'} - {match.team2Goals ?? '-'}
                                  </span>
                                  {match.status !== 'COMPLETED' && <span className="text-yellow-600 ml-2">●</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Generate Next Round Button - Only show if tournament is not completed */}
                      {tournament.status !== 'COMPLETED' && (() => {
                        const stages = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];
                        const knockoutMatches = tournament.tournamentMatches.filter((m: any) => stages.includes(m.stage));
                        const hasMoreRounds = stages.some(stage => !knockoutMatches.find((m: any) => m.stage === stage));
                        const allCurrentRoundsCompleted = knockoutMatches.filter((m: any) => {
                          const lastStage = stages.reverse().find(st => knockoutMatches.some((km: any) => km.stage === st));
                          return m.stage === lastStage;
                        }).every((m: any) => m.status === 'COMPLETED');

                        if (hasMoreRounds && allCurrentRoundsCompleted) {
                          return (
                            <button
                              onClick={() => generateNextRound.mutate(tournament.id)}
                              disabled={generateNextRound.isPending}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mt-2"
                            >
                              <Play size={16} /> {t('generateNextRound') || 'Generate Next Round'}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {tournament.status === 'COMPLETED' && tournament.winner && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <p className="text-sm font-semibold text-yellow-900">
                        🏆 {t('champion')}: {tournament.winner?.name}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Match Modal */}
      {selectedMatchForEdit && (
        <MatchDetailsModal
          tournamentId={tournaments?.find((t: any) =>
            t.tournamentMatches?.some((m: any) => m.id === selectedMatchForEdit)
          )?.id}
          matchId={selectedMatchForEdit}
          match={tournaments
            ?.flatMap((t: any) => t.tournamentMatches || [])
            .find((m: any) => m.id === selectedMatchForEdit)
          }
          onClose={() => setSelectedMatchForEdit(null)}
          onSubmit={(team1Goals, team2Goals) =>
            completeMatch.mutate({
              tournamentId: tournaments?.find((t: any) =>
                t.tournamentMatches?.some((m: any) => m.id === selectedMatchForEdit)
              )?.id,
              matchId: selectedMatchForEdit,
              team1Goals,
              team2Goals,
            })
          }
          loading={completeMatch.isPending}
        />
      )}

      {/* Create Tournament Modal */}
      {showCreateTournament && (
        <CreateTournamentModal
          teams={teams || []}
          onClose={() => setShowCreateTournament(false)}
          onSuccess={() => {
            setShowCreateTournament(false);
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
          }}
        />
      )}
    </div>
  );
}

function MatchDetailsModal({ match, onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [team1Goals, setTeam1Goals] = useState(match?.team1Goals ?? 0);
  const [team2Goals, setTeam2Goals] = useState(match?.team2Goals ?? 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">{t('matchDetails')}</h3>
        <div className="space-y-4">
          <div className="text-center py-4 border rounded-lg">
            <p className="text-sm text-gray-600">{match?.team1?.name}</p>
            <input
              type="number"
              value={team1Goals}
              onChange={(e) => setTeam1Goals(Number(e.target.value))}
              className="w-12 text-2xl font-bold text-center mx-auto my-2 border rounded-lg"
              min="0"
            />
            <p className="text-sm text-gray-600">{match?.team2?.name}</p>
            <input
              type="number"
              value={team2Goals}
              onChange={(e) => setTeam2Goals(Number(e.target.value))}
              className="w-12 text-2xl font-bold text-center mx-auto my-2 border rounded-lg"
              min="0"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => onSubmit(team1Goals, team2Goals)}
              disabled={loading}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? '...' : t('updateMatch')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTournamentModal({ teams, onClose, onSuccess }: any) {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    numberOfGroups: 4,
    teamsPerGroup: 4,
    teamsAdvancingPerGroup: 2,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    selectedTeamIds: [] as string[],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tournaments', data),
    onSuccess: () => {
      toast.success('Tournament created!');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      onSuccess();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (form.selectedTeamIds.length !== form.numberOfGroups * form.teamsPerGroup) {
      toast.error(`Select ${form.numberOfGroups * form.teamsPerGroup} teams`);
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">{t('createTournament')}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('tournamentName') + ' (EN)'}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
            placeholder={t('tournamentName') + ' (AR)'}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">{t('numberOfGroups')}</label>
              <input
                type="number"
                value={form.numberOfGroups}
                onChange={(e) => setForm({ ...form, numberOfGroups: Number(e.target.value) })}
                min="1"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">{t('teamsPerGroup')}</label>
              <input
                type="number"
                value={form.teamsPerGroup}
                onChange={(e) => setForm({ ...form, teamsPerGroup: Number(e.target.value) })}
                min="2"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">{t('teamsAdvancing')}</label>
              <input
                type="number"
                value={form.teamsAdvancingPerGroup}
                onChange={(e) => setForm({ ...form, teamsAdvancingPerGroup: Number(e.target.value) })}
                min="1"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">{t('pointsForWin')}</label>
              <input
                type="number"
                value={form.pointsForWin}
                onChange={(e) => setForm({ ...form, pointsForWin: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">{t('pointsForDraw')}</label>
              <input
                type="number"
                value={form.pointsForDraw}
                onChange={(e) => setForm({ ...form, pointsForDraw: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">{t('pointsForLoss')}</label>
              <input
                type="number"
                value={form.pointsForLoss}
                onChange={(e) => setForm({ ...form, pointsForLoss: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">
              {t('selectTeams')} ({form.selectedTeamIds.length}/{form.numberOfGroups * form.teamsPerGroup})
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {teams.map((team: any) => (
                <label key={team.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.selectedTeamIds.includes(team.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, selectedTeamIds: [...form.selectedTeamIds, team.id] });
                      } else {
                        setForm({
                          ...form,
                          selectedTeamIds: form.selectedTeamIds.filter((id: string) => id !== team.id),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  {team.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? '...' : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
