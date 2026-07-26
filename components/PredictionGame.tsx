'use client';

import { useCallback, useEffect, useState } from 'react';
import { useIPLStore } from '@/lib/store';
import { getTeamById } from '@/lib/data/teams';
import { FIXTURES } from '@/lib/data/fixtures';
import { TeamLogo } from './TeamLogo';
import { Button } from './ui/button';
import { useSocial } from './social/SupabaseProvider';
import { SignInDialog } from './social/SignInDialog';
import { fetchMyCalls, upsertCall } from '@/lib/social/api';
import { isMatchLocked } from '@/lib/social/match';
import { Target, Check, X, CloudUpload, UserRound } from 'lucide-react';

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
const IMPORTED_KEY = 'ipl-predictions-imported';

function loadPredictions(): Prediction[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function savePredictions(predictions: Prediction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
}

function stampPrediction(fixtureId: string, predictedWinner: string): Prediction {
  return { fixtureId, predictedWinner, timestamp: Date.now() };
}

export function PredictionGame() {
  const { fixtures: simFixtures } = useIPLStore();
  const { configured, user, profile } = useSocial();
  const [localPredictions, setLocalPredictions] = useState<Prediction[]>([]);
  const [serverPredictions, setServerPredictions] = useState<Prediction[]>([]);
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [importHandled, setImportHandled] = useState(true);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Signed in (with Supabase configured) → Calls live on the server;
  // otherwise everything stays in localStorage exactly as before.
  const useServer = configured && user !== null;
  const predictions = useServer ? serverPredictions : localPredictions;

  // Server Calls are about real matches — grade and lock against the static
  // fixture data, not the simulator-mutated store copy. Signed-out local play
  // keeps the store so the game reacts to simulations as before.
  const fixtures = useServer ? FIXTURES : simFixtures;

  const loadServerCalls = useCallback(() => {
    if (!user) return Promise.resolve();
    return fetchMyCalls(user.id)
      .then((calls) =>
        setServerPredictions(
          calls.map((c) => ({
            fixtureId: c.matchId,
            predictedWinner: c.predictedTeamId,
            timestamp: new Date(c.createdAt).getTime(),
          }))
        )
      )
      .catch(() => { /* keep whatever we had */ });
  }, [user]);

  useEffect(() => {
    setLocalPredictions(loadPredictions());
    setName(localStorage.getItem(NAME_KEY) ?? '');
    setImportHandled(Boolean(localStorage.getItem(IMPORTED_KEY)));
  }, []);

  useEffect(() => {
    loadServerCalls();
  }, [loadServerCalls]);

  // Offer a one-time import of local picks once signed in
  const showImport = useServer && !importHandled && localPredictions.length > 0;

  const pendingFixtures = fixtures.filter((f) => !f.isCompleted);

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

  const makePrediction = async (fixtureId: string, winnerId: string) => {
    if (useServer) {
      const previous = serverPredictions;
      const updated = previous.filter((p) => p.fixtureId !== fixtureId);
      updated.push(stampPrediction(fixtureId, winnerId));
      setServerPredictions(updated);
      try {
        await upsertCall(fixtureId, winnerId);
      } catch {
        setServerPredictions(previous); // e.g. RLS lock after match start
      }
    } else {
      const updated = localPredictions.filter((p) => p.fixtureId !== fixtureId);
      updated.push(stampPrediction(fixtureId, winnerId));
      setLocalPredictions(updated);
      savePredictions(updated);
    }
  };

  const importLocalPicks = async () => {
    const fixtureMap = new Map(fixtures.map((f) => [f.id, f]));
    const importable = localPredictions.filter((p) => {
      const fixture = fixtureMap.get(p.fixtureId);
      return fixture && !isMatchLocked(fixture) && !predictionMap.has(p.fixtureId);
    });
    let imported = 0;
    for (const p of importable) {
      try {
        await upsertCall(p.fixtureId, p.predictedWinner);
        imported++;
      } catch { /* locked or invalid — skip */ }
    }
    const skipped = localPredictions.length - imported;
    if (imported > 0 || importable.length === 0) {
      setImportResult(
        `${imported} imported${skipped > 0 ? `, ${skipped} skipped (already decided or already called)` : ''}`
      );
      localStorage.setItem(IMPORTED_KEY, '1');
      setImportHandled(true);
    } else {
      // nothing made it through (e.g. offline) — keep the offer alive
      setImportResult('Import failed — please try again');
    }
    await loadServerCalls();
  };

  const dismissImport = () => {
    localStorage.setItem(IMPORTED_KEY, '1');
    setImportHandled(true);
  };

  const saveName = () => {
    localStorage.setItem(NAME_KEY, name);
    setShowNameInput(false);
  };

  const playingAs = useServer
    ? profile?.displayName || profile?.username || null
    : name || null;

  return (
    <div className="space-y-4">
      {/* Header + stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-primary">
            {useServer ? 'Your Calls' : 'Prediction Game'}
          </span>
        </div>
        {playingAs ? (
          <span className="text-xs text-muted">Playing as <strong>{playingAs}</strong></span>
        ) : useServer ? null : configured ? (
          <Button size="sm" variant="ghost" onClick={() => setSignInOpen(true)}>
            <UserRound className="w-3 h-3" />
            Sign in to save
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setShowNameInput(true)}>
            Set name
          </Button>
        )}
      </div>

      {showNameInput && !useServer && (
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

      {/* Import local picks into server Calls */}
      {showImport && (
        <div
          className="rounded-xl p-3 flex items-center justify-between gap-2"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <span className="text-xs text-primary">
            Found {localPredictions.length} picks saved in this browser — import them as Calls?
          </span>
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" onClick={importLocalPicks}>
              <CloudUpload className="w-3 h-3" />
              Import
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissImport}>Skip</Button>
          </div>
        </div>
      )}
      {importResult && <p className="text-xs text-emerald-600 dark:text-emerald-400">{importResult}</p>}

      {/* Score card */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-3 text-center" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
            <div className="text-lg font-bold text-primary">{predictions.length}</div>
            <div className="text-[10px] text-muted">{useServer ? 'Calls' : 'Predictions'}</div>
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
        <div className="text-xs text-muted mb-2">
          {useServer ? 'Make your Calls on upcoming matches:' : 'Predict upcoming matches:'}
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {pendingFixtures.slice(0, 8).map((fixture) => {
            const team1 = getTeamById(fixture.team1Id);
            const team2 = getTeamById(fixture.team2Id);
            if (!team1 || !team2) return null;

            const existing = predictionMap.get(fixture.id);
            const locked = useServer && isMatchLocked(fixture);

            return (
              <div
                key={fixture.id}
                className="flex items-center gap-2 rounded-xl p-2"
                style={{
                  background: 'var(--row-hover)',
                  border: '1px solid var(--border)',
                  opacity: locked ? 0.5 : 1,
                }}
              >
                <button
                  onClick={() => makePrediction(fixture.id, team1.id)}
                  disabled={locked}
                  className="flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed"
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
                  disabled={locked}
                  className="flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed"
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

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
