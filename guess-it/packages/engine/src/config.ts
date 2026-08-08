/**
 * Tunable rule configuration, version-stamped (Engine Spec R-6.3.3).
 * All gameplay constants live here — nothing hard-coded in mechanics.
 */
import type { Difficulty, Mechanic } from './types';

export const RULE_CONFIG_VERSION = '1.0.0';

export const BASE_SCORE = 1000;
export const SCORE_FLOOR = 100;

export const DIFFICULTY_MULT: Record<Difficulty, number> = {
  EASY: 1.0,
  MEDIUM: 1.25,
  HARD: 1.5,
};

/** Progress costs (Engine Spec §6.3). */
export const COSTS = {
  EXACT_WRONG_GUESS: 90,
  CLUE_EXTRA_CLUE: 150,
  CLUE_WRONG_GUESS: 50,
  HL_WRONG_GUESS: 110,
  IMAGE_REVEAL_LEVEL: 175,
  IMAGE_WRONG_GUESS: 50,
} as const;

/** Hint costs (Engine Spec §7). */
export const HINT_COSTS = {
  REVEAL_DIGIT: 200,
  FIRST_LETTER: 150,
  SHRINK_RANGE: 200,
  FIFTY_FIFTY: 300,
} as const;

export const BONUS_FIRST_GUESS = 250;
export const BONUS_NO_HINTS = 100;

export const HINT_BUDGET: Record<Difficulty, number> = { EASY: 3, MEDIUM: 2, HARD: 1 };

export function attemptsFor(mechanic: Mechanic, difficulty: Difficulty): number {
  switch (mechanic) {
    case 'EXACT_NUMBER':
      return { EASY: 12, MEDIUM: 10, HARD: 8 }[difficulty];
    case 'HIGHER_LOWER':
      return { EASY: 10, MEDIUM: 8, HARD: 7 }[difficulty];
    case 'CLUE_GUESS':
    case 'IMAGE_REVEAL':
      return 5;
    case 'MULTIPLE_CHOICE':
      return 1;
  }
}

export function mcTimeLimitMs(difficulty: Difficulty): number {
  return { EASY: 20000, MEDIUM: 15000, HARD: 10000 }[difficulty];
}

/** Image reveal ladder identifiability (AI Spec §2.1). */
export const REVEAL_LEVELS = [0.1, 0.25, 0.5, 0.75, 1.0];
export const REVEAL_IDENTIFIABILITY = [0.1, 0.3, 0.6, 0.85, 0.97];

/** XP awards (BRD §19 / Engine R-6.5.1). */
export const XP = {
  CORRECT: 100,
  WIN_VS: 150,
  HARD_GAME: 50,
  PERFECT: 100,
  DAILY: 200,
} as const;

/** Cumulative XP required to *reach* level n (Engine R-6.5.2). */
export function xpForLevel(level: number): number {
  return (500 * level * (level - 1)) / 2;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export const LEVEL_TITLES: [number, string][] = [
  [1, 'Beginner'],
  [5, 'Curious'],
  [10, 'Thinker'],
  [20, 'Detective'],
  [30, 'Expert'],
  [50, 'Master'],
  [75, 'Legend'],
  [100, 'Grandmaster'],
];

export function titleForLevel(level: number): string {
  let title = LEVEL_TITLES[0][1];
  for (const [lvl, t] of LEVEL_TITLES) if (level >= lvl) title = t;
  return title;
}
