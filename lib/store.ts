import { create } from 'zustand';
import { Team, Fixture, SimulationResult, AIInsight } from './types';
import { TEAMS } from './data/teams';
import { FIXTURES } from './data/fixtures';
import { runSimulation } from './simulation';

interface IPLStore {
  teams: Team[];
  fixtures: Fixture[];
  simulationResults: SimulationResult[];
  insights: AIInsight[];
  isSimulating: boolean;
  lastSimulated: string | null;
  simulationCount: number;

  // Actions
  setFixtureWinner: (fixtureId: string, winnerId: string) => void;
  resetFixture: (fixtureId: string) => void;
  resetAllFixtures: () => void;
  runSimulations: () => void;
  addInsight: (insight: AIInsight) => void;
  clearInsights: () => void;
  updateLiveScore: (fixtureId: string, score1: string, score2: string, overs1: number, overs2: number, wickets1: number, wickets2: number) => void;
}

// IDs of fixtures that were already completed in the real data (never changes)
const ORIGINALLY_COMPLETED = new Set(
  FIXTURES.filter((f) => f.isCompleted).map((f) => f.id)
);

function applyFixtureResults(fixtures: Fixture[]): Team[] {
  // Start from a fresh deep-copy of the real standings baseline
  const baseTeams = TEAMS.map((t) => ({ ...t }));
  const teamMap = new Map(baseTeams.map((t) => [t.id, t]));

  for (const fixture of fixtures) {
    // Skip anything that was already completed in the real data
    if (!fixture.isCompleted || ORIGINALLY_COMPLETED.has(fixture.id)) continue;

    if (fixture.winnerId) {
      const winner = teamMap.get(fixture.winnerId);
      const loserId =
        fixture.team1Id === fixture.winnerId ? fixture.team2Id : fixture.team1Id;
      const loser = teamMap.get(loserId);
      if (winner && loser) {
        winner.points += 2;
        winner.won += 1;
        winner.played += 1;
        loser.lost += 1;
        loser.played += 1;
      }
    } else {
      const t1 = teamMap.get(fixture.team1Id);
      const t2 = teamMap.get(fixture.team2Id);
      if (t1) { t1.points += 1; t1.noResult += 1; t1.played += 1; }
      if (t2) { t2.points += 1; t2.noResult += 1; t2.played += 1; }
    }
  }

  return baseTeams;
}

export const useIPLStore = create<IPLStore>((set, get) => ({
  // Always start from the canonical TEAMS — never derive on init
  teams: TEAMS.map((t) => ({ ...t })),
  fixtures: FIXTURES.map((f) => ({ ...f })),
  simulationResults: [],
  insights: [],
  isSimulating: false,
  lastSimulated: null,
  simulationCount: 0,

  setFixtureWinner: (fixtureId, winnerId) => {
    const fixtures = get().fixtures.map((f) =>
      f.id === fixtureId ? { ...f, isCompleted: true, winnerId } : f
    );
    const teams = applyFixtureResults(fixtures);
    set({ fixtures, teams });
    setTimeout(() => get().runSimulations(), 0);
  },

  resetFixture: (fixtureId) => {
    const fixtures = get().fixtures.map((f) =>
      f.id === fixtureId ? { ...f, isCompleted: false, winnerId: undefined } : f
    );
    const teams = applyFixtureResults(fixtures);
    set({ fixtures, teams });
    setTimeout(() => get().runSimulations(), 0);
  },

  resetAllFixtures: () => {
    // Deep-copy both to avoid any mutation leaking between resets
    set({
      fixtures: FIXTURES.map((f) => ({ ...f })),
      teams: TEAMS.map((t) => ({ ...t })),
      simulationResults: [],
    });
    setTimeout(() => get().runSimulations(), 0);
  },

  runSimulations: () => {
    set({ isSimulating: true });
    setTimeout(() => {
      const { teams, fixtures, simulationCount } = get();
      const results = runSimulation(teams, fixtures);
      set({
        simulationResults: results,
        isSimulating: false,
        lastSimulated: new Date().toISOString(),
        simulationCount: simulationCount + 1,
      });
    }, 10);
  },

  addInsight: (insight) => {
    set((state) => ({ insights: [insight, ...state.insights].slice(0, 20) }));
  },

  clearInsights: () => set({ insights: [] }),

  updateLiveScore: (fixtureId, score1, score2, overs1, overs2, wickets1, wickets2) => {
    set((state) => ({
      fixtures: state.fixtures.map((f) =>
        f.id === fixtureId
          ? {
              ...f,
              score_1: score1,
              score_2: score2,
              overs_1: overs1,
              overs_2: overs2,
              wickets_1: wickets1,
              wickets_2: wickets2,
            }
          : f
      ),
    }));
  },
}));
