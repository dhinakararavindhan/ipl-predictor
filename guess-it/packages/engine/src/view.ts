/**
 * PlayerView projection — the client-safe state (Engine Spec R-1.4).
 * While a game is ACTIVE the view must contain no answer-bearing data:
 * no secret, no answer name/aliases, no correct option index.
 */
import type { GameDefinition, GameState } from './types';
import { potentialScore } from './game';

export interface PlayerView {
  defId: string;
  mechanic: GameState['mechanic'];
  world: string;
  difficulty: GameState['difficulty'];
  status: GameState['status'];
  attemptsUsed: number;
  attemptsMax: number;
  hintsRemaining: number;
  potentialScore: number;
  exact?: {
    guesses: NonNullable<GameState['exact']>['guesses'];
    revealedPositions: NonNullable<GameState['exact']>['revealedPositions'];
  };
  clue?: { cluesRevealed: string[]; cluesTotal: number; wrongGuesses: string[]; firstLetter?: string };
  hl?: { curLo: number; curHi: number; unit?: string; prompt: string; history: NonNullable<GameState['hl']>['history'] };
  mc?: { question: string; options: string[]; eliminated: number[]; timeLimitMs: number };
  image?: { level: number; wrongGuesses: string[]; firstLetter?: string };
  result?: GameState['result'];
}

export function playerView(state: GameState, def: GameDefinition): PlayerView {
  const v: PlayerView = {
    defId: state.defId,
    mechanic: state.mechanic,
    world: state.world,
    difficulty: state.difficulty,
    status: state.status,
    attemptsUsed: state.attemptsUsed,
    attemptsMax: state.attemptsMax,
    hintsRemaining: state.hintsRemaining,
    potentialScore: potentialScore(state),
    result: state.result,
  };
  switch (state.mechanic) {
    case 'EXACT_NUMBER':
      v.exact = {
        guesses: state.exact!.guesses,
        revealedPositions: state.exact!.revealedPositions,
      };
      break;
    case 'CLUE_GUESS':
      v.clue = {
        cluesRevealed: def.clue!.clues.slice(0, state.clueState!.cluesRevealed).map((c) => c.text),
        cluesTotal: def.clue!.clues.length,
        wrongGuesses: state.clueState!.wrongGuesses,
        firstLetter: state.clueState!.firstLetter,
      };
      break;
    case 'HIGHER_LOWER':
      v.hl = {
        curLo: state.hl!.curLo,
        curHi: state.hl!.curHi,
        unit: def.higherLower!.unit,
        prompt: def.higherLower!.prompt,
        history: state.hl!.history,
      };
      break;
    case 'MULTIPLE_CHOICE':
      v.mc = {
        question: def.multipleChoice!.question,
        options: state.mc!.order.map((i) => def.multipleChoice!.options[i]),
        eliminated: state.mc!.eliminated,
        timeLimitMs: state.mc!.timeLimitMs,
      };
      break;
    case 'IMAGE_REVEAL':
      v.image = {
        level: state.image!.level,
        wrongGuesses: state.image!.wrongGuesses,
        firstLetter: state.image!.firstLetter,
      };
      break;
  }
  return v;
}
