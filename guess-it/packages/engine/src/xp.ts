/** XP awards for a finished game (Engine R-6.5.1, BRD §19). */
import { XP } from './config';
import type { GameResult } from './types';

export interface XpAward {
  total: number;
  parts: { label: string; amount: number }[];
}

export function xpForResult(
  result: GameResult,
  opts: { versus: boolean; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; daily?: boolean },
): XpAward {
  const parts: { label: string; amount: number }[] = [];
  if (result.outcome === 'WON') {
    parts.push({ label: 'Correct answer', amount: XP.CORRECT });
    if (opts.versus) parts.push({ label: 'Win vs AI', amount: XP.WIN_VS });
    if (opts.difficulty === 'HARD') parts.push({ label: 'Hard game', amount: XP.HARD_GAME });
    if (result.perfect) parts.push({ label: 'Perfect game', amount: XP.PERFECT });
  }
  if (opts.daily && result.outcome !== 'FORFEITED')
    parts.push({ label: 'Daily challenge', amount: XP.DAILY });
  return { total: parts.reduce((s, p) => s + p.amount, 0), parts };
}
