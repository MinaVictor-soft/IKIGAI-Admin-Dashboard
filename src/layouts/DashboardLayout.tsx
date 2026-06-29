import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import {
  LayoutDashboard, Users, Calendar, Trophy, Gift,
  HelpCircle, Swords, LogOut, Menu, X, Layers, Globe, Medal, BookOpen, Settings, Flag, Database
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/users', icon: Users, key: 'users' },
  { to: '/tribes', icon: Layers, key: 'tribes' },
  { to: '/levels', icon: Medal, key: 'levels' },
  { to: '/sessions', icon: Calendar, key: 'sessions' },
  { to: '/quizzes', icon: HelpCircle, key: 'quizzes' },
  { to: '/xp', icon: Trophy, key: 'xpLeaderboard' },
  { to: '/bonus', icon: Gift, key: 'bonusQr' },
  { to: '/sports', icon: Swords, key: 'sports' },
  { to: '/tournaments', icon: Flag, key: 'tournaments' },
  { to: '/publications', icon: BookOpen, key: 'publications' },
  { to: '/settings', icon: Settings, key: 'settings' },
];

const superAdminNavItems = [
  { to: '/backup', icon: Database, label: 'Backup & Restore' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-600">IKIGAI Quest</h1>
          <p className="text-xs text-gray-400 mt-1">{t('adminPanel')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {t(key)}
            </NavLink>
          ))}
          {user?.role === 'SUPER_ADMIN' && (
            <>
              <div className="pt-2 pb-1 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Super Admin</span>
              </div>
              {superAdminNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-2"
          >
            <Globe size={16} />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-700">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
