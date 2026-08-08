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
  | { type: 'create'; name: string; config: RaceConfig }
  | { type: 'join'; code: string; name: string }
  | { type: 'start' } // host only, requires 2 players
  | { type: 'action'; action: 'guess' | 'advance' | 'hint'; payload?: string }
  | { type: 'rematch' }
  | { type: 'leave' };

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
  | { type: 'lobby'; code: string; players: LobbyPlayer[]; config: RaceConfig; canStart: boolean }
  | { type: 'game_start'; view: PlayerView; opponentName: string }
  | { type: 'view'; view: PlayerView } // your own state after your action
  | { type: 'opponent'; progress: OpponentProgress }
  | {
      type: 'game_over';
      outcome: 'WIN' | 'LOSS' | 'DRAW' | 'WALKOVER';
      view: PlayerView; // terminal — includes the answer via result
      you: { name: string; score: number; attemptsUsed: number };
      opponent: { name: string; score: number; attemptsUsed: number; finished: boolean };
    }
  | { type: 'opponent_left' }
  | { type: 'rematch_offer'; from: string }
  | { type: 'error'; code: string; message: string };
