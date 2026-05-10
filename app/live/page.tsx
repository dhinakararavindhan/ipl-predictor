'use client';

import { useEffect, useState, useCallback } from 'react';
import { useIPLStore } from '@/lib/store';
import { getTeamById } from '@/lib/data/teams';
import { getMatchPredictions } from '@/lib/simulation';
import { FIXTURES } from '@/lib/data/fixtures';
import { PointsTable } from '@/components/PointsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamLogo } from '@/components/TeamLogo';
import { LiveNRRTracker } from '@/components/LiveNRRTracker';
import { WinProbabilityGraph } from '@/components/WinProbabilityGraph';
import { NRRCalculator } from '@/components/NRRCalculator';
import { formatNRR } from '@/lib/utils';
import { Radio, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { Team } from '@/lib/types';

const REFRESH_INTERVAL = 30_000; // 30 seconds

// ── Types ──────────────────────────────────────────────────────────────────
interface FreeApiMatch {
  status: string;
  title: string;
  team_1: string;
  score_1: string;
  team_2: string;
  score_2: string;
  status_text: string;
}

interface LiveApiResponse {
  live: boolean;
  source?: string;
  data?: {
    status_code: number;
    season: string;
    source: string;
    status: string;
    live_count: number;
    matches: Record<string, FreeApiMatch>;
  };
  // CricAPI fallback format
  matches?: Record<string, unknown>[];
  noLiveMatch?: boolean;
  error?: string;
  cached?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getTodaysFixture() {
  const today = new Date().toISOString().slice(0, 10);
  return FIXTURES.find((f) => f.date === today && !f.isCompleted) ?? null;
}

function findTeamByName(name: string, teams: Team[]): Team | undefined {
  const lower = name.toLowerCase();
  return teams.find(
    (t) =>
      lower.includes(t.shortName.toLowerCase()) ||
      lower.includes(t.name.toLowerCase().split(' ').pop() ?? '') ||
      t.name.toLowerCase().includes(lower.split(' ').pop() ?? '')
  );
}

// ── Win probability bar ────────────────────────────────────────────────────
function WinBar({ team1Name, team2Name, prob }: { team1Name: string; team2Name: string; prob: number }) {
  const p1 = Math.round(prob * 100);
  const p2 = 100 - p1;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span style={{ color: 'var(--text)' }}>{team1Name}</span>
        <span style={{ color: 'var(--text-muted)' }}>Win probability</span>
        <span style={{ color: 'var(--text)' }}>{team2Name}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden">
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700"
          style={{ width: `${p1}%`, background: '#6366f1' }}
        >
          {p1 > 15 ? `${p1}%` : ''}
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700"
          style={{ width: `${p2}%`, background: '#f59e0b' }}
        >
          {p2 > 15 ? `${p2}%` : ''}
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{p1}%</span>
        <span>{p2}%</span>
      </div>
    </div>
  );
}

// ── Playoff impact panel ───────────────────────────────────────────────────
function PlayoffImpact({ team1, team2 }: { team1: Team; team2: Team }) {
  const { simulationResults } = useIPLStore();
  const t1Result = simulationResults.find((r) => r.teamId === team1.id);
  const t2Result = simulationResults.find((r) => r.teamId === team2.id);

  if (!t1Result || !t2Result) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {[{ team: team1, result: t1Result }, { team: team2, result: t2Result }].map(({ team, result }) => (
        <div key={team.id} className="rounded-xl p-3 space-y-1"
          style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
          <div className="text-xs text-muted font-medium">{team.shortName} playoff odds</div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Top 4</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {(result.top4Probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Top 2</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {(result.top2Probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">NRR</span>
            <span className={`font-mono font-semibold ${team.nrr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {formatNRR(team.nrr)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Live score card (free API format) ──────────────────────────────────────
function FreeApiLiveCard({ match, source }: { match: FreeApiMatch; source: string }) {
  const { teams, fixtures } = useIPLStore();

  const team1 = findTeamByName(match.team_1, teams);
  const team2 = findTeamByName(match.team_2, teams);

  // Win probability from our simulation
  let t1Prob = 0.5;
  if (team1 && team2) {
    const todayFixture = fixtures.find(
      (f) => !f.isCompleted &&
        ((f.team1Id === team1.id && f.team2Id === team2.id) ||
         (f.team1Id === team2.id && f.team2Id === team1.id))
    );
    if (todayFixture) {
      const predictions = getMatchPredictions(teams, fixtures);
      const pred = predictions.find((p) => p.fixtureId === todayFixture.id);
      if (pred) {
        t1Prob = todayFixture.team1Id === team1.id
          ? pred.team1WinProbability
          : 1 - pred.team1WinProbability;
      }
    }
  }

  const isLive = match.status === 'Live';

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={`text-xs font-semibold uppercase tracking-wide ${isLive ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {match.status}
          </span>
        </div>
        <span className="text-[10px] text-faint">via {source}</span>
      </div>

      {/* Match title */}
      <p className="text-sm font-medium text-primary">{match.title}</p>

      {/* Scores */}
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            {team1 && <TeamLogo team={team1} size="sm" />}
            <span className="font-semibold text-primary text-sm">{match.team_1}</span>
          </div>
          <span className="font-bold text-primary tabular-nums">
            {match.score_1 !== 'N.A' ? match.score_1 : 'Yet to bat'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            {team2 && <TeamLogo team={team2} size="sm" />}
            <span className="font-semibold text-primary text-sm">{match.team_2}</span>
          </div>
          <span className="font-bold text-primary tabular-nums">
            {match.score_2 !== 'N.A' ? match.score_2 : 'Yet to bat'}
          </span>
        </div>
      </div>

      {/* Status text */}
      {match.status_text && (
        <p className="text-xs text-muted italic">{match.status_text}</p>
      )}

      {/* Win probability */}
      {team1 && team2 && (
        <>
          <WinBar team1Name={team1.shortName} team2Name={team2.shortName} prob={t1Prob} />

          {/* Win probability graph (for completed/live matches with scores) */}
          {(match.score_1 !== 'N.A' || match.score_2 !== 'N.A') && (
            <WinProbabilityGraph
              team1Name={team1.shortName}
              team2Name={team2.shortName}
              team1Color={team1.color}
              team2Color={team2.color}
              score1={match.score_1}
              score2={match.score_2 !== 'N.A' ? match.score_2 : ''}
            />
          )}

          {/* Live NRR Tracker */}
          <LiveNRRTracker team1={team1} team2={team2} team1Score={match.score_1} team2Score={match.score_2} />

          <PlayoffImpact team1={team1} team2={team2} />
        </>
      )}
    </div>
  );
}

// ── Static "today's match" card (no live data) ─────────────────────────────
function TodaysMatchCard() {
  const { teams, fixtures, simulationResults } = useIPLStore();
  const fixture = getTodaysFixture();

  if (!fixture) {
    const today = new Date().toISOString().slice(0, 10);
    const completedToday = FIXTURES.find((f) => f.date === today && f.isCompleted);
    if (completedToday) {
      const t1 = getTeamById(completedToday.team1Id);
      const t2 = getTeamById(completedToday.team2Id);
      const winner = getTeamById(completedToday.winnerId ?? '');
      return (
        <div className="rounded-2xl p-6 text-center space-y-2"
          style={{ background: 'var(--row-top2)', border: '1px solid var(--border)' }}>
          <p className="text-sm text-muted">Today's match is complete</p>
          {t1 && t2 && <p className="font-bold text-primary">{t1.shortName} vs {t2.shortName}</p>}
          {winner && <p className="text-emerald-600 dark:text-emerald-400 font-semibold">🏆 {winner.name} won</p>}
        </div>
      );
    }
    return (
      <div className="rounded-2xl p-8 text-center space-y-2"
        style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
        <Clock className="w-8 h-8 mx-auto text-muted opacity-40" />
        <p className="text-muted text-sm">No match scheduled today</p>
      </div>
    );
  }

  const team1 = getTeamById(fixture.team1Id);
  const team2 = getTeamById(fixture.team2Id);
  if (!team1 || !team2) return null;

  const predictions = getMatchPredictions(teams, fixtures);
  const pred = predictions.find((p) => p.fixtureId === fixture.id);
  const t1Prob = pred?.team1WinProbability ?? 0.5;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
          Today's Match
        </span>
        <span className="ml-auto text-xs text-muted">7:30 PM IST</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <TeamLogo team={team1} size="xl" />
          <span className="font-bold text-primary text-lg">{team1.shortName}</span>
          <span className="text-xs text-muted">{team1.points} pts</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-black text-muted">VS</span>
          <span className="text-[10px] text-faint text-center max-w-[80px] leading-tight">
            {fixture.venue.split(',')[0]}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <TeamLogo team={team2} size="xl" />
          <span className="font-bold text-primary text-lg">{team2.shortName}</span>
          <span className="text-xs text-muted">{team2.points} pts</span>
        </div>
      </div>

      <WinBar team1Name={team1.shortName} team2Name={team2.shortName} prob={t1Prob} />
      <PlayoffImpact team1={team1} team2={team2} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function LivePage() {
  const { simulationResults } = useIPLStore();
  const [liveData, setLiveData] = useState<LiveApiResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchLive = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/live-match');
      const data: LiveApiResponse = await res.json();
      setLiveData(data);
      setLastRefresh(new Date());
    } catch {
      setLiveData({ live: false, error: 'Network error' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLive]);

  // Extract live match from free API format
  const freeApiMatches = liveData?.data?.matches
    ? Object.values(liveData.data.matches)
    : [];
  const hasLiveMatch = liveData?.live && freeApiMatches.length > 0;
  const hasAnyMatchData = freeApiMatches.length > 0;
  const liveMatch = freeApiMatches[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-3">
            <Radio className="w-7 h-7 text-red-500" />
            Live
          </h1>
          <p className="text-muted mt-1 text-sm">
            Today's match · Win prediction · Live standings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {liveData && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {hasLiveMatch ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              {lastRefresh && (
                <span>
                  {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          )}
          <button
            onClick={fetchLive}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: live match card */}
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {hasLiveMatch ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                    Live Score
                  </>
                ) : hasAnyMatchData && liveMatch?.status === 'Completed' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    Latest Result
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Today's Match
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!liveData ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted" />
                </div>
              ) : hasAnyMatchData && liveMatch ? (
                <FreeApiLiveCard match={liveMatch} source={liveData.source ?? 'unknown'} />
              ) : (
                <TodaysMatchCard />
              )}
            </CardContent>
          </Card>

          {hasLiveMatch && (
            <p className="text-xs text-faint text-center">
              Auto-refreshes every 30 seconds · Source: {liveData?.source}
            </p>
          )}
          {!hasLiveMatch && hasAnyMatchData && (
            <p className="text-xs text-faint text-center">
              Source: {liveData?.source} · Refreshes during live matches
            </p>
          )}
        </div>

        {/* Right: live standings and NRR Calculator */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Live Standings
                {refreshing && <RefreshCw className="w-3 h-3 animate-spin text-muted" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PointsTable simulationResults={simulationResults} />
            </CardContent>
          </Card>

          {/* NRR Calculator with Live View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📐 NRR Impact Calculator
                {hasLiveMatch && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Live Match Data
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NRRCalculator 
                liveTeam1Score={liveMatch?.score_1}
                liveTeam2Score={liveMatch?.score_2}
                liveTeam1Overs={liveMatch?.score_1 ? parseOvers(liveMatch.score_1) : undefined}
                liveTeam2Overs={liveMatch?.score_2 ? parseOvers(liveMatch.score_2) : undefined}
                liveTeam1Wickets={liveMatch?.score_1 ? parseWickets(liveMatch.score_1) : undefined}
                liveTeam2Wickets={liveMatch?.score_2 ? parseWickets(liveMatch.score_2) : undefined}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper functions to parse scores
function parseOvers(scoreStr: string): number | undefined {
  const match = scoreStr.match(/\(([0-9.]+)\)/);
  if (match) {
    const overs = parseFloat(match[1]);
    return overs > 20 ? 20 : overs;
  }
  return undefined;
}

function parseWickets(scoreStr: string): number | undefined {
  const match = scoreStr.match(/\/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  return undefined;
}
