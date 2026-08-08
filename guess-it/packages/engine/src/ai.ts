/**
 * AI opponent — policies + pacing (Engine Spec §9, AI Spec §2–§3).
 * The AI races the player on the same puzzle. It never reads answer data
 * except through the sealed evaluate step (AI Spec §4.1): for EXACT_NUMBER it
 * receives only feedback triples; for knowledge games it holds an opaque
 * "solved" flag and submits the answer only at solve time.
 */
import { deepClone } from './clone';
import { REVEAL_IDENTIFIABILITY } from './config';
import { evaluateExact, generateSecret } from './game';
import { deriveSeed, Rng } from './prng';
import type {
  AiCharacterId,
  AiEvent,
  AiLevel,
  AiRuntime,
  GameDefinition,
  GameState,
} from './types';

export interface AiLevelParams {
  blunderRate: number;
  knowledge: number;
  thinkMinMs: number;
  thinkMaxMs: number;
}

/** Canonical difficulty parameters (AI Spec §2). */
export const AI_PARAMS: Record<AiLevel, AiLevelParams> = {
  ROOKIE: { blunderRate: 0.25, knowledge: 0.2, thinkMinMs: 8000, thinkMaxMs: 20000 },
  EASY: { blunderRate: 0.15, knowledge: 0.35, thinkMinMs: 7000, thinkMaxMs: 16000 },
  MEDIUM: { blunderRate: 0, knowledge: 0.55, thinkMinMs: 6000, thinkMaxMs: 14000 },
  HARD: { blunderRate: 0, knowledge: 0.75, thinkMinMs: 5000, thinkMaxMs: 12000 },
};

export interface AiCharacter {
  id: AiCharacterId;
  name: string;
  emoji: string;
  blurb: string;
  /** knowledge delta on clue/image games (AI Spec §3, clamped downstream). */
  clueMod: number;
  /** knowledge delta on numeric feel — used to speed think time on numeric games. */
  numericMod: number;
  lines: {
    start: string[];
    aiWrong: string[];
    playerWrong: string[];
    aiSolved: string[];
    playerSolved: string[];
  };
}

export const AI_CHARACTERS: AiCharacter[] = [
  {
    id: 'detective',
    name: 'Detective',
    emoji: '🕵️',
    blurb: 'The clues never lie.',
    clueMod: 0.1,
    numericMod: -0.05,
    lines: {
      start: ['The game is afoot.', 'Every clue is a confession.'],
      aiWrong: ['Hmm. A red herring.', 'The plot thickens…'],
      playerWrong: ['Interesting theory.', 'Not quite, I suspect.'],
      aiSolved: ['Elementary.', 'Case closed.'],
      playerSolved: ['Well deduced. I tip my hat.', 'A worthy rival.'],
    },
  },
  {
    id: 'calculator',
    name: 'Calculator',
    emoji: '🔢',
    blurb: 'Feels nothing. Computes everything.',
    clueMod: -0.1,
    numericMod: 0.1,
    lines: {
      start: ['01101000 01101001.', 'Probability engaged.'],
      aiWrong: ['Recalculating…', 'Variance detected.'],
      playerWrong: ['Suboptimal input.', 'Error margin: yours.'],
      aiSolved: ['Solution converged.', 'QED.'],
      playerSolved: ['Impressive. For a human.', 'Statistically unlikely. Well done.'],
    },
  },
  {
    id: 'machine',
    name: 'Machine',
    emoji: '🤖',
    blurb: 'General-purpose. Generally unbeatable.',
    clueMod: 0,
    numericMod: 0,
    lines: {
      start: ['Beginning.', 'I am ready.'],
      aiWrong: ['Noted.', 'Adjusting.'],
      playerWrong: ['Logged.', 'Continue.'],
      aiSolved: ['Complete.', 'As expected.'],
      playerSolved: ['You win. This time.', 'Acknowledged.'],
    },
  },
];

export function getCharacter(id: AiCharacterId): AiCharacter {
  return AI_CHARACTERS.find((c) => c.id === id)!;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function allCodes(): string[] {
  // all 5-digit distinct-digit codes would be 30,240 strings; generate lazily once
  const out: string[] = [];
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (const a of digits)
    for (const b of digits)
      if (b !== a)
        for (const c of digits)
          if (c !== a && c !== b)
            for (const d of digits)
              if (d !== a && d !== b && d !== c)
                for (const e of digits)
                  if (e !== a && e !== b && e !== c && e !== d) out.push(a + b + c + d + e);
  return out;
}

let CODE_CACHE: string[] | null = null;
function codes(): string[] {
  if (!CODE_CACHE) CODE_CACHE = allCodes();
  return CODE_CACHE;
}

export function createAiRuntime(
  character: AiCharacterId,
  level: AiLevel,
  state: GameState,
  now: number,
): AiRuntime {
  const rng = new Rng(deriveSeed(state.seed, 'ai-init'));
  const params = AI_PARAMS[level];
  const runtime: AiRuntime = {
    character,
    level,
    nextActionAt: now + rng.int(params.thinkMinMs, params.thinkMaxMs),
    guessCount: 0,
    cluesUsed: 1,
    solved: false,
    events: [],
    log: [],
    wrongGuessMade: false,
  };
  if (state.mechanic === 'EXACT_NUMBER') runtime.candidates = codes();
  const char = getCharacter(character);
  runtime.events.push({ at: now, type: 'DIALOGUE', line: rng.pick(char.lines.start) });
  return runtime;
}

/**
 * Advance the AI to `now`. Returns a new runtime plus whether the AI just
 * solved the puzzle (the caller ends the game via loseToAi if the player
 * hasn't already won). Deterministic per seed + action count (R-9.1.2).
 */
export function runAi(
  ai: AiRuntime,
  state: GameState,
  def: GameDefinition,
  now: number,
): { ai: AiRuntime; aiSolved: boolean } {
  if (state.status !== 'ACTIVE' || ai.solved) return { ai, aiSolved: false };
  if (now < ai.nextActionAt) return { ai, aiSolved: false };

  const next: AiRuntime = deepClone(ai);
  const params = AI_PARAMS[next.level];
  const char = getCharacter(next.character);
  const rng = new Rng(deriveSeed(state.seed, `ai-turn-${next.guessCount}-${next.cluesUsed}`));
  const pushEvent = (e: AiEvent) => next.events.push(e);
  const schedule = () => {
    const numeric = state.mechanic === 'EXACT_NUMBER' || state.mechanic === 'HIGHER_LOWER';
    const speedup = numeric ? 1 - char.numericMod : 1;
    next.nextActionAt = now + Math.round(rng.int(params.thinkMinMs, params.thinkMaxMs) * speedup);
  };

  if (state.mechanic === 'EXACT_NUMBER') {
    const secret = state.exact!.secret ?? generateSecret(state.seed);
    let guess: string;
    const blunder = rng.next() < params.blunderRate;
    const cands = next.candidates!;
    if (blunder) {
      guess = rng.pick(codes());
    } else if (next.level === 'HARD' && cands.length > 2) {
      // sampled max-elimination (AI Spec §2): pick candidate minimizing expected remainder
      const sample = cands.length > 300 ? rng.shuffle(cands).slice(0, 300) : cands;
      const pool = sample.length > 60 ? rng.shuffle(sample).slice(0, 60) : sample;
      let best = pool[0];
      let bestScore = Infinity;
      for (const g of pool) {
        const buckets = new Map<string, number>();
        for (const c of sample) {
          const r = evaluateExact(c, g);
          const k = `${r.exact}-${r.misplaced}`;
          buckets.set(k, (buckets.get(k) ?? 0) + 1);
        }
        let expected = 0;
        for (const n of buckets.values()) expected += (n * n) / sample.length;
        if (expected < bestScore) {
          bestScore = expected;
          best = g;
        }
      }
      guess = best;
    } else {
      guess = rng.pick(cands);
    }

    next.guessCount++;
    const row = evaluateExact(secret, guess);
    next.log.push({
      at: now,
      text: `Guess ${next.guessCount}: ${guess} → ${row.exact} exact, ${row.misplaced} misplaced (${next.candidates!.length.toLocaleString()} codes possible)`,
    });
    if (row.exact === 5) {
      next.solved = true;
      next.solvedAt = now;
      pushEvent({ at: now, type: 'AI_SOLVED' });
      pushEvent({ at: now, type: 'DIALOGUE', line: rng.pick(char.lines.aiSolved) });
      return { ai: next, aiSolved: true };
    }
    // exact filtering step shared by all levels (R-9.2.2)
    next.candidates = next.candidates!.filter((c) => {
      const r = evaluateExact(c, guess);
      return r.exact === row.exact && r.misplaced === row.misplaced;
    });
    pushEvent({ at: now, type: 'AI_GUESSED', exact: row.exact });
    if (rng.next() < 0.3) pushEvent({ at: now, type: 'DIALOGUE', line: rng.pick(char.lines.aiWrong) });
    schedule();
    return { ai: next, aiSolved: false };
  }

  if (state.mechanic === 'CLUE_GUESS' || state.mechanic === 'IMAGE_REVEAL') {
    const knowledge = clamp(
      params.knowledge + (state.mechanic === 'CLUE_GUESS' ? char.clueMod : 0),
      0.05,
      0.97,
    );
    const identifiability =
      state.mechanic === 'CLUE_GUESS'
        ? (def.clue!.clues[Math.min(next.cluesUsed, def.clue!.clues.length) - 1]?.identifiability ?? 0.5)
        : REVEAL_IDENTIFIABILITY[Math.min(next.cluesUsed, 5) - 1];
    const solveRoll = rng.next() < knowledge * identifiability;
    if (solveRoll) {
      next.solved = true;
      next.solvedAt = now;
      next.log.push({ at: now, text: `Solved it after ${next.cluesUsed} ${state.mechanic === 'CLUE_GUESS' ? 'clues' : 'reveals'}.` });
      next.events.push({ at: now, type: 'AI_SOLVED' });
      next.events.push({ at: now, type: 'DIALOGUE', line: rng.pick(char.lines.aiSolved) });
      return { ai: next, aiSolved: true };
    }
    const total = state.mechanic === 'CLUE_GUESS' ? def.clue!.clues.length : 5;
    if (next.cluesUsed < total) {
      next.cluesUsed++;
      next.log.push({
        at: now,
        text: `${state.mechanic === 'CLUE_GUESS' ? `Took clue ${next.cluesUsed}` : `Revealed more (level ${next.cluesUsed})`} — still thinking.`,
      });
      next.events.push({ at: now, type: 'AI_ADVANCED' });
    } else if (!next.wrongGuessMade && (next.level === 'ROOKIE' || next.level === 'EASY')) {
      next.wrongGuessMade = true;
      next.log.push({ at: now, text: 'Made a wrong guess.' });
      next.events.push({ at: now, type: 'AI_GUESSED' });
      next.events.push({ at: now, type: 'DIALOGUE', line: rng.pick(char.lines.aiWrong) });
    }
    schedule();
    return { ai: next, aiSolved: false };
  }

  // No versus mode for HIGHER_LOWER / MULTIPLE_CHOICE at MVP.
  return { ai: next, aiSolved: false };
}

/** Which mechanics support versus-AI play at MVP. */
export function supportsVersus(mechanic: GameState['mechanic']): boolean {
  return mechanic === 'EXACT_NUMBER' || mechanic === 'CLUE_GUESS' || mechanic === 'IMAGE_REVEAL';
}
