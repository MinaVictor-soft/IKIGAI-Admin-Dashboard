import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SessionsPage from './pages/SessionsPage';
import QuizzesPage from './pages/QuizzesPage';
import XpPage from './pages/XpPage';
import BonusPage from './pages/BonusPage';
import SportsPage from './pages/SportsPage';
import TournamentsPage from './pages/TournamentsPage';
import TribesPage from './pages/TribesPage';
import LevelsPage from './pages/LevelsPage';
import PublicationsPage from './pages/PublicationsPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="tribes" element={<TribesPage />} />
                <Route path="levels" element={<LevelsPage />} />
                <Route path="sessions" element={<SessionsPage />} />
                <Route path="quizzes" element={<QuizzesPage />} />
                <Route path="xp" element={<XpPage />} />
                <Route path="bonus" element={<BonusPage />} />
                <Route path="sports" element={<SportsPage />} />              <Route path="tournaments" element={<TournamentsPage />} />                <Route path="publications" element={<PublicationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
            <Toaster position="top-right" />
          </AuthProvider>
        </BrowserRouter>
      </LangProvider>
    </QueryClientProvider>
  );
}
