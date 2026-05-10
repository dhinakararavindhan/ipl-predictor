'use client';

import { Team } from '@/lib/types';
import { TeamLogo } from './TeamLogo';
import { formatNRR } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LiveNRRTrackerProps {
  team1: Team;
  team2: Team;
  team1Score?: string; // e.g., "180/5 (20.0)"
  team2Score?: string; // e.g., "150/8 (19.4)"
}

// Parse score string like "180/5 (20.0)" or "180/5"
function parseScore(scoreStr: string): { runs: number; wickets: number; overs: number } | null {
  if (!scoreStr || scoreStr === 'N.A' || scoreStr === 'Yet to bat') return null;
  
  try {
    // Match patterns like "180/5 (20.0)" or "180/5 (20)" or "180/5"
    const match = scoreStr.match(/(\d+)\/(\d+)(?:\s*\((\d+(?:\.\d+)?)\))?/);
    if (!match) return null;
    
    const runs = parseInt(match[1]);
    const wickets = parseInt(match[2]);
    const overs = match[3] ? parseFloat(match[3]) : 20.0; // Default to 20 if not specified
    
    return { runs, wickets, overs };
  } catch {
    return null;
  }
}

// Calculate live NRR impact for a single match
function calculateLiveNRR(
  team: Team,
  teamRuns: number,
  teamOvers: number,
  oppRuns: number,
  oppOvers: number
): { matchNRR: number; estimatedNewNRR: number; change: number } {
  // Match NRR = (runs scored / overs batted) - (runs conceded / overs bowled)
  const matchNRR = (teamRuns / teamOvers) - (oppRuns / oppOvers);
  
  // Estimate new overall NRR (simplified approximation)
  const played = team.played;
  const estimatedNewNRR = team.nrr + (matchNRR - team.nrr) / (played + 1);
  const change = estimatedNewNRR - team.nrr;
  
  return { matchNRR, estimatedNewNRR, change };
}

export function LiveNRRTracker({ team1, team2, team1Score, team2Score }: LiveNRRTrackerProps) {
  const score1 = parseScore(team1Score ?? '');
  const score2 = parseScore(team2Score ?? '');
  
  // Calculate NRR for both teams if we have scores
  let team1NRR = null;
  let team2NRR = null;
  
  if (score1 && score2) {
    team1NRR = calculateLiveNRR(team1, score1.runs, score1.overs, score2.runs, score2.overs);
    team2NRR = calculateLiveNRR(team2, score2.runs, score2.overs, score1.runs, score1.overs);
  }
  
  const hasLiveData = team1NRR !== null && team2NRR !== null;
  
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted uppercase tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        Live NRR Impact
      </div>

      {!hasLiveData ? (
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
          <p className="text-xs text-muted">NRR updates will appear when match scores are available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Team 1 NRR */}
          <div className="rounded-xl p-3" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TeamLogo team={team1} size="sm" />
                <span className="font-semibold text-primary text-sm">{team1.shortName}</span>
              </div>
              {team1Score && (
                <span className="text-xs font-mono text-muted">{team1Score}</span>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-faint">Current NRR</div>
                <div className={`font-bold ${team1.nrr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatNRR(team1.nrr)}
                </div>
              </div>
              <div>
                <div className="text-faint">Match Impact</div>
                <div className={`font-bold flex items-center gap-1 ${team1NRR!.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {team1NRR!.change > 0.01 ? <TrendingUp className="w-3 h-3" /> : team1NRR!.change < -0.01 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {team1NRR!.change >= 0 ? '+' : ''}{team1NRR!.change.toFixed(3)}
                </div>
              </div>
              <div>
                <div className="text-faint">Projected NRR</div>
                <div className={`font-bold ${team1NRR!.estimatedNewNRR >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatNRR(team1NRR!.estimatedNewNRR)}
                </div>
              </div>
            </div>
          </div>

          {/* Team 2 NRR */}
          <div className="rounded-xl p-3" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TeamLogo team={team2} size="sm" />
                <span className="font-semibold text-primary text-sm">{team2.shortName}</span>
              </div>
              {team2Score && (
                <span className="text-xs font-mono text-muted">{team2Score}</span>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-faint">Current NRR</div>
                <div className={`font-bold ${team2.nrr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatNRR(team2.nrr)}
                </div>
              </div>
              <div>
                <div className="text-faint">Match Impact</div>
                <div className={`font-bold flex items-center gap-1 ${team2NRR!.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {team2NRR!.change > 0.01 ? <TrendingUp className="w-3 h-3" /> : team2NRR!.change < -0.01 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {team2NRR!.change >= 0 ? '+' : ''}{team2NRR!.change.toFixed(3)}
                </div>
              </div>
              <div>
                <div className="text-faint">Projected NRR</div>
                <div className={`font-bold ${team2NRR!.estimatedNewNRR >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatNRR(team2NRR!.estimatedNewNRR)}
                </div>
              </div>
            </div>
          </div>

          {/* NRR Comparison */}
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div className="text-[10px] text-muted uppercase tracking-wide mb-1">NRR Gap</div>
            <div className="font-bold text-primary">
              {Math.abs(team1NRR!.estimatedNewNRR - team2NRR!.estimatedNewNRR).toFixed(3)}
            </div>
            <div className="text-xs text-muted mt-1">
              {team1NRR!.estimatedNewNRR > team2NRR!.estimatedNewNRR 
                ? `${team1.shortName} ahead` 
                : team2NRR!.estimatedNewNRR > team1NRR!.estimatedNewNRR
                ? `${team2.shortName} ahead`
                : 'Equal'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
