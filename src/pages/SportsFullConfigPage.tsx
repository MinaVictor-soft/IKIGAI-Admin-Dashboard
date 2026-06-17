import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Play, Trophy, Users, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import api from '../lib/api';
import { useLang } from '../contexts/LangContext';

interface Team {
  id: string;
  name: string;
  color: string;
  maxRosterSize: number;
}

interface Player {
  id: string;
  userId: string;
  teamId: string;
  jerseyNumber?: number;
  position?: 'GK' | 'DEF' | 'MID' | 'FWD';
  user: { name: string; email: string };
}

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  scheduledAt: string;
  groupName?: string;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  numberOfGroups: number;
}

export default function SportsFullConfigPage() {
  const { t } = useLang();
  const queryClient = useQueryClient();

  // State Management
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'matches' | 'results' | 'advance'>('teams');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [formData, setFormData] = useState({ name: '', color: '#FF0000', maxRosterSize: 15 });
  const [playerForm, setPlayerForm] = useState({ userId: '', teamId: '', position: 'MID', jerseyNumber: 1 });
  const [matchForm, setMatchForm] = useState({ homeTeamId: '', awayTeamId: '', scheduledAt: '', groupName: 'Group A' });
  const [matchScore, setMatchScore] = useState({ matchId: '', homeScore: 0, awayScore: 0 });

  // Queries
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/sports/teams');
      return res.data;
    },
  });

  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await api.get('/sports/tournaments');
      return res.data;
    },
  });

  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['players', selectedTournament],
    queryFn: async () => {
      if (!selectedTournament) return [];
      const res = await api.get(`/sports/teams/${selectedTournament}/players`);
      return res.data;
    },
    enabled: !!selectedTournament,
  });

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', selectedTournament],
    queryFn: async () => {
      if (!selectedTournament) return [];
      const res = await api.get(`/sports/tournaments/${selectedTournament}/matches`);
      return res.data;
    },
    enabled: !!selectedTournament,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  // Mutations
  const createTeamMutation = useMutation<any, any, any>({
    mutationFn: (data: any) => api.post('/sports/teams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setFormData({ name: '', color: '#FF0000', maxRosterSize: 15 });
      alert('Team created successfully!');
    },
  });

  const deleteTeamMutation = useMutation<any, any, any>({
    mutationFn: (teamId: string) => api.delete(`/sports/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      alert('Team deleted successfully!');
    },
  });

  const addPlayerMutation = useMutation<any, any, any>({
    mutationFn: (data: any) => api.post(`/sports/teams/${data.teamId}/players`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setPlayerForm({ userId: '', teamId: '', position: 'MID', jerseyNumber: 1 });
      alert('Player added successfully!');
    },
  });

  const createMatchMutation = useMutation<any, any, any>({
    mutationFn: (data: any) => api.post(`/sports/tournaments/${selectedTournament}/matches`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setMatchForm({ homeTeamId: '', awayTeamId: '', scheduledAt: '', groupName: 'Group A' });
      alert('Match created successfully!');
    },
  });

  const setScoreMutation = useMutation<any, any, any>({
    mutationFn: (data: any) => api.post(`/sports/matches/${data.matchId}/score`, { homeScore: data.homeScore, awayScore: data.awayScore }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setMatchScore({ matchId: '', homeScore: 0, awayScore: 0 });
      alert('Match score updated successfully!');
    },
  });

  const advanceTournamentMutation = useMutation<any, any, string>({
    mutationFn: (tournamentId: string) => api.post(`/sports/tournaments/${tournamentId}/advance-stage`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments', 'matches'] });
      alert('Tournament advanced to next stage!');
    },
  });

  const teams = teamsData || [];
  const matches = matchesData || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Sports & Tournament Management</h1>
          <p className="text-slate-600">Complete tournament lifecycle management</p>
        </div>

        {/* Tournament Selector */}
        {tournamentsData && tournamentsData.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Select Tournament</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a Tournament --</option>
              {tournamentsData.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {[
            { id: 'teams', label: 'Teams', icon: Users },
            { id: 'players', label: 'Players', icon: Plus },
            { id: 'matches', label: 'Matches', icon: Play },
            { id: 'results', label: 'Results', icon: CheckCircle },
            { id: 'advance', label: 'Advance Cup', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Create Team</h2>
              <div className="grid grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Team Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="number"
                  min={5}
                  max={30}
                  placeholder="Max Roster Size"
                  value={formData.maxRosterSize}
                  onChange={(e) => setFormData({ ...formData, maxRosterSize: Number(e.target.value) })}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  onClick={() => createTeamMutation.mutate(formData)}
                  disabled={createTeamMutation.isPending || !formData.name}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={18} />
                  {createTeamMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Teams List</h2>
              {teamsLoading ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader className="animate-spin" size={20} />
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <p className="text-slate-500">No teams created yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="p-4 border-l-4 rounded-lg bg-slate-50 border-l-blue-500"
                      style={{ borderLeftColor: team.color }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">{team.name}</h3>
                          <p className="text-sm text-slate-600">Max Roster: {team.maxRosterSize}</p>
                        </div>
                        <button
                          onClick={() => deleteTeamMutation.mutate(team.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            {!selectedTournament ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-gap-3">
                <AlertCircle className="text-yellow-600" size={20} />
                <p className="text-yellow-800">Please select a tournament first</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Add Player to Team</h2>
                  <div className="grid grid-cols-5 gap-4">
                    <select
                      value={playerForm.teamId}
                      onChange={(e) => setPlayerForm({ ...playerForm, teamId: e.target.value })}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Select Team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={playerForm.userId}
                      onChange={(e) => setPlayerForm({ ...playerForm, userId: e.target.value })}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Select User</option>
                      {usersData?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={playerForm.position}
                      onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value as any })}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="GK">Goalkeeper</option>
                      <option value="DEF">Defender</option>
                      <option value="MID">Midfielder</option>
                      <option value="FWD">Forward</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      placeholder="Jersey #"
                      value={playerForm.jerseyNumber}
                      onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: Number(e.target.value) })}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    />
                    <button
                      onClick={() => addPlayerMutation.mutate(playerForm)}
                      disabled={addPlayerMutation.isPending || !playerForm.userId || !playerForm.teamId}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Add Player
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Players by Team</h2>
                  {playersLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="animate-spin" /> Loading...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teams.map((team) => {
                        const teamPlayers = playersData?.filter((p) => p.teamId === team.id) || [];
                        return (
                          <div key={team.id} className="border rounded-lg p-4">
                            <h3 className="font-bold text-slate-900 mb-3">{team.name}</h3>
                            {teamPlayers.length === 0 ? (
                              <p className="text-slate-500 text-sm">No players</p>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {teamPlayers.map((p) => (
                                  <div key={p.id} className="bg-slate-50 p-2 rounded text-sm">
                                    <p className="font-medium">{p.user.name}</p>
                                    <p className="text-slate-600">#{p.jerseyNumber} - {p.position}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {!selectedTournament ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-gap-3">
                <AlertCircle className="text-yellow-600" size={20} />
                <p className="text-yellow-800">Please select a tournament first</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Create Match</h2>
                  <div className="grid grid-cols-5 gap-4">
                    <select
                      value={matchForm.homeTeamId}
                      onChange={(e) => setMatchForm({ ...matchForm, homeTeamId: e.target.value })}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Home Team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={matchForm.awayTeamId}
                      onChange={(e) => setMatchForm({ ...matchForm, awayTeamId: e.target.value })}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Away Team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={matchForm.scheduledAt}
                      onChange={(e) => setMatchForm({ ...matchForm, scheduledAt: e.target.value })}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    />
                    <select
                      value={matchForm.groupName}
                      onChange={(e) => setMatchForm({ ...matchForm, groupName: e.target.value })}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="Group A">Group A</option>
                      <option value="Group B">Group B</option>
                      <option value="QF">Quarter Final</option>
                      <option value="SF">Semi Final</option>
                      <option value="Final">Final</option>
                    </select>
                    <button
                      onClick={() => createMatchMutation.mutate(matchForm)}
                      disabled={createMatchMutation.isPending || !matchForm.homeTeamId || !matchForm.awayTeamId}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Create Match
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Matches</h2>
                  {matchesLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="animate-spin" /> Loading...
                    </div>
                  ) : matches.length === 0 ? (
                    <p className="text-slate-500">No matches created</p>
                  ) : (
                    <div className="space-y-3">
                      {matches.map((match) => {
                        const homeTeam = teams.find((t) => t.id === match.homeTeamId);
                        const awayTeam = teams.find((t) => t.id === match.awayTeamId);
                        return (
                          <div key={match.id} className="border rounded-lg p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-slate-500">{match.groupName} • {new Date(match.scheduledAt).toLocaleString()}</p>
                              <p className="font-bold text-lg">
                                {homeTeam?.name} vs {awayTeam?.name}
                              </p>
                              <p className="text-slate-600">Status: {match.status}</p>
                            </div>
                            {match.homeScore !== undefined && (
                              <div className="text-right font-bold text-2xl">
                                {match.homeScore} - {match.awayScore}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {!selectedTournament ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-gap-3">
                <AlertCircle className="text-yellow-600" size={20} />
                <p className="text-yellow-800">Please select a tournament first</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Set Match Scores</h2>
                <div className="space-y-4">
                  {matches.filter((m) => m.status !== 'COMPLETED').length === 0 ? (
                    <p className="text-slate-500">All matches completed!</p>
                  ) : (
                    matches
                      .filter((m) => m.status !== 'COMPLETED')
                      .map((match) => {
                        const homeTeam = teams.find((t) => t.id === match.homeTeamId);
                        const awayTeam = teams.find((t) => t.id === match.awayTeamId);
                        return (
                          <div key={match.id} className="border rounded-lg p-4">
                            <div className="grid grid-cols-5 gap-4 items-center">
                              <div>
                                <p className="font-bold">{homeTeam?.name}</p>
                                <p className="text-sm text-slate-600">vs {awayTeam?.name}</p>
                              </div>
                              <input
                                type="number"
                                min={0}
                                placeholder="Home Score"
                                value={matchScore.matchId === match.id ? matchScore.homeScore : ''}
                                onChange={(e) =>
                                  setMatchScore({
                                    matchId: match.id,
                                    homeScore: Number(e.target.value),
                                    awayScore: matchScore.awayScore,
                                  })
                                }
                                className="px-3 py-2 border border-slate-300 rounded text-center"
                              />
                              <span className="text-center font-bold">-</span>
                              <input
                                type="number"
                                min={0}
                                placeholder="Away Score"
                                value={matchScore.matchId === match.id ? matchScore.awayScore : ''}
                                onChange={(e) =>
                                  setMatchScore({
                                    matchId: match.id,
                                    homeScore: matchScore.homeScore,
                                    awayScore: Number(e.target.value),
                                  })
                                }
                                className="px-3 py-2 border border-slate-300 rounded text-center"
                              />
                              <button
                                onClick={() => setScoreMutation.mutate(matchScore)}
                                disabled={setScoreMutation.isPending || matchScore.matchId !== match.id}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Advance Cup Tab */}
        {activeTab === 'advance' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {!selectedTournament ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-gap-3">
                <AlertCircle className="text-yellow-600" size={20} />
                <p className="text-yellow-800">Please select a tournament first</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Tournament Progression</h2>
                <div className="space-y-4">
                  {tournamentsData?.find((t) => t.id === selectedTournament) && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                      <p className="text-slate-600 mb-2">Current Status:</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {tournamentsData.find((t) => t.id === selectedTournament)?.status}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => advanceTournamentMutation.mutate(selectedTournament)}
                    disabled={advanceTournamentMutation.isPending}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 font-bold text-lg flex items-center justify-center gap-2"
                  >
                    <Trophy size={24} />
                    {advanceTournamentMutation.isPending ? 'Advancing...' : 'Advance to Next Stage'}
                  </button>
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="font-bold text-blue-900 mb-2">Tournament Stages:</p>
                    <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
                      <li>Group Stage - Round Robin matches</li>
                      <li>Auto-Advance - Top 2 teams per group advance</li>
                      <li>Knockout Stage - Quarter Finals</li>
                      <li>Semi Finals</li>
                      <li>Grand Final</li>
                    </ol>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
