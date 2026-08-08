'use client';

/**
 * Friend Challenge lite (Phase 2 preview, no backend): the challenge link
 * encodes the definition id + seed so the recipient plays the exact same
 * puzzle. NOTE: the payload is decodable client-side — acceptable for the
 * friendly-lite version; the server-authoritative version (API Spec §6)
 * replaces this when the backend lands.
 */
import type { Difficulty, GameState, Mechanic } from '@guess-it/engine';

export interface ChallengePayload {
  v: 1;
  d: string; // definition id
  w: string; // world (needed for generative EXACT_NUMBER)
  df: Difficulty;
  s: string; // seed
  n: string; // challenger name
  sc: number; // challenger score
  at: number; // challenger attempts
  o: 'WON' | 'LOST' | 'FORFEITED';
}

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)));
}

export function encodeChallenge(p: ChallengePayload): string {
  return b64urlEncode(JSON.stringify(p));
}

export function decodeChallenge(c: string): ChallengePayload | null {
  try {
    const p = JSON.parse(b64urlDecode(c)) as ChallengePayload;
    if (p.v !== 1 || !p.d || !p.s) return null;
    return p;
  } catch {
    return null;
  }
}

export function challengeUrl(p: ChallengePayload): string {
  return `${window.location.origin}/challenge?c=${encodeChallenge(p)}`;
}

/** Wordle-style spoiler-free result text (UI/UX §4). */
export function emojiGrid(game: GameState, mechanicName: string): string {
  const lines: string[] = [`GUESS IT · ${mechanicName} · ${game.difficulty}`];
  const r = game.result;
  switch (game.mechanic) {
    case 'EXACT_NUMBER':
      for (const row of game.exact!.guesses) {
        lines.push(row.perDigit.map((m) => (m === 'EXACT' ? '🟩' : m === 'MISPLACED' ? '🟨' : '⬛')).join(''));
      }
      break;
    case 'CLUE_GUESS': {
      const cluesUsed = game.clueState!.cluesRevealed;
      lines.push(`${'🔍'.repeat(cluesUsed)} ${r?.outcome === 'WON' ? `solved with ${cluesUsed} clue${cluesUsed > 1 ? 's' : ''}` : 'unsolved'}`);
      if (game.clueState!.wrongGuesses.length > 0) lines.push('❌'.repeat(game.clueState!.wrongGuesses.length));
      break;
    }
    case 'HIGHER_LOWER':
      lines.push(
        game.hl!.history.map((h) => (h.verdict === 'TOO_LOW' ? '🔺' : '🔻')).join('') +
          (r?.outcome === 'WON' ? '🎯' : '💥'),
      );
      break;
    case 'MULTIPLE_CHOICE':
      lines.push(`${r?.outcome === 'WON' ? '✅' : '❌'} in ${((r?.durationMs ?? 0) / 1000).toFixed(1)}s`);
      break;
    case 'IMAGE_REVEAL':
      lines.push(`🖼️ level ${game.image!.level}/5 ${r?.outcome === 'WON' ? '✅' : '❌'}`);
      break;
  }
  lines.push(`Score: ${r?.score ?? 0} · Think. Guess. Outsmart.`);
  return lines.join('\n');
}
