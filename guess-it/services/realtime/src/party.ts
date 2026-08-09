/**
 * Party Mode — one human vs the room, server-refereed, 2–8 players.
 *
 *   CODE rounds    — the Setter picks a secret 5-digit code; guessers take
 *                    turns on a shared exact/misplaced board.
 *   MYSTERY rounds — the Setter picks a secret person/movie/thing from the
 *                    catalog; guessers take turns naming it; every 3 wrong
 *                    guesses auto-reveals the next clue.
 *
 * Turn timer: TURN_MS to act, or that guess is forfeited and play moves on.
 * Scoreboard across rounds: crack it +3 · Setter survives everyone +2.
 * Rematches rotate the Setter.
 */
import { evaluateExact, isValidExactGuess, matchesAnswer, type ExactGuessRow } from '@guess-it/engine';
import { DEFINITIONS } from '@guess-it/content';
import type { ServerMsg } from './protocol';

export const GUESSES_PER_PLAYER = 8;
export const TURN_MS = 45_000;
export const CLUES_EVERY = 3; // mystery: reveal next clue every N wrong guesses
const POINTS_CRACK = 3;
const POINTS_SETTER_HOLD = 2;
const MAX_PLAYERS = 8;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

export type PartyMode = 'code' | 'mystery';

export interface PartyPlayer {
  id: string;
  name: string;
  send: (msg: ServerMsg) => void;
  guessesLeft: number;
  lastReactAt?: number;
}

/** The only emoji the server will relay — anything else is dropped. */
export const PARTY_REACTIONS = ['😂', '🔥', '😱', '👏', '🤯', '😭'];
const REACT_COOLDOWN_MS = 1000;

export interface BoardRow extends ExactGuessRow {
  by: string;
}

/** Mystery-mode board: wrong name guesses + auto-revealed clues, in order. */
export interface MysteryEvent {
  kind: 'guess' | 'clue';
  by?: string;
  text: string;
}

interface MysteryState {
  defId: string;
  answerName: string;
  aliases: string[];
  clues: string[];
  cluesRevealed: number;
  wrongCount: number;
  events: MysteryEvent[];
}

export interface PartyRoom {
  code: string;
  hostId: string;
  mode: PartyMode;
  phase: 'lobby' | 'setting' | 'guessing' | 'over';
  players: PartyPlayer[];
  setterIdx: number;
  secret: string | null; // code mode
  mystery: MysteryState | null; // mystery mode
  board: BoardRow[];
  turnIdx: number;
  scores: Record<string, number>; // by player name (stable across rematch)
  turnTimer: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

/** Mystery choices: catalog entities that have clue definitions, by world. */
export function mysteryChoices(): Record<string, string[]> {
  const byWorld: Record<string, string[]> = {};
  for (const d of DEFINITIONS) {
    if (d.mechanic !== 'CLUE_GUESS' || !d.answer) continue;
    (byWorld[d.world] ??= []).push(d.answer.name);
  }
  for (const w of Object.keys(byWorld)) byWorld[w] = [...new Set(byWorld[w])].sort();
  return byWorld;
}

function mysteryDefFor(name: string): MysteryState | null {
  const d = DEFINITIONS.find(
    (x) => x.mechanic === 'CLUE_GUESS' && x.answer && x.answer.name === name,
  );
  if (!d) return null;
  return {
    defId: d.id,
    answerName: d.answer!.name,
    aliases: d.answer!.aliases,
    clues: d.clue!.clues.map((c) => c.text),
    cluesRevealed: 1,
    wrongCount: 0,
    events: [{ kind: 'clue', text: d.clue!.clues[0].text }],
  };
}

export class PartyManager {
  private rooms = new Map<string, PartyRoom>();
  private byPlayer = new Map<string, PartyRoom>();
  private random: () => number;
  /** Injectable for tests; production uses the real timer. */
  private turnMs: number;

  constructor(random: () => number = Math.random, turnMs: number = TURN_MS) {
    this.random = random;
    this.turnMs = turnMs;
  }

  private newCode(): string {
    let code = '';
    do {
      code = Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)]).join('');
    } while (this.rooms.has(code));
    return code;
  }

  create(player: PartyPlayer, mode: PartyMode = 'code'): PartyRoom {
    this.leave(player.id);
    const room: PartyRoom = {
      code: this.newCode(),
      hostId: player.id,
      mode: mode === 'mystery' ? 'mystery' : 'code',
      phase: 'lobby',
      players: [player],
      setterIdx: 0,
      secret: null,
      mystery: null,
      board: [],
      turnIdx: 1,
      scores: { [player.name]: 0 },
      turnTimer: null,
      createdAt: Date.now(),
    };
    this.rooms.set(room.code, room);
    this.byPlayer.set(player.id, room);
    this.lobby(room);
    return room;
  }

  join(player: PartyPlayer, code: string): void {
    this.leave(player.id);
    const room = this.rooms.get(code.trim().toUpperCase());
    if (!room) {
      player.send({ type: 'error', code: 'NOT_FOUND', message: 'No party with that code.' });
      return;
    }
    if (room.phase !== 'lobby' || room.players.length >= MAX_PLAYERS) {
      player.send({ type: 'error', code: 'FULL', message: 'That party is full or already playing.' });
      return;
    }
    if (room.players.some((p) => p.name === player.name)) {
      player.name = `${player.name} ${room.players.length + 1}`.slice(0, 14);
    }
    room.players.push(player);
    room.scores[player.name] ??= 0;
    this.byPlayer.set(player.id, room);
    this.lobby(room);
  }

  start(playerId: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room || room.phase !== 'lobby') return;
    if (room.hostId !== playerId) {
      this.playerOf(room, playerId)?.send({ type: 'error', code: 'NOT_HOST', message: 'Only the host can start.' });
      return;
    }
    if (room.players.length < 2) {
      this.playerOf(room, playerId)?.send({ type: 'error', code: 'NEED_PLAYERS', message: 'You need at least one guesser.' });
      return;
    }
    this.beginSetting(room);
  }

  private beginSetting(room: PartyRoom): void {
    this.clearTimer(room);
    room.phase = 'setting';
    room.secret = null;
    room.mystery = null;
    room.board = [];
    for (const p of room.players) p.guessesLeft = GUESSES_PER_PLAYER;
    const setter = room.players[room.setterIdx];
    for (const p of room.players) {
      p.send({
        type: 'party_setting',
        mode: room.mode,
        setterName: setter.name,
        youAreSetter: p.id === setter.id,
        choices: room.mode === 'mystery' && p.id === setter.id ? mysteryChoices() : undefined,
      });
    }
  }

  setCode(playerId: string, code: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room || room.phase !== 'setting') return;
    const setter = room.players[room.setterIdx];
    if (setter.id !== playerId) {
      this.playerOf(room, playerId)?.send({ type: 'error', code: 'NOT_SETTER', message: 'Only the setter picks the secret.' });
      return;
    }
    if (room.mode === 'code') {
      if (!isValidExactGuess(code)) {
        setter.send({ type: 'error', code: 'INVALID_GUESS_FORMAT', message: 'Pick 5 different digits.' });
        return;
      }
      room.secret = code;
    } else {
      const mystery = mysteryDefFor(code);
      if (!mystery) {
        setter.send({ type: 'error', code: 'INVALID_CHOICE', message: 'Pick a mystery from the list.' });
        return;
      }
      room.mystery = mystery;
    }
    room.phase = 'guessing';
    room.turnIdx = this.nextGuesser(room, room.setterIdx);
    this.broadcastState(room);
    this.armTimer(room);
  }

  guess(playerId: string, payload: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room || room.phase !== 'guessing') return;
    const player = this.playerOf(room, playerId);
    if (!player) return;
    if (room.players[room.turnIdx]?.id !== playerId) {
      player.send({ type: 'error', code: 'NOT_YOUR_TURN', message: 'Wait for your turn.' });
      return;
    }

    if (room.mode === 'code') {
      if (!room.secret) return;
      if (!isValidExactGuess(payload)) {
        player.send({ type: 'error', code: 'INVALID_GUESS_FORMAT', message: 'Enter 5 different digits.' });
        return;
      }
      if (room.board.some((r) => r.digits === payload)) {
        player.send({ type: 'error', code: 'DUPLICATE_GUESS', message: 'That code was already tried — check the board!' });
        return;
      }
      const row = evaluateExact(room.secret, payload);
      room.board.push({ ...row, by: player.name });
      player.guessesLeft--;
      if (row.exact === 5) {
        this.finish(room, player.name, 'cracked');
        return;
      }
    } else {
      const m = room.mystery;
      if (!m) return;
      const text = payload.trim().slice(0, 40);
      if (!text) {
        player.send({ type: 'error', code: 'INVALID_GUESS_FORMAT', message: 'Type a guess first.' });
        return;
      }
      if (matchesAnswer(text, m.answerName, m.aliases)) {
        player.guessesLeft--;
        this.finish(room, player.name, 'cracked');
        return;
      }
      player.guessesLeft--;
      m.wrongCount++;
      m.events.push({ kind: 'guess', by: player.name, text });
      if (m.wrongCount % CLUES_EVERY === 0 && m.cluesRevealed < m.clues.length) {
        m.events.push({ kind: 'clue', text: m.clues[m.cluesRevealed] });
        m.cluesRevealed++;
      }
    }

    if (this.allExhausted(room)) {
      this.finish(room, null, 'exhausted');
      return;
    }
    room.turnIdx = this.nextGuesser(room, room.turnIdx);
    this.broadcastState(room);
    this.armTimer(room);
  }

  /** Turn timer expiry: the sleeping guesser forfeits one guess. */
  private timeoutTurn(room: PartyRoom): void {
    if (room.phase !== 'guessing') return;
    const sleeper = room.players[room.turnIdx];
    if (!sleeper) return;
    sleeper.guessesLeft--;
    if (this.allExhausted(room)) {
      this.finish(room, null, 'exhausted');
      return;
    }
    room.turnIdx = this.nextGuesser(room, room.turnIdx);
    this.broadcastState(room, `${sleeper.name} snoozed — guess forfeited!`);
    this.armTimer(room);
  }

  private armTimer(room: PartyRoom): void {
    this.clearTimer(room);
    room.turnTimer = setTimeout(() => this.timeoutTurn(room), this.turnMs);
    room.turnTimer.unref?.();
  }

  private clearTimer(room: PartyRoom): void {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  private allExhausted(room: PartyRoom): boolean {
    return room.players.every((p, i) => i === room.setterIdx || p.guessesLeft <= 0);
  }

  /** Relay a quick emoji reaction to the whole room (1/sec per player). */
  react(playerId: string, emoji: string, now = Date.now()): void {
    const room = this.byPlayer.get(playerId);
    if (!room) return;
    const player = this.playerOf(room, playerId);
    if (!player || !PARTY_REACTIONS.includes(emoji)) return;
    if (now - (player.lastReactAt ?? 0) < REACT_COOLDOWN_MS) return;
    player.lastReactAt = now;
    for (const p of room.players) p.send({ type: 'party_reaction', by: player.name, emoji });
  }

  rematch(playerId: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room || room.phase !== 'over') return;
    if (room.hostId !== playerId) {
      this.playerOf(room, playerId)?.send({ type: 'error', code: 'NOT_HOST', message: 'Only the host can start the next round.' });
      return;
    }
    if (room.players.length < 2) return;
    room.setterIdx = (room.setterIdx + 1) % room.players.length;
    this.beginSetting(room);
  }

  leave(playerId: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room) return;
    this.byPlayer.delete(playerId);
    const leaver = this.playerOf(room, playerId);
    const wasSetter = room.players[room.setterIdx]?.id === playerId;
    const leaverIdx = room.players.findIndex((p) => p.id === playerId);
    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      this.clearTimer(room);
      this.rooms.delete(room.code);
      return;
    }
    if (leaver) for (const p of room.players) p.send({ type: 'party_left', name: leaver.name });

    if (leaverIdx !== -1) {
      if (leaverIdx < room.setterIdx) room.setterIdx--;
      if (leaverIdx < room.turnIdx) room.turnIdx--;
      room.setterIdx %= room.players.length;
      room.turnIdx %= room.players.length;
    }
    if (room.hostId === playerId) room.hostId = room.players[0].id;

    if (room.phase === 'lobby') {
      this.lobby(room);
      return;
    }
    if (wasSetter && room.phase !== 'over') {
      this.finish(room, null, 'setter_left');
      return;
    }
    if (room.players.length < 2 && room.phase !== 'over') {
      this.finish(room, null, 'not_enough_players');
      return;
    }
    if (room.phase === 'guessing') {
      if (room.players[room.turnIdx]?.id === room.players[room.setterIdx]?.id) {
        room.turnIdx = this.nextGuesser(room, room.turnIdx);
      }
      this.broadcastState(room);
      this.armTimer(room);
    }
  }

  private finish(room: PartyRoom, winner: string | null, reason: 'cracked' | 'exhausted' | 'setter_left' | 'not_enough_players'): void {
    this.clearTimer(room);
    room.phase = 'over';
    const setter = room.players[room.setterIdx];
    if (reason === 'cracked' && winner) {
      room.scores[winner] = (room.scores[winner] ?? 0) + POINTS_CRACK;
    } else if (reason === 'exhausted' && setter) {
      room.scores[setter.name] = (room.scores[setter.name] ?? 0) + POINTS_SETTER_HOLD;
    }
    const answer =
      reason === 'setter_left'
        ? null
        : room.mode === 'code'
          ? room.secret
          : (room.mystery?.answerName ?? null);
    for (const p of room.players) {
      p.send({
        type: 'party_over',
        mode: room.mode,
        winner,
        reason,
        secret: answer,
        setterName: setter?.name ?? 'Setter',
        board: room.board,
        events: room.mystery?.events ?? [],
        scores: this.scoreList(room),
        isHost: p.id === room.hostId,
      });
    }
  }

  private scoreList(room: PartyRoom): { name: string; points: number }[] {
    return Object.entries(room.scores)
      .filter(([name]) => room.players.some((p) => p.name === name))
      .map(([name, points]) => ({ name, points }))
      .sort((a, b) => b.points - a.points);
  }

  private nextGuesser(room: PartyRoom, from: number): number {
    for (let step = 1; step <= room.players.length; step++) {
      const i = (from + step) % room.players.length;
      if (i === room.setterIdx) continue;
      if (room.players[i].guessesLeft > 0) return i;
    }
    return (room.setterIdx + 1) % room.players.length;
  }

  private playerOf(room: PartyRoom, id: string): PartyPlayer | undefined {
    return room.players.find((p) => p.id === id);
  }

  private lobby(room: PartyRoom): void {
    for (const p of room.players) {
      p.send({
        type: 'party_lobby',
        code: room.code,
        mode: room.mode,
        canStart: p.id === room.hostId && room.players.length >= 2,
        players: room.players.map((x, i) => ({
          name: x.name,
          isHost: x.id === room.hostId,
          isYou: x.id === p.id,
          isSetter: i === room.setterIdx,
        })),
        scores: this.scoreList(room),
      });
    }
  }

  private broadcastState(room: PartyRoom, notice?: string): void {
    const turn = room.players[room.turnIdx];
    for (const p of room.players) {
      p.send({
        type: 'party_state',
        mode: room.mode,
        board: room.board,
        events: room.mystery?.events ?? [],
        setterName: room.players[room.setterIdx].name,
        turnName: turn?.name ?? '',
        yourTurn: p.id === turn?.id,
        youAreSetter: p.id === room.players[room.setterIdx].id,
        turnMs: this.turnMs,
        notice,
        guesses: room.players
          .filter((_, i) => i !== room.setterIdx)
          .map((x) => ({ name: x.name, left: x.guessesLeft })),
        scores: this.scoreList(room),
      });
    }
  }

  sweep(now = Date.now()): void {
    for (const [code, room] of this.rooms) {
      if (now - room.createdAt > ROOM_TTL_MS) {
        this.clearTimer(room);
        for (const p of room.players) this.byPlayer.delete(p.id);
        this.rooms.delete(code);
      }
    }
  }

  _room(code: string): PartyRoom | undefined {
    return this.rooms.get(code);
  }
}
