import { describe, expect, it } from 'vitest';
import {
  advance,
  createAiRuntime,
  createGame,
  evaluateExact,
  generateSecret,
  isValidExactGuess,
  loseToAi,
  matchesAnswer,
  normalize,
  playerView,
  potentialScore,
  Rng,
  runAi,
  submitGuess,
  tick,
  useHint,
  xpForResult,
  type GameDefinition,
  type GameState,
} from '../src/index';

const CLUE_DEF: GameDefinition = {
  id: 'test-clue',
  mechanic: 'CLUE_GUESS',
  world: 'actors',
  difficulty: 'MEDIUM',
  answer: { name: 'Shah Rukh Khan', aliases: ['SRK', 'Shahrukh Khan'] },
  clue: {
    clues: [
      { text: 'I was born in India.', identifiability: 0.05 },
      { text: 'I debuted on TV in 1989.', identifiability: 0.3 },
      { text: 'I am called the King of Bollywood.', identifiability: 0.97 },
    ],
  },
};

const HL_DEF: GameDefinition = {
  id: 'test-hl',
  mechanic: 'HIGHER_LOWER',
  world: 'numbers',
  difficulty: 'MEDIUM',
  higherLower: { secret: 8849, lo: 8000, hi: 9000, unit: 'm', prompt: 'Everest height?' },
};

const MC_DEF: GameDefinition = {
  id: 'test-mc',
  mechanic: 'MULTIPLE_CHOICE',
  world: 'movies',
  difficulty: 'EASY',
  multipleChoice: {
    question: 'Who directed Inception?',
    options: ['Spielberg', 'Nolan', 'Cameron', 'Scorsese'],
    correctIndex: 1,
  },
};

const EXACT_DEF: GameDefinition = {
  id: 'test-exact',
  mechanic: 'EXACT_NUMBER',
  world: 'numbers',
  difficulty: 'MEDIUM',
};

const T0 = 1_000_000;

describe('R-5.1 exact number evaluation', () => {
  it('matches the BRD §53 worked example: 78391 vs 74162', () => {
    const row = evaluateExact('78391', '74162');
    expect(row.exact).toBe(1);
    expect(row.misplaced).toBe(1);
    expect(row.miss).toBe(3);
    expect(row.perDigit).toEqual(['EXACT', 'MISS', 'MISPLACED', 'MISS', 'MISS']);
  });

  it('exact + misplaced + miss = 5 for random pairs (property)', () => {
    const rng = new Rng('prop');
    for (let i = 0; i < 500; i++) {
      const s = generateSecret(`s${i}`);
      const g = generateSecret(`g${i}`);
      const r = evaluateExact(s, g);
      expect(r.exact + r.misplaced + r.miss).toBe(5);
      expect(rng.next()).toBeGreaterThanOrEqual(0);
    }
  });

  it('validates guesses: 5 distinct digits only (R-5.1.4)', () => {
    expect(isValidExactGuess('04871')).toBe(true);
    expect(isValidExactGuess('11234')).toBe(false);
    expect(isValidExactGuess('1234')).toBe(false);
    expect(isValidExactGuess('1234a')).toBe(false);
  });

  it('secrets are 5 distinct digits and deterministic per seed (R-1.1, R-5.1.1)', () => {
    for (let i = 0; i < 100; i++) {
      const s = generateSecret(`seed-${i}`);
      expect(isValidExactGuess(s)).toBe(true);
      expect(generateSecret(`seed-${i}`)).toBe(s);
    }
  });

  it('invalid and duplicate guesses never consume attempts', () => {
    let g = createGame(EXACT_DEF, 'x1', T0);
    expect(() => submitGuess(g, EXACT_DEF, '11111', T0)).toThrow();
    expect(g.attemptsUsed).toBe(0);
    const wrong = g.exact!.secret === '01234' ? '56789' : '01234';
    g = submitGuess(g, EXACT_DEF, wrong, T0);
    expect(g.attemptsUsed).toBe(1);
    expect(() => submitGuess(g, EXACT_DEF, wrong, T0)).toThrow(/Already/);
    expect(g.attemptsUsed).toBe(1);
  });

  it('win on exact=5; loss after attemptsMax; secret revealed on loss (R-5.1.9/10)', () => {
    let g = createGame(EXACT_DEF, 'x2', T0);
    const secret = g.exact!.secret;
    const win = submitGuess(g, EXACT_DEF, secret, T0 + 1000);
    expect(win.status).toBe('WON');
    expect(win.result!.answerName).toBe(secret);

    // drive to loss with distinct wrong guesses
    let lost = createGame(EXACT_DEF, 'x3', T0);
    const pool = ['01234', '56789', '02468', '13579', '09876', '54321', '12340', '67895', '24680', '97531'];
    for (const p of pool) {
      if (lost.status !== 'ACTIVE') break;
      if (p === lost.exact!.secret) continue;
      if (lost.exact!.guesses.some((r) => r.digits === p)) continue;
      lost = submitGuess(lost, EXACT_DEF, p, T0);
    }
    expect(lost.status).toBe('LOST');
    expect(lost.result!.answerName).toBe(lost.exact!.secret);
  });
});

describe('R-4 normalization & clue guess', () => {
  it('normalizes case, whitespace, diacritics, leading "the"', () => {
    expect(normalize('  The  MATRIX ')).toBe('matrix');
    expect(normalize('Amélie')).toBe('amelie');
  });

  it('matches canonical name and aliases (R-4.2)', () => {
    expect(matchesAnswer('srk', 'Shah Rukh Khan', ['SRK'])).toBe(true);
    expect(matchesAnswer('shah rukh khan', 'Shah Rukh Khan', [])).toBe(true);
    expect(matchesAnswer('salman', 'Shah Rukh Khan', ['SRK'])).toBe(false);
  });

  it('clue flow: clue 1 free, extra clues cost, win by alias', () => {
    let g = createGame(CLUE_DEF, 'c1', T0);
    expect(playerView(g, CLUE_DEF).clue!.cluesRevealed.length).toBe(1);
    const p0 = potentialScore(g);
    g = advance(g, CLUE_DEF, T0);
    expect(potentialScore(g)).toBeLessThan(p0);
    g = submitGuess(g, CLUE_DEF, 'srk', T0 + 5000);
    expect(g.status).toBe('WON');
    expect(g.result!.score).toBeGreaterThan(0);
  });

  it('revealing all clues does not end the game (R-5.2.5)', () => {
    let g = createGame(CLUE_DEF, 'c2', T0);
    g = advance(g, CLUE_DEF, T0);
    g = advance(g, CLUE_DEF, T0);
    expect(g.status).toBe('ACTIVE');
    expect(() => advance(g, CLUE_DEF, T0)).toThrow(/No more/);
    expect(g.status).toBe('ACTIVE');
  });

  it('wrong guesses consume attempts; loss reveals answer', () => {
    let g = createGame(CLUE_DEF, 'c3', T0);
    for (let i = 0; i < 5; i++) g = submitGuess(g, CLUE_DEF, `wrong ${i}`, T0);
    expect(g.status).toBe('LOST');
    expect(g.result!.answerName).toBe('Shah Rukh Khan');
  });
});

describe('R-5.3 higher/lower', () => {
  it('narrows range and keeps the invariant curLo <= secret <= curHi', () => {
    let g = createGame(HL_DEF, 'h1', T0);
    g = submitGuess(g, HL_DEF, '8500', T0);
    expect(g.hl!.curLo).toBe(8501);
    g = submitGuess(g, HL_DEF, '8900', T0);
    expect(g.hl!.curHi).toBe(8899);
    expect(g.hl!.curLo).toBeLessThanOrEqual(8849);
    expect(g.hl!.curHi).toBeGreaterThanOrEqual(8849);
    expect(() => submitGuess(g, HL_DEF, '8000', T0)).toThrow(/between/);
    g = submitGuess(g, HL_DEF, '8849', T0);
    expect(g.status).toBe('WON');
  });
});

describe('R-5.5 multiple choice', () => {
  it('shuffles per seed deterministically and scores speed (R-6.4.1)', () => {
    const a = createGame(MC_DEF, 'm1', T0);
    const b = createGame(MC_DEF, 'm1', T0);
    expect(a.mc!.order).toEqual(b.mc!.order);
    const correctPres = a.mc!.order.indexOf(1);
    const fast = submitGuess(a, MC_DEF, String(correctPres), T0 + 1000);
    expect(fast.status).toBe('WON');
    const slow = submitGuess(b, MC_DEF, String(correctPres), T0 + 19000);
    expect(slow.status).toBe('WON');
    expect(fast.result!.score).toBeGreaterThan(slow.result!.score);
  });

  it('times out via tick (R-3.4)', () => {
    const g = createGame(MC_DEF, 'm2', T0);
    const timedOut = tick(g, MC_DEF, T0 + 60_000);
    expect(timedOut.status).toBe('LOST');
  });
});

describe('R-6 scoring invariants', () => {
  it('potential score never increases (R-6.3.4)', () => {
    let g = createGame(CLUE_DEF, 's1', T0);
    let last = potentialScore(g);
    g = advance(g, CLUE_DEF, T0);
    expect(potentialScore(g)).toBeLessThanOrEqual(last);
    last = potentialScore(g);
    g = useHint(g, CLUE_DEF, 'FIRST_LETTER');
    expect(potentialScore(g)).toBeLessThanOrEqual(last);
    last = potentialScore(g);
    g = submitGuess(g, CLUE_DEF, 'nope', T0);
    expect(potentialScore(g)).toBeLessThanOrEqual(last);
  });

  it('win score respects the floor (R-6.1.1) and hints void perfect (R-7.4)', () => {
    let g = createGame(CLUE_DEF, 's2', T0);
    g = advance(g, CLUE_DEF, T0);
    g = advance(g, CLUE_DEF, T0);
    g = useHint(g, CLUE_DEF, 'FIRST_LETTER');
    for (let i = 0; i < 4; i++) g = submitGuess(g, CLUE_DEF, `w${i}`, T0);
    g = submitGuess(g, CLUE_DEF, 'SRK', T0);
    expect(g.status).toBe('WON');
    expect(g.result!.perfect).toBe(false);
    expect(g.result!.score).toBeGreaterThanOrEqual(100);
  });

  it('first-guess and no-hint bonuses stack (R-6.2.1)', () => {
    let g = createGame(CLUE_DEF, 's3', T0);
    g = submitGuess(g, CLUE_DEF, 'Shah Rukh Khan', T0 + 2000);
    expect(g.status).toBe('WON');
    const labels = g.result!.breakdown.bonuses.map((b) => b.label);
    expect(labels).toContain('First guess');
    expect(labels).toContain('No hints');
    expect(g.result!.perfect).toBe(true);
  });

  it('hint budget enforced (R-7.1)', () => {
    let g = createGame(CLUE_DEF, 's4', T0); // MEDIUM → 2 hints
    g = useHint(g, CLUE_DEF, 'FIRST_LETTER');
    g = useHint(g, CLUE_DEF, 'FIRST_LETTER');
    expect(() => useHint(g, CLUE_DEF, 'FIRST_LETTER')).toThrow(/No hints/);
  });

  it('XP: win vs AI on HARD perfect stacks correctly (R-6.5.1)', () => {
    const award = xpForResult(
      {
        outcome: 'WON',
        answerName: 'x',
        score: 1000,
        breakdown: { base: 1000, costs: [], afterCosts: 1000, difficultyMult: 1.5, speedMult: 1, bonuses: [], final: 1000 },
        attemptsUsed: 1,
        durationMs: 1000,
        perfect: true,
      },
      { versus: true, difficulty: 'HARD' },
    );
    expect(award.total).toBe(100 + 150 + 50 + 100);
  });
});

describe('R-1.4 no answer leakage', () => {
  function leakCheck(state: GameState, def: GameDefinition, needles: string[]) {
    const json = JSON.stringify(playerView(state, def)).toLowerCase();
    for (const n of needles) {
      if (state.status === 'ACTIVE') expect(json).not.toContain(n.toLowerCase());
    }
  }

  it('clue game view never contains the answer while active', () => {
    let g = createGame(CLUE_DEF, 'l1', T0);
    const needles = ['Shah Rukh Khan', 'shahrukh', '"srk"'];
    leakCheck(g, CLUE_DEF, needles);
    g = advance(g, CLUE_DEF, T0);
    leakCheck(g, CLUE_DEF, needles);
    g = submitGuess(g, CLUE_DEF, 'wrong', T0);
    leakCheck(g, CLUE_DEF, needles);
  });

  it('exact number view never contains the secret while active', () => {
    let g = createGame(EXACT_DEF, 'l2', T0);
    const secret = g.exact!.secret;
    const wrong = secret === '01234' ? '56789' : '01234';
    g = submitGuess(g, EXACT_DEF, wrong, T0);
    const json = JSON.stringify(playerView(g, EXACT_DEF));
    expect(json).not.toContain(secret);
  });

  it('MC view never exposes the correct index while active', () => {
    const g = createGame(MC_DEF, 'l3', T0);
    const v = playerView(g, MC_DEF);
    expect(JSON.stringify(v)).not.toContain('correctIndex');
  });
});

describe('R-3 lifecycle', () => {
  it('rejects actions on finished games without mutation (R-3.1)', () => {
    let g = createGame(CLUE_DEF, 'f1', T0);
    g = submitGuess(g, CLUE_DEF, 'SRK', T0);
    expect(g.status).toBe('WON');
    expect(() => submitGuess(g, CLUE_DEF, 'again', T0)).toThrow(/over/);
    expect(() => advance(g, CLUE_DEF, T0)).toThrow(/over/);
    expect(() => useHint(g, CLUE_DEF, 'FIRST_LETTER')).toThrow(/over/);
  });

  it('determinism: same seed + same actions → identical states (R-1.1)', () => {
    const run = () => {
      let g = createGame(EXACT_DEF, 'det', T0);
      g = submitGuess(g, EXACT_DEF, g.exact!.secret === '01234' ? '56789' : '01234', T0 + 1000);
      g = useHint(g, EXACT_DEF, 'REVEAL_DIGIT');
      return JSON.stringify(g);
    };
    expect(run()).toBe(run());
  });
});

describe('R-9 AI opponent', () => {
  it('exact-number AI candidate set always contains the secret (R-9.2.2)', () => {
    for (let i = 0; i < 5; i++) {
      const seed = `ai-${i}`;
      let g = createGame(EXACT_DEF, seed, T0);
      let ai = createAiRuntime('machine', 'MEDIUM', g, T0);
      let now = T0;
      for (let turn = 0; turn < 15 && !ai.solved && g.status === 'ACTIVE'; turn++) {
        now = ai.nextActionAt;
        const r = runAi(ai, g, EXACT_DEF, now);
        ai = r.ai;
        if (r.aiSolved) {
          g = loseToAi(g, EXACT_DEF, now);
        } else if (ai.candidates) {
          expect(ai.candidates).toContain(g.exact!.secret);
        }
      }
    }
  });

  it('AI is deterministic per seed (R-9.1.2)', () => {
    const play = () => {
      const g = createGame(EXACT_DEF, 'ai-det', T0);
      let ai = createAiRuntime('calculator', 'HARD', g, T0);
      const guesses: string[] = [];
      for (let turn = 0; turn < 6 && !ai.solved; turn++) {
        const r = runAi(ai, g, EXACT_DEF, ai.nextActionAt);
        ai = r.ai;
        guesses.push(ai.log[ai.log.length - 1]?.text ?? '');
      }
      return guesses.join('|');
    };
    expect(play()).toBe(play());
  });

  it('AI never acts before its scheduled time (pacing, R-9.4.1)', () => {
    const g = createGame(EXACT_DEF, 'ai-pace', T0);
    const ai = createAiRuntime('machine', 'ROOKIE', g, T0);
    expect(ai.nextActionAt).toBeGreaterThanOrEqual(T0 + 8000);
    const r = runAi(ai, g, EXACT_DEF, T0 + 100);
    expect(r.ai.guessCount).toBe(0);
  });

  it('higher AI levels solve clue games faster on average (ordering)', () => {
    const avgCluesToSolve = (level: 'ROOKIE' | 'HARD') => {
      let total = 0;
      const runs = 60;
      for (let i = 0; i < runs; i++) {
        const g = createGame(CLUE_DEF, `ord-${level}-${i}`, T0);
        let ai = createAiRuntime('machine', level, g, T0);
        let steps = 0;
        while (!ai.solved && steps < 12) {
          const r = runAi(ai, g, CLUE_DEF, ai.nextActionAt);
          ai = r.ai;
          steps++;
        }
        total += ai.solved ? ai.cluesUsed : 10;
      }
      return total / runs;
    };
    expect(avgCluesToSolve('HARD')).toBeLessThan(avgCluesToSolve('ROOKIE'));
  });
});
