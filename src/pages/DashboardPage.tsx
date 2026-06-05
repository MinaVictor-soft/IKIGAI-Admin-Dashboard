import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Users, Calendar, Trophy, Zap, HelpCircle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function DashboardPage() {
  const { t } = useLang();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  const cards = [
    { label: t('totalUsers'), value: stats?.totalUsers ?? '-', icon: Users, color: 'bg-blue-500' },
    { label: t('activeSessions'), value: stats?.activeSessions ?? '-', icon: Calendar, color: 'bg-green-500' },
    { label: t('totalXpAwarded'), value: stats?.totalXpAwarded ?? '-', icon: Zap, color: 'bg-yellow-500' },
    { label: t('totalAttendance'), value: stats?.totalAttendance ?? '-', icon: Trophy, color: 'bg-purple-500' },
    { label: t('activeQuizzes'), value: stats?.activeQuizzes ?? '-', icon: HelpCircle, color: 'bg-pink-500' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
