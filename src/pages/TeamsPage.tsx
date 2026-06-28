import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PasswordConfirmModal from '../components/PasswordConfirmModal';

interface Team {
  id: string;
  name: string;
  description?: string;
  coach?: string;
  createdAt: string;
}

export default function TeamsPage() {
  const { t, lang } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

  const { data: teams = [], isLoading, refetch } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/sports/teams');
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sports/teams', data);
      return res.data.data;
    },
    onSuccess: () => {
      refetch();
      setShowForm(false);
      setEditingTeam(null);
      toast.success(t('teamCreated') || 'Team created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create team');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sports/teams/${id}`);
    },
    onSuccess: () => {
      refetch();
      toast.success(t('teamDeleted') || 'Team deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete team');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description') || '',
      coach: formData.get('coach') || '',
    };
    createMutation.mutate(data);
  };

  const filteredTeams = teams.filter((team: Team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('teams') || 'Teams'}</h1>
        <button
          onClick={() => { setEditingTeam(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          {t('createTeam') || 'Create Team'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('search') || 'Search teams...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Teams List */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t('noTeams') || 'No teams found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team: Team) => (
            <div key={team.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                {team.coach && <p className="text-sm text-gray-600">{t('coach') || 'Coach'}: {team.coach}</p>}
              </div>
              {team.description && (
                <p className="text-sm text-gray-600 mb-3">{team.description}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingTeam(team); setShowForm(true); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200 transition"
                >
                  <Edit2 size={16} />
                  {t('edit') || 'Edit'}
                </button>
                <button
                  onClick={() => setDeleteTeamId(team.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200 transition"
                >
                  <Trash2 size={16} />
                  {t('delete') || 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingTeam ? (t('editTeam') || 'Edit Team') : (t('createTeam') || 'Create Team')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('teamName') || 'Team Name'} *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTeam?.name || ''}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Manchester United"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('coach') || 'Coach'}
                </label>
                <input
                  type="text"
                  name="coach"
                  defaultValue={editingTeam?.coach || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Coach name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('description') || 'Description'}
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTeam?.description || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Team description"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? t('loading') : (t('save') || 'Save')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingTeam(null); }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  {t('cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTeamId && (\n        <PasswordConfirmModal
          title={t('deleteTeam') || 'Delete Team'}
          description="This team will be permanently deleted."
          confirmLabel={t('delete') || 'Delete'}
          onConfirm={() => { deleteMutation.mutate(deleteTeamId); setDeleteTeamId(null); }}
          onClose={() => setDeleteTeamId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
