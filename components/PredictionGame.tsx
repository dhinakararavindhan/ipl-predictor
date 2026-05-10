'use client';

import { useState, useEffect } from 'react';
import { useIPLStore } from '@/lib/store';
import { getTeamById } from '@/lib/data/teams';
import { TeamLogo } from './TeamLogo';
import { Button } from './ui/button';
import { Trophy, Target, Check, X } from 'lucide-react';

interface Prediction {
  fixtureId: string;
  predictedWinner: string;
  timestamp: number;
}

interface PredictionResult {
  fixtureId: string;
  predictedWinner: string;
  actualWinner: string | undefined;
  correct: boolean | null; // null = not yet decided
}

const STORAGE_KEY = 'ipl-predictions';
const NAME_KEY = 'ipl-predictor-name';

function loadPredictions(): Prediction[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function savePredictions(predictions: Prediction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
}

export function PredictionGame() {
  const { fixtures } = useIPLStore();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    setPredictions(loadPredictions());
    setName(localStorage.getItem(NAME_KEY) ?? '');
  }, []);

  const pendingFixtures = fixtures.filter((f) => !f.isCompleted);
  const completedFixtures = fixtures.filter((f) => f.isCompleted && f.winnerId);

  const predictionMap = new Map(predictions.map((p) => [p.fixtureId, p]));

  // Calculate results
  const results: PredictionResult[] = predictions.map((p) => {
    const fixture = fixtures.find((f) => f.id === p.fixtureId);
    if (!fixture || !fixture.isCompleted) {
      return { ...p, actualWinner: undefined, correct: null };
    }
    return {
      ...p,
      actualWinner: fixture.winnerId,
      correct: fixture.winnerId === p.predictedWinner,
    };
  });

  const decided = results.filter((r) => r.correct !== null);
  const correctCount = decided.filter((r) => r.correct).length;
  const accuracy = decided.length > 0 ? (correctCount / decided.length) * 100 : 0;

  const makePrediction = (fixtureId: string, winnerId: string) => {
    const updated = predictions.filter((p) => p.fixtureId !== fixtureId);
    updated.push({ fixtureId, predictedWinner: winnerId, timestamp: Date.now() });
    setPredictions(updated);
    savePredictions(updated);
  };

  const saveName = () => {
    localStorage.setItem(NAME_KEY, name);
    setShowNameInput(false);
  };

  return (
    <div className="space-y-4">
      {/* Header + stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-primary">Prediction Game</span>
        </div>
        {name ? (
          <span className="text-xs text-muted">Playing as <strong>{name}</strong></span>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setShowNameInput(true)}>
            Set name
          </Button>
        )}
      </div>

      {showNameInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm text-primary"
            style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
          />
          <Button size="sm" onClick={saveName}>Save</Button>
        </div>
      )}

      {/* Score card */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-3 text-center" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
            <div className="text-lg font-bold text-primary">{predictions.length}</div>
            <div className="text-[10px] text-muted">Predictions</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{correctCount}</div>
            <div className="text-[10px] text-muted">Correct</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{accuracy.toFixed(0)}%</div>
            <div className="text-[10px] text-muted">Accuracy</div>
          </div>
        </div>
      )}

      {/* Upcoming matches to predict */}
      <div>
        <div className="text-xs text-muted mb-2">Predict upcoming matches:</div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {pendingFixtures.slice(0, 8).map((fixture) => {
            const team1 = getTeamById(fixture.team1Id);
            const team2 = getTeamById(fixture.team2Id);
            if (!team1 || !team2) return null;

            const existing = predictionMap.get(fixture.id);

            return (
              <div
                key={fixture.id}
                className="flex items-center gap-2 rounded-xl p-2"
                style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => makePrediction(fixture.id, team1.id)}
                  className="flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: existing?.predictedWinner === team1.id ? `${team1.color}20` : 'transparent',
                    border: existing?.predictedWinner === team1.id ? `1.5px solid ${team1.color}` : '1px solid transparent',
                    color: team1.color,
                  }}
                >
                  <TeamLogo team={team1} size="xs" />
                  {team1.shortName}
                </button>
                <span className="text-[10px] text-muted">vs</span>
                <button
                  onClick={() => makePrediction(fixture.id, team2.id)}
                  className="flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: existing?.predictedWinner === team2.id ? `${team2.color}20` : 'transparent',
                    border: existing?.predictedWinner === team2.id ? `1.5px solid ${team2.color}` : '1px solid transparent',
                    color: team2.color,
                  }}
                >
                  <TeamLogo team={team2} size="xs" />
                  {team2.shortName}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past results */}
      {decided.length > 0 && (
        <div>
          <div className="text-xs text-muted mb-2">Your results:</div>
          <div className="space-y-1">
            {decided.slice(0, 5).map((r) => {
              const team = getTeamById(r.predictedWinner);
              return (
                <div key={r.fixtureId} className="flex items-center gap-2 text-xs">
                  {r.correct ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span className="text-primary">
                    Predicted {team?.shortName ?? '?'}
                  </span>
                  <span className="text-muted">
                    — {r.correct ? 'Correct!' : `Wrong (${getTeamById(r.actualWinner ?? '')?.shortName} won)`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
