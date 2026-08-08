/**
 * Core game lifecycle: creation, actions, evaluation, scoring.
 * Pure and deterministic: state in, state out (Engine Spec R-1.1/R-1.2).
 * All state transitions clone; callers must treat GameState as immutable.
 */
import {
  attemptsFor,
  BASE_SCORE,
  BONUS_FIRST_GUESS,
  BONUS_NO_HINTS,
  COSTS,
  DIFFICULTY_MULT,
  HINT_BUDGET,
  HINT_COSTS,
  mcTimeLimitMs,
  SCORE_FLOOR,
} from './config';
import { matchesAnswer, normalize } from './normalize';
import { deriveSeed, Rng } from './prng';
import {
  EngineError,
  type DigitMark,
  type ExactGuessRow,
  type GameDefinition,
  type GameResult,
  type GameState,
  type HintType,
  type Outcome,
  type ScoreBreakdown,
} from './types';

// ---------- creation ----------

export function generateSecret(seed: string): string {
  const rng = new Rng(deriveSeed(seed, 'secret'));
  return rng
    .shuffle(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
    .slice(0, 5)
    .join('');
}

export function createGame(def: GameDefinition, seed: string, now: number): GameState {
  const state: GameState = {
    defId: def.id,
    mechanic: def.mechanic,
    world: def.world,
    difficulty: def.difficulty,
    seed,
    status: 'ACTIVE',
    startedAt: now,
    attemptsUsed: 0,
    attemptsMax: attemptsFor(def.mechanic, def.difficulty),
    hintsRemaining: HINT_BUDGET[def.difficulty],
    hintsUsed: [],
    costs: [],
    firstGuessCorrect: false,
  };

  switch (def.mechanic) {
    case 'EXACT_NUMBER':
      state.exact = { secret: generateSecret(seed), guesses: [], revealedPositions: [] };
      break;
    case 'CLUE_GUESS':
      state.clueState = { cluesRevealed: 1, wrongGuesses: [] }; // clue 1 shown at start (R-5.2.2)
      break;
    case 'HIGHER_LOWER': {
      const c = def.higherLower!;
      state.hl = { curLo: c.lo, curHi: c.hi, history: [] };
      break;
    }
    case 'IMAGE_REVEAL':
      state.image = { level: 1, wrongGuesses: [] };
      break;
    case 'MULTIPLE_CHOICE': {
      const c = def.multipleChoice!;
      const rng = new Rng(deriveSeed(seed, 'mc-shuffle'));
      state.mc = {
        order: rng.shuffle(c.options.map((_, i) => i)),
        eliminated: [],
        timeLimitMs: mcTimeLimitMs(def.difficulty),
      };
      break;
    }
  }
  return state;
}

// ---------- evaluation (Engine §5.1.5–5.1.8) ----------

export function evaluateExact(secret: string, guess: string): ExactGuessRow {
  const perDigit: DigitMark[] = [];
  let exact = 0;
  let misplaced = 0;
  for (let i = 0; i < 5; i++) {
    if (guess[i] === secret[i]) {
      perDigit.push('EXACT');
      exact++;
    } else if (secret.includes(guess[i])) {
      perDigit.push('MISPLACED');
      misplaced++;
    } else {
      perDigit.push('MISS');
    }
  }
  return { digits: guess, perDigit, exact, misplaced, miss: 5 - exact - misplaced };
}

export function isValidExactGuess(guess: string): boolean {
  return /^\d{5}$/.test(guess) && new Set(guess).size === 5;
}

// ---------- scoring (Engine §6) ----------

function totalCosts(state: GameState): number {
  return state.costs.reduce((s, c) => s + c.amount, 0);
}

export function potentialScore(state: GameState): number {
  const afterCosts = Math.max(SCORE_FLOOR, BASE_SCORE - totalCosts(state));
  return Math.round(afterCosts * DIFFICULTY_MULT[state.difficulty]);
}

function buildBreakdown(state: GameState, outcome: Outcome, speedMult: number): ScoreBreakdown {
  const costs = state.costs.slice();
  const afterCosts = Math.max(SCORE_FLOOR, BASE_SCORE - totalCosts(state));
  const bonuses: { label: string; amount: number }[] = [];
  if (outcome === 'WON') {
    if (state.firstGuessCorrect) bonuses.push({ label: 'First guess', amount: BONUS_FIRST_GUESS });
    if (state.hintsUsed.length === 0) bonuses.push({ label: 'No hints', amount: BONUS_NO_HINTS });
  }
  const mult = DIFFICULTY_MULT[state.difficulty];
  const core = outcome === 'WON' ? Math.round(afterCosts * mult * speedMult) : 0;
  let final = core + bonuses.reduce((s, b) => s + b.amount, 0);
  if (outcome === 'LOST') {
    // participation score (R-6.1.4)
    if (state.mechanic === 'EXACT_NUMBER' && state.exact) {
      const best = Math.max(0, ...state.exact.guesses.map((g) => g.exact));
      final = 10 * best;
    } else {
      final = 0;
    }
  }
  if (outcome === 'FORFEITED') final = 0;
  return { base: BASE_SCORE, costs, afterCosts, difficultyMult: mult, speedMult, bonuses, final };
}

function finish(
  state: GameState,
  def: GameDefinition,
  outcome: Outcome,
  now: number,
  opts: { speedMult?: number; beatenByAi?: boolean } = {},
): GameState {
  const breakdown = buildBreakdown(state, outcome, opts.speedMult ?? 1);
  const answerName =
    def.mechanic === 'EXACT_NUMBER'
      ? state.exact!.secret
      : def.mechanic === 'HIGHER_LOWER'
        ? String(def.higherLower!.secret)
        : def.mechanic === 'MULTIPLE_CHOICE'
          ? def.multipleChoice!.options[def.multipleChoice!.correctIndex]
          : def.answer!.name;
  const result: GameResult = {
    outcome,
    answerName,
    answerEmoji: def.answer?.emoji,
    score: breakdown.final,
    breakdown,
    attemptsUsed: state.attemptsUsed,
    durationMs: now - state.startedAt,
    perfect: outcome === 'WON' && state.hintsUsed.length === 0 && noWrongGuesses(state),
    beatenByAi: opts.beatenByAi,
  };
  return { ...state, status: outcome, endedAt: now, result };
}

function noWrongGuesses(state: GameState): boolean {
  switch (state.mechanic) {
    case 'EXACT_NUMBER':
      return state.exact!.guesses.length <= 1;
    case 'CLUE_GUESS':
      return state.clueState!.wrongGuesses.length === 0;
    case 'HIGHER_LOWER':
      return state.hl!.history.length === 0;
    case 'IMAGE_REVEAL':
      return state.image!.wrongGuesses.length === 0;
    case 'MULTIPLE_CHOICE':
      return true;
  }
}

// ---------- actions ----------

function assertActive(state: GameState): void {
  if (state.status !== 'ACTIVE') throw new EngineError('GAME_NOT_ACTIVE', 'Game is over.');
}

function clone(state: GameState): GameState {
  return structuredClone(state);
}

export function forfeit(state: GameState, def: GameDefinition, now: number): GameState {
  assertActive(state);
  return finish(clone(state), def, 'FORFEITED', now);
}

/** requestClue / revealMore (Engine R-5.2.3 / R-5.4.3). */
export function advance(state: GameState, def: GameDefinition, now: number): GameState {
  assertActive(state);
  const s = clone(state);
  if (s.mechanic === 'CLUE_GUESS') {
    const total = def.clue!.clues.length;
    if (s.clueState!.cluesRevealed >= total)
      throw new EngineError('NOTHING_TO_ADVANCE', 'No more clues.');
    s.clueState!.cluesRevealed++;
    s.costs.push({ label: `Clue ${s.clueState!.cluesRevealed}`, amount: COSTS.CLUE_EXTRA_CLUE });
    return s;
  }
  if (s.mechanic === 'IMAGE_REVEAL') {
    if (s.image!.level >= 5) throw new EngineError('NOTHING_TO_ADVANCE', 'Fully revealed.');
    s.image!.level++;
    s.costs.push({ label: `Reveal ${s.image!.level}`, amount: COSTS.IMAGE_REVEAL_LEVEL });
    return s;
  }
  throw new EngineError('NOTHING_TO_ADVANCE', 'Nothing to advance for this mechanic.');
}

export function useHint(state: GameState, def: GameDefinition, hint: HintType): GameState {
  assertActive(state);
  if (state.hintsRemaining <= 0) throw new EngineError('NO_HINTS_LEFT', 'No hints left.');
  const s = clone(state);

  switch (hint) {
    case 'REVEAL_DIGIT': {
      if (s.mechanic !== 'EXACT_NUMBER')
        throw new EngineError('HINT_NOT_APPLICABLE', 'Not a number game.');
      const revealed = new Set(s.exact!.revealedPositions.map((r) => r.index));
      const index = [0, 1, 2, 3, 4].find((i) => !revealed.has(i));
      if (index === undefined) throw new EngineError('HINT_NOT_APPLICABLE', 'All revealed.');
      s.exact!.revealedPositions.push({ index, digit: s.exact!.secret[index] });
      s.costs.push({ label: 'Hint: reveal digit', amount: HINT_COSTS.REVEAL_DIGIT });
      break;
    }
    case 'FIRST_LETTER': {
      if (s.mechanic !== 'CLUE_GUESS' && s.mechanic !== 'IMAGE_REVEAL')
        throw new EngineError('HINT_NOT_APPLICABLE', 'Not a text game.');
      const letter = normalize(def.answer!.name).charAt(0).toUpperCase();
      if (s.mechanic === 'CLUE_GUESS') s.clueState!.firstLetter = letter;
      else s.image!.firstLetter = letter;
      s.costs.push({ label: 'Hint: first letter', amount: HINT_COSTS.FIRST_LETTER });
      break;
    }
    case 'SHRINK_RANGE': {
      if (s.mechanic !== 'HIGHER_LOWER')
        throw new EngineError('HINT_NOT_APPLICABLE', 'Not higher/lower.');
      const { curLo, curHi } = s.hl!;
      const secret = def.higherLower!.secret;
      const width = curHi - curLo;
      if (width < 4) throw new EngineError('HINT_NOT_APPLICABLE', 'Range already tiny.');
      // Halve the range around the secret (R-7.2)
      const half = Math.floor(width / 4);
      s.hl!.curLo = Math.max(curLo, secret - half);
      s.hl!.curHi = Math.min(curHi, secret + half);
      s.costs.push({ label: 'Hint: shrink range', amount: HINT_COSTS.SHRINK_RANGE });
      break;
    }
    case 'FIFTY_FIFTY': {
      if (s.mechanic !== 'MULTIPLE_CHOICE')
        throw new EngineError('HINT_NOT_APPLICABLE', 'Not multiple choice.');
      if (s.mc!.eliminated.length > 0)
        throw new EngineError('HINT_NOT_APPLICABLE', 'Already used.');
      const rng = new Rng(deriveSeed(s.seed, 'fifty'));
      const wrongPresentation = s.mc!.order
        .map((optIdx, presIdx) => ({ optIdx, presIdx }))
        .filter((x) => x.optIdx !== def.multipleChoice!.correctIndex);
      s.mc!.eliminated = rng
        .shuffle(wrongPresentation)
        .slice(0, 2)
        .map((x) => x.presIdx);
      s.costs.push({ label: 'Hint: 50/50', amount: HINT_COSTS.FIFTY_FIFTY });
      break;
    }
  }

  s.hintsRemaining--;
  s.hintsUsed.push(hint);
  return s;
}

/**
 * Submit a guess. Invalid guesses throw EngineError and never consume attempts
 * (Engine R-5.1.4, R-4.4, R-5.3.2). `guess` is digits, text, or a presentation
 * index (MULTIPLE_CHOICE, as a string).
 */
export function submitGuess(
  state: GameState,
  def: GameDefinition,
  guess: string,
  now: number,
): GameState {
  assertActive(state);
  const s = clone(state);

  switch (s.mechanic) {
    case 'EXACT_NUMBER': {
      const g = guess.trim();
      if (!isValidExactGuess(g))
        throw new EngineError('INVALID_GUESS_FORMAT', 'Enter 5 different digits.');
      if (s.exact!.guesses.some((r) => r.digits === g))
        throw new EngineError('DUPLICATE_GUESS', 'Already tried that code.');
      const row = evaluateExact(s.exact!.secret, g);
      s.exact!.guesses.push(row);
      s.attemptsUsed++;
      if (row.exact === 5) {
        if (s.attemptsUsed === 1) s.firstGuessCorrect = true;
        return finish(s, def, 'WON', now);
      }
      s.costs.push({ label: `Wrong guess ${s.exact!.guesses.length}`, amount: COSTS.EXACT_WRONG_GUESS });
      if (s.attemptsUsed >= s.attemptsMax) return finish(s, def, 'LOST', now);
      return s;
    }

    case 'CLUE_GUESS':
    case 'IMAGE_REVEAL': {
      const g = guess.trim();
      if (g.length === 0) throw new EngineError('INVALID_GUESS_FORMAT', 'Type a guess first.');
      const prior =
        s.mechanic === 'CLUE_GUESS' ? s.clueState!.wrongGuesses : s.image!.wrongGuesses;
      if (prior.some((p) => normalize(p) === normalize(g)))
        throw new EngineError('DUPLICATE_GUESS', 'Already guessed that.');
      s.attemptsUsed++;
      if (matchesAnswer(g, def.answer!.name, def.answer!.aliases)) {
        if (s.attemptsUsed === 1) s.firstGuessCorrect = true;
        return finish(s, def, 'WON', now);
      }
      prior.push(g);
      const cost =
        s.mechanic === 'CLUE_GUESS' ? COSTS.CLUE_WRONG_GUESS : COSTS.IMAGE_WRONG_GUESS;
      s.costs.push({ label: `Wrong guess`, amount: cost });
      if (s.attemptsUsed >= s.attemptsMax) return finish(s, def, 'LOST', now);
      return s;
    }

    case 'HIGHER_LOWER': {
      const n = Number(guess.trim());
      if (!Number.isInteger(n)) throw new EngineError('INVALID_GUESS_FORMAT', 'Enter a whole number.');
      const { curLo, curHi } = s.hl!;
      if (n < curLo || n > curHi)
        throw new EngineError('OUT_OF_RANGE', `Guess between ${curLo} and ${curHi}.`);
      const secret = def.higherLower!.secret;
      s.attemptsUsed++;
      if (n === secret) {
        if (s.attemptsUsed === 1) s.firstGuessCorrect = true;
        return finish(s, def, 'WON', now);
      }
      if (n < secret) {
        s.hl!.history.push({ guess: n, verdict: 'TOO_LOW' });
        s.hl!.curLo = n + 1;
      } else {
        s.hl!.history.push({ guess: n, verdict: 'TOO_HIGH' });
        s.hl!.curHi = n - 1;
      }
      s.costs.push({ label: 'Wrong guess', amount: COSTS.HL_WRONG_GUESS });
      if (s.attemptsUsed >= s.attemptsMax) return finish(s, def, 'LOST', now);
      return s;
    }

    case 'MULTIPLE_CHOICE': {
      const presIdx = Number(guess);
      if (!Number.isInteger(presIdx) || presIdx < 0 || presIdx >= s.mc!.order.length)
        throw new EngineError('INVALID_GUESS_FORMAT', 'Pick an option.');
      if (s.mc!.eliminated.includes(presIdx))
        throw new EngineError('INVALID_GUESS_FORMAT', 'That option was eliminated.');
      s.attemptsUsed = 1;
      const elapsed = Math.max(0, now - s.startedAt);
      const limit = s.mc!.timeLimitMs;
      const correct = s.mc!.order[presIdx] === def.multipleChoice!.correctIndex;
      if (elapsed >= limit) return finish(s, def, 'LOST', now);
      if (correct) {
        s.firstGuessCorrect = true;
        // speed multiplier (R-6.4.1)
        const speedMult = 0.5 + 0.5 * ((limit - elapsed) / limit);
        return finish(s, def, 'WON', now, { speedMult });
      }
      return finish(s, def, 'LOST', now);
    }
  }
}

/** Timeout sweep for timed mechanics (Engine R-3.4). */
export function tick(state: GameState, def: GameDefinition, now: number): GameState {
  if (state.status !== 'ACTIVE') return state;
  if (state.mechanic === 'MULTIPLE_CHOICE' && now - state.startedAt >= state.mc!.timeLimitMs) {
    return finish(clone(state), def, 'LOST', now);
  }
  return state;
}

/** Called by the AI runner when the AI solves first: the player loses the race. */
export function loseToAi(state: GameState, def: GameDefinition, now: number): GameState {
  assertActive(state);
  return finish(clone(state), def, 'LOST', now, { beatenByAi: true });
}
