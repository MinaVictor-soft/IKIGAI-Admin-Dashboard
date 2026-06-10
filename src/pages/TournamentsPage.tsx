import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';

interface Tournament {
  id: string;
  name: string;
  nameAr?: string;
  status: string;
  numberOfGroups: number;
  teamsPerGroup: number;
  startDate?: string;
  endDate?: string;
}

export default function TournamentsPage() {
  const { t, lang } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const {
    data: tournaments,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await api.get('/sports/tournaments');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sports/tournaments', data);
      return res.data.data;
    },
    onSuccess: () => {
      refetch();
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sports/tournaments/${id}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data = {
      name: formData.get('name'),
      nameAr: formData.get('nameAr'),
      description: formData.get('description'),
      descriptionAr: formData.get('descriptionAr'),
      numberOfGroups: parseInt(formData.get('numberOfGroups') as string),
      teamsPerGroup: parseInt(formData.get('teamsPerGroup') as string),
      teamsAdvancingPerGroup: parseInt(formData.get('teamsAdvancing') as string),
      pointsForWin: parseInt(formData.get('pointsForWin') as string),
      pointsForDraw: parseInt(formData.get('pointsForDraw') as string),
      pointsForLoss: parseInt(formData.get('pointsForLoss') as string),
      groupStageWinXp: parseInt(formData.get('groupWinXp') as string),
      groupStageDrawXp: parseInt(formData.get('groupDrawXp') as string),
      groupStageLossXp: parseInt(formData.get('groupLossXp') as string),
      quarterFinalWinXp: parseInt(formData.get('quarterFinalWinXp') as string),
      quarterFinalLossXp: parseInt(formData.get('quarterFinalLossXp') as string),
      semiFinalWinXp: parseInt(formData.get('semiFinalWinXp') as string),
      semiFinalLossXp: parseInt(formData.get('semiFinalLossXp') as string),
      finalWinnerXp: parseInt(formData.get('finalWinnerXp') as string),
      finalRunnerUpXp: parseInt(formData.get('finalRunnerUpXp') as string),
    };

    createMutation.mutate(data);
  };

  if (isLoading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('tournaments')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          {t('createTournament')}
        </button>
      </div>

      {/* Tournaments List */}
      {tournaments && tournaments.length > 0 ? (
        <div className="grid gap-4">
          {tournaments.map((tourn: Tournament) => (
            <div
              key={tourn.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {lang === 'ar' ? tourn.nameAr || tourn.name : tourn.name}
                  </h3>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">{t('numberOfGroups')}:</span> {tourn.numberOfGroups}
                    </div>
                    <div>
                      <span className="font-medium">{t('teamsPerGroup')}:</span> {tourn.teamsPerGroup}
                    </div>
                    <div>
                      <span className="font-medium">{t('status')}:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        tourn.status === 'PLANNING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : tourn.status === 'GROUP_STAGE'
                          ? 'bg-blue-100 text-blue-800'
                          : tourn.status === 'KNOCKOUT'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {t(tourn.status.toLowerCase())}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTournament(tourn);
                      setShowDetails(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded"
                    title={t('viewDetails')}
                  >
                    <Eye size={18} className="text-blue-600" />
                  </button>
                  <button
                    className="p-2 hover:bg-gray-100 rounded"
                    title={t('edit')}
                  >
                    <Edit2 size={18} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(tourn.id)}
                    className="p-2 hover:bg-red-50 rounded"
                    title={t('delete')}
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">{t('noTournamentsYet')}</div>
      )}

      {/* Create Tournament Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{t('createTournament')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder={t('tournamentName')}
                  required
                  className="border rounded px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  name="nameAr"
                  placeholder="اسم البطولة"
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  name="numberOfGroups"
                  placeholder={t('numberOfGroups')}
                  defaultValue="4"
                  required
                  className="border rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  name="teamsPerGroup"
                  placeholder={t('teamsPerGroup')}
                  defaultValue="4"
                  required
                  className="border rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  name="teamsAdvancing"
                  placeholder={t('teamsAdvancing')}
                  defaultValue="2"
                  required
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  name="pointsForWin"
                  placeholder={t('pointsForWin')}
                  defaultValue="3"
                  className="border rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  name="pointsForDraw"
                  placeholder={t('pointsForDraw')}
                  defaultValue="1"
                  className="border rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  name="pointsForLoss"
                  placeholder={t('pointsForLoss')}
                  defaultValue="0"
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">{t('xpConfig')}</h3>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    name="groupWinXp"
                    placeholder={t('groupWinXp')}
                    defaultValue="50"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    name="groupDrawXp"
                    placeholder={t('groupDrawXp')}
                    defaultValue="25"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    name="groupLossXp"
                    placeholder={t('groupLossXp')}
                    defaultValue="0"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    name="quarterFinalWinXp"
                    placeholder={t('quarterFinalWinXp')}
                    defaultValue="100"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    name="quarterFinalLossXp"
                    placeholder={t('quarterFinalLossXp')}
                    defaultValue="50"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    name="semiFinalWinXp"
                    placeholder={t('semiFinalWinXp')}
                    defaultValue="150"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    name="semiFinalLossXp"
                    placeholder={t('semiFinalLossXp')}
                    defaultValue="75"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    name="finalWinnerXp"
                    placeholder={t('finalWinnerXp')}
                    defaultValue="300"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    name="finalRunnerUpXp"
                    placeholder={t('finalRunnerUpXp')}
                    defaultValue="200"
                    className="border rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? t('loading') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tournament Details Modal */}
      {showDetails && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {lang === 'ar' ? selectedTournament.nameAr || selectedTournament.name : selectedTournament.name}
              </h2>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('status')}</label>
                  <p className="text-lg">{selectedTournament.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('numberOfGroups')}</label>
                  <p className="text-lg">{selectedTournament.numberOfGroups}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('teamsPerGroup')}</label>
                  <p className="text-lg">{selectedTournament.teamsPerGroup}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('startDate')}</label>
                  <p className="text-lg">{selectedTournament.startDate ? new Date(selectedTournament.startDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {t('assignTeams')}
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {t('generateMatches')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
