'use client';

/** Party Mode (Code Setter) client — shares the realtime WebSocket server. */
import { create } from 'zustand';
import type { DigitMark } from '@guess-it/engine';
import { track } from './analytics';
import { REALTIME_URL } from './online';

export interface PartyBoardRow {
  by: string;
  digits: string;
  perDigit: DigitMark[];
  exact: number;
  misplaced: number;
  miss: number;
}

interface PartyState {
  phase: 'idle' | 'connecting' | 'lobby' | 'setting' | 'guessing' | 'over';
  code: string | null;
  players: { name: string; isHost: boolean; isYou: boolean; isSetter: boolean }[];
  canStart: boolean;
  setterName: string;
  youAreSetter: boolean;
  board: PartyBoardRow[];
  turnName: string;
  yourTurn: boolean;
  guesses: { name: string; left: number }[];
  over: { winner: string | null; reason: string; secret: string | null; setterName: string; isHost: boolean } | null;
  notice: string | null;
  error: string | null;
  errorNonce: number;

  createParty: (name: string) => void;
  joinParty: (name: string, code: string) => void;
  start: () => void;
  setCode: (code: string) => void;
  guess: (digits: string) => void;
  rematch: () => void;
  leave: () => void;
}

let socket: WebSocket | null = null;

export const useParty = create<PartyState>((set, get) => {
  const fail = (message: string) => set({ error: message, errorNonce: get().errorNonce + 1 });

  const send = (msg: unknown) => {
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
  };

  const connect = (onOpen: () => void) => {
    if (!REALTIME_URL) {
      fail('Party mode needs the game server. See guess-it/DISTRIBUTION.md.');
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
      fail('Could not reach the game server.');
      set({ phase: 'idle' });
    };
    socket.onclose = () => {
      if (get().phase !== 'idle') {
        fail('Connection lost.');
        set({ phase: 'idle' });
      }
    };
    socket.onmessage = (ev) => {
      const m = JSON.parse(ev.data as string);
      switch (m.type) {
        case 'party_lobby':
          set({ phase: 'lobby', code: m.code, players: m.players, canStart: m.canStart, over: null, board: [] });
          break;
        case 'party_setting':
          set({ phase: 'setting', setterName: m.setterName, youAreSetter: m.youAreSetter, board: [], over: null, notice: null });
          if (m.youAreSetter) track('party_setting', {});
          break;
        case 'party_state':
          set({
            phase: 'guessing',
            board: m.board,
            setterName: m.setterName,
            turnName: m.turnName,
            yourTurn: m.yourTurn,
            youAreSetter: m.youAreSetter,
            guesses: m.guesses,
          });
          break;
        case 'party_over':
          track('party_over', { reason: m.reason });
          set({
            phase: 'over',
            board: m.board,
            over: { winner: m.winner, reason: m.reason, secret: m.secret, setterName: m.setterName, isHost: m.isHost },
          });
          break;
        case 'party_left':
          set({ notice: `${m.name} left the party.` });
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
    setterName: '',
    youAreSetter: false,
    board: [],
    turnName: '',
    yourTurn: false,
    guesses: [],
    over: null,
    notice: null,
    error: null,
    errorNonce: 0,

    createParty: (name) => connect(() => send({ type: 'party_create', name })),
    joinParty: (name, code) => connect(() => send({ type: 'party_join', name, code })),
    start: () => send({ type: 'party_start' }),
    setCode: (code) => send({ type: 'party_setcode', code }),
    guess: (digits) => send({ type: 'party_guess', digits }),
    rematch: () => send({ type: 'party_rematch' }),
    leave: () => {
      send({ type: 'leave' });
      socket?.close();
      socket = null;
      set({ phase: 'idle', code: null, players: [], board: [], over: null, notice: null, error: null });
    },
  };
});
