'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { TeamLogo } from './TeamLogo';
import { TrendingUp, TrendingDown, Activity, Trophy } from 'lucide-react';

interface WinProbPoint {
  over: number;
  team1Prob: number;
}

interface WinProbabilityGraphProps {
  team1Name: string;
  team2Name: string;
  team1Color: string;
  team2Color: string;
  score1: string; // e.g. "166/7 (20)" or "166-7 (20)"
  score2: string; // e.g. "167/8 (20)" or "N.A" or "Yet to bat"
}

// Parse score string to extract runs, wickets, overs
function parseScore(scoreStr: string) {
  if (!scoreStr || scoreStr === 'N.A' || scoreStr === 'Yet to bat') return null;
  
  // Try different formats: "166/7 (20)" or "166-7 (20)" or "166 (20)"
  const match = scoreStr.match(/(\d+)\/?(\d*)\s*\(([0-9.]+)\)/);
  if (!match) return null;
  
  return {
    runs: parseInt(match[1]),
    wickets: match[2] ? parseInt(match[2]) : 10,
    overs: parseFloat(match[3]),
  };
}

// Calculate win probability based on current match state
function calculateWinProbability(
  team1Runs: number,
  team1Overs: number,
  team1Wickets: number,
  team2Runs: number,
  team2Overs: number,
  team2Wickets: number,
  team1Strength: number = 100,
  team2Strength: number = 100
): number {
  // If match hasn't started
  if (team1Overs === 0 && team2Overs === 0) return 0.5;
  
  // If first innings is complete
  if (team1Overs >= 20 && team2Overs === 0) {
    return 0.5; // Can't determine yet
  }
  
  // If match is complete
  if (team1Overs >= 20 && team2Overs >= 20) {
    return team2Runs > team1Runs ? 0 : 1;
  }
  
  // First innings in progress
  if (team1Overs < 20 && team2Overs === 0) {
    const ballsRemaining = (20 - team1Overs) * 6;
    const runsInOver = team1Overs > 0 ? team1Runs / team1Overs : 0;
    const projectedRuns = runsInOver * 20;
    const runRateDiff = (projectedRuns - team2Runs) / 20;
    
    let prob = 0.5 + (runRateDiff / 5);
    return Math.max(0.05, Math.min(0.95, prob));
  }
  
  // Second innings in progress
  if (team1Overs >= 20 && team2Overs > 0 && team2Overs < 20) {
    const runsNeeded = team1Runs + 1;
    const ballsRemaining = (20 - team2Overs) * 6;
    const runsScored = team2Runs;
    const wicketsRemaining = 10 - team2Wickets;
    
    const runsToWin = runsNeeded - runsScored;
    const runRateNeeded = ballsRemaining > 0 ? runsToWin / (ballsRemaining / 6) : 0;
    const currentRunRate = team2Overs > 0 ? team2Runs / team2Overs : 0;
    
    let prob = 0.5;
    
    if (runsToWin <= 0) prob = 1;
    else if (ballsRemaining <= 0) prob = 0;
    else {
      const runRateFactor = currentRunRate > runRateNeeded ? 0.3 : -0.3;
      const wicketFactor = wicketsRemaining / 10 * 0.2;
      const pressureFactor = ballsRemaining < 30 ? (wicketsRemaining < 3 ? -0.2 : 0.1) : 0;
      
      prob = 0.5 + runRateFactor + wicketFactor + pressureFactor;
    }
    
    return Math.max(0.05, Math.min(0.95, prob));
  }
  
  return 0.5;
}

/**
 * Generates a simulated ball-by-ball win probability curve
 * based on the final scores. This is an approximation — real
 * ball-by-ball data would come from a premium API.
 */
function generateWinProbCurve(score1: string, score2: string): WinProbPoint[] {
  const points: WinProbPoint[] = [];

  const s1 = parseScore(score1);
  const s2 = parseScore(score2);

  if (!s1) return [{ over: 0, team1Prob: 50 }];

  // First innings: batting team's probability starts at 50% and fluctuates
  const totalOvers = Math.ceil(s1.overs);
  for (let i = 0; i <= totalOvers; i++) {
    const progress = i / totalOvers;
    // Simulate probability based on run rate vs par
    const parScore = 170 * progress; // par score at this stage
    const actualScore = s1.runs * progress;
    const advantage = (actualScore - parScore) / 50; // normalized
    const prob = 50 + advantage * 15 + (Math.random() - 0.5) * 5;
    points.push({ over: i, team1Prob: Math.max(10, Math.min(90, prob)) });
  }

  // Second innings (if available)
  if (s2) {
    const target = s1.runs + 1;
    const totalOvers2 = Math.ceil(s2.overs);
    for (let i = 1; i <= totalOvers2; i++) {
      const progress = i / totalOvers2;
      const requiredRate = (target - s2.runs * progress) / ((1 - progress) * totalOvers2);
      const currentRate = (s2.runs * progress) / i;
      const advantage = (currentRate - requiredRate) / 3;
      // In second innings, team2 chasing means higher team2Prob = lower team1Prob
      const team2Advantage = advantage * 20;
      const prob = points[points.length - 1].team1Prob - team2Advantage + (Math.random() - 0.5) * 8;
      points.push({ over: totalOvers + i, team1Prob: Math.max(5, Math.min(95, prob)) });
    }

    // Final result
    const team1Won = s1.runs > s2.runs;
    points.push({ over: totalOvers + totalOvers2, team1Prob: team1Won ? 100 : 0 });
  }

  return points;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; payload: WinProbPoint }[] }) => {
  if (active && payload && payload.length) {
    const prob = payload[0].value;
    return (
      <div className="rounded-lg p-2 text-xs shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-primary">Over {payload[0].payload.over}</div>
        <div className="text-muted">Win%: {prob.toFixed(1)}%</div>
      </div>
    );
  }
  return null;
};

export function WinProbabilityGraph({ team1Name, team2Name, team1Color, team2Color, score1, score2 }: WinProbabilityGraphProps) {
  const [prob1, setProb1] = useState(0.5);
  const [prob2, setProb2] = useState(0.5);
  const [matchState, setMatchState] = useState('Preview');

  const s1 = parseScore(score1);
  const s2 = parseScore(score2);

  useEffect(() => {
    if (!s1 || !s2) {
      setProb1(0.5);
      setProb2(0.5);
      setMatchState('Preview');
      return;
    }

    // Calculate win probability based on match state
    const p1 = calculateWinProbability(
      s1.runs, s1.overs, s1.wickets,
      s2.runs, s2.overs, s2.wickets
    );

    setProb1(p1);
    setProb2(1 - p1);

    // Determine match state
    if (s1.overs >= 20 && s2.overs >= 20) {
      setMatchState(s2.runs > s1.runs ? 'Team 2 Won' : 'Team 1 Won');
    } else if (s1.overs >= 20) {
      setMatchState('Team 2 Batting');
    } else if (s2.overs > 0) {
      setMatchState('Team 2 Batting');
    } else {
      setMatchState('Team 1 Batting');
    }
  }, [s1, s2]);

  const data = generateWinProbCurve(score1, score2);
  const p1 = Math.round(prob1 * 100);
  const p2 = Math.round(prob2 * 100);

  if (data.length <= 1) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamLogo team={{ id: 'team1', name: team1Name, shortName: team1Name, color: team1Color } as any} size="sm" />
            <span className="font-semibold text-primary text-sm">{team1Name}</span>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted">Win Probability</div>
            <div className="text-lg font-bold text-primary">{p1}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted">Match State</div>
            <div className="text-xs font-semibold text-amber-500">{matchState}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted">Win Probability</div>
            <div className="text-lg font-bold text-primary">{p2}%</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary text-sm">{team2Name}</span>
            <TeamLogo team={{ id: 'team2', name: team2Name, shortName: team2Name, color: team2Color } as any} size="sm" />
          </div>
        </div>

        <div className="flex h-4 rounded-full overflow-hidden shadow-sm">
          <div
            className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
            style={{ width: `${p1}%`, background: team1Color }}
          >
            {p1 > 15 ? `${p1}%` : ''}
          </div>
          <div
            className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
            style={{ width: `${p2}%`, background: team2Color }}
          >
            {p2 > 15 ? `${p2}%` : ''}
          </div>
        </div>

        <div className="text-center py-6 text-xs text-muted">
          Win probability graph available during/after the match
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with current probabilities */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TeamLogo team={{ id: 'team1', name: team1Name, shortName: team1Name, color: team1Color } as any} size="sm" />
          <span className="font-semibold text-primary text-sm">{team1Name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs text-muted">Win Probability</div>
            <div className="text-lg font-bold text-primary">{p1}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted">Match State</div>
            <div className="text-xs font-semibold text-amber-500">{matchState}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted">Win Probability</div>
            <div className="text-lg font-bold text-primary">{p2}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary text-sm">{team2Name}</span>
          <TeamLogo team={{ id: 'team2', name: team2Name, shortName: team2Name, color: team2Color } as any} size="sm" />
        </div>
      </div>

      {/* Probability Bar */}
      <div className="flex h-4 rounded-full overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
          style={{ width: `${p1}%`, background: team1Color }}
        >
          {p1 > 15 ? `${p1}%` : ''}
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
          style={{ width: `${p2}%`, background: team2Color }}
        >
          {p2 > 15 ? `${p2}%` : ''}
        </div>
      </div>

      {/* Win Probability Graph */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted">
          <span style={{ color: team1Color }}>{team1Name}</span>
          <span style={{ color: team2Color }}>{team2Name}</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTeam1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={team1Color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={team1Color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="over"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="team1Prob"
              stroke={team1Color}
              strokeWidth={2}
              fill="url(#colorTeam1)"
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="text-[10px] text-faint text-center">
          Simulated win probability curve based on match progress
        </div>
      </div>

      {/* Current Scores */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg p-2" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <TeamLogo team={{ id: 'team1', name: team1Name, shortName: team1Name, color: team1Color } as any} size="xs" />
            <span className="font-semibold">{team1Name}</span>
          </div>
          <div className="font-mono text-primary">
            {score1 || 'Yet to bat'}
          </div>
        </div>
        <div className="rounded-lg p-2" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{team2Name}</span>
            <TeamLogo team={{ id: 'team2', name: team2Name, shortName: team2Name, color: team2Color } as any} size="xs" />
          </div>
          <div className="font-mono text-primary">
            {score2 || 'Yet to bat'}
          </div>
        </div>
      </div>

      {/* Probability Change Indicator */}
      <div className="rounded-xl p-3" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 text-xs text-muted mb-2">
          <Activity className="w-3 h-3" />
          <span>Win Probability Dynamics</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-muted mb-1">Current Lead</div>
            <div className="font-semibold">
              {s1 && s2 ? (
                s1.runs > s2.runs ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {team1Name} leads by {s1.runs - s2.runs} runs
                  </span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {team2Name} leads by {s2.runs - s1.runs} runs
                  </span>
                )
              ) : (
                <span className="text-muted">Match in progress</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-muted mb-1">Win Probability Shift</div>
            <div className="font-semibold">
              {Math.abs(p1 - 50) > 10 ? (
                <span className={p1 > 50 ? 'text-emerald-500' : 'text-red-500'}>
                  {p1 > 50 ? team1Name : team2Name} favored
                </span>
              ) : (
                <span className="text-amber-500">Too close to call</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
