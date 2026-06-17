import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useLang } from '../contexts/LangContext';
import { ArrowLeft, Trophy, Clock, Zap } from 'lucide-react';

export default function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang } = useLang();

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => id ? api.get(`/tournaments/${id}`).then(r => r.data) : null,
  });

  if (isLoading) return <div className="p-8 text-center"><div className="text-gray-500">{t('loading')}</div></div>;
  if (!tournament) return <div className="p-8 text-center text-gray-500">{t('noTournamentsYet')}</div>;

  const knockoutStages = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];
  const stageLabels: Record<string, string> = {
    'ROUND_OF_16': t('roundOf16') || 'Round of 16',
    'QUARTER_FINAL': t('quarterFinal') || 'Quarter Final',
    'SEMI_FINAL': t('semiFinal') || 'Semi Final',
    'FINAL': t('final') || 'Final'
  };

  const tournamentMatches = tournament.tournamentMatches || [];
  const groupMatches = tournamentMatches.filter((m: any) => m.stage === 'GROUP_STAGE');
  const knockoutMatches = tournamentMatches.filter((m: any) => knockoutStages.includes(m.stage));
  
  // Calculate current stage
  const getCurrentStage = () => {
    if (tournament.status === 'COMPLETED') return 'COMPLETED';
    if (tournament.status === 'GROUP_STAGE') return 'GROUP_STAGE';
    if (tournament.status === 'PLANNING') return 'PLANNING';
    // For knockout, find the latest stage with matches
    for (const stage of knockoutStages) {
      const stageMatches = knockoutMatches.filter((m: any) => m.stage === stage);
      if (stageMatches.length > 0) {
        const allCompleted = stageMatches.every((m: any) => m.status === 'COMPLETED');
        if (!allCompleted) return stage;
      }
    }
    return 'KNOCKOUT';
  };

  const currentStage = getCurrentStage();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'GROUP_STAGE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'KNOCKOUT': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PLANNING': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-gray-500 mt-1">{lang === 'ar' ? 'تفاصيل البطولة الكاملة' : 'Complete Tournament Details'}</p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-lg border-2 p-6 flex items-center justify-between ${getStatusColor(tournament.status)}`}>
          <div>
            <p className="text-sm font-semibold opacity-75">{lang === 'ar' ? 'الحالة الحالية' : 'Current Status'}</p>
            <p className="text-2xl font-bold mt-1">{tournament.status}</p>
          </div>
          <div className="text-4xl">
            {tournament.status === 'COMPLETED' && '✓'}
            {tournament.status === 'GROUP_STAGE' && '🔄'}
            {tournament.status === 'KNOCKOUT' && '⚡'}
            {tournament.status === 'PLANNING' && '📋'}
          </div>
        </div>

        {/* Tournament Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-medium">{t('numberOfGroups')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{tournament.numberOfGroups}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-medium">{t('teamsPerGroup')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{tournament.teamsPerGroup}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 font-medium">{lang === 'ar' ? 'المباريات' : 'Matches'}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{tournamentMatches.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 font-medium">{lang === 'ar' ? 'مكتملة' : 'Completed'}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{tournamentMatches.filter((m: any) => m.status === 'COMPLETED').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 font-medium">{lang === 'ar' ? 'قيد التقدم' : 'In Progress'}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{tournamentMatches.filter((m: any) => m.status !== 'COMPLETED').length}</p>
          </div>
        </div>

        {/* Group Stage Section */}
        {tournament.groups && tournament.groups.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={28} className="text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">{t('groupStage')}</h2>
            </div>
            
            <div className={`grid gap-6 ${tournament.numberOfGroups === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
              {tournament.groups.map((group: any) => (
                <div key={group.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                  {/* Group Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                    <h3 className="text-xl font-bold">{group.groupName}</h3>
                    <p className="text-blue-100 text-sm mt-1">{group.teams?.length || 0} {lang === 'ar' ? 'فريق' : 'Teams'}</p>
                  </div>

                  {/* Team Standings */}
                  <div className="p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{lang === 'ar' ? 'الترتيب' : 'Standings'}</p>
                    <div className="space-y-2">
                      {group.teams
                        ?.sort((a: any, b: any) => {
                          if (b.points !== a.points) return b.points - a.points;
                          const aDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0);
                          const bDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0);
                          return bDiff - aDiff;
                        })
                        .map((team: any, pos: number) => (
                          <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {pos + 1}
                              </div>
                              <span className="font-medium text-gray-800 text-sm">{team.team?.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">{team.points}</div>
                              <div className="text-xs text-gray-500">{team.played}M {team.won}W {team.drawn}D {team.lost}L</div>
                              <div className="text-xs text-gray-500">{team.goalsFor}-{team.goalsAgainst}</div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Group Matches */}
                    <div className="mt-5 pt-5 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{lang === 'ar' ? 'المباريات' : 'Matches'}</p>
                      <div className="space-y-2">
                        {groupMatches
                          .filter((m: any) => {
                            const matchTeams = [m.team1Id, m.team2Id];
                            return group.teams?.some((t: any) => matchTeams.includes(t.teamId));
                          })
                          .map((match: any) => (
                            <div key={match.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium text-gray-700 flex-1 truncate">{match.team1?.name}</div>
                                <div className="font-bold text-gray-900 min-w-fit px-2">
                                  {match.team1Goals ?? '-'} - {match.team2Goals ?? '-'}
                                </div>
                                <div className="text-sm font-medium text-gray-700 flex-1 text-right truncate">{match.team2?.name}</div>
                              </div>
                              <div className={`mt-2 text-xs font-semibold px-2 py-1 rounded inline-block ${
                                match.status === 'COMPLETED' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {match.status === 'COMPLETED' ? '✓ ' + (lang === 'ar' ? 'مكتملة' : 'Completed') : lang === 'ar' ? 'قادمة' : 'Pending'}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knockout Bracket Section */}
        {knockoutMatches.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap size={28} className="text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900">{t('knockoutStage')}</h2>
            </div>
            
            <div className="space-y-6">
              {knockoutStages.map((stage) => {
                const stageMatches = knockoutMatches.filter((m: any) => m.stage === stage);
                if (stageMatches.length === 0) return null;

                const allCompleted = stageMatches.every((m: any) => m.status === 'COMPLETED');

                return (
                  <div key={stage} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Stage Header */}
                    <div className={`p-4 flex items-center justify-between ${
                      stage === currentStage && tournament.status !== 'COMPLETED' 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700' 
                        : allCompleted ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-gray-600 to-gray-700'
                    } text-white`}>
                      <h3 className="text-lg font-bold">{stageLabels[stage]}</h3>
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white bg-opacity-20">
                        {stageMatches.length} {lang === 'ar' ? 'مباراة' : 'Match'}
                      </span>
                    </div>

                    {/* Matches */}
                    <div className="p-5 space-y-4">
                      {stageMatches.map((match: any, idx) => (
                        <div
                          key={match.id}
                          className="border-2 border-gray-200 rounded-lg p-5 hover:border-purple-400 hover:shadow-md transition bg-gray-50"
                        >
                          <div className="flex items-center justify-between gap-4">
                            {/* Team 1 */}
                            <div className="flex-1 text-center">
                              <div className="font-semibold text-gray-900 text-base">{match.team1?.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{lang === 'ar' ? 'فريق 1' : 'Team 1'}</div>
                            </div>

                            {/* Score */}
                            <div className="text-center min-w-24">
                              <div className="text-4xl font-bold text-gray-900">
                                {match.team1Goals ?? '-'} <span className="text-gray-400">:</span> {match.team2Goals ?? '-'}
                              </div>
                              <div className={`text-xs mt-2 font-semibold px-3 py-1 rounded-full inline-block ${
                                match.status === 'COMPLETED' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {match.status === 'COMPLETED' ? '✓ Finished' : 'Pending'}
                              </div>
                            </div>

                            {/* Team 2 */}
                            <div className="flex-1 text-center">
                              <div className="font-semibold text-gray-900 text-base">{match.team2?.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{lang === 'ar' ? 'فريق 2' : 'Team 2'}</div>
                            </div>
                          </div>

                          {/* Winner */}
                          {match.winner && (
                            <div className="mt-4 pt-4 border-t-2 border-gray-200">
                              <div className="text-center">
                                <span className="inline-block bg-gradient-to-r from-green-400 to-green-600 text-white font-bold px-4 py-2 rounded-full text-sm">
                                  🏆 {lang === 'ar' ? 'الفائز' : 'Winner'}: {match.winner?.name}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Champion Section */}
        {tournament.status === 'COMPLETED' && tournament.winner && (
          <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-lg shadow-2xl p-12 text-center">
            <div className="text-7xl mb-4 animate-bounce">🏆</div>
            <h3 className="text-4xl font-bold text-white mb-2">{tournament.winner.name}</h3>
            <p className="text-yellow-100 text-lg">{lang === 'ar' ? 'بطل البطولة' : 'Tournament Champion'}</p>
            <div className="mt-6 text-white text-sm font-semibold opacity-90">
              {lang === 'ar' ? 'تم الانتهاء من البطولة بنجاح' : 'Tournament Completed Successfully'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
