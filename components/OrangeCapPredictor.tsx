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

export function OrangeCapPredictor({ playerStats }: { playerStats: PlayerStatsResponse | null }) {
  // Use live data if available, otherwise fallback to static data
  let batsmen: PlayerStat[] = [];
  
  if (playerStats?.live && playerStats.data.batting && playerStats.data.batting.length > 0) {
    batsmen = playerStats.data.batting;
  } else {
    // Fallback to static data
    batsmen = PLAYERS.filter((p) => p.role === 'batsman' || p.role === 'all-rounder').map(p => ({
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
  
  const sortedPlayers = [...batsmen].map((player) => {
    // Predict runs based on current average and remaining matches
    const avgRuns = player.runs && player.matches > 0 ? player.runs / player.matches : 40;
    const remainingMatches = 16 - player.matches;
    const predictedRuns = (player.runs || 0) + (avgRuns * remainingMatches);
    return { ...player, predictedRuns };
  }).sort((a, b) => (b.predictedRuns || 0) - (a.predictedRuns || 0));

  return (
    <div className="space-y-6">
      <div className="text-center py-4 px-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
          <Trophy className="w-6 h-6 text-amber-500" />
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Orange Cap Predictor
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
            className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300"
          >
            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
              idx < 3 
                ? idx === 0 
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30' 
                  : idx === 1 
                  ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-500/30' 
                  : 'bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-lg shadow-amber-700/30'
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
              <div className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">{Math.round(player.predictedRuns || 0)} runs</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {player.runs ? `${player.runs} actual` : 'Projected'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
