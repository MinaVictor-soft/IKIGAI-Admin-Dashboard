import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Save } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { translations } from '../i18n/translations';

export default function TournamentConfigModal({
  tournamentId,
  onClose,
}: {
  tournamentId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { lang } = useLang();
  const t = (key: string) => translations[lang]?.[key] || key;
  const [config, setConfig] = useState<any>(null);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => api.get(`/sports/tournaments/${tournamentId}`).then((r) => r.data),
  });

  useEffect(() => {
    if (tournament) {
      setConfig(tournament);
    }
  }, [tournament]);

  const { data: tribes = [] } = useQuery({
    queryKey: ['tribes'],
    queryFn: () => api.get('/tribes').then((r) => r.data),
  });

  const updateConfig = useMutation({
    mutationFn: (data: any) =>
      api.patch(`/sports/tournaments/${tournamentId}/config`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success(t('success'));
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || t('failed')),
  });

  const handleChange = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
          <p>{t('tournamentsLoading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{t('pointsConfig')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Points Configuration */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{t('pointsConfig')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('pointsForWin')}</label>
                <input
                  type="number"
                  value={config?.pointsForWin || 0}
                  onChange={(e) => handleChange('pointsForWin', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('pointsForDraw')}</label>
                <input
                  type="number"
                  value={config?.pointsForDraw || 0}
                  onChange={(e) => handleChange('pointsForDraw', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('pointsForLoss')}</label>
                <input
                  type="number"
                  value={config?.pointsForLoss || 0}
                  onChange={(e) => handleChange('pointsForLoss', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Group Stage XP */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{t('groupStageWinXp')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('groupStageWinXp')}</label>
                <input
                  type="number"
                  value={config?.groupStageWinXp || 0}
                  onChange={(e) => handleChange('groupStageWinXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('groupStageDrawXp')}</label>
                <input
                  type="number"
                  value={config?.groupStageDrawXp || 0}
                  onChange={(e) => handleChange('groupStageDrawXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('groupStageLossXp')}</label>
                <input
                  type="number"
                  value={config?.groupStageLossXp || 0}
                  onChange={(e) => handleChange('groupStageLossXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Quarter-Final XP */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{t('quarterFinalWinXp')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('quarterFinalWinXp')}</label>
                <input
                  type="number"
                  value={config?.quarterFinalWinXp || 0}
                  onChange={(e) => handleChange('quarterFinalWinXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('quarterFinalLossXp')}</label>
                <input
                  type="number"
                  value={config?.quarterFinalLossXp || 0}
                  onChange={(e) => handleChange('quarterFinalLossXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Semi-Final XP */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{t('semiFinalWinXp')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('semiFinalWinXp')}</label>
                <input
                  type="number"
                  value={config?.semiFinalWinXp || 0}
                  onChange={(e) => handleChange('semiFinalWinXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('semiFinalLossXp')}</label>
                <input
                  type="number"
                  value={config?.semiFinalLossXp || 0}
                  onChange={(e) => handleChange('semiFinalLossXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Final XP */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{t('finalWinnerXp')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('finalWinnerXp')}</label>
                <input
                  type="number"
                  value={config?.finalWinnerXp || 0}
                  onChange={(e) => handleChange('finalWinnerXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('finalRunnerUpXp')}</label>
                <input
                  type="number"
                  value={config?.finalRunnerUpXp || 0}
                  onChange={(e) => handleChange('finalRunnerUpXp', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6 border-t pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => updateConfig.mutate(config)}
            disabled={updateConfig.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
