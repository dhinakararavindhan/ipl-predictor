'use client';

import { PLAYERS } from '@/lib/data/players';
import { TeamLogo } from './TeamLogo';
import { Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayerStat {
  name: string;
  team: string;
  matches: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
  economy?: number;
}

interface PlayerStatsResponse {
  data: {
    batting: PlayerStat[];
    bowling: PlayerStat[];
  };
  live: boolean;
}

export function PurpleCapPredictor({ playerStats }: { playerStats: PlayerStatsResponse | null }) {
  // Use live data if available, otherwise fallback to static data
  let bowlers: PlayerStat[] = [];
  
  if (playerStats?.live && playerStats.data.bowling && playerStats.data.bowling.length > 0) {
    bowlers = playerStats.data.bowling;
  } else {
    // Fallback to static data
    bowlers = PLAYERS.filter((p) => p.role === 'bowler' || p.role === 'all-rounder').map(p => ({
      name: p.name,
      team: p.teamId,
      matches: p.matches,
      runs: p.runs,
      wickets: p.wickets,
      average: p.average,
      strikeRate: p.strikeRate,
      economy: p.economy
    }));
  }
  
  const sortedPlayers = [...bowlers].map((player) => {
    // Predict wickets based on current average and remaining matches
    const avgWickets = player.wickets && player.matches > 0 ? player.wickets / player.matches : 1.2;
    const remainingMatches = 16 - player.matches;
    const predictedWickets = (player.wickets || 0) + (avgWickets * remainingMatches);
    return { ...player, predictedWickets };
  }).sort((a, b) => (b.predictedWickets || 0) - (a.predictedWickets || 0));

  return (
    <div className="space-y-6">
      <div className="text-center py-4 px-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
          <Trophy className="w-6 h-6 text-indigo-500" />
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Purple Cap Predictor
          </span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          {playerStats?.live ? 'Live data from IPL 2026' : 'Based on current form and projections'}
        </p>
      </div>

      {/* Top 10 List */}
      <div className="space-y-3">
        {sortedPlayers.slice(0, 10).map((player, idx) => (
          <div
            key={idx}
            className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300"
          >
            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
              idx < 3 
                ? idx === 0 
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : idx === 1 
                  ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-500/30' 
                  : 'bg-gradient-to-br from-indigo-700 to-indigo-900 text-white shadow-lg shadow-indigo-700/30'
                : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              #{idx + 1}
            </div>
            <div className="flex-shrink-0">
              <TeamLogo team={{ id: player.team, name: '', shortName: '', color: '', secondaryColor: '', emoji: '' } as any} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 dark:text-white truncate text-sm sm:text-base">{player.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 sm:gap-2 flex-wrap">
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs sm:text-sm">{player.team.toUpperCase()}</span>
                <span className="hidden sm:inline">• {player.matches} matches</span>
                {player.average && <span className="hidden sm:inline">• Avg: {player.average.toFixed(2)}</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">{Math.round(player.predictedWickets || 0)} wickets</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {player.wickets ? `${player.wickets} actual` : 'Projected'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
