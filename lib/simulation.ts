import { Team, Fixture, SimulationResult, MatchPrediction } from './types';

const SIMULATIONS = 10000;
const HOME_ADVANTAGE = 0.05; // 5% boost for home team

/**
 * Compute win probability for team1 vs team2
 */
export function computeWinProbability(
  team1: Team,
  team2: Team,
  isTeam1Home: boolean
): number {
  // Composite strength: base + batting + bowling weighted
  const t1Strength =
    team1.baseStrength * 0.4 +
    team1.battingRating * 0.3 +
    team1.bowlingRating * 0.3;
  const t2Strength =
    team2.baseStrength * 0.4 +
    team2.battingRating * 0.3 +
    team2.bowlingRating * 0.3;

  // Recent form factor (last 5 matches)
  const t1Form = team1.recentForm.reduce((a, b) => a + b, 0) / team1.recentForm.length;
  const t2Form = team2.recentForm.reduce((a, b) => a + b, 0) / team2.recentForm.length;

  const t1Score = t1Strength * (0.85 + t1Form * 0.3);
  const t2Score = t2Strength * (0.85 + t2Form * 0.3);

  let prob = t1Score / (t1Score + t2Score);

  // Home advantage
  if (isTeam1Home) prob = Math.min(0.95, prob + HOME_ADVANTAGE);
  else prob = Math.max(0.05, prob - HOME_ADVANTAGE);

  return prob;
}

/**
 * Get all match predictions for remaining fixtures
 */
export function getMatchPredictions(
  teams: Team[],
  fixtures: Fixture[]
): MatchPrediction[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return fixtures
    .filter((f) => !f.isCompleted)
    .map((f) => {
      const t1 = teamMap.get(f.team1Id)!;
      const t2 = teamMap.get(f.team2Id)!;
      const isHome = !f.isNeutralVenue;
      const p = computeWinProbability(t1, t2, isHome);
      return {
        fixtureId: f.id,
        team1WinProbability: p,
        team2WinProbability: 1 - p,
      };
    });
}

/**
 * Run a single simulation of remaining fixtures
 * Returns updated team standings
 */
function simulateOnce(
  teams: Team[],
  remainingFixtures: Fixture[],
  predictions: Map<string, number>
): Team[] {
  // Deep copy teams
  const simTeams: Team[] = teams.map((t) => ({ ...t }));
  const teamMap = new Map(simTeams.map((t) => [t.id, t]));

  for (const fixture of remainingFixtures) {
    const t1WinProb = predictions.get(fixture.id) ?? 0.5;
    const t1Wins = Math.random() < t1WinProb;

    const t1 = teamMap.get(fixture.team1Id)!;
    const t2 = teamMap.get(fixture.team2Id)!;

    if (t1Wins) {
      t1.points += 2;
      t1.won += 1;
      t2.lost += 1;
    } else {
      t2.points += 2;
      t2.won += 1;
      t1.lost += 1;
    }
    t1.played += 1;
    t2.played += 1;
  }

  return simTeams;
}

/**
 * Sort teams by points then NRR
 */
function rankTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });
}

/**
 * Run Monte Carlo simulation
 */
export function runSimulation(
  teams: Team[],
  fixtures: Fixture[]
): SimulationResult[] {
  const remainingFixtures = fixtures.filter((f) => !f.isCompleted);
  const predictions = getMatchPredictions(teams, fixtures);
  const predMap = new Map(predictions.map((p) => [p.fixtureId, p.team1WinProbability]));

  // Counters
  const top4Count = new Map<string, number>(teams.map((t) => [t.id, 0]));
  const top2Count = new Map<string, number>(teams.map((t) => [t.id, 0]));
  const finishSum = new Map<string, number>(teams.map((t) => [t.id, 0]));
  const finishDist = new Map<string, number[]>(
    teams.map((t) => [t.id, new Array(10).fill(0)])
  );

  for (let i = 0; i < SIMULATIONS; i++) {
    const simTeams = simulateOnce(teams, remainingFixtures, predMap);
    const ranked = rankTeams(simTeams);

    ranked.forEach((team, idx) => {
      const rank = idx + 1;
      if (rank <= 4) top4Count.set(team.id, (top4Count.get(team.id) ?? 0) + 1);
      if (rank <= 2) top2Count.set(team.id, (top2Count.get(team.id) ?? 0) + 1);
      finishSum.set(team.id, (finishSum.get(team.id) ?? 0) + rank);
      const dist = finishDist.get(team.id)!;
      dist[idx] = (dist[idx] ?? 0) + 1;
    });
  }

  return teams.map((team) => ({
    teamId: team.id,
    top4Probability: (top4Count.get(team.id) ?? 0) / SIMULATIONS,
    top2Probability: (top2Count.get(team.id) ?? 0) / SIMULATIONS,
    eliminationProbability: 1 - (top4Count.get(team.id) ?? 0) / SIMULATIONS,
    averageFinish: (finishSum.get(team.id) ?? 0) / SIMULATIONS,
    finishDistribution: (finishDist.get(team.id) ?? []).map((c) => c / SIMULATIONS),
  }));
}

/**
 * Get qualification scenarios for a team
 */
export function getQualificationScenarios(
  team: Team,
  teams: Team[],
  fixtures: Fixture[]
): {
  bestCase: { points: number; position: number };
  worstCase: { points: number; position: number };
  winsNeeded: number;
} {
  const teamFixtures = fixtures.filter(
    (f) => !f.isCompleted && (f.team1Id === team.id || f.team2Id === team.id)
  );
  const remainingMatches = teamFixtures.length;
  const maxPoints = team.points + remainingMatches * 2;

  // Estimate wins needed for top 4
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
  const fourthPlacePoints = sortedTeams[3]?.points ?? 0;
  const winsNeeded = Math.max(0, Math.ceil((fourthPlacePoints - team.points + 1) / 2));

  return {
    bestCase: { points: maxPoints, position: 1 },
    worstCase: { points: team.points, position: 10 },
    winsNeeded: Math.min(winsNeeded, remainingMatches),
  };
}
