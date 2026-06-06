import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../contexts/LangContext';

const DEFAULT_NAV_CONFIG = {
  dashboard: true,
  users: true,
  tribes: true,
  levels: true,
  sessions: true,
  quizzes: true,
  xp: true,
  bonus: true,
  sports: true,
  publications: true,
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', description: 'View dashboard statistics' },
  { key: 'users', label: 'Users', icon: '👥', description: 'Manage users and roles' },
  { key: 'tribes', label: 'Tribes', icon: '🏆', description: 'Manage competition tribes' },
  { key: 'levels', label: 'Levels', icon: '⭐', description: 'Manage XP levels' },
  { key: 'sessions', label: 'Sessions', icon: '📅', description: 'Create and manage sessions' },
  { key: 'quizzes', label: 'Quizzes', icon: '❓', description: 'Manage quizzes and questions' },
  { key: 'xp', label: 'XP Leaderboard', icon: '🏅', description: 'View XP rankings' },
  { key: 'bonus', label: 'Bonus QR', icon: '🎁', description: 'Manage bonus QR codes' },
  { key: 'sports', label: 'Sports', icon: '⚽', description: 'Manage sports and matches' },
  { key: 'publications', label: 'Publications', icon: '📰', description: 'Manage publications' },
];

export default function SettingsPage() {
  const { t } = useLang();
  const [config, setConfig] = useState(DEFAULT_NAV_CONFIG);
  const [savedConfig, setSavedConfig] = useState(DEFAULT_NAV_CONFIG);

  useEffect(() => {
    const stored = localStorage.getItem('admin-nav-config');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
        setSavedConfig(parsed);
      } catch (e) {
        console.error('Failed to parse nav config');
      }
    }
  }, []);

  const toggleNav = (key: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveConfig = () => {
    localStorage.setItem('admin-nav-config', JSON.stringify(config));
    setSavedConfig(config);
    toast.success('Navigation settings saved');
  };

  const resetConfig = () => {
    setConfig(DEFAULT_NAV_CONFIG);
    localStorage.removeItem('admin-nav-config');
    setSavedConfig(DEFAULT_NAV_CONFIG);
    toast.success('Settings reset to defaults');
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const visibleCount = Object.values(config).filter(Boolean).length;
  const totalCount = Object.keys(config).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">⚙️ Admin Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure navigation items visible in admin dashboard</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetConfig}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={saveConfig}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Visible Items</p>
          <p className="text-2xl font-bold text-indigo-600">{visibleCount}</p>
          <p className="text-xs text-gray-400 mt-1">of {totalCount} total</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Changes</p>
          <p className={`text-2xl font-bold ${hasChanges ? 'text-amber-600' : 'text-gray-400'}`}>
            {hasChanges ? '●' : '○'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{hasChanges ? 'Unsaved' : 'No changes'}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p className="text-sm font-semibold text-green-600">Active</p>
          <p className="text-xs text-gray-400 mt-1">Saving to localStorage</p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Dashboard Navigation</h3>
          <p className="text-xs text-gray-500 mt-1">Toggle to show/hide items in admin dashboard sidebar</p>
        </div>

        <div className="divide-y divide-gray-100">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.key}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">{item.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => toggleNav(item.key)}
                className={`p-2 rounded-lg transition flex items-center justify-center ${
                  config[item.key as keyof typeof config]
                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                {config[item.key as keyof typeof config] ? (
                  <Eye size={18} />
                ) : (
                  <EyeOff size={18} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium">💡 How it works</p>
        <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4 list-disc">
          <li>Enable/disable navigation items visible to admin users</li>
          <li>Changes are saved to browser localStorage</li>
          <li>Settings apply to all admin dashboard users on this device</li>
          <li>Use "Reset" to restore default visibility</li>
        </ul>
      </div>
    </div>
  );
}
