/**
 * Party Mode — "Code Setter": one human sets a secret 5-digit code, the rest
 * of the room takes turns guessing on a shared board (2–8 players).
 * The original GUESS IT parlor game, server-refereed:
 *   crack it → that guesser wins · everyone runs dry → the Setter wins.
 * Rematches rotate the setter. Server-authoritative: the secret never leaves
 * this process until the game is over.
 */
import { evaluateExact, isValidExactGuess, type ExactGuessRow } from '@guess-it/engine';
import type { ServerMsg } from './protocol';

export const GUESSES_PER_PLAYER = 8;
const MAX_PLAYERS = 8;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

export interface PartyPlayer {
  id: string;
  name: string;
  send: (msg: ServerMsg) => void;
  guessesLeft: number;
}

export interface BoardRow extends ExactGuessRow {
  by: string;
}

export interface PartyRoom {
  code: string;
  hostId: string;
  phase: 'lobby' | 'setting' | 'guessing' | 'over';
  players: PartyPlayer[]; // index 0..n; setter is players[setterIdx]
  setterIdx: number;
  secret: string | null;
  board: BoardRow[];
  turnIdx: number; // index into players; never the setter
  createdAt: number;
}

export class PartyManager {
  private rooms = new Map<string, PartyRoom>();
  private byPlayer = new Map<string, PartyRoom>();
  private random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  private newCode(): string {
    let code = '';
    do {
      code = Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)]).join('');
    } while (this.rooms.has(code));
    return code;
  }

  create(player: PartyPlayer): PartyRoom {
    this.leave(player.id);
    const room: PartyRoom = {
      code: this.newCode(),
      hostId: player.id,
      phase: 'lobby',
      players: [player],
      setterIdx: 0,
      secret: null,
      board: [],
      turnIdx: 1,
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
    room.phase = 'setting';
    room.secret = null;
    room.board = [];
    for (const p of room.players) p.guessesLeft = GUESSES_PER_PLAYER;
    const setter = room.players[room.setterIdx];
    for (const p of room.players) {
      p.send({ type: 'party_setting', setterName: setter.name, youAreSetter: p.id === setter.id });
    }
  }

  setCode(playerId: string, code: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room || room.phase !== 'setting') return;
    const setter = room.players[room.setterIdx];
    if (setter.id !== playerId) {
      this.playerOf(room, playerId)?.send({ type: 'error', code: 'NOT_SETTER', message: 'Only the setter picks the code.' });
      return;
    }
    if (!isValidExactGuess(code)) {
      setter.send({ type: 'error', code: 'INVALID_GUESS_FORMAT', message: 'Pick 5 different digits.' });
      return;
    }
    room.secret = code;
    room.phase = 'guessing';
    room.turnIdx = this.nextGuesser(room, room.setterIdx);
    this.broadcastState(room);
  }

  guess(playerId: string, digits: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room || room.phase !== 'guessing' || !room.secret) return;
    const player = this.playerOf(room, playerId);
    if (!player) return;
    if (room.players[room.turnIdx]?.id !== playerId) {
      player.send({ type: 'error', code: 'NOT_YOUR_TURN', message: 'Wait for your turn.' });
      return;
    }
    if (!isValidExactGuess(digits)) {
      player.send({ type: 'error', code: 'INVALID_GUESS_FORMAT', message: 'Enter 5 different digits.' });
      return;
    }
    if (room.board.some((r) => r.digits === digits)) {
      player.send({ type: 'error', code: 'DUPLICATE_GUESS', message: 'That code was already tried — check the board!' });
      return;
    }

    const row = evaluateExact(room.secret, digits);
    room.board.push({ ...row, by: player.name });
    player.guessesLeft--;

    if (row.exact === 5) {
      this.finish(room, player.name, 'cracked');
      return;
    }
    if (room.players.every((p, i) => i === room.setterIdx || p.guessesLeft <= 0)) {
      this.finish(room, null, 'exhausted'); // the Setter wins
      return;
    }
    room.turnIdx = this.nextGuesser(room, room.turnIdx);
    this.broadcastState(room);
  }

  rematch(playerId: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room || room.phase !== 'over') return;
    if (room.hostId !== playerId) {
      this.playerOf(room, playerId)?.send({ type: 'error', code: 'NOT_HOST', message: 'Only the host can start the next round.' });
      return;
    }
    if (room.players.length < 2) return;
    room.setterIdx = (room.setterIdx + 1) % room.players.length; // rotate the setter
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
      this.rooms.delete(room.code);
      return;
    }
    if (leaver) for (const p of room.players) p.send({ type: 'party_left', name: leaver.name });

    // keep indices coherent after removal
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
    }
  }

  private finish(room: PartyRoom, winner: string | null, reason: 'cracked' | 'exhausted' | 'setter_left' | 'not_enough_players'): void {
    room.phase = 'over';
    const setter = room.players[room.setterIdx];
    for (const p of room.players) {
      p.send({
        type: 'party_over',
        winner,
        reason,
        secret: reason === 'setter_left' ? null : room.secret,
        setterName: setter?.name ?? 'Setter',
        board: room.board,
        isHost: p.id === room.hostId,
      });
    }
  }

  /** Next player index that can still guess, skipping the setter. */
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
        canStart: p.id === room.hostId && room.players.length >= 2,
        players: room.players.map((x, i) => ({
          name: x.name,
          isHost: x.id === room.hostId,
          isYou: x.id === p.id,
          isSetter: i === room.setterIdx,
        })),
      });
    }
  }

  private broadcastState(room: PartyRoom): void {
    const turn = room.players[room.turnIdx];
    for (const p of room.players) {
      p.send({
        type: 'party_state',
        board: room.board,
        setterName: room.players[room.setterIdx].name,
        turnName: turn?.name ?? '',
        yourTurn: p.id === turn?.id,
        youAreSetter: p.id === room.players[room.setterIdx].id,
        guesses: room.players
          .filter((_, i) => i !== room.setterIdx)
          .map((x) => ({ name: x.name, left: x.guessesLeft })),
      });
    }
  }

  sweep(now = Date.now()): void {
    for (const [code, room] of this.rooms) {
      if (now - room.createdAt > ROOM_TTL_MS) {
        for (const p of room.players) this.byPlayer.delete(p.id);
        this.rooms.delete(code);
      }
    }
  }

  _room(code: string): PartyRoom | undefined {
    return this.rooms.get(code);
  }
}
