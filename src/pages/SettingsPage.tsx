import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, RotateCcw, AlertCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';

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
  { key: 'sports', label: 'Sports Management', icon: '⚽', description: 'Manage football/sports matches' },
  { key: 'publications', label: 'Publications', icon: '📰', description: 'Manage publications' },
];

interface AdminSettings {
  id: string;
  enableTournamentMatches: boolean;
  enableRegularSportMatches: boolean;
  enablePushNotifications: boolean;
  tournamentVisibilityWeb: boolean;
  tournamentVisibilityMobile: boolean;
  regularMatchesVisibilityWeb: boolean;
  regularMatchesVisibilityMobile: boolean;
  sportsTabVisibilityWeb: boolean;
  sportsTabVisibilityMobile: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { t } = useLang();
  const [config, setConfig] = useState(DEFAULT_NAV_CONFIG);
  const [savedConfig, setSavedConfig] = useState(DEFAULT_NAV_CONFIG);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

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
    
    // Fetch admin settings from backend
    const timer = setTimeout(() => {
      fetchAdminSettings();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response && response.data) {
        setAdminSettings(response.data);
        setOriginalSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin settings:', error);
      // Don't show error toast on initial load
    } finally {
      setLoading(false);
    }
  };

  const toggleNav = (key: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleSportsSetting = (key: keyof AdminSettings) => {
    if (adminSettings && (key.startsWith('sportsTab') || key.startsWith('tournamentVisibility'))) {
      setAdminSettings({
        ...adminSettings,
        [key]: !adminSettings[key],
      });
    }
  };

  const saveConfig = () => {
    localStorage.setItem('admin-nav-config', JSON.stringify(config));
    setSavedConfig(config);
    toast.success('Navigation settings saved');
  };

  const saveSportsSettings = async () => {
    if (!adminSettings || !originalSettings) return;
    
    setSaving(true);
    try {
      const response = await api.patch('/admin/settings', {
        sportsTabVisibilityWeb: adminSettings.sportsTabVisibilityWeb,
        sportsTabVisibilityMobile: adminSettings.sportsTabVisibilityMobile,
        tournamentVisibilityWeb: adminSettings.tournamentVisibilityWeb,
        tournamentVisibilityMobile: adminSettings.tournamentVisibilityMobile,
      });
      setOriginalSettings(response.data);
      setAdminSettings(response.data);
      toast.success('Tab visibility settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save tab visibility settings');
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = () => {
    setConfig(DEFAULT_NAV_CONFIG);
    localStorage.removeItem('admin-nav-config');
    setSavedConfig(DEFAULT_NAV_CONFIG);
    toast.success('Settings reset to defaults');
  };

  const resetSportsSettings = () => {
    if (originalSettings) {
      setAdminSettings(originalSettings);
      toast.success('Sports settings reset');
    }
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const visibleCount = Object.values(config).filter(Boolean).length;
  const totalCount = Object.keys(config).length;
  const sportsSettingsChanged = adminSettings && originalSettings && 
    (adminSettings.sportsTabVisibilityWeb !== originalSettings.sportsTabVisibilityWeb ||
     adminSettings.sportsTabVisibilityMobile !== originalSettings.sportsTabVisibilityMobile ||
     adminSettings.tournamentVisibilityWeb !== originalSettings.tournamentVisibilityWeb ||
     adminSettings.tournamentVisibilityMobile !== originalSettings.tournamentVisibilityMobile);

  const downloadBackup = async () => {
    setBackingUp(true);
    try {
      const response = await api.get('/admin/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute('download', `ikigai-backup-${timestamp}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Backup failed');
    } finally {
      setBackingUp(false);
    }
  };

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
            onClick={downloadBackup}
            disabled={backingUp}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            {backingUp ? 'Downloading...' : 'Backup All Data'}
          </button>
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

      {/* User App Tabs - Sports & Tournaments */}
      {!loading && adminSettings && (
        <div className="space-y-4">
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              👥 User App - Tab Visibility Settings
            </h2>
            <p className="text-sm text-gray-600 mt-2">Control which tabs users see in their mobile and web app navigation</p>
          </div>

          {/* Sports Matches Tab FOR USERS */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                ⚽ USERS: Sports Matches Tab (Regular Football)
              </h3>
              <p className="text-xs text-gray-500 mt-1">Show or hide the Sports tab that displays regular football matches for users</p>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Web Platform */}
              <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">🌐</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Web App</p>
                    <p className="text-xs text-gray-500">Users will see ⚽ tab in web navbar</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSportsSetting('sportsTabVisibilityWeb')}
                  className={`p-2 rounded-lg transition flex items-center justify-center ${
                    adminSettings.sportsTabVisibilityWeb
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  {adminSettings.sportsTabVisibilityWeb ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>

              {/* Mobile Platform */}
              <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">📱</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Mobile App</p>
                    <p className="text-xs text-gray-500">Users will see ⚽ tab in mobile navbar</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSportsSetting('sportsTabVisibilityMobile')}
                  className={`p-2 rounded-lg transition flex items-center justify-center ${
                    adminSettings.sportsTabVisibilityMobile
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  {adminSettings.sportsTabVisibilityMobile ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tournament Tab FOR USERS */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                🏆 USERS: Tournaments Tab (Competitions/Brackets)
              </h3>
              <p className="text-xs text-gray-500 mt-1">Show or hide the Tournaments tab that displays tournament brackets and competitions for users</p>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Web Platform */}
              <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">🌐</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Web App</p>
                    <p className="text-xs text-gray-500">Users will see 🏆 tab in web navbar</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSportsSetting('tournamentVisibilityWeb')}
                  className={`p-2 rounded-lg transition flex items-center justify-center ${
                    adminSettings.tournamentVisibilityWeb
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  {adminSettings.tournamentVisibilityWeb ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>

              {/* Mobile Platform */}
              <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">📱</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Mobile App</p>
                    <p className="text-xs text-gray-500">Users will see 🏆 tab in mobile navbar</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSportsSetting('tournamentVisibilityMobile')}
                  className={`p-2 rounded-lg transition flex items-center justify-center ${
                    adminSettings.tournamentVisibilityMobile
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  {adminSettings.tournamentVisibilityMobile ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={resetSportsSettings}
                disabled={!sportsSettingsChanged}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <RotateCcw size={16} className="inline mr-2" />
                Reset
              </button>
              <button
                onClick={saveSportsSettings}
                disabled={!sportsSettingsChanged || saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Save size={16} className="inline mr-2" />
                {saving ? 'Saving...' : 'Save Tab Settings'}
              </button>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Note</p>
              <p className="text-xs text-amber-800 mt-1">
                Changes to tab visibility will take effect immediately for new sessions. Users currently viewing the tabs may need to refresh their page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
