import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Save, Eye, EyeOff } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

const NAV_ITEMS_DEFAULT = [
  { key: 'home', label: 'Home', icon: '🏠', visible: true },
  { key: 'profile', label: 'Profile', icon: '👤', visible: true },
  { key: 'leaderboard', label: 'Leaderboard', icon: '🏆', visible: true },
  { key: 'events', label: 'Events', icon: '📅', visible: true },
  { key: 'quizzes', label: 'Quizzes', icon: '❓', visible: true },
  { key: 'library', label: 'Library', icon: '📚', visible: true },
  { key: 'sports', label: 'Sports', icon: '⚽', visible: true },
  { key: 'scan', label: 'QR Scanner', icon: '📲', visible: true },
  { key: 'info', label: 'Info', icon: 'ℹ️', visible: true },
];

export default function NavConfigPage() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [navItems, setNavItems] = useState(NAV_ITEMS_DEFAULT);
  const [platform, setPlatform] = useState<'web' | 'mobile'>('web');

  const { data: config } = useQuery({
    queryKey: ['nav-config'],
    queryFn: () => api.get('/admin/nav-config').then((r) => r.data),
    onSuccess: (data) => {
      if (data?.navConfig) {
        const config = JSON.parse(data.navConfig);
        if (config[platform]) {
          setNavItems(config[platform]);
        }
      }
    },
  });

  const updateNavConfig = useMutation({
    mutationFn: (data: any) => api.patch('/admin/nav-config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nav-config'] });
      toast.success('Navigation configuration updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update nav config'),
  });

  const handleToggleVisibility = (key: string) => {
    setNavItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const handleSave = () => {
    updateNavConfig.mutate({
      platform,
      navItems,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Navigation Configuration</h2>
        <button
          onClick={handleSave}
          disabled={updateNavConfig.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save size={16} />
          {updateNavConfig.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setPlatform('web')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              platform === 'web'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Web App
          </button>
          <button
            onClick={() => setPlatform('mobile')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              platform === 'mobile'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mobile App
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
              item.visible
                ? 'bg-white border-gray-100 hover:border-indigo-200'
                : 'bg-gray-50 border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.key}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleVisibility(item.key)}
              className={`p-2 rounded-lg transition-colors ${
                item.visible
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              title={item.visible ? 'Hide' : 'Show'}
            >
              {item.visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Info:</span> Disabled items will be hidden from the navigation bar on the selected platform.
        </p>
      </div>
    </div>
  );
}
