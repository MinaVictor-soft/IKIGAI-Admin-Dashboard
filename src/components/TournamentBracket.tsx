import React from 'react';

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore?: number;
  awayScore?: number;
  status: string;
  stageType: string;
}

interface BracketProps {
  quarterFinals: Match[];
  semiFinals: Match[];
  finals: Match[];
  t: (key: string) => string;
}

export function TournamentBracket({ quarterFinals, semiFinals, finals, t }: BracketProps) {
  const getStageLabel = (stageType: string) => {
    switch (stageType) {
      case 'QUARTER_FINAL':
        return t('quarterFinals');
      case 'SEMI_FINAL':
        return t('semiFinals');
      case 'FINAL':
        return t('finals');
      default:
        return stageType;
    }
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-3 min-w-max hover:shadow-md transition">
      <div className="flex items-center gap-2">
        <div className="flex-1 text-right">
          <p className="font-medium text-sm">{match.homeTeam?.name || 'TBD'}</p>
          {match.status === 'COMPLETED' && (
            <p className="text-xs text-gray-500">Score: {match.homeScore}</p>
          )}
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-sm font-bold">{match.homeScore ?? '-'}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 my-2 py-1 border-t border-b">
        {match.status === 'COMPLETED' ? 'Completed' : 'Scheduled'}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-sm font-bold">{match.awayScore ?? '-'}</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{match.awayTeam?.name || 'TBD'}</p>
          {match.status === 'COMPLETED' && (
            <p className="text-xs text-gray-500">Score: {match.awayScore}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-8 overflow-x-auto">
      {/* Quarter Finals */}
      {quarterFinals.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4">{t('quarterFinals')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quarterFinals.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Semi Finals */}
      {semiFinals.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4">{t('semiFinals')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {semiFinals.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Finals */}
      {finals.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4">{t('finals')}</h3>
          <div className="flex justify-center">
            {finals.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {quarterFinals.length === 0 && semiFinals.length === 0 && finals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t('noMatchesScheduled')}
        </div>
      )}
    </div>
  );
}
