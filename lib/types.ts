// Core types for IPL Playoff Lab

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  secondaryColor: string;
  emoji: string;
  // Stats
  played: number;
  won: number;
  lost: number;
  noResult: number;
  points: number;
  nrr: number;
  // Strength ratings (0-100)
  baseStrength: number;
  battingRating: number;
  bowlingRating: number;
  recentForm: number[]; // last 5 results: 1=win, 0=loss
  homeGround: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: 'batsman' | 'bowler' | 'all-rounder';
  matches: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
  economy?: number;
}

export interface Fixture {
  id: string;
  team1Id: string;
  team2Id: string;
  date: string;
  venue: string;
  isCompleted: boolean;
  winnerId?: string;
  isNeutralVenue?: boolean;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  // Live match data
  score_1?: string; // e.g., "180/5 (20)"
  score_2?: string; // e.g., "150/8 (19.4)"
  overs_1?: number;
  overs_2?: number;
  wickets_1?: number;
  wickets_2?: number;
}

export interface SimulationResult {
  teamId: string;
  top4Probability: number;
  top2Probability: number;
  eliminationProbability: number;
  averageFinish: number;
  finishDistribution: number[]; // index 0 = 1st place probability, etc.
}

export interface MatchPrediction {
  fixtureId: string;
  team1WinProbability: number;
  team2WinProbability: number;
}

export interface StandingsSnapshot {
  teams: Team[];
  timestamp: string;
}

export interface AIInsight {
  teamId?: string;
  type: 'qualification' | 'elimination' | 'pressure' | 'general';
  text: string;
  timestamp: string;
}
