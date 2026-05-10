'use client';

import { useState, useRef } from 'react';
import { useIPLStore } from '@/lib/store';
import { getMatchPredictions } from '@/lib/simulation';
import { FixtureCard } from './FixtureCard';
import { Button } from './ui/button';
import { RotateCcw, Zap, StopCircle } from 'lucide-react';

const DELAY_MS = 600; // ms between each match result

export function MatchSimulator() {
  const { teams, fixtures, resetAllFixtures, setFixtureWinner } = useIPLStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentlySimulating, setCurrentlySimulating] = useState<string | null>(null);
  const stopRef = useRef(false);

  const predictions = getMatchPredictions(teams, fixtures);
  const predMap = new Map(predictions.map((p) => [p.fixtureId, p.team1WinProbability]));

  const filteredFixtures = fixtures.filter((f) => {
    if (filter === 'pending') return !f.isCompleted;
    if (filter === 'completed') return f.isCompleted;
    return true;
  });

  const pendingCount = fixtures.filter((f) => !f.isCompleted).length;
  const completedCount = fixtures.filter((f) => f.isCompleted).length;

  const simulateAll = async () => {
    const pending = fixtures.filter((f) => !f.isCompleted);
    if (pending.length === 0) return;

    stopRef.current = false;
    setIsAnimating(true);
    // Switch to 'all' so completed cards are visible as they come in
    setFilter('all');

    for (const f of pending) {
      if (stopRef.current) break;

      setCurrentlySimulating(f.id);
      // Small pause so the "pulsing" card is visible before result lands
      await delay(DELAY_MS * 0.4);

      if (stopRef.current) break;

      const prob = predMap.get(f.id) ?? 0.5;
      const winnerId = Math.random() < prob ? f.team1Id : f.team2Id;
      setFixtureWinner(f.id, winnerId);

      await delay(DELAY_MS * 0.6);
    }

    setCurrentlySimulating(null);
    setIsAnimating(false);
  };

  const stopSimulation = () => {
    stopRef.current = true;
  };

  const handleReset = () => {
    stopRef.current = true;
    setIsAnimating(false);
    setCurrentlySimulating(null);
    resetAllFixtures();
    setFilter('pending');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter tabs */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs font-medium transition-colors capitalize"
              style={{
                background: filter === f ? '#6366f1' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-muted)',
              }}
            >
              {f}{' '}
              {f === 'pending'
                ? `(${pendingCount})`
                : f === 'completed'
                ? `(${completedCount})`
                : ''}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          {isAnimating ? (
            <Button size="sm" variant="danger" onClick={stopSimulation}>
              <StopCircle className="w-3 h-3" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={simulateAll}
              disabled={pendingCount === 0}
            >
              <Zap className="w-3 h-3" />
              Simulate All
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleReset} disabled={isAnimating}>
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {isAnimating && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted">
            <span>Simulating matches…</span>
            <span>{completedCount} / {completedCount + pendingCount}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{
                width: `${((completedCount) / (completedCount + pendingCount)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Fixtures Grid */}
      {filteredFixtures.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-sm">No {filter} fixtures</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              showSimulator
              team1WinProb={predMap.get(fixture.id)}
              isPulsing={currentlySimulating === fixture.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
