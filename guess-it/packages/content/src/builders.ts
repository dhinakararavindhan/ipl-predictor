/** Definition builder helpers shared by all content waves. */
import type { GameDefinition } from '@guess-it/engine';

export const clue = (
  id: string,
  world: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  name: string,
  aliases: string[],
  emoji: string,
  clues: [string, number][],
): GameDefinition => ({
  id,
  mechanic: 'CLUE_GUESS',
  world,
  difficulty,
  answer: { name, aliases, emoji },
  clue: { clues: clues.map(([text, identifiability]) => ({ text, identifiability })) },
});

export const hl = (
  id: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  prompt: string,
  secret: number,
  lo: number,
  hi: number,
  unit?: string,
): GameDefinition => ({
  id,
  mechanic: 'HIGHER_LOWER',
  world: 'numbers',
  difficulty,
  higherLower: { secret, lo, hi, unit, prompt },
});

export const mc = (
  id: string,
  world: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  question: string,
  options: string[],
  correctIndex: number,
): GameDefinition => ({
  id,
  mechanic: 'MULTIPLE_CHOICE',
  world,
  difficulty,
  multipleChoice: { question, options, correctIndex },
});

