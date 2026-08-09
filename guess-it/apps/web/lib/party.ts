'use client';

/**
 * Party Mode client — shares the realtime WebSocket server.
 *   Code rounds:    setter picks a 5-digit code; shared exact/misplaced board.
 *   Mystery rounds: setter picks a person/movie/thing; clue feed + name guesses.
 * Turn timer + cross-round scoreboard come from the server.
 */
import { create } from 'zustand';
import type { DigitMark } from '@guess-it/engine';
import { track } from './analytics';
import { REALTIME_URL } from './online';

export type PartyMode = 'code' | 'mystery';

export interface PartyBoardRow {
  by: string;
  digits: string;
  perDigit: DigitMark[];
  exact: number;
  misplaced: number;
  miss: number;
}

export interface PartyEvent {
  kind: 'guess' | 'clue';
  by?: string;
  text: string;
}

export interface PartyScore {
  name: string;
  points: number;
}

export interface PartyReaction {
  id: number;
  by: string;
  emoji: string;
}

/** Mirror of the server's PARTY_REACTIONS catalog. */
export const PARTY_REACTIONS = ['😂', '🔥', '😱', '👏', '🤯', '😭'];

interface PartyState {
  phase: 'idle' | 'connecting' | 'lobby' | 'setting' | 'guessing' | 'over';
  mode: PartyMode;
  code: string | null;
  players: { name: string; isHost: boolean; isYou: boolean; isSetter: boolean }[];
  canStart: boolean;
  setterName: string;
  youAreSetter: boolean;
  /** mystery, setter only: catalog answers grouped by world */
  choices: Record<string, string[]> | null;
  board: PartyBoardRow[];
  events: PartyEvent[];
  turnName: string;
  yourTurn: boolean;
  /** server turn length; countdown restarts whenever turnNonce changes */
  turnMs: number;
  turnNonce: number;
  guesses: { name: string; left: number }[];
  scores: PartyScore[];
  over: {
    mode: PartyMode;
    winner: string | null;
    reason: string;
    secret: string | null;
    setterName: string;
    isHost: boolean;
  } | null;
  notice: string | null;
  reactions: PartyReaction[];
  error: string | null;
  errorNonce: number;

  createParty: (name: string, mode: PartyMode) => void;
  react: (emoji: string) => void;
  joinParty: (name: string, code: string) => void;
  start: () => void;
  setCode: (code: string) => void;
  guess: (payload: string) => void;
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
          set({
            phase: 'lobby',
            code: m.code,
            mode: m.mode,
            players: m.players,
            canStart: m.canStart,
            scores: m.scores ?? [],
            over: null,
            board: [],
            events: [],
          });
          break;
        case 'party_setting':
          set({
            phase: 'setting',
            mode: m.mode,
            setterName: m.setterName,
            youAreSetter: m.youAreSetter,
            choices: m.choices ?? null,
            board: [],
            events: [],
            over: null,
            notice: null,
          });
          if (m.youAreSetter) track('party_setting', { mode: m.mode });
          break;
        case 'party_state':
          set({
            phase: 'guessing',
            mode: m.mode,
            board: m.board,
            events: m.events ?? [],
            setterName: m.setterName,
            turnName: m.turnName,
            yourTurn: m.yourTurn,
            youAreSetter: m.youAreSetter,
            turnMs: m.turnMs ?? 45000,
            turnNonce: get().turnNonce + 1,
            guesses: m.guesses,
            scores: m.scores ?? [],
            notice: m.notice ?? null,
          });
          break;
        case 'party_over':
          track('party_over', { mode: m.mode, reason: m.reason });
          set({
            phase: 'over',
            mode: m.mode,
            board: m.board,
            events: m.events ?? [],
            scores: m.scores ?? [],
            over: {
              mode: m.mode,
              winner: m.winner,
              reason: m.reason,
              secret: m.secret,
              setterName: m.setterName,
              isHost: m.isHost,
            },
          });
          break;
        case 'party_left':
          set({ notice: `${m.name} left the party.` });
          break;
        case 'party_reaction':
          set((s) => ({
            reactions: [...s.reactions, { id: (s.reactions.at(-1)?.id ?? 0) + 1, by: m.by, emoji: m.emoji }].slice(-6),
          }));
          break;
        case 'error':
          fail(m.message);
          break;
      }
    };
  };

  return {
    phase: 'idle',
    mode: 'code',
    code: null,
    players: [],
    canStart: false,
    setterName: '',
    youAreSetter: false,
    choices: null,
    board: [],
    events: [],
    turnName: '',
    yourTurn: false,
    turnMs: 45000,
    turnNonce: 0,
    guesses: [],
    scores: [],
    over: null,
    notice: null,
    reactions: [],
    error: null,
    errorNonce: 0,

    createParty: (name, mode) => connect(() => send({ type: 'party_create', name, mode })),
    react: (emoji) => send({ type: 'party_react', emoji }),
    joinParty: (name, code) => connect(() => send({ type: 'party_join', name, code })),
    start: () => send({ type: 'party_start' }),
    setCode: (code) => send({ type: 'party_setcode', code }),
    guess: (payload) => send({ type: 'party_guess', digits: payload }),
    rematch: () => send({ type: 'party_rematch' }),
    leave: () => {
      send({ type: 'leave' });
      socket?.close();
      socket = null;
      set({
        phase: 'idle',
        code: null,
        players: [],
        board: [],
        events: [],
        scores: [],
        choices: null,
        over: null,
        notice: null,
        reactions: [],
        error: null,
      });
    },
  };
});
