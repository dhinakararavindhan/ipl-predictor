'use client';

/**
 * Live race client — WebSocket connection to services/realtime.
 * Configure the server with NEXT_PUBLIC_REALTIME_URL (e.g. wss://host/ws).
 */
import { create } from 'zustand';
import type { Difficulty, Mechanic, PlayerView } from '@guess-it/engine';
import { track } from './analytics';

export const REALTIME_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ??
  (process.env.NODE_ENV === 'development' ? 'ws://localhost:8787/ws' : '');

export interface RaceConfig {
  world: string;
  mechanic: Mechanic;
  difficulty: Difficulty;
}

export interface OpponentProgress {
  attemptsUsed: number;
  cluesRevealed?: number;
  lastExactCount?: number;
  finished: boolean;
}

export interface GameOver {
  outcome: 'WIN' | 'LOSS' | 'DRAW' | 'WALKOVER';
  view: PlayerView;
  you: { name: string; score: number; attemptsUsed: number };
  opponent: { name: string; score: number; attemptsUsed: number; finished: boolean };
}

interface OnlineState {
  phase: 'idle' | 'connecting' | 'lobby' | 'racing' | 'over';
  code: string | null;
  players: { name: string; isHost: boolean; isYou: boolean }[];
  canStart: boolean;
  config: RaceConfig | null;
  opponentName: string | null;
  view: PlayerView | null;
  opponent: OpponentProgress | null;
  gameOver: GameOver | null;
  rematchOffer: string | null;
  error: string | null;
  errorNonce: number;

  createRoom: (name: string, config: RaceConfig) => void;
  joinRoom: (name: string, code: string) => void;
  start: () => void;
  sendAction: (action: 'guess' | 'advance' | 'hint', payload?: string) => void;
  rematch: () => void;
  leave: () => void;
}

let socket: WebSocket | null = null;

export const useOnline = create<OnlineState>((set, get) => {
  const fail = (message: string) => set({ error: message, errorNonce: get().errorNonce + 1 });

  const send = (msg: unknown) => {
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
  };

  const connect = (onOpen: () => void) => {
    if (!REALTIME_URL) {
      fail('Live races need the realtime server. See guess-it/DISTRIBUTION.md to deploy it.');
      return;
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      onOpen();
      return;
    }
    set({ phase: 'connecting', error: null });
    socket = new WebSocket(REALTIME_URL);
    socket.onopen = onOpen;
    socket.onerror = () => {
      fail('Could not reach the race server.');
      set({ phase: 'idle' });
    };
    socket.onclose = () => {
      const p = get().phase;
      if (p === 'racing' || p === 'lobby') {
        fail('Connection lost.');
        set({ phase: 'idle', view: null, opponent: null });
      }
    };
    socket.onmessage = (ev) => {
      const m = JSON.parse(ev.data as string);
      switch (m.type) {
        case 'lobby':
          set({
            phase: 'lobby',
            code: m.code,
            players: m.players,
            canStart: m.canStart,
            config: m.config,
            gameOver: null,
            rematchOffer: null,
          });
          break;
        case 'game_start':
          track('race_started', { mechanic: m.view.mechanic, world: m.view.world, difficulty: m.view.difficulty });
          set({
            phase: 'racing',
            view: m.view,
            opponentName: m.opponentName,
            opponent: { attemptsUsed: 0, finished: false },
            gameOver: null,
            rematchOffer: null,
          });
          break;
        case 'view':
          set({ view: m.view });
          break;
        case 'opponent':
          set({ opponent: m.progress });
          break;
        case 'game_over':
          track('race_finished', { outcome: m.outcome, mechanic: m.view.mechanic });
          set({ phase: 'over', gameOver: m, view: m.view });
          break;
        case 'opponent_left':
          fail('Your opponent left the room.');
          break;
        case 'rematch_offer':
          set({ rematchOffer: m.from });
          break;
        case 'error':
          fail(m.message);
          break;
      }
    };
  };

  return {
    phase: 'idle',
    code: null,
    players: [],
    canStart: false,
    config: null,
    opponentName: null,
    view: null,
    opponent: null,
    gameOver: null,
    rematchOffer: null,
    error: null,
    errorNonce: 0,

    createRoom: (name, config) => connect(() => send({ type: 'create', name, config })),
    joinRoom: (name, code) => connect(() => send({ type: 'join', name, code })),
    start: () => send({ type: 'start' }),
    sendAction: (action, payload) => send({ type: 'action', action, payload }),
    rematch: () => send({ type: 'rematch' }),
    leave: () => {
      send({ type: 'leave' });
      socket?.close();
      socket = null;
      set({ phase: 'idle', code: null, players: [], view: null, opponent: null, gameOver: null, error: null });
    },
  };
});
