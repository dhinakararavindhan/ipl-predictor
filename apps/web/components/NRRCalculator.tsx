'use client';

import { useState, useEffect } from 'react';
import { useIPLStore } from '@/lib/store';
import { TeamLogo } from './TeamLogo';
import { formatNRR } from '@/lib/utils';
import { Calculator } from 'lucide-react';
import { FIXTURES } from '@/lib/data/fixtures';

// Helper to validate overs (balls must be 0-6)
function validateOvers(value: number): number {
  const overs = Math.floor(value);
  const balls = Math.round((value - overs) * 10);
  if (balls > 6) {
    return overs + 1;
  }
  return overs + balls / 10;
}

// Helper to get today's fixture
function getTodaysFixture() {
  const today = new Date().toISOString().slice(0, 10);
  return FIXTURES.find((f) => f.date === today && !f.isCompleted) ?? null;
}

export function NRRCalculator({ 
  liveTeam1Score, 
  liveTeam2Score,
  liveTeam1Overs,
  liveTeam2Overs,
  liveTeam1Wickets,
  liveTeam2Wickets,
  selectedTeamId,
  targetTeamId
}: { 
  liveTeam1Score?: string;
  liveTeam2Score?: string;
  liveTeam1Overs?: number;
  liveTeam2Overs?: number;
  liveTeam1Wickets?: number;
  liveTeam2Wickets?: number;
  selectedTeamId?: string;
  targetTeamId?: string;
}) {
  const { teams } = useIPLStore();
  
  const todayFixture = getTodaysFixture();
  const defaultTeam1 = todayFixture ? teams.find(t => t.id === todayFixture.team1Id) : teams[0];
  const defaultTeam2 = todayFixture ? teams.find(t => t.id === todayFixture.team2Id) : teams[1];
  
  const [selectedTeam, setSelectedTeam] = useState(selectedTeamId ?? defaultTeam1?.id ?? teams[0]?.id ?? 'rcb');
  const [targetTeam, setTargetTeam] = useState(targetTeamId ?? defaultTeam2?.id ?? teams[1]?.id ?? 'srh');
  const [battingFirst, setBattingFirst] = useState(true);
  const [teamScore, setTeamScore] = useState(180);
  const [teamWickets, setTeamWickets] = useState(5);
  const [teamOvers, setTeamOvers] = useState(20);
  const [oppScore, setOppScore] = useState(150);
  const [oppWickets, setOppWickets] = useState(8);
  const [oppOvers, setOppOvers] = useState(20);
  const [showLiveView, setShowLiveView] = useState(false);

  useEffect(() => {
    if (todayFixture) {
      const t1 = teams.find(t => t.id === todayFixture.team1Id);
      const t2 = teams.find(t => t.id === todayFixture.team2Id);
      if (t1) setSelectedTeam(t1.id);
      if (t2) setTargetTeam(t2.id);
    }
  }, [todayFixture, teams]);

  useEffect(() => {
    if (showLiveView && liveTeam1Score && liveTeam2Score && liveTeam1Overs !== undefined && liveTeam2Overs !== undefined) {
      const parseScore = (scoreStr: string) => {
        const match = scoreStr.match(/(\d+)\/(\d+)/);
        if (match) return { runs: parseInt(match[1]), wickets: parseInt(match[2]) };
        return { runs: 0, wickets: 0 };
      };

      const s1 = parseScore(liveTeam1Score);
      const s2 = parseScore(liveTeam2Score);

      setTeamScore(s1.runs);
      setTeamWickets(s1.wickets);
      setTeamOvers(liveTeam1Overs);
      setOppScore(s2.runs);
      setOppWickets(s2.wickets);
      setOppOvers(liveTeam2Overs);
    }
  }, [liveTeam1Score, liveTeam2Score, liveTeam1Overs, liveTeam2Overs, liveTeam1Wickets, liveTeam2Wickets, showLiveView]);

  const team = teams.find((t) => t.id === selectedTeam);
  const target = teams.find((t) => t.id === targetTeam);

  if (!team || !target) return null;

  // Calculate tournament-level NRR
  // NRR = (Total runs scored / Total overs faced) - (Total runs conceded / Total overs bowled)
  // For a single match: (runs scored / overs batted) - (runs conceded / overs bowled)
  const matchNRR = (teamScore / teamOvers) - (oppScore / oppOvers);
  
  // Calculate tournament NRR from team stats
  // Total runs scored = (current NRR * total overs bowled) + runs scored in this match
  // Total overs bowled = (played * 20) - losses (since all-out counts as 20 overs)
  // Simplified: use current NRR and add match impact
  const played = team.played;
  const estimatedNewNRR = team.nrr + (matchNRR - team.nrr) / (played + 1);
  const wouldOvertake = estimatedNewNRR > target.nrr;
  const nrrGap = target.nrr - team.nrr;

  const liveMatchNRR = (teamScore / teamOvers) - (oppScore / oppOvers);
  const liveEstimatedNewNRR = team.nrr + (liveMatchNRR - team.nrr) / (played + 1);
  const liveWouldOvertake = liveEstimatedNewNRR > target.nrr;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-medium text-primary">NRR Impact Calculator</span>
        {todayFixture && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
            Today's Match
          </span>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowLiveView(false)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            !showLiveView 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setShowLiveView(true)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            showLiveView 
              ? 'bg-emerald-600 text-white shadow-md animate-pulse' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          Live
        </button>
      </div>

      {showLiveView ? (
        <div className="space-y-2">
          {/* Live Match Data */}
          <div className="rounded-lg p-2" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary">Live Match Data</span>
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted mb-0.5">{team.shortName}</div>
                <div className="font-bold text-primary">
                  {teamScore}/{teamWickets} <span className="text-muted">({teamOvers} ov)</span>
                </div>
              </div>
              <div>
                <div className="text-muted mb-0.5">{target.shortName}</div>
                <div className="font-bold text-primary">
                  {oppScore}/{oppWickets} <span className="text-muted">({oppOvers} ov)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live NRR Impact */}
          <div className="rounded-lg p-2 space-y-1.5" style={{ background: liveWouldOvertake ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${liveWouldOvertake ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Live NRR</span>
              <span className={`font-bold ${liveMatchNRR >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {liveMatchNRR >= 0 ? '+' : ''}{liveMatchNRR.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Current NRR</span>
              <span className="font-bold text-primary">{formatNRR(team.nrr)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Projected NRR</span>
              <span className="font-bold text-primary">{formatNRR(liveEstimatedNewNRR)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">{target.shortName} NRR</span>
              <span className="font-bold text-primary">{formatNRR(target.nrr)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Gap</span>
              <span className="font-bold text-primary">{formatNRR(nrrGap)}</span>
            </div>
            <div className="pt-0.5 text-xs font-semibold">
              {liveWouldOvertake ? (
                <span className="text-emerald-600 dark:text-emerald-400">✅ Would overtake {target.shortName}</span>
              ) : (
                <span className="text-red-500 dark:text-red-400">❌ Would NOT overtake</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-2 space-y-2" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
          {/* Team Selection */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted block mb-0.5">Your team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded px-2 py-1 text-xs text-primary"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.shortName} (NRR: {formatNRR(t.nrr)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted block mb-0.5">Opponent</label>
              <select
                value={targetTeam}
                onChange={(e) => setTargetTeam(e.target.value)}
                className="w-full rounded px-2 py-1 text-xs text-primary"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                {teams.filter((t) => t.id !== selectedTeam).map((t) => (
                  <option key={t.id} value={t.id}>{t.shortName} (NRR: {formatNRR(t.nrr)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bat/Chase Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBattingFirst(true)}
              className={`flex-1 py-1 text-[10px] font-semibold rounded ${
                battingFirst 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Bat first
            </button>
            <button
              onClick={() => setBattingFirst(false)}
              className={`flex-1 py-1 text-[10px] font-semibold rounded ${
                !battingFirst 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Chase
            </button>
          </div>

          {/* Score Inputs */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-2">
              <label className="text-[10px] text-muted">{team.shortName} score</label>
              <input
                type="number"
                value={teamScore}
                onChange={(e) => setTeamScore(Number(e.target.value))}
                className="w-full rounded px-2 py-1 text-xs text-primary mt-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted">Wkts</label>
              <input
                type="number"
                min="0"
                max="10"
                value={teamWickets}
                onChange={(e) => setTeamWickets(Math.min(10, Math.max(0, Number(e.target.value))))}
                className="w-full rounded px-2 py-1 text-xs text-primary mt-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted">{team.shortName} overs</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={teamOvers}
              onChange={(e) => setTeamOvers(validateOvers(Number(e.target.value)))}
              onBlur={(e) => setTeamOvers(validateOvers(Number(e.target.value)))}
              className="w-full rounded px-2 py-1 text-xs text-primary mt-0.5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-2">
              <label className="text-[10px] text-muted">Opponent score</label>
              <input
                type="number"
                value={oppScore}
                onChange={(e) => setOppScore(Number(e.target.value))}
                className="w-full rounded px-2 py-1 text-xs text-primary mt-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted">Wkts</label>
              <input
                type="number"
                min="0"
                max="10"
                value={oppWickets}
                onChange={(e) => setOppWickets(Math.min(10, Math.max(0, Number(e.target.value))))}
                className="w-full rounded px-2 py-1 text-xs text-primary mt-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted">Opponent overs</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={oppOvers}
              onChange={(e) => setOppOvers(validateOvers(Number(e.target.value)))}
              onBlur={(e) => setOppOvers(validateOvers(Number(e.target.value)))}
              className="w-full rounded px-2 py-1 text-xs text-primary mt-0.5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Result */}
          <div className="rounded-lg p-2 space-y-1.5" style={{ background: wouldOvertake ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${wouldOvertake ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Match NRR</span>
              <span className={`font-bold ${matchNRR >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {matchNRR >= 0 ? '+' : ''}{matchNRR.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Current NRR</span>
              <span className="font-bold text-primary">{formatNRR(team.nrr)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Projected NRR</span>
              <span className="font-bold text-primary">{formatNRR(estimatedNewNRR)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">{target.shortName} NRR</span>
              <span className="font-bold text-primary">{formatNRR(target.nrr)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Gap</span>
              <span className="font-bold text-primary">{formatNRR(nrrGap)}</span>
            </div>
            <div className="pt-0.5 text-xs font-semibold">
              {wouldOvertake ? (
                <span className="text-emerald-600 dark:text-emerald-400">✅ Would overtake {target.shortName}</span>
              ) : (
                <span className="text-red-500 dark:text-red-400">❌ Would NOT overtake</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
