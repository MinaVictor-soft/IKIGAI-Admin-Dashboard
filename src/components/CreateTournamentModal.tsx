import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { translations } from '../i18n/translations';

interface CreateTournamentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

// Auto-calculate tournament cup levels/stages based on knockout team count
const calculateCupLevels = (knockoutTeamCount: number) => {
  const stages = [];
  if (knockoutTeamCount >= 8) stages.push('QUARTER_FINAL');
  if (knockoutTeamCount >= 4) stages.push('SEMI_FINAL');
  if (knockoutTeamCount >= 2) stages.push('FINAL');
  
  return {
    stages,
    description: `${knockoutTeamCount} teams → ${stages.join(' → ')}`,
  };
};

// Generate XP based on tournament stages
const generateStageXp = (stages: string[]) => {
  return {
    groupStageWinXp: 20,
    groupStageDrawXp: 10,
    groupStageLossXp: 5,
    quarterFinalWinXp: 30,
    quarterFinalLossXp: 15,
    semiFinalWinXp: 40,
    semiFinalLossXp: 20,
    finalWinnerXp: 100,
    finalRunnerUpXp: 50,
  };
};

export default function CreateTournamentModal({ onClose, onSuccess }: CreateTournamentModalProps) {
  const { lang } = useLang();
  const t = (key: string) => translations[lang]?.[key] || key;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    selectedTeamIds: [] as string[],
    numberOfGroups: 4,
    teamsAdvancingPerGroup: 2,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
  });

  // Fetch available teams
  const { data: availableTeams = [] } = useQuery({
    queryKey: ['available-teams'],
    queryFn: () => api.get('/tournaments/available/teams').then((r) => r.data),
  });

  // Calculate tournament structure
  const totalTeams = formData.selectedTeamIds.length;
  const teamsPerGroup = totalTeams > 0 ? Math.ceil(totalTeams / formData.numberOfGroups) : 4;
  // Allow advancing up to all teams in a group (fully configurable)
  const maxAdvancing = Math.max(1, teamsPerGroup);
  const knockoutTeams = formData.numberOfGroups * formData.teamsAdvancingPerGroup;
  const cupLevels = knockoutTeams > 0 ? calculateCupLevels(knockoutTeams) : null;

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const xpConfig = generateStageXp(cupLevels?.stages || []);
      return api.post('/tournaments', {
        name: data.name,
        nameAr: data.nameAr,
        numberOfGroups: data.numberOfGroups,
        teamsPerGroup,
        teamsAdvancingPerGroup: data.teamsAdvancingPerGroup,
        pointsForWin: data.pointsForWin,
        pointsForDraw: data.pointsForDraw,
        pointsForLoss: data.pointsForLoss,
        selectedTeamIds: data.selectedTeamIds,
        ...xpConfig,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success(t('tournamentCreated'));
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || t('failed'));
    },
  });

  const handleTeamToggle = (teamId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTeamIds: prev.selectedTeamIds.includes(teamId)
        ? prev.selectedTeamIds.filter((id) => id !== teamId)
        : [...prev.selectedTeamIds, teamId],
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nameAr) {
      toast.error(t('requiredField'));
      return;
    }
    if (formData.selectedTeamIds.length === 0) {
      toast.error('Please select at least one team');
      return;
    }
    createMutation.mutate(formData);
  };

  const isRTL = lang === 'ar';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-lg w-full max-w-3xl m-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t('createTournament')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Tournament Names */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('tournamentName')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('tournamentNameEn')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="World Cup 2026"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('tournamentNameAr')}
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => handleInputChange('nameAr', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="كأس العالم 2026"
                  required
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('teams')} ({formData.selectedTeamIds.length}/{availableTeams.length})
            </h3>
            <p className="text-sm text-gray-600">
              Supported: 2, 4, 8, 16, 32, or 46 teams. Only teams with players available.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              {availableTeams.length === 0 ? (
                <p className="col-span-2 text-gray-500 py-4">No teams with players available</p>
              ) : (
                availableTeams.map((team: any) => (
                  <label key={team.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedTeamIds.includes(team.id)}
                      onChange={() => handleTeamToggle(team.id)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="flex-1">
                      <div className="font-medium text-gray-900">{team.name}</div>
                      <div className="text-xs text-gray-500">{team.playerCount} players</div>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Group Configuration */}
          {formData.selectedTeamIds.length > 0 && (
            <div className="space-y-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('groupStageConfig')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('numberOfGroups')}
                  </label>
                  <select
                    value={formData.numberOfGroups}
                    onChange={(e) => handleInputChange('numberOfGroups', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {[1, 2, 3, 4, 6, 8, 16].filter((num) => num <= totalTeams).map((num) => (
                      <option key={num} value={num}>
                        {num} groups
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    {teamsPerGroup} teams per group
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('teamsAdvancingPerGroup')}
                  </label>
                  <select
                    value={formData.teamsAdvancingPerGroup}
                    onChange={(e) => handleInputChange('teamsAdvancingPerGroup', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Array.from({ length: maxAdvancing }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} teams
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Total advancing: {knockoutTeams}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cup Levels Summary */}
          {cupLevels && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-2">📊 Tournament Cup Levels</h4>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Structure:</strong> {cupLevels.description}
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Group Stage:</strong> {totalTeams} teams in {formData.numberOfGroups} groups</p>
                <p><strong>Knockout Stage:</strong> {knockoutTeams} teams → {cupLevels.stages.join(' → ')}</p>
              </div>
            </div>
          )}

          {/* Points Configuration */}
          {formData.selectedTeamIds.length > 0 && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">{t('pointsConfig')}</h3>
              <p className="text-sm text-gray-600">Configure match points for wins, draws, and losses</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pointsForWin')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pointsForWin}
                    onChange={(e) => handleInputChange('pointsForWin', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pointsForDraw')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pointsForDraw}
                    onChange={(e) => handleInputChange('pointsForDraw', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pointsForLoss')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pointsForLoss}
                    onChange={(e) => handleInputChange('pointsForLoss', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Auto XP Info */}
          {formData.selectedTeamIds.length > 0 && cupLevels && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <strong>✓ XP Rewards:</strong> Will be auto-generated based on tournament cup levels: {cupLevels.stages.join(', ')}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || formData.selectedTeamIds.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
