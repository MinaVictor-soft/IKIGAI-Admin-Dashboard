import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trophy, Users, UserPlus, X, Zap, Eye, ExternalLink, Edit2, Check } from 'lucide-react';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import { useLang } from '../contexts/LangContext';
import TournamentsTab from '../components/TournamentsTab';

export default function SportsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLang();
  
  // Initialize tab from localStorage or default to 'teams'
  const [tab, setTab] = useState<'teams' | 'matches' | 'standings' | 'tournaments'>(() => {
    const savedTab = localStorage.getItem('sportsPageTab');
    return (savedTab as 'teams' | 'matches' | 'standings' | 'tournaments') || 'teams';
  });

  // Save tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sportsPageTab', tab);
  }, [tab]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamForm, setEditTeamForm] = useState({ name: '', color: '#6366f1' });
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedMatchTournament, setSelectedMatchTournament] = useState<any>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ matchTime: '', matchPlace: '' });
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteTeamsDialog, setShowDeleteTeamsDialog] = useState(false);
  const [showDeleteMatchesDialog, setShowDeleteMatchesDialog] = useState(false);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: teams, isLoading: teamsLoading, isError: teamsError } = useQuery({
    queryKey: ['sports-teams'],
    queryFn: () => api.get('/sports/teams').then((r) => r.data),
  });

  const { data: matches, isLoading: matchesLoading, isError: matchesError } = useQuery({
    queryKey: ['sports-matches'],
    queryFn: () => api.get('/sports/matches').then((r) => r.data),
  });

  const { data: standings, isLoading: standingsLoading, isError: standingsError } = useQuery({
    queryKey: ['sports-standings'],
    queryFn: () => api.get('/sports/standings').then((r) => r.data),
  });

  const { data: teamDetail } = useQuery({
    queryKey: ['sports-team', selectedTeamId],
    queryFn: () => api.get(`/sports/teams/${selectedTeamId}`).then((r) => r.data),
    enabled: !!selectedTeamId,
  });

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments-all'],
    queryFn: () => api.get('/tournaments').then((r) => r.data),
  });

  const createTeam = useMutation({
    mutationFn: (data: any) => api.post('/sports/teams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-teams'] });
      setShowCreateTeam(false);
      toast.success('Team created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const createMatch = useMutation({
    mutationFn: (data: any) => api.post('/sports/matches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-matches'] });
      setShowCreateMatch(false);
      toast.success('Match scheduled');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const startMatch = useMutation({
    mutationFn: (id: string) => api.patch(`/sports/matches/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-matches'] });
      toast.success('Match started');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const completeMatch = useMutation({
    mutationFn: ({ id, homeScore, awayScore }: any) =>
      api.patch(`/sports/matches/${id}/complete`, { homeScore, awayScore }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-matches'] });
      queryClient.invalidateQueries({ queryKey: ['sports-standings'] });
      toast.success('Match completed');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const addPlayer = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: any }) =>
      api.post(`/sports/teams/${teamId}/players`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-team', selectedTeamId] });
      queryClient.invalidateQueries({ queryKey: ['sports-teams'] });
      setShowAddPlayer(false);
      toast.success('Player added to team');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const removePlayer = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.delete(`/sports/teams/${teamId}/players/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-team', selectedTeamId] });
      queryClient.invalidateQueries({ queryKey: ['sports-teams'] });
      toast.success('Player removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const updateTournamentMatch = useMutation({
    mutationFn: ({ tournamentId, matchId, data }: { tournamentId: string; matchId: string; data: any }) =>
      api.patch(`/tournaments/${tournamentId}/match/${matchId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments-all'] });
      toast.success('Match updated successfully');
      setEditingMatchId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update match'),
  });

  const addEvent = useMutation({
    mutationFn: ({ matchId, data }: { matchId: string; data: any }) =>
      api.post(`/sports/matches/${matchId}/events`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-matches'] });
      toast.success('Event recorded');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const updateTeam = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: any }) =>
      api.patch(`/sports/teams/${teamId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-teams'] });
      queryClient.invalidateQueries({ queryKey: ['sports-team', selectedTeamId] });
      toast.success('Team updated');
      setEditingTeamId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const deleteTeam = useMutation({
    mutationFn: (teamId: string) => api.delete(`/sports/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-teams'] });
      setSelectedTeamId(null);
      toast.success('Team deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const resetAllData = useMutation({
    mutationFn: () => api.post(`/sports/reset-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-teams'] });
      queryClient.invalidateQueries({ queryKey: ['sports-matches'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments-all'] });
      queryClient.invalidateQueries({ queryKey: ['sports-standings'] });
      setShowResetDialog(false);
      toast.success('All data cleared');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to reset'),
  });

  const deleteAllTeams = useMutation({
    mutationFn: () => api.post(`/sports/teams/delete-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-teams'] });
      queryClient.invalidateQueries({ queryKey: ['sports-standings'] });
      toast.success('All teams deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to delete teams'),
  });

  const deleteAllMatches = useMutation({
    mutationFn: () => api.post(`/sports/matches/delete-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-matches'] });
      queryClient.invalidateQueries({ queryKey: ['sports-standings'] });
      toast.success('All matches deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to delete matches'),
  });

  const deleteAllTournaments = useMutation({
    mutationFn: () => api.post(`/tournaments/delete-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments-all'] });
      toast.success('All tournaments deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to delete tournaments'),
  });

  const { data: allUsers } = useQuery({
    queryKey: ['attendees-for-sports'],
    queryFn: () => api.get('/admin/users', { params: { role: 'ATTENDEE', limit: 200 } }).then((r) => r.data),
    enabled: showAddPlayer,
  });

  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    LIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('sports')}</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button onClick={() => setTab('teams')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'teams' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          <Users size={16} /> {t('teams')}
        </button>
        <button onClick={() => setTab('matches')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'matches' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          {t('matches')}
        </button>
        <button onClick={() => setTab('standings')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'standings' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          <Trophy size={16} /> {t('standings')}
        </button>
        <button onClick={() => setTab('tournaments')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'tournaments' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          <Trophy size={16} /> {t('tournaments')}
        </button>
      </div>

      {tab === 'teams' && (
        <div className="space-y-4">
          <button onClick={() => setShowCreateTeam(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> {t('createTeam')}
          </button>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamsLoading ? (
              <div className="col-span-full text-center py-8 text-gray-400">Loading...</div>
            ) : teamsError ? (
              <div className="col-span-full text-center py-8 text-red-400">Failed to load teams. Please check your connection and try again.</div>
            ) : teams?.map((t: any) => (
              <div key={t.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                <div onClick={() => setSelectedTeamId(t.id)} className="cursor-pointer mb-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: t.color || '#6366f1' }} />
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Players: {t._count?.players ?? t.players?.length ?? 0}/{t.maxRosterSize}</p>
                    <p>W{t.wins} D{t.draws} L{t.losses} • Pts: {t.points}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => {
                      setEditingTeamId(t.id);
                      setEditTeamForm({ name: t.name, color: t.color });
                    }}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-200"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTeamTarget({ id: t.id, name: t.name })}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Delete Buttons */}
          <div className="pt-4 border-t space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowDeleteTeamsDialog(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-1"
              >
                🗑️ Delete Teams
              </button>
              <button
                onClick={() => setShowDeleteMatchesDialog(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-1"
              >
                🗑️ Delete Matches
              </button>
              <button
                onClick={() => setShowDeleteTournamentsDialog(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-1"
              >
                🗑️ Delete Tournaments
              </button>
            </div>
            <button
              onClick={() => setShowResetDialog(true)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2"
            >
              🗑️ Reset All Data
            </button>
          </div>
        </div>
      )}

      {/* Team Detail Modal */}
      {selectedTeamId && teamDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTeamId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: teamDetail.color || '#6366f1' }} />
              <div>
                <h3 className="text-lg font-bold">{teamDetail.name}</h3>
                <p className="text-sm text-gray-500">W{teamDetail.wins} D{teamDetail.draws} L{teamDetail.losses} • {teamDetail.points} pts • GD: {teamDetail.goalDifference}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700">Roster ({teamDetail.players?.length || 0} players)</h4>
              <button
                onClick={() => setShowAddPlayer(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
              >
                <UserPlus size={14} /> {t('addPlayer')}
              </button>
            </div>

            {/* Add Player Form */}
            {showAddPlayer && (
              <AddPlayerForm
                teamId={selectedTeamId!}
                users={allUsers || []}
                existingPlayerIds={(() => {
                  const allAssigned = new Set<string>();
                  (teams || []).forEach((team: any) => {
                    (team.players || []).forEach((p: any) => allAssigned.add(p.userId));
                  });
                  return Array.from(allAssigned);
                })()}
                onSubmit={(data) => addPlayer.mutate({ teamId: selectedTeamId!, data })}
                onClose={() => setShowAddPlayer(false)}
                loading={addPlayer.isPending}
              />
            )}
            <div className="space-y-2">
              {teamDetail.players?.length === 0 ? (
                <p className="text-sm text-gray-400">{t('noPlayersYet')}</p>
              ) : teamDetail.players?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-6">#{p.jerseyNumber || '-'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.user.name}</p>
                      <p className="text-xs text-gray-500">{p.position || t('notApplicable')}{p.user.tribe ? ` • ${p.user.tribe.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-0.5">
                      <p className="text-xs"><span className="text-green-600 font-semibold">{p.sportsXp ?? 0}</span> <span className="text-gray-400">Sports</span></p>
                      <p className="text-xs"><span className="text-blue-600 font-semibold">{p.conferenceXp ?? 0}</span> <span className="text-gray-400">Conference</span></p>
                      <p className="text-xs text-gray-400">Total: <span className="font-bold text-indigo-600">{p.user.totalXp}</span></p>
                    </div>
                    <button
                      onClick={() => { if (confirm(t('confirmRemovePlayer'))) removePlayer.mutate({ teamId: selectedTeamId!, userId: p.user.id }); }}
                      className="p-1 text-red-400 hover:text-red-600"
                      title={t('removePlayer')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setSelectedTeamId(null); setShowAddPlayer(false); }} className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm">{t('close')}</button>
          </div>
        </div>
      )}

      {tab === 'matches' && (
        <div className="space-y-4">
          <button onClick={() => setShowCreateMatch(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus size={16} /> {t('scheduleMatch')}
          </button>
          {matchesLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : matchesError ? (
            <div className="text-center py-8 text-red-400">Failed to load matches</div>
          ) : (
            <>
              {/* Tournament Matches */}
              {tournaments && tournaments.length > 0 && (
                <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-bold text-gray-900">🏆 Tournament Matches</h3>
                  {tournaments.map((tournament: any) =>
                    tournament.tournamentMatches?.map((m: any) => (
                      <div 
                        key={m.id} 
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-shrink-0 bg-blue-100 px-3 py-1 rounded-lg">
                              <span className="text-xs font-bold text-blue-700">{tournament.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900">{m.team1?.name ?? 'Home'}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="font-semibold text-gray-900">{m.team2?.name ?? 'Away'}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[m.status]}`}>
                            {m.status}
                          </span>
                        </div>

                        {/* Match Info - Editable */}
                        {editingMatchId === m.id ? (
                          <div className="bg-white rounded-lg p-4 mb-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 font-semibold">Date & Time</label>
                                <input 
                                  type="datetime-local" 
                                  value={editFormData.matchTime}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, matchTime: e.target.value }))}
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 font-semibold">Venue/Place</label>
                                <input 
                                  type="text" 
                                  value={editFormData.matchPlace}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, matchPlace: e.target.value }))}
                                  placeholder="e.g., Wembley Stadium"
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  updateTournamentMatch.mutate({
                                    tournamentId: tournament.id,
                                    matchId: m.id,
                                    data: {
                                      matchTime: editFormData.matchTime ? new Date(editFormData.matchTime).toISOString() : undefined,
                                      matchPlace: editFormData.matchPlace,
                                    }
                                  });
                                }}
                                disabled={updateTournamentMatch.isPending}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <Check size={14} /> Save
                              </button>
                              <button
                                onClick={() => setEditingMatchId(null)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-gray-600 mb-2 flex items-center justify-between">
                              <span>
                                {m.matchTime ? new Date(m.matchTime).toLocaleString() : 'Time not set'} 
                                {m.matchPlace && ` • ${m.matchPlace}`}
                              </span>
                              {m.status === 'COMPLETED' && (
                                <span className="font-bold text-gray-900">Score: {m.team1Goals}-{m.team2Goals}</span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              {m.status === 'SCHEDULED' && (
                                <button
                                  onClick={() => {
                                    setEditingMatchId(m.id);
                                    setEditFormData({
                                      matchTime: m.matchTime ? new Date(m.matchTime).toISOString().slice(0, 16) : '',
                                      matchPlace: m.matchPlace || ''
                                    });
                                  }}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium flex items-center gap-1"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setSelectedMatch(m);
                                  setSelectedMatchTournament(tournament);
                                }}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium flex items-center gap-1"
                              >
                                <Eye size={12} /> Details
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Regular Sports Matches */}
              {matches && matches.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">⚽ Regular Matches</h3>
                  {matches.map((m: any) => (
                    <div 
                      key={m.id} 
                      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-gray-900">{m.homeTeam?.name ?? 'Home'}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="font-semibold text-gray-900">{m.awayTeam?.name ?? 'Away'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[m.status]}`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {m.venue && `${m.venue} • `}{new Date(m.scheduledAt).toLocaleString()}
                        {m.status === 'COMPLETED' && ` • Score: ${m.homeScore}-${m.awayScore}`}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {m.status === 'SCHEDULED' && (
                          <button onClick={() => startMatch.mutate(m.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Start</button>
                        )}
                        {m.status === 'LIVE' && (
                          <>
                            <button onClick={() => {
                              const hs = prompt('Home Score:');
                              const as2 = prompt('Away Score:');
                              if (hs !== null && as2 !== null) completeMatch.mutate({ id: m.id, homeScore: Number(hs), awayScore: Number(as2) });
                            }} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">Complete</button>
                            <button onClick={() => {
                              const eventType = prompt('Event type (GOAL, ASSIST, YELLOW_CARD, RED_CARD, SUBSTITUTION):');
                              if (!eventType) return;
                              const playerId = prompt('Player ID:');
                              if (!playerId) return;
                              const teamId = prompt('Team ID:');
                              if (!teamId) return;
                              const minute = prompt('Minute:');
                              if (!minute) return;
                              addEvent.mutate({ matchId: m.id, data: { eventType, playerId, teamId, minute: Number(minute) } });
                            }} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium flex items-center gap-1">
                              <Zap size={12} /> Event
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!matches || matches.length === 0) && (!tournaments || tournaments.length === 0) && (
                <div className="text-center py-8 text-gray-400">{t('noMatchesScheduled')}</div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'standings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">P</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">W</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">D</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">L</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">GD</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {standingsLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : standingsError ? (
                <tr><td colSpan={8} className="text-center py-8 text-red-400">Failed to load standings. Please check your connection and try again.</td></tr>
              ) : standings?.map((t: any, i: number) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="text-center px-3 py-3">{t.matchesPlayed}</td>
                  <td className="text-center px-3 py-3 text-green-600">{t.wins}</td>
                  <td className="text-center px-3 py-3 text-yellow-600">{t.draws}</td>
                  <td className="text-center px-3 py-3 text-red-600">{t.losses}</td>
                  <td className="text-center px-3 py-3">{t.goalDifference}</td>
                  <td className="text-center px-3 py-3 font-bold text-indigo-600">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'tournaments' && <TournamentsTab />}

      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{t('createTeam')}</h3>
            <CreateTeamForm onClose={() => setShowCreateTeam(false)} onSubmit={(d) => createTeam.mutate(d)} loading={createTeam.isPending} />
          </div>
        </div>
      )}
      {showCreateMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{t('scheduleMatch')}</h3>
            <CreateMatchForm teams={teams || []} onClose={() => setShowCreateMatch(false)} onSubmit={(d) => createMatch.mutate(d)} loading={createMatch.isPending} />
          </div>
        </div>
      )}

      {/* Match Details Modal */}
      {/* Edit Team Modal */}
      {editingTeamId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingTeamId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Edit Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={editTeamForm.name}
                  onChange={(e) => setEditTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Team name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={editTeamForm.color}
                    onChange={(e) => setEditTeamForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10 border rounded-lg cursor-pointer"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: editTeamForm.color }}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => updateTeam.mutate({ teamId: editingTeamId, data: editTeamForm })}
                  disabled={updateTeam.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {updateTeam.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingTeamId(null)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Data Confirmation Dialog */}
      {showResetDialog && (
        <PasswordConfirmModal
          title="Reset All Sports Data?"
          description="This will permanently delete all teams, matches, tournaments, and match results."
          confirmLabel={resetAllData.isPending ? 'Clearing...' : 'Reset All Data'}
          loading={resetAllData.isPending}
          onConfirm={() => resetAllData.mutate()}
          onClose={() => setShowResetDialog(false)}
        />
      )}

      {/* Delete Teams Confirmation Dialog */}
      {showDeleteTeamsDialog && (
        <PasswordConfirmModal
          title="Delete All Teams?"
          description="This will permanently delete all teams and remove all players from teams."
          confirmLabel={deleteAllTeams.isPending ? 'Deleting...' : 'Delete All Teams'}
          loading={deleteAllTeams.isPending}
          onConfirm={() => { deleteAllTeams.mutate(); setShowDeleteTeamsDialog(false); }}
          onClose={() => setShowDeleteTeamsDialog(false)}
          danger={false}
        />
      )}

      {/* Delete Matches Confirmation Dialog */}
      {showDeleteMatchesDialog && (
        <PasswordConfirmModal
          title="Delete All Matches?"
          description="This will permanently delete all regular matches and match results."
          confirmLabel={deleteAllMatches.isPending ? 'Deleting...' : 'Delete All Matches'}
          loading={deleteAllMatches.isPending}
          onConfirm={() => { deleteAllMatches.mutate(); setShowDeleteMatchesDialog(false); }}
          onClose={() => setShowDeleteMatchesDialog(false)}
          danger={false}
        />
      )}

      {/* Delete Tournaments Confirmation Dialog */}
      {showDeleteTournamentsDialog && (
        <PasswordConfirmModal
          title="Delete All Tournaments?"
          description="This will permanently delete all tournaments, tournament matches, and results."
          confirmLabel={deleteAllTournaments.isPending ? 'Deleting...' : 'Delete All Tournaments'}
          loading={deleteAllTournaments.isPending}
          onConfirm={() => { deleteAllTournaments.mutate(); setShowDeleteTournamentsDialog(false); }}
          onClose={() => setShowDeleteTournamentsDialog(false)}
          danger={false}
        />
      )}

      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedMatch(null); setSelectedMatchTournament(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{t('matchDetails')}</h3>
              <button onClick={() => { setSelectedMatch(null); setSelectedMatchTournament(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Match Score */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">{selectedMatch.homeTeam?.name}</p>
                  <p className="text-4xl font-bold text-gray-900">{selectedMatch.homeScore ?? '-'}</p>
                </div>
                <div className="px-6 text-center">
                  <p className="text-sm font-semibold text-gray-500 mb-2">VS</p>
                  <p className={`text-xs px-3 py-1 rounded-full font-semibold inline-block ${statusColors[selectedMatch.status]}`}>
                    {selectedMatch.status}
                  </p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">{selectedMatch.awayTeam?.name}</p>
                  <p className="text-4xl font-bold text-gray-900">{selectedMatch.awayScore ?? '-'}</p>
                </div>
              </div>
            </div>

            {/* Match Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date & Time</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedMatch.matchTime 
                    ? new Date(selectedMatch.matchTime).toLocaleString() 
                    : selectedMatch.scheduledAt 
                      ? new Date(selectedMatch.scheduledAt).toLocaleString()
                      : 'Not set'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Venue</p>
                <p className="text-sm font-medium text-gray-900">{selectedMatch.matchPlace || selectedMatch.venue || 'N/A'}</p>
              </div>
              {selectedMatch.winXp && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Win XP</p>
                  <p className="text-sm font-bold text-green-600">+{selectedMatch.winXp} XP</p>
                </div>
              )}
              {selectedMatch.drawXp && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Draw XP</p>
                  <p className="text-sm font-bold text-yellow-600">+{selectedMatch.drawXp} XP</p>
                </div>
              )}
            </div>

            {/* Tournament Context */}
            {selectedMatchTournament && (
              <div className="border-t pt-6 mb-6 space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-600" />
                  {selectedMatchTournament.name} - {selectedMatch.stage}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-600">Tournament Status</p>
                    <p className="text-sm font-bold text-blue-700">{selectedMatchTournament.status}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-xs text-gray-600">Groups</p>
                    <p className="text-sm font-bold text-purple-700">{selectedMatchTournament.numberOfGroups}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-gray-600">Total Matches</p>
                    <p className="text-sm font-bold text-green-700">{selectedMatchTournament.tournamentMatches?.length || 0}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate(`/tournament/${selectedMatchTournament.id}`);
                    setSelectedMatch(null);
                    setSelectedMatchTournament(null);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition"
                >
                  <ExternalLink size={16} />
                  View Full Tournament Details
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <button onClick={() => { setSelectedMatch(null); setSelectedMatchTournament(null); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium">
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Individual Team Delete */}
      {deleteTeamTarget && (
        <PasswordConfirmModal
          title={`Delete Team "${deleteTeamTarget.name}"?`}
          description="This will permanently delete this team and remove all its players."
          confirmLabel={deleteTeam.isPending ? 'Deleting...' : 'Delete Team'}
          loading={deleteTeam.isPending}
          onConfirm={() => { deleteTeam.mutate(deleteTeamTarget.id); setDeleteTeamTarget(null); }}
          onClose={() => setDeleteTeamTarget(null)}
          danger={false}
        />
      )}
    </div>
  );
}

function CreateTeamForm({ onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', color: '#6366f1', maxRosterSize: 15 });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, maxRosterSize: Number(form.maxRosterSize) }); }} className="space-y-3">
      <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('teamName') + ' *'} required className="w-full px-3 py-2 border rounded-lg text-sm" />
      <div className="flex gap-3">
        <div className="flex-1"><label className="text-xs text-gray-500">{t('color')}</label><input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-full h-10 border rounded-lg" /></div>
        <div className="flex-1"><label className="text-xs text-gray-500">{t('maxRoster')}</label><input type="number" value={form.maxRosterSize} onChange={(e) => set('maxRosterSize', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
        <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : t('create')}</button>
      </div>
    </form>
  );
}

function CreateMatchForm({ teams, onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({ homeTeamId: '', awayTeamId: '', scheduledAt: '', venue: '', winXp: 20, drawXp: 10, lossXp: 5 });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString(), winXp: Number(form.winXp), drawXp: Number(form.drawXp), lossXp: Number(form.lossXp) }); }} className="space-y-3">
      <div>
        <label className="text-xs text-gray-500">{t('teams')} - Home *</label>
        <select value={form.homeTeamId} onChange={(e) => set('homeTeamId', e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">{t('selectTeam')}</option>
          {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500">{t('teams')} - Away *</label>
        <select value={form.awayTeamId} onChange={(e) => set('awayTeamId', e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">{t('selectTeam')}</option>
          {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500">{t('dateTime')} *</label>
        <input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>
      <input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder={t('location')} className="w-full px-3 py-2 border rounded-lg text-sm" />
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs text-gray-500">{t('winXp')}</label><input type="number" min={0} max={500} value={form.winXp} onChange={(e) => set('winXp', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs text-gray-500">{t('drawXp')}</label><input type="number" min={0} max={500} value={form.drawXp} onChange={(e) => set('drawXp', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs text-gray-500">{t('lossXp')}</label><input type="number" min={0} max={500} value={form.lossXp} onChange={(e) => set('lossXp', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
        <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : t('schedule')}</button>
      </div>
    </form>
  );
}

function AddPlayerForm({ teamId: _teamId, users, existingPlayerIds, onSubmit, onClose, loading }: any) {
  const [selected, setSelected] = useState<string[]>([]);
  const [position, setPosition] = useState('');

  const availableUsers = users.filter(
    (u: any) => !existingPlayerIds.includes(u.id)
  );

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    selected.forEach((userId) => {
      onSubmit({ userId, position: position || undefined });
    });
  };

  return (
    <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-indigo-800">Add Players ({selected.length} selected)</span>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
      <div className="max-h-64 overflow-y-auto border rounded-lg bg-white mb-2">
        {availableUsers.length === 0 ? (
          <p className="text-xs text-gray-400 p-2 text-center">No available users</p>
        ) : (
          availableUsers.map((u: any) => (
            <label key={u.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 ${selected.includes(u.id) ? 'bg-indigo-50' : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span className="text-xs text-gray-900 flex-1">{u.name}</span>
              <span className="text-xs text-gray-400">{u.email}</span>
            </label>
          ))
        )}
      </div>
      <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs mb-2">
        <option value="">Default Position</option>
        <option value="GK">Goalkeeper</option>
        <option value="DEF">Defender</option>
        <option value="MID">Midfielder</option>
        <option value="FWD">Forward</option>
      </select>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || selected.length === 0}
        className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
      >
        {loading ? 'Adding...' : `Add ${selected.length} Player${selected.length !== 1 ? 's' : ''} to Team`}
      </button>
    </div>
  );
}
