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
      <div className="text-center py-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-indigo-500" />
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
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/80 dark:hover:bg-slate-700/60 transition-all"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              idx < 3 
                ? idx === 0 
                  ? 'bg-indigo-400 text-white' 
                  : idx === 1 
                  ? 'bg-slate-300 text-white' 
                  : 'bg-indigo-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}>
              #{idx + 1}
            </div>
            <TeamLogo team={{ id: player.team, name: '', shortName: '', color: '', secondaryColor: '', emoji: '' } as any} size="sm" />
            <div className="flex-1">
              <div className="font-semibold text-slate-800 dark:text-white">{player.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {player.team.toUpperCase()} • {player.matches} matches
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800 dark:text-white">{Math.round(player.predictedWickets || 0)} wickets</div>
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
