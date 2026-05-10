// Historical IPL data for qualification analysis and predictions
// Data covers IPL seasons 2008-2025

// ============================================================================
// TYPES
// ============================================================================

export interface SeasonStanding {
  season: number;
  team: string; // shortName (e.g., 'RCB', 'CSK')
  played: number;
  won: number;
  lost: number;
  points: number;
  nrr: number;
  qualified: boolean; // top 4
  position: number; // 1-10
}

export interface HeadToHeadRecord {
  team1Wins: number;
  team2Wins: number;
  lastFiveResults: string[]; // winner IDs, most recent first
}

export interface IPLWinner {
  season: number;
  winner: string;
  runnerUp: string;
}

// ============================================================================
// IPL WINNERS 2008-2025
// ============================================================================

export const IPL_WINNERS: IPLWinner[] = [
  { season: 2008, winner: 'rr', runnerUp: 'csk' },
  { season: 2009, winner: 'dc', runnerUp: 'rcb' },
  { season: 2010, winner: 'csk', runnerUp: 'mi' },
  { season: 2011, winner: 'csk', runnerUp: 'rcb' },
  { season: 2012, winner: 'kkr', runnerUp: 'csk' },
  { season: 2013, winner: 'mi', runnerUp: 'csk' },
  { season: 2014, winner: 'kkr', runnerUp: 'pbks' },
  { season: 2015, winner: 'mi', runnerUp: 'csk' },
  { season: 2016, winner: 'srh', runnerUp: 'rcb' },
  { season: 2017, winner: 'mi', runnerUp: 'srh' },
  { season: 2018, winner: 'csk', runnerUp: 'srh' },
  { season: 2019, winner: 'mi', runnerUp: 'csk' },
  { season: 2020, winner: 'mi', runnerUp: 'dc' },
  { season: 2021, winner: 'csk', runnerUp: 'kkr' },
  { season: 2022, winner: 'gt', runnerUp: 'rr' },
  { season: 2023, winner: 'csk', runnerUp: 'gt' },
  { season: 2024, winner: 'kkr', runnerUp: 'srh' },
  { season: 2025, winner: 'rcb', runnerUp: 'srh' },
];

// ============================================================================
// HISTORICAL LEAGUE STAGE STANDINGS (2008-2025)
// ============================================================================

export const HISTORICAL_STANDINGS: SeasonStanding[] = [
  // === 2008 (8 teams, 14 matches each) ===
  { season: 2008, team: 'RR', played: 14, won: 11, lost: 3, points: 22, nrr: 0.836, qualified: true, position: 1 },
  { season: 2008, team: 'CSK', played: 14, won: 9, lost: 5, points: 18, nrr: 0.652, qualified: true, position: 2 },
  { season: 2008, team: 'PBKS', played: 14, won: 10, lost: 4, points: 20, nrr: 0.537, qualified: true, position: 3 },
  { season: 2008, team: 'DC', played: 14, won: 7, lost: 7, points: 14, nrr: -0.137, qualified: true, position: 4 },
  { season: 2008, team: 'MI', played: 14, won: 7, lost: 7, points: 14, nrr: -0.256, qualified: false, position: 5 },
  { season: 2008, team: 'KKR', played: 14, won: 6, lost: 8, points: 12, nrr: -0.311, qualified: false, position: 6 },
  { season: 2008, team: 'RCB', played: 14, won: 4, lost: 10, points: 8, nrr: -0.608, qualified: false, position: 7 },
  { season: 2008, team: 'SRH', played: 14, won: 2, lost: 12, points: 4, nrr: -1.391, qualified: false, position: 8 },

  // === 2009 (8 teams, 14 matches each) ===
  { season: 2009, team: 'DC', played: 14, won: 10, lost: 4, points: 20, nrr: 0.537, qualified: true, position: 1 },
  { season: 2009, team: 'RCB', played: 14, won: 9, lost: 5, points: 18, nrr: 0.411, qualified: true, position: 2 },
  { season: 2009, team: 'CSK', played: 14, won: 8, lost: 6, points: 16, nrr: 0.306, qualified: true, position: 3 },
  { season: 2009, team: 'PBKS', played: 14, won: 7, lost: 7, points: 14, nrr: 0.102, qualified: true, position: 4 },
  { season: 2009, team: 'RR', played: 14, won: 6, lost: 8, points: 12, nrr: -0.088, qualified: false, position: 5 },
  { season: 2009, team: 'KKR', played: 14, won: 4, lost: 10, points: 8, nrr: -0.452, qualified: false, position: 6 },
  { season: 2009, team: 'MI', played: 14, won: 5, lost: 9, points: 10, nrr: -0.318, qualified: false, position: 7 },
  { season: 2009, team: 'SRH', played: 14, won: 3, lost: 11, points: 6, nrr: -0.876, qualified: false, position: 8 },

  // === 2010 (8 teams, 14 matches each) ===
  { season: 2010, team: 'MI', played: 14, won: 10, lost: 4, points: 20, nrr: 0.816, qualified: true, position: 1 },
  { season: 2010, team: 'CSK', played: 14, won: 9, lost: 5, points: 18, nrr: 0.767, qualified: true, position: 2 },
  { season: 2010, team: 'RCB', played: 14, won: 8, lost: 6, points: 16, nrr: 0.287, qualified: true, position: 3 },
  { season: 2010, team: 'DC', played: 14, won: 7, lost: 7, points: 14, nrr: 0.052, qualified: true, position: 4 },
  { season: 2010, team: 'KKR', played: 14, won: 7, lost: 7, points: 14, nrr: -0.045, qualified: false, position: 5 },
  { season: 2010, team: 'RR', played: 14, won: 6, lost: 8, points: 12, nrr: -0.198, qualified: false, position: 6 },
  { season: 2010, team: 'PBKS', played: 14, won: 5, lost: 9, points: 10, nrr: -0.612, qualified: false, position: 7 },
  { season: 2010, team: 'SRH', played: 14, won: 4, lost: 10, points: 8, nrr: -1.067, qualified: false, position: 8 },

  // === 2011 (10 teams, 14 matches each) ===
  { season: 2011, team: 'CSK', played: 14, won: 11, lost: 3, points: 22, nrr: 0.531, qualified: true, position: 1 },
  { season: 2011, team: 'RCB', played: 14, won: 10, lost: 4, points: 20, nrr: 0.548, qualified: true, position: 2 },
  { season: 2011, team: 'MI', played: 14, won: 9, lost: 5, points: 18, nrr: 0.481, qualified: true, position: 3 },
  { season: 2011, team: 'KKR', played: 14, won: 8, lost: 6, points: 16, nrr: 0.089, qualified: true, position: 4 },
  { season: 2011, team: 'RR', played: 14, won: 6, lost: 8, points: 12, nrr: -0.049, qualified: false, position: 5 },
  { season: 2011, team: 'DC', played: 14, won: 6, lost: 8, points: 12, nrr: -0.152, qualified: false, position: 6 },
  { season: 2011, team: 'SRH', played: 14, won: 6, lost: 8, points: 12, nrr: -0.267, qualified: false, position: 7 },
  { season: 2011, team: 'PBKS', played: 14, won: 5, lost: 9, points: 10, nrr: -0.389, qualified: false, position: 8 },

  // === 2012 (9 teams, 16 matches each) ===
  { season: 2012, team: 'DC', played: 16, won: 11, lost: 5, points: 22, nrr: 0.531, qualified: true, position: 1 },
  { season: 2012, team: 'KKR', played: 16, won: 10, lost: 6, points: 20, nrr: 0.365, qualified: true, position: 2 },
  { season: 2012, team: 'MI', played: 16, won: 10, lost: 6, points: 20, nrr: 0.326, qualified: true, position: 3 },
  { season: 2012, team: 'CSK', played: 16, won: 9, lost: 7, points: 18, nrr: 0.363, qualified: true, position: 4 },
  { season: 2012, team: 'RR', played: 16, won: 8, lost: 8, points: 16, nrr: -0.045, qualified: false, position: 5 },
  { season: 2012, team: 'RCB', played: 16, won: 8, lost: 8, points: 16, nrr: -0.148, qualified: false, position: 6 },
  { season: 2012, team: 'PBKS', played: 16, won: 7, lost: 9, points: 14, nrr: -0.267, qualified: false, position: 7 },
  { season: 2012, team: 'SRH', played: 16, won: 5, lost: 11, points: 10, nrr: -0.612, qualified: false, position: 8 },

  // === 2013 (9 teams, 16 matches each) ===
  { season: 2013, team: 'CSK', played: 16, won: 11, lost: 5, points: 22, nrr: 0.531, qualified: true, position: 1 },
  { season: 2013, team: 'MI', played: 16, won: 11, lost: 5, points: 22, nrr: 0.441, qualified: true, position: 2 },
  { season: 2013, team: 'SRH', played: 16, won: 10, lost: 6, points: 20, nrr: 0.374, qualified: true, position: 3 },
  { season: 2013, team: 'RR', played: 16, won: 9, lost: 7, points: 18, nrr: 0.147, qualified: true, position: 4 },
  { season: 2013, team: 'RCB', played: 16, won: 8, lost: 8, points: 16, nrr: 0.021, qualified: false, position: 5 },
  { season: 2013, team: 'PBKS', played: 16, won: 8, lost: 8, points: 16, nrr: -0.089, qualified: false, position: 6 },
  { season: 2013, team: 'KKR', played: 16, won: 6, lost: 10, points: 12, nrr: -0.356, qualified: false, position: 7 },
  { season: 2013, team: 'DC', played: 16, won: 3, lost: 13, points: 6, nrr: -1.087, qualified: false, position: 8 },

  // === 2014 (8 teams, 14 matches each) ===
  { season: 2014, team: 'PBKS', played: 14, won: 11, lost: 3, points: 22, nrr: 0.834, qualified: true, position: 1 },
  { season: 2014, team: 'KKR', played: 14, won: 9, lost: 5, points: 18, nrr: 0.326, qualified: true, position: 2 },
  { season: 2014, team: 'CSK', played: 14, won: 9, lost: 5, points: 18, nrr: 0.212, qualified: true, position: 3 },
  { season: 2014, team: 'MI', played: 14, won: 7, lost: 7, points: 14, nrr: 0.078, qualified: true, position: 4 },
  { season: 2014, team: 'RR', played: 14, won: 7, lost: 7, points: 14, nrr: -0.023, qualified: false, position: 5 },
  { season: 2014, team: 'SRH', played: 14, won: 6, lost: 8, points: 12, nrr: -0.198, qualified: false, position: 6 },
  { season: 2014, team: 'RCB', played: 14, won: 5, lost: 9, points: 10, nrr: -0.512, qualified: false, position: 7 },
  { season: 2014, team: 'DC', played: 14, won: 2, lost: 12, points: 4, nrr: -1.402, qualified: false, position: 8 },

  // === 2015 (8 teams, 14 matches each) ===
  { season: 2015, team: 'CSK', played: 14, won: 10, lost: 4, points: 20, nrr: 0.652, qualified: true, position: 1 },
  { season: 2015, team: 'MI', played: 14, won: 9, lost: 5, points: 18, nrr: 0.353, qualified: true, position: 2 },
  { season: 2015, team: 'RCB', played: 14, won: 7, lost: 7, points: 14, nrr: 0.108, qualified: true, position: 3 },
  { season: 2015, team: 'RR', played: 14, won: 7, lost: 7, points: 14, nrr: 0.023, qualified: true, position: 4 },
  { season: 2015, team: 'SRH', played: 14, won: 7, lost: 7, points: 14, nrr: -0.067, qualified: false, position: 5 },
  { season: 2015, team: 'KKR', played: 14, won: 7, lost: 7, points: 14, nrr: -0.089, qualified: false, position: 6 },
  { season: 2015, team: 'DC', played: 14, won: 5, lost: 9, points: 10, nrr: -0.456, qualified: false, position: 7 },
  { season: 2015, team: 'PBKS', played: 14, won: 3, lost: 11, points: 6, nrr: -0.891, qualified: false, position: 8 },

  // === 2016 (8 teams, 14 matches each) ===
  { season: 2016, team: 'RCB', played: 14, won: 9, lost: 5, points: 18, nrr: 0.593, qualified: true, position: 1 },
  { season: 2016, team: 'GL', played: 14, won: 9, lost: 5, points: 18, nrr: 0.228, qualified: true, position: 2 },
  { season: 2016, team: 'SRH', played: 14, won: 8, lost: 6, points: 16, nrr: 0.284, qualified: true, position: 3 },
  { season: 2016, team: 'KKR', played: 14, won: 8, lost: 6, points: 16, nrr: 0.198, qualified: true, position: 4 },
  { season: 2016, team: 'MI', played: 14, won: 7, lost: 7, points: 14, nrr: -0.041, qualified: false, position: 5 },
  { season: 2016, team: 'DC', played: 14, won: 6, lost: 8, points: 12, nrr: -0.312, qualified: false, position: 6 },
  { season: 2016, team: 'PBKS', played: 14, won: 4, lost: 10, points: 8, nrr: -0.567, qualified: false, position: 7 },
  { season: 2016, team: 'CSK', played: 14, won: 4, lost: 10, points: 8, nrr: -0.712, qualified: false, position: 8 },

  // === 2017 (8 teams, 14 matches each) ===
  { season: 2017, team: 'MI', played: 14, won: 10, lost: 4, points: 20, nrr: 0.784, qualified: true, position: 1 },
  { season: 2017, team: 'SRH', played: 14, won: 9, lost: 5, points: 18, nrr: 0.412, qualified: true, position: 2 },
  { season: 2017, team: 'KKR', played: 14, won: 8, lost: 6, points: 16, nrr: 0.163, qualified: true, position: 3 },
  { season: 2017, team: 'PBKS', played: 14, won: 7, lost: 7, points: 14, nrr: 0.087, qualified: true, position: 4 },
  { season: 2017, team: 'DC', played: 14, won: 6, lost: 8, points: 12, nrr: -0.198, qualified: false, position: 5 },
  { season: 2017, team: 'RCB', played: 14, won: 3, lost: 11, points: 6, nrr: -0.693, qualified: false, position: 6 },
  { season: 2017, team: 'RR', played: 14, won: 4, lost: 10, points: 8, nrr: -0.456, qualified: false, position: 7 },
  { season: 2017, team: 'GL', played: 14, won: 7, lost: 7, points: 14, nrr: -0.012, qualified: false, position: 8 },

  // === 2018 (8 teams, 14 matches each) ===
  { season: 2018, team: 'SRH', played: 14, won: 9, lost: 5, points: 18, nrr: 0.284, qualified: true, position: 1 },
  { season: 2018, team: 'CSK', played: 14, won: 9, lost: 5, points: 18, nrr: 0.253, qualified: true, position: 2 },
  { season: 2018, team: 'KKR', played: 14, won: 8, lost: 6, points: 16, nrr: 0.201, qualified: true, position: 3 },
  { season: 2018, team: 'RR', played: 14, won: 7, lost: 7, points: 14, nrr: -0.055, qualified: true, position: 4 },
  { season: 2018, team: 'MI', played: 14, won: 6, lost: 8, points: 12, nrr: -0.113, qualified: false, position: 5 },
  { season: 2018, team: 'RCB', played: 14, won: 6, lost: 8, points: 12, nrr: -0.287, qualified: false, position: 6 },
  { season: 2018, team: 'PBKS', played: 14, won: 6, lost: 8, points: 12, nrr: -0.302, qualified: false, position: 7 },
  { season: 2018, team: 'DC', played: 14, won: 5, lost: 9, points: 10, nrr: -0.512, qualified: false, position: 8 },

  // === 2019 (8 teams, 14 matches each) ===
  { season: 2019, team: 'MI', played: 14, won: 9, lost: 5, points: 18, nrr: 0.421, qualified: true, position: 1 },
  { season: 2019, team: 'CSK', played: 14, won: 9, lost: 5, points: 18, nrr: 0.131, qualified: true, position: 2 },
  { season: 2019, team: 'DC', played: 14, won: 9, lost: 5, points: 18, nrr: 0.044, qualified: true, position: 3 },
  { season: 2019, team: 'SRH', played: 14, won: 6, lost: 8, points: 12, nrr: 0.577, qualified: true, position: 4 },
  { season: 2019, team: 'KKR', played: 14, won: 6, lost: 8, points: 12, nrr: -0.107, qualified: false, position: 5 },
  { season: 2019, team: 'PBKS', played: 14, won: 6, lost: 8, points: 12, nrr: -0.251, qualified: false, position: 6 },
  { season: 2019, team: 'RR', played: 14, won: 5, lost: 9, points: 10, nrr: -0.445, qualified: false, position: 7 },
  { season: 2019, team: 'RCB', played: 14, won: 5, lost: 9, points: 10, nrr: -0.607, qualified: false, position: 8 },

  // === 2020 (8 teams, 14 matches each) ===
  { season: 2020, team: 'MI', played: 14, won: 9, lost: 5, points: 18, nrr: 1.107, qualified: true, position: 1 },
  { season: 2020, team: 'DC', played: 14, won: 8, lost: 6, points: 16, nrr: 0.030, qualified: true, position: 2 },
  { season: 2020, team: 'SRH', played: 14, won: 7, lost: 7, points: 14, nrr: 0.608, qualified: true, position: 3 },
  { season: 2020, team: 'RCB', played: 14, won: 7, lost: 7, points: 14, nrr: -0.172, qualified: true, position: 4 },
  { season: 2020, team: 'KKR', played: 14, won: 7, lost: 7, points: 14, nrr: -0.214, qualified: false, position: 5 },
  { season: 2020, team: 'PBKS', played: 14, won: 6, lost: 8, points: 12, nrr: -0.162, qualified: false, position: 6 },
  { season: 2020, team: 'CSK', played: 14, won: 6, lost: 8, points: 12, nrr: -0.455, qualified: false, position: 7 },
  { season: 2020, team: 'RR', played: 14, won: 6, lost: 8, points: 12, nrr: -0.569, qualified: false, position: 8 },

  // === 2021 (8 teams, 14 matches each) ===
  { season: 2021, team: 'CSK', played: 14, won: 9, lost: 5, points: 18, nrr: 0.455, qualified: true, position: 1 },
  { season: 2021, team: 'DC', played: 14, won: 10, lost: 4, points: 20, nrr: 0.481, qualified: true, position: 2 },
  { season: 2021, team: 'RCB', played: 14, won: 9, lost: 5, points: 18, nrr: -0.140, qualified: true, position: 3 },
  { season: 2021, team: 'KKR', played: 14, won: 7, lost: 7, points: 14, nrr: 0.587, qualified: true, position: 4 },
  { season: 2021, team: 'MI', played: 14, won: 7, lost: 7, points: 14, nrr: 0.116, qualified: false, position: 5 },
  { season: 2021, team: 'PBKS', played: 14, won: 6, lost: 8, points: 12, nrr: -0.001, qualified: false, position: 6 },
  { season: 2021, team: 'RR', played: 14, won: 5, lost: 9, points: 10, nrr: -0.993, qualified: false, position: 7 },
  { season: 2021, team: 'SRH', played: 14, won: 3, lost: 11, points: 6, nrr: -0.545, qualified: false, position: 8 },

  // === 2022 (10 teams, 14 matches each) — GT and LSG debut ===
  { season: 2022, team: 'GT', played: 14, won: 10, lost: 4, points: 20, nrr: 0.316, qualified: true, position: 1 },
  { season: 2022, team: 'RR', played: 14, won: 9, lost: 5, points: 18, nrr: 0.298, qualified: true, position: 2 },
  { season: 2022, team: 'LSG', played: 14, won: 9, lost: 5, points: 18, nrr: 0.251, qualified: true, position: 3 },
  { season: 2022, team: 'RCB', played: 14, won: 8, lost: 6, points: 16, nrr: -0.253, qualified: true, position: 4 },
  { season: 2022, team: 'DC', played: 14, won: 7, lost: 7, points: 14, nrr: 0.204, qualified: false, position: 5 },
  { season: 2022, team: 'PBKS', played: 14, won: 7, lost: 7, points: 14, nrr: -0.107, qualified: false, position: 6 },
  { season: 2022, team: 'KKR', played: 14, won: 6, lost: 8, points: 12, nrr: 0.146, qualified: false, position: 7 },
  { season: 2022, team: 'SRH', played: 14, won: 6, lost: 8, points: 12, nrr: -0.379, qualified: false, position: 8 },
  { season: 2022, team: 'CSK', played: 14, won: 4, lost: 10, points: 8, nrr: -0.203, qualified: false, position: 9 },
  { season: 2022, team: 'MI', played: 14, won: 4, lost: 10, points: 8, nrr: -0.506, qualified: false, position: 10 },

  // === 2023 (10 teams, 14 matches each) ===
  { season: 2023, team: 'GT', played: 14, won: 10, lost: 4, points: 20, nrr: 0.809, qualified: true, position: 1 },
  { season: 2023, team: 'CSK', played: 14, won: 8, lost: 5, points: 17, nrr: 0.652, qualified: true, position: 2 },
  { season: 2023, team: 'LSG', played: 14, won: 8, lost: 6, points: 16, nrr: 0.284, qualified: true, position: 3 },
  { season: 2023, team: 'MI', played: 14, won: 8, lost: 6, points: 16, nrr: 0.042, qualified: true, position: 4 },
  { season: 2023, team: 'RR', played: 14, won: 7, lost: 7, points: 14, nrr: 0.148, qualified: false, position: 5 },
  { season: 2023, team: 'RCB', played: 14, won: 7, lost: 7, points: 14, nrr: -0.121, qualified: false, position: 6 },
  { season: 2023, team: 'KKR', played: 14, won: 7, lost: 7, points: 14, nrr: -0.175, qualified: false, position: 7 },
  { season: 2023, team: 'PBKS', played: 14, won: 6, lost: 8, points: 12, nrr: -0.304, qualified: false, position: 8 },
  { season: 2023, team: 'DC', played: 14, won: 5, lost: 9, points: 10, nrr: -0.573, qualified: false, position: 9 },
  { season: 2023, team: 'SRH', played: 14, won: 4, lost: 10, points: 8, nrr: -0.826, qualified: false, position: 10 },

  // === 2024 (10 teams, 14 matches each) ===
  { season: 2024, team: 'KKR', played: 14, won: 9, lost: 5, points: 19, nrr: 1.428, qualified: true, position: 1 },
  { season: 2024, team: 'SRH', played: 14, won: 8, lost: 5, points: 17, nrr: 0.476, qualified: true, position: 2 },
  { season: 2024, team: 'RR', played: 14, won: 8, lost: 5, points: 17, nrr: 0.468, qualified: true, position: 3 },
  { season: 2024, team: 'RCB', played: 14, won: 7, lost: 7, points: 14, nrr: 0.459, qualified: true, position: 4 },
  { season: 2024, team: 'CSK', played: 14, won: 7, lost: 7, points: 14, nrr: 0.206, qualified: false, position: 5 },
  { season: 2024, team: 'DC', played: 14, won: 7, lost: 7, points: 14, nrr: -0.377, qualified: false, position: 6 },
  { season: 2024, team: 'LSG', played: 14, won: 7, lost: 7, points: 14, nrr: -0.556, qualified: false, position: 7 },
  { season: 2024, team: 'GT', played: 14, won: 5, lost: 9, points: 10, nrr: -0.304, qualified: false, position: 8 },
  { season: 2024, team: 'MI', played: 14, won: 4, lost: 10, points: 8, nrr: -0.318, qualified: false, position: 9 },
  { season: 2024, team: 'PBKS', played: 14, won: 5, lost: 9, points: 10, nrr: -1.411, qualified: false, position: 10 },

  // === 2025 (10 teams, 14 matches each) ===
  { season: 2025, team: 'RCB', played: 14, won: 9, lost: 5, points: 18, nrr: 0.846, qualified: true, position: 1 },
  { season: 2025, team: 'SRH', played: 14, won: 9, lost: 5, points: 18, nrr: 0.712, qualified: true, position: 2 },
  { season: 2025, team: 'CSK', played: 14, won: 8, lost: 6, points: 16, nrr: 0.341, qualified: true, position: 3 },
  { season: 2025, team: 'GT', played: 14, won: 8, lost: 6, points: 16, nrr: 0.228, qualified: true, position: 4 },
  { season: 2025, team: 'PBKS', played: 14, won: 7, lost: 7, points: 14, nrr: 0.156, qualified: false, position: 5 },
  { season: 2025, team: 'RR', played: 14, won: 7, lost: 7, points: 14, nrr: -0.045, qualified: false, position: 6 },
  { season: 2025, team: 'KKR', played: 14, won: 6, lost: 8, points: 12, nrr: -0.198, qualified: false, position: 7 },
  { season: 2025, team: 'DC', played: 14, won: 5, lost: 9, points: 10, nrr: -0.567, qualified: false, position: 8 },
  { season: 2025, team: 'MI', played: 14, won: 4, lost: 10, points: 8, nrr: -0.712, qualified: false, position: 9 },
  { season: 2025, team: 'LSG', played: 14, won: 3, lost: 11, points: 6, nrr: -0.934, qualified: false, position: 10 },
];


// ============================================================================
// HEAD-TO-HEAD RECORDS (All-time between current 10 teams)
// Key format: "team1Id-team2Id" (alphabetical order)
// ============================================================================

export const HEAD_TO_HEAD: Record<string, HeadToHeadRecord> = {
  // CSK matchups
  'csk-dc': { team1Wins: 16, team2Wins: 12, lastFiveResults: ['csk', 'dc', 'csk', 'csk', 'dc'] },
  'csk-gt': { team1Wins: 4, team2Wins: 3, lastFiveResults: ['csk', 'gt', 'csk', 'gt', 'csk'] },
  'csk-kkr': { team1Wins: 18, team2Wins: 12, lastFiveResults: ['kkr', 'csk', 'kkr', 'csk', 'csk'] },
  'csk-lsg': { team1Wins: 4, team2Wins: 3, lastFiveResults: ['csk', 'lsg', 'csk', 'csk', 'lsg'] },
  'csk-mi': { team1Wins: 16, team2Wins: 20, lastFiveResults: ['csk', 'csk', 'mi', 'csk', 'mi'] },
  'csk-pbks': { team1Wins: 18, team2Wins: 12, lastFiveResults: ['pbks', 'csk', 'csk', 'pbks', 'csk'] },
  'csk-rcb': { team1Wins: 19, team2Wins: 12, lastFiveResults: ['rcb', 'rcb', 'csk', 'rcb', 'csk'] },
  'csk-rr': { team1Wins: 15, team2Wins: 13, lastFiveResults: ['csk', 'rr', 'csk', 'rr', 'csk'] },
  'csk-srh': { team1Wins: 14, team2Wins: 12, lastFiveResults: ['srh', 'csk', 'srh', 'csk', 'srh'] },

  // DC matchups
  'dc-gt': { team1Wins: 2, team2Wins: 5, lastFiveResults: ['gt', 'gt', 'dc', 'gt', 'gt'] },
  'dc-kkr': { team1Wins: 12, team2Wins: 16, lastFiveResults: ['kkr', 'dc', 'kkr', 'dc', 'kkr'] },
  'dc-lsg': { team1Wins: 3, team2Wins: 4, lastFiveResults: ['dc', 'lsg', 'dc', 'lsg', 'lsg'] },
  'dc-mi': { team1Wins: 14, team2Wins: 17, lastFiveResults: ['dc', 'mi', 'dc', 'dc', 'mi'] },
  'dc-pbks': { team1Wins: 15, team2Wins: 14, lastFiveResults: ['pbks', 'dc', 'pbks', 'dc', 'dc'] },
  'dc-rcb': { team1Wins: 13, team2Wins: 16, lastFiveResults: ['rcb', 'dc', 'rcb', 'rcb', 'dc'] },
  'dc-rr': { team1Wins: 12, team2Wins: 14, lastFiveResults: ['rr', 'dc', 'rr', 'dc', 'rr'] },
  'dc-srh': { team1Wins: 10, team2Wins: 14, lastFiveResults: ['srh', 'srh', 'dc', 'srh', 'dc'] },

  // GT matchups (from 2022)
  'gt-kkr': { team1Wins: 4, team2Wins: 3, lastFiveResults: ['kkr', 'gt', 'gt', 'kkr', 'gt'] },
  'gt-lsg': { team1Wins: 5, team2Wins: 3, lastFiveResults: ['gt', 'gt', 'lsg', 'gt', 'lsg'] },
  'gt-mi': { team1Wins: 5, team2Wins: 3, lastFiveResults: ['gt', 'mi', 'gt', 'gt', 'mi'] },
  'gt-pbks': { team1Wins: 4, team2Wins: 4, lastFiveResults: ['pbks', 'gt', 'pbks', 'gt', 'gt'] },
  'gt-rcb': { team1Wins: 3, team2Wins: 4, lastFiveResults: ['rcb', 'gt', 'rcb', 'gt', 'rcb'] },
  'gt-rr': { team1Wins: 5, team2Wins: 3, lastFiveResults: ['gt', 'rr', 'gt', 'gt', 'rr'] },
  'gt-srh': { team1Wins: 3, team2Wins: 4, lastFiveResults: ['srh', 'gt', 'srh', 'srh', 'gt'] },

  // KKR matchups
  'kkr-lsg': { team1Wins: 4, team2Wins: 4, lastFiveResults: ['kkr', 'lsg', 'kkr', 'kkr', 'lsg'] },
  'kkr-mi': { team1Wins: 15, team2Wins: 17, lastFiveResults: ['kkr', 'kkr', 'mi', 'kkr', 'mi'] },
  'kkr-pbks': { team1Wins: 16, team2Wins: 13, lastFiveResults: ['kkr', 'pbks', 'kkr', 'pbks', 'kkr'] },
  'kkr-rcb': { team1Wins: 14, team2Wins: 16, lastFiveResults: ['rcb', 'kkr', 'kkr', 'rcb', 'kkr'] },
  'kkr-rr': { team1Wins: 13, team2Wins: 12, lastFiveResults: ['kkr', 'rr', 'kkr', 'rr', 'kkr'] },
  'kkr-srh': { team1Wins: 12, team2Wins: 13, lastFiveResults: ['srh', 'kkr', 'srh', 'kkr', 'kkr'] },

  // LSG matchups (from 2022)
  'lsg-mi': { team1Wins: 3, team2Wins: 4, lastFiveResults: ['mi', 'lsg', 'mi', 'lsg', 'mi'] },
  'lsg-pbks': { team1Wins: 4, team2Wins: 4, lastFiveResults: ['pbks', 'lsg', 'pbks', 'lsg', 'pbks'] },
  'lsg-rcb': { team1Wins: 3, team2Wins: 4, lastFiveResults: ['rcb', 'rcb', 'lsg', 'rcb', 'lsg'] },
  'lsg-rr': { team1Wins: 4, team2Wins: 3, lastFiveResults: ['lsg', 'rr', 'lsg', 'rr', 'lsg'] },
  'lsg-srh': { team1Wins: 3, team2Wins: 4, lastFiveResults: ['srh', 'srh', 'lsg', 'srh', 'lsg'] },

  // MI matchups
  'mi-pbks': { team1Wins: 17, team2Wins: 14, lastFiveResults: ['pbks', 'mi', 'pbks', 'mi', 'pbks'] },
  'mi-rcb': { team1Wins: 17, team2Wins: 14, lastFiveResults: ['rcb', 'rcb', 'mi', 'rcb', 'mi'] },
  'mi-rr': { team1Wins: 14, team2Wins: 13, lastFiveResults: ['rr', 'mi', 'rr', 'mi', 'rr'] },
  'mi-srh': { team1Wins: 10, team2Wins: 12, lastFiveResults: ['srh', 'mi', 'srh', 'srh', 'mi'] },

  // PBKS matchups
  'pbks-rcb': { team1Wins: 13, team2Wins: 16, lastFiveResults: ['rcb', 'pbks', 'rcb', 'pbks', 'rcb'] },
  'pbks-rr': { team1Wins: 12, team2Wins: 14, lastFiveResults: ['rr', 'pbks', 'rr', 'pbks', 'rr'] },
  'pbks-srh': { team1Wins: 11, team2Wins: 14, lastFiveResults: ['srh', 'pbks', 'srh', 'srh', 'pbks'] },

  // RCB matchups
  'rcb-rr': { team1Wins: 13, team2Wins: 13, lastFiveResults: ['rcb', 'rr', 'rcb', 'rcb', 'rr'] },
  'rcb-srh': { team1Wins: 11, team2Wins: 14, lastFiveResults: ['rcb', 'srh', 'rcb', 'srh', 'rcb'] },

  // RR matchups
  'rr-srh': { team1Wins: 10, team2Wins: 11, lastFiveResults: ['srh', 'rr', 'srh', 'rr', 'srh'] },
};


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get head-to-head record between two teams.
 * Automatically handles key ordering (alphabetical).
 * Returns undefined if no record exists.
 */
export function getH2H(team1Id: string, team2Id: string): HeadToHeadRecord | undefined {
  const [first, second] = [team1Id, team2Id].sort();
  const key = `${first}-${second}`;
  const record = HEAD_TO_HEAD[key];

  if (!record) return undefined;

  // If the caller's team1 is alphabetically first, return as-is
  if (team1Id === first) {
    return record;
  }

  // Otherwise, flip the record so team1Wins corresponds to the caller's team1
  return {
    team1Wins: record.team2Wins,
    team2Wins: record.team1Wins,
    lastFiveResults: record.lastFiveResults,
  };
}

/**
 * Calculate the historical qualification percentage for teams
 * that had a given number of points after a given number of matches played.
 *
 * This looks at all historical seasons and finds teams that had
 * the equivalent points-per-match ratio at the same stage, then
 * returns what percentage of them qualified for playoffs.
 *
 * @param points - Current points tally
 * @param played - Number of matches played so far
 * @returns Percentage (0-100) of teams that historically qualified with similar records
 */
export function getHistoricalQualification(points: number, played: number): number {
  if (played === 0) return 50; // No data, return neutral

  // Calculate the projected final points based on current rate
  // Most IPL seasons have 14 matches per team in the league stage
  const totalMatches = 14;
  const pointsPerMatch = points / played;
  const projectedPoints = Math.round(pointsPerMatch * totalMatches);

  // Find all historical entries where teams played the full season (14+ matches)
  // and check how many with similar final points qualified
  const relevantEntries = HISTORICAL_STANDINGS.filter(
    (entry) => entry.played >= 14
  );

  if (relevantEntries.length === 0) return 50;

  // Group by projected points range (±1 point tolerance for better sample size)
  const similarTeams = relevantEntries.filter(
    (entry) => Math.abs(entry.points - projectedPoints) <= 1
  );

  if (similarTeams.length === 0) {
    // Fallback: use broader range
    const broaderTeams = relevantEntries.filter(
      (entry) => Math.abs(entry.points - projectedPoints) <= 2
    );
    if (broaderTeams.length === 0) return projectedPoints >= 16 ? 75 : 25;
    const qualifiedCount = broaderTeams.filter((t) => t.qualified).length;
    return Math.round((qualifiedCount / broaderTeams.length) * 100);
  }

  const qualifiedCount = similarTeams.filter((t) => t.qualified).length;
  return Math.round((qualifiedCount / similarTeams.length) * 100);
}

/**
 * Get all standings for a specific season.
 */
export function getSeasonStandings(season: number): SeasonStanding[] {
  return HISTORICAL_STANDINGS.filter((entry) => entry.season === season);
}

/**
 * Get historical performance of a specific team across all seasons.
 * Uses shortName (e.g., 'RCB', 'CSK').
 */
export function getTeamHistory(shortName: string): SeasonStanding[] {
  return HISTORICAL_STANDINGS.filter(
    (entry) => entry.team === shortName.toUpperCase()
  );
}

/**
 * Get the minimum points historically needed to qualify in a 10-team season.
 * Useful for "magic number" calculations.
 */
export function getMinQualificationPoints(): { min: number; avg: number; max: number } {
  const tenTeamSeasons = [2022, 2023, 2024, 2025];
  const qualifiers = HISTORICAL_STANDINGS.filter(
    (entry) =>
      tenTeamSeasons.includes(entry.season) &&
      entry.qualified &&
      entry.position === 4 // 4th place = minimum qualifier
  );

  if (qualifiers.length === 0) {
    return { min: 14, avg: 15, max: 16 };
  }

  const points = qualifiers.map((q) => q.points);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const avg = Math.round(points.reduce((a, b) => a + b, 0) / points.length);

  return { min, avg, max };
}

/**
 * Get the number of IPL titles won by each current team.
 */
export function getTitleCount(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of IPL_WINNERS) {
    counts[entry.winner] = (counts[entry.winner] || 0) + 1;
  }
  return counts;
}
