import { Player } from '../types';

// IPL 2026 Top Players (based on 2025 performance and projections)
export const PLAYERS: Player[] = [
  // Batsmen (Orange Cap candidates)
  { id: 'p1', name: 'Virat Kohli', teamId: 'rcb', role: 'batsman', matches: 16, runs: 650, wickets: 0, average: 43.3, strikeRate: 145 },
  { id: 'p2', name: 'Suryakumar Yadav', teamId: 'mi', role: 'batsman', matches: 16, runs: 580, wickets: 0, average: 38.6, strikeRate: 155 },
  { id: 'p3', name: 'Rohit Sharma', teamId: 'mi', role: 'batsman', matches: 14, runs: 480, wickets: 0, average: 34.2, strikeRate: 140 },
  { id: 'p4', name: 'Shubman Gill', teamId: 'gt', role: 'batsman', matches: 16, runs: 520, wickets: 0, average: 36.4, strikeRate: 138 },
  { id: 'p5', name: 'Travis Head', teamId: 'srh', role: 'batsman', matches: 15, runs: 510, wickets: 0, average: 34.0, strikeRate: 150 },
  { id: 'p6', name: 'Dhruv Jurel', teamId: 'csk', role: 'batsman', matches: 14, runs: 380, wickets: 0, average: 31.6, strikeRate: 142 },
  { id: 'p7', name: 'KL Rahul', teamId: 'pbks', role: 'batsman', matches: 12, runs: 350, wickets: 0, average: 29.1, strikeRate: 135 },
  { id: 'p8', name: 'Shreyas Iyer', teamId: 'dc', role: 'batsman', matches: 15, runs: 420, wickets: 0, average: 30.0, strikeRate: 132 },
  { id: 'p9', name: 'Rishabh Pant', teamId: 'dc', role: 'batsman', matches: 10, runs: 320, wickets: 0, average: 32.0, strikeRate: 155 },
  { id: 'p10', name: 'Glenn Maxwell', teamId: 'rcb', role: 'all-rounder', matches: 14, runs: 380, wickets: 8, average: 28.4, strikeRate: 160 },

  // Bowlers (Purple Cap candidates)
  { id: 'p11', name: 'Jasprit Bumrah', teamId: 'mi', role: 'bowler', matches: 15, runs: 10, wickets: 24, average: 18.5, economy: 7.8 },
  { id: 'p12', name: 'Mohammed Shami', teamId: 'gt', role: 'bowler', matches: 16, runs: 5, wickets: 22, average: 19.2, economy: 8.2 },
  { id: 'p13', name: 'Yuzvendra Chahal', teamId: 'rr', role: 'bowler', matches: 15, runs: 0, wickets: 20, average: 20.5, economy: 8.5 },
  { id: 'p14', name: 'Kuldeep Yadav', teamId: 'dc', role: 'bowler', matches: 16, runs: 2, wickets: 18, average: 22.0, economy: 8.0 },
  { id: 'p15', name: 'Arshdeep Singh', teamId: 'pbks', role: 'bowler', matches: 14, runs: 8, wickets: 17, average: 21.5, economy: 8.3 },
  { id: 'p16', name: 'Mukesh Choudhary', teamId: 'csk', role: 'bowler', matches: 15, runs: 12, wickets: 16, average: 23.0, economy: 8.6 },
  { id: 'p17', name: 'Trent Boult', teamId: 'mi', role: 'bowler', matches: 12, runs: 0, wickets: 15, average: 22.0, economy: 8.8 },
  { id: 'p18', name: 'Harshal Patel', teamId: 'rcb', role: 'bowler', matches: 10, runs: 0, wickets: 14, average: 20.0, economy: 9.0 },
  { id: 'p19', name: 'Rashid Khan', teamId: 'srh', role: 'bowler', matches: 14, runs: 5, wickets: 16, average: 19.5, economy: 7.5 },
  { id: 'p20', name: 'Noor Ahmad', teamId: 'gt', role: 'bowler', matches: 15, runs: 0, wickets: 15, average: 21.0, economy: 8.2 },
];
