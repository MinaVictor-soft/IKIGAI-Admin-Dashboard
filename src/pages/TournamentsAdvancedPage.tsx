import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, Plus, Trash2, Eye, ChevronLeft, Loader } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Tournament {
  id: string;
  name: string;
  nameAr?: string;
  status: string;
  numberOfGroups: number;
  teamsPerGroup: number;
}

interface Team {
  id: string;
  name: string;
  coach?: string;
}

export default function TournamentsAdvancedPage() {
  const { t, lang } = useLang();
  const [step, setStep] = useState<'list' | 'setup'>('list');
  const [setupStep, setSetupStep] = useState(1);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCoach, setNewTeamCoach] = useState('');

  // Form states
  const [tournamentData, setTournamentData] = useState({
    name: '',
    nameAr: '',
    numberOfGroups: 4,
    teamsPerGroup: 4,
    teamsAdvancingPerGroup: 2,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    groupStageWinXp: 50,
    groupStageDrawXp: 25,
    groupStageLossXp: 0,
    quarterFinalWinXp: 100,
    quarterFinalLossXp: 50,
    semiFinalWinXp: 150,
    semiFinalLossXp: 75,
    finalWinnerXp: 300,
    finalRunnerUpXp: 200,
  });

  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const { data: tournaments = [], refetch: refetchTournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await api.get('/sports/tournaments');
      return res.data.data || [];
    },
  });

  const { data: teams = [], refetch: refetchTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/sports/teams');
      return res.data.data || [];
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sports/tournaments', data);
      return res.data.data;
    },
    onSuccess: (newTournament) => {
      refetchTournaments();
      setSelectedTournament(newTournament);
      setSetupStep(4); // Show review
      toast.success(t('tournamentCreated') || 'Tournament created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create tournament');
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sports/teams', data);
      return res.data.data;
    },
    onSuccess: (newTeam) => {
      refetchTeams();
      setSelectedTeams([...selectedTeams, newTeam.id]);
      setNewTeamName('');
      setNewTeamCoach('');
      toast.success(t('teamCreated') || 'Team created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create team');
    },
  });

  const assignTeamsMutation = useMutation({
    mutationFn: async () => {
      // Auto-generate groups based on selected teams
      const totalTeams = selectedTeams.length;
      const teamsPerGroup = tournamentData.teamsPerGroup;
      const numberOfGroups = tournamentData.numberOfGroups;
      const requiredTeams = numberOfGroups * teamsPerGroup;

      if (totalTeams < requiredTeams) {
        throw new Error(`Need at least ${requiredTeams} teams for ${numberOfGroups} groups of ${teamsPerGroup}`);
      }

      // Shuffle teams and assign to groups
      const shuffled = [...selectedTeams].sort(() => Math.random() - 0.5);
      const groupAssignments: any = {};

      for (let i = 0; i < numberOfGroups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D, etc.
        groupAssignments[groupName] = shuffled.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
      }

      const res = await api.post(`/sports/tournaments/${selectedTournament!.id}/assign-groups`, {
        groupAssignments,
      });
      return res.data.data;
    },
    onSuccess: async () => {
      refetchTournaments();
      
      // Generate matches
      await api.post(`/sports/tournaments/${selectedTournament!.id}/generate-matches`);
      
      setSetupStep(5); // Show confirmation
      toast.success(t('groupsAssigned') || 'Groups assigned and matches generated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to assign teams');
    },
  });

  const handleTournamentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...tournamentData,
      numberOfGroups: parseInt(String(tournamentData.numberOfGroups)),
      teamsPerGroup: parseInt(String(tournamentData.teamsPerGroup)),
      teamsAdvancingPerGroup: parseInt(String(tournamentData.teamsAdvancingPerGroup)),
      pointsForWin: parseInt(String(tournamentData.pointsForWin)),
      pointsForDraw: parseInt(String(tournamentData.pointsForDraw)),
      pointsForLoss: parseInt(String(tournamentData.pointsForLoss)),
      groupStageWinXp: parseInt(String(tournamentData.groupStageWinXp)),
      groupStageDrawXp: parseInt(String(tournamentData.groupStageDrawXp)),
      groupStageLossXp: parseInt(String(tournamentData.groupStageLossXp)),
      quarterFinalWinXp: parseInt(String(tournamentData.quarterFinalWinXp)),
      quarterFinalLossXp: parseInt(String(tournamentData.quarterFinalLossXp)),
      semiFinalWinXp: parseInt(String(tournamentData.semiFinalWinXp)),
      semiFinalLossXp: parseInt(String(tournamentData.semiFinalLossXp)),
      finalWinnerXp: parseInt(String(tournamentData.finalWinnerXp)),
      finalRunnerUpXp: parseInt(String(tournamentData.finalRunnerUpXp)),
    };
    
    createTournamentMutation.mutate(data);
    setSetupStep(2);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    createTeamMutation.mutate({
      name: newTeamName,
      coach: newTeamCoach,
      description: '',
    });
  };

  const handleAssignTeams = () => {
    const required = tournamentData.numberOfGroups * tournamentData.teamsPerGroup;
    if (selectedTeams.length < required) {
      toast.error(`Need at least ${required} teams for this configuration`);
      return;
    }
    assignTeamsMutation.mutate();
  };

  if (step === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('tournaments')}</h1>
          <button
            onClick={() => {
              setStep('setup');
              setSetupStep(1);
              setTournamentData({
                name: '',
                nameAr: '',
                numberOfGroups: 4,
                teamsPerGroup: 4,
                teamsAdvancingPerGroup: 2,
                pointsForWin: 3,
                pointsForDraw: 1,
                pointsForLoss: 0,
                groupStageWinXp: 50,
                groupStageDrawXp: 25,
                groupStageLossXp: 0,
                quarterFinalWinXp: 100,
                quarterFinalLossXp: 50,
                semiFinalWinXp: 150,
                semiFinalLossXp: 75,
                finalWinnerXp: 300,
                finalRunnerUpXp: 200,
              });
              setSelectedTeams([]);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            {t('createTournament')}
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">{t('noTournamentsYet')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournaments.map((tournament: Tournament) => (
              <div key={tournament.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{tournament.name}</h3>
                    <p className="text-sm text-gray-600">
                      {tournament.numberOfGroups} {t('groups')} × {tournament.teamsPerGroup} {t('teams')} | Status: {tournament.status}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`flex-1 h-2 rounded ${s <= setupStep ? 'bg-blue-600' : 'bg-gray-300'}`} />
        ))}
      </div>

      {/* Step 1: Tournament Configuration */}
      {setupStep === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('createTournament')}</h2>
          <form onSubmit={handleTournamentSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('tournamentName')} (EN) *</label>
                <input
                  type="text"
                  value={tournamentData.name}
                  onChange={(e) => setTournamentData({ ...tournamentData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., World Cup 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('tournamentName')} (AR)</label>
                <input
                  type="text"
                  value={tournamentData.nameAr}
                  onChange={(e) => setTournamentData({ ...tournamentData, nameAr: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="كأس العالم 2026"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('numberOfGroups')} *</label>
                <input
                  type="number"
                  min="2"
                  max="16"
                  value={tournamentData.numberOfGroups}
                  onChange={(e) => setTournamentData({ ...tournamentData, numberOfGroups: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('teamsPerGroup')} *</label>
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={tournamentData.teamsPerGroup}
                  onChange={(e) => setTournamentData({ ...tournamentData, teamsPerGroup: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('teamsAdvancing')} *</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={tournamentData.teamsAdvancingPerGroup}
                  onChange={(e) => setTournamentData({ ...tournamentData, teamsAdvancingPerGroup: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-1">{t('pointsForWin')}</label>
                <input
                  type="number"
                  value={tournamentData.pointsForWin}
                  onChange={(e) => setTournamentData({ ...tournamentData, pointsForWin: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('pointsForDraw')}</label>
                <input
                  type="number"
                  value={tournamentData.pointsForDraw}
                  onChange={(e) => setTournamentData({ ...tournamentData, pointsForDraw: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('pointsForLoss')}</label>
                <input
                  type="number"
                  value={tournamentData.pointsForLoss}
                  onChange={(e) => setTournamentData({ ...tournamentData, pointsForLoss: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setStep('list')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                <ChevronLeft size={20} />
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={createTournamentMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createTournamentMutation.isPending && <Loader size={20} className="animate-spin" />}
                {t('next')} <ChevronRight size={20} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Team Selection/Creation */}
      {setupStep === 2 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('selectTeams')} ({selectedTeams.length} / {tournamentData.numberOfGroups * tournamentData.teamsPerGroup})</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Existing Teams */}
            <div>
              <h3 className="font-bold mb-3">{t('selectFromExisting')}</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {teams.map((team: Team) => (
                  <label key={team.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeams([...selectedTeams, team.id]);
                        } else {
                          setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium">{team.name}</div>
                      {team.coach && <div className="text-xs text-gray-600">{team.coach}</div>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Create New Team */}
            <div>
              <h3 className="font-bold mb-3">{t('createNewTeam')}</h3>
              <form onSubmit={handleCreateTeam} className="space-y-3 border border-gray-200 rounded-lg p-4">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder={t('teamName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <input
                  type="text"
                  value={newTeamCoach}
                  onChange={(e) => setNewTeamCoach(e.target.value)}
                  placeholder={t('coach')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createTeamMutation.isPending && <Loader size={16} className="animate-spin" />}
                  <Plus size={16} /> {t('createTeam')}
                </button>
              </form>
            </div>
          </div>

          <div className="flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => setSetupStep(1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              <ChevronLeft size={20} />
              {t('back')}
            </button>
            <button
              onClick={() => setSetupStep(3)}
              disabled={selectedTeams.length < tournamentData.numberOfGroups * tournamentData.teamsPerGroup}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {t('next')} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: XP Configuration */}
      {setupStep === 3 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('xpConfig')}</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Group Stage */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold mb-4">{t('groupStage')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">{t('groupWinXp')}</label>
                  <input
                    type="number"
                    value={tournamentData.groupStageWinXp}
                    onChange={(e) => setTournamentData({ ...tournamentData, groupStageWinXp: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">{t('groupDrawXp')}</label>
                  <input
                    type="number"
                    value={tournamentData.groupStageDrawXp}
                    onChange={(e) => setTournamentData({ ...tournamentData, groupStageDrawXp: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">{t('groupLossXp')}</label>
                  <input
                    type="number"
                    value={tournamentData.groupStageLossXp}
                    onChange={(e) => setTournamentData({ ...tournamentData, groupStageLossXp: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Knockout Stages */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold mb-3">{t('quarterFinalsXpLabel')}</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm mb-1">{t('quarterFinalWinXp')}</label>
                    <input
                      type="number"
                      value={tournamentData.quarterFinalWinXp}
                      onChange={(e) => setTournamentData({ ...tournamentData, quarterFinalWinXp: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">{t('quarterFinalLossXp')}</label>
                    <input
                      type="number"
                      value={tournamentData.quarterFinalLossXp}
                      onChange={(e) => setTournamentData({ ...tournamentData, quarterFinalLossXp: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold mb-3">{t('finalsXpLabel')}</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm mb-1">{t('finalWinnerXp')}</label>
                    <input
                      type="number"
                      value={tournamentData.finalWinnerXp}
                      onChange={(e) => setTournamentData({ ...tournamentData, finalWinnerXp: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">{t('finalRunnerUpXp')}</label>
                    <input
                      type="number"
                      value={tournamentData.finalRunnerUpXp}
                      onChange={(e) => setTournamentData({ ...tournamentData, finalRunnerUpXp: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => setSetupStep(2)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              <ChevronLeft size={20} />
              {t('back')}
            </button>
            <button
              onClick={() => setSetupStep(4)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              {t('next')} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {setupStep === 4 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('review')}</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-sm text-gray-600">{t('tournamentName')}</p>
              <p className="font-bold">{tournamentData.name}</p>
            </div>
            <div className="border-l-4 border-green-600 pl-4">
              <p className="text-sm text-gray-600">{t('selectedTeams')}</p>
              <p className="font-bold">{selectedTeams.length} / {tournamentData.numberOfGroups * tournamentData.teamsPerGroup}</p>
            </div>
            <div className="border-l-4 border-purple-600 pl-4">
              <p className="text-sm text-gray-600">{t('structure')}</p>
              <p className="font-bold">{tournamentData.numberOfGroups} × {tournamentData.teamsPerGroup} teams</p>
            </div>
            <div className="border-l-4 border-orange-600 pl-4">
              <p className="text-sm text-gray-600">{t('pointsPerMatch')}</p>
              <p className="font-bold">W:{tournamentData.pointsForWin} D:{tournamentData.pointsForDraw} L:{tournamentData.pointsForLoss}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => setSetupStep(3)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              <ChevronLeft size={20} />
              {t('back')}
            </button>
            <button
              onClick={handleAssignTeams}
              disabled={assignTeamsMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {assignTeamsMutation.isPending && <Loader size={20} className="animate-spin" />}
              {t('generateGroups')}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {setupStep === 5 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">{t('tournamentReady')}</h2>
          <p className="text-gray-600 mb-6">
            {selectedTournament?.name} is ready! Groups have been assigned and matches are generated.
          </p>
          <button
            onClick={() => {
              setStep('list');
              refetchTournaments();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('backToList')}
          </button>
        </div>
      )}
    </div>
  );
}
