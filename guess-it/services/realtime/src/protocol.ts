/**
 * Wire protocol for live friend races (implements API Spec §9 in spirit,
 * adapted to the room-based no-database realtime server).
 * All messages are JSON over a single WebSocket.
 */
import type { Difficulty, Mechanic } from '@guess-it/engine';
import type { PlayerView } from '@guess-it/engine';

export interface RaceConfig {
  world: string;
  mechanic: Mechanic;
  difficulty: Difficulty;
}

// ---- client → server ----
export type ClientMsg =
  | { type: 'create'; name: string; config: RaceConfig; token?: string }
  | { type: 'join'; code: string; name: string; token?: string }
  | { type: 'quickmatch'; name: string; token?: string }
  | { type: 'start' } // host only, requires 2 players
  | { type: 'action'; action: 'guess' | 'advance' | 'hint'; payload?: string }
  | { type: 'rematch' }
  | { type: 'leave' }
  // Party Mode — Code Setter (one human sets the code, the room guesses)
  | { type: 'party_create'; name: string }
  | { type: 'party_join'; code: string; name: string }
  | { type: 'party_start' }
  | { type: 'party_setcode'; code: string }
  | { type: 'party_guess'; digits: string }
  | { type: 'party_rematch' };

// ---- server → client ----
export interface LobbyPlayer {
  name: string;
  isHost: boolean;
  isYou: boolean;
}

export interface OpponentProgress {
  attemptsUsed: number;
  cluesRevealed?: number;
  lastExactCount?: number; // EXACT_NUMBER: exact digits in their last guess
  finished: boolean;
}

export type ServerMsg =
  | { type: 'searching' }
  | { type: 'lobby'; code: string; players: LobbyPlayer[]; config: RaceConfig; canStart: boolean }
  | { type: 'game_start'; view: PlayerView; opponentName: string }
  | { type: 'view'; view: PlayerView } // your own state after your action
  | { type: 'opponent'; progress: OpponentProgress }
  | {
      type: 'game_over';
      outcome: 'WIN' | 'LOSS' | 'DRAW' | 'WALKOVER';
      view: PlayerView; // terminal — includes the answer via result
      you: { name: string; score: number; attemptsUsed: number; rating?: number; ratingDelta?: number };
      opponent: { name: string; score: number; attemptsUsed: number; finished: boolean; rating?: number };
    }
  | { type: 'opponent_left' }
  | { type: 'rematch_offer'; from: string }
  // Party Mode
  | {
      type: 'party_lobby';
      code: string;
      canStart: boolean;
      players: { name: string; isHost: boolean; isYou: boolean; isSetter: boolean }[];
    }
  | { type: 'party_setting'; setterName: string; youAreSetter: boolean }
  | {
      type: 'party_state';
      board: { by: string; digits: string; perDigit: ('EXACT' | 'MISPLACED' | 'MISS')[]; exact: number; misplaced: number; miss: number }[];
      setterName: string;
      turnName: string;
      yourTurn: boolean;
      youAreSetter: boolean;
      guesses: { name: string; left: number }[];
    }
  | {
      type: 'party_over';
      winner: string | null;
      reason: 'cracked' | 'exhausted' | 'setter_left' | 'not_enough_players';
      secret: string | null;
      setterName: string;
      board: { by: string; digits: string; perDigit: ('EXACT' | 'MISPLACED' | 'MISS')[]; exact: number; misplaced: number; miss: number }[];
      isHost: boolean;
    }
  | { type: 'party_left'; name: string }
  | { type: 'error'; code: string; message: string };
