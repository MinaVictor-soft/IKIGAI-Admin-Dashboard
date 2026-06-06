import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trophy, Users, UserPlus, X, Zap } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function SportsPage() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [tab, setTab] = useState<'teams' | 'matches' | 'standings'>('teams');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

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

  const addEvent = useMutation({
    mutationFn: ({ matchId, data }: { matchId: string; data: any }) =>
      api.post(`/sports/matches/${matchId}/events`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-matches'] });
      toast.success('Event recorded');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
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
        <div className="flex gap-2">
          <button onClick={() => setShowCreateTeam(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> {t('createTeam')}
          </button>
          <button onClick={() => setShowCreateMatch(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus size={16} /> {t('scheduleMatch')}
          </button>
        </div>
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
      </div>

      {tab === 'teams' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamsLoading ? (
            <div className="col-span-full text-center py-8 text-gray-400">Loading...</div>
          ) : teamsError ? (
            <div className="col-span-full text-center py-8 text-red-400">Failed to load teams. Please check your connection and try again.</div>
          ) : teams?.map((t: any) => (
            <div key={t.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => setSelectedTeamId(t.id)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: t.color || '#6366f1' }} />
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Players: {t._count?.players ?? t.players?.length ?? 0}/{t.maxRosterSize}</p>
                <p>W{t.wins} D{t.draws} L{t.losses} • Pts: {t.points}</p>
              </div>
            </div>
          ))}
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
        <div className="grid gap-4">
          {matchesLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : matchesError ? (
            <div className="text-center py-8 text-red-400">Failed to load matches. Please check your connection and try again.</div>
          ) : matches?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('noMatchesScheduled')}</div>
          ) : matches?.map((m: any) => (
            <div key={m.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">{m.homeTeam?.name ?? 'Home'}</span>
                  <span className="text-gray-400">{t('vs')}</span>
                  <span className="font-semibold text-gray-900">{m.awayTeam?.name ?? 'Away'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[m.status]}`}>{m.status}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {m.venue && `${m.venue} • `}{new Date(m.scheduledAt).toLocaleString()}
                {m.status === 'COMPLETED' && ` • ${t('score')}: ${m.homeScore}-${m.awayScore}`}
              </p>
              <div className="flex gap-2 mt-3">
                {m.status === 'SCHEDULED' && (
                  <button onClick={() => startMatch.mutate(m.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Start</button>
                )}
                {m.status === 'LIVE' && (
                  <>
                    <button onClick={() => {
                      const hs = prompt(t('homeScore') + ':');
                      const as2 = prompt(t('awayScore') + ':');
                      if (hs !== null && as2 !== null) completeMatch.mutate({ id: m.id, homeScore: Number(hs), awayScore: Number(as2) });
                    }} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">Complete</button>
                    <button onClick={() => {
                      const eventType = prompt('Event type (GOAL, ASSIST, YELLOW_CARD, RED_CARD, SUBSTITUTION):');
                      if (!eventType) return;
                      const playerId = prompt('Player ID (UUID):');
                      if (!playerId) return;
                      const teamId = prompt('Team ID (home or away UUID):');
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
