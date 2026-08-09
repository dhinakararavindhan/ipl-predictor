/** Shared engine types — mirrors Game Engine Spec §2, §10 and API Spec §4. */

export type Mechanic =
  | 'EXACT_NUMBER'
  | 'CLUE_GUESS'
  | 'HIGHER_LOWER'
  | 'IMAGE_REVEAL'
  | 'MULTIPLE_CHOICE';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Status = 'ACTIVE' | 'WON' | 'LOST' | 'FORFEITED';
export type Outcome = 'WON' | 'LOST' | 'FORFEITED';
export type DigitMark = 'EXACT' | 'MISPLACED' | 'MISS';
export type HintType = 'REVEAL_DIGIT' | 'FIRST_LETTER' | 'SHRINK_RANGE' | 'FIFTY_FIFTY';

export type AiLevel = 'ROOKIE' | 'EASY' | 'MEDIUM' | 'HARD';
export type AiCharacterId = 'detective' | 'calculator' | 'machine' | 'professor' | 'trickster';

export interface AnswerSpec {
  name: string;
  aliases: string[];
  entityId?: string;
  /** Shown on the result screen only. */
  emoji?: string;
  attribution?: string;
}

export interface ClueContent {
  clues: { text: string; identifiability: number }[];
}
export interface HigherLowerContent {
  secret: number;
  lo: number;
  hi: number;
  unit?: string;
  prompt: string;
}
export interface MultipleChoiceContent {
  question: string;
  options: string[];
  correctIndex: number;
}
export interface ImageRevealContent {
  imageUrl: string;
}

export interface GameDefinition {
  id: string;
  mechanic: Mechanic;
  world: string;
  difficulty: Difficulty;
  answer?: AnswerSpec; // absent for generated EXACT_NUMBER
  clue?: ClueContent;
  higherLower?: HigherLowerContent;
  multipleChoice?: MultipleChoiceContent;
  imageReveal?: ImageRevealContent;
}

export interface ExactGuessRow {
  digits: string;
  perDigit: DigitMark[];
  exact: number;
  misplaced: number;
  miss: number;
}

export interface ScoreBreakdown {
  base: number;
  costs: { label: string; amount: number }[];
  afterCosts: number;
  difficultyMult: number;
  speedMult: number;
  bonuses: { label: string; amount: number }[];
  final: number;
}

export interface GameResult {
  outcome: Outcome;
  answerName: string;
  answerEmoji?: string;
  score: number;
  breakdown: ScoreBreakdown;
  attemptsUsed: number;
  durationMs: number;
  perfect: boolean;
  /** Set when the AI beat the player to the answer. */
  beatenByAi?: boolean;
}

export interface AiEvent {
  at: number;
  type: 'AI_GUESSED' | 'AI_ADVANCED' | 'AI_SOLVED' | 'DIALOGUE';
  line?: string;
  /** For EXACT_NUMBER: exact count of the AI's guess (never the digits mid-game). */
  exact?: number;
}

export interface AiRuntime {
  character: AiCharacterId;
  level: AiLevel;
  nextActionAt: number;
  /** EXACT_NUMBER: remaining consistent candidates (AI-private). */
  candidates?: string[];
  guessCount: number;
  cluesUsed: number;
  solved: boolean;
  solvedAt?: number;
  events: AiEvent[];
  /** AI's own guess log, revealed post-game ("how it solved it"). */
  log: { at: number; text: string }[];
  wrongGuessMade: boolean;
}

export interface GameState {
  defId: string;
  mechanic: Mechanic;
  world: string;
  difficulty: Difficulty;
  seed: string;
  status: Status;
  startedAt: number;
  endedAt?: number;
  attemptsUsed: number;
  attemptsMax: number;
  hintsRemaining: number;
  hintsUsed: HintType[];
  /** Accumulated progress + hint costs (Engine §6.3). */
  costs: { label: string; amount: number }[];
  firstGuessCorrect: boolean;

  // Mechanic state (exactly one populated)
  exact?: {
    secret: string; // engine-private; stripped from PlayerView while ACTIVE
    guesses: ExactGuessRow[];
    revealedPositions: { index: number; digit: string }[];
  };
  clueState?: { cluesRevealed: number; wrongGuesses: string[]; firstLetter?: string };
  hl?: {
    curLo: number;
    curHi: number;
    history: { guess: number; verdict: 'TOO_LOW' | 'TOO_HIGH' }[];
  };
  mc?: {
    order: number[]; // seed-shuffled presentation order (indices into options)
    eliminated: number[]; // presentation indices removed by 50/50
    timeLimitMs: number;
  };
  image?: { level: number; wrongGuesses: string[]; firstLetter?: string };

  vs?: AiRuntime;
  result?: GameResult;
}

export type EngineErrorCode =
  | 'GAME_NOT_ACTIVE'
  | 'INVALID_GUESS_FORMAT'
  | 'DUPLICATE_GUESS'
  | 'OUT_OF_RANGE'
  | 'NO_HINTS_LEFT'
  | 'HINT_NOT_APPLICABLE'
  | 'NOTHING_TO_ADVANCE';

export class EngineError extends Error {
  code: EngineErrorCode;
  constructor(code: EngineErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
