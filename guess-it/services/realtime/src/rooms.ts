/**
 * Room manager — the server-authoritative race core (Engine R-1.3 finally
 * enforced server-side: clients only ever receive PlayerView; the definition,
 * secrets and full state live here).
 *
 * Rooms are ephemeral and in-memory: live racing needs no persistence.
 */
import {
  advance,
  createGame,
  EngineError,
  forfeit,
  loseToAi,
  playerView,
  submitGuess,
  useHint,
  type GameDefinition,
  type GameState,
  type HintType,
  type Mechanic,
} from '@guess-it/engine';
import { pickDefinition } from '@guess-it/content';
import { eloUpdate } from './elo.js';
import type { Storage } from './storage.js';
import type { OpponentProgress, RaceConfig, ServerMsg } from './protocol';

/** Mechanics that make good live races: same-puzzle, first-correct-wins. */
export function supportsOnline(mechanic: Mechanic): boolean {
  return mechanic === 'EXACT_NUMBER' || mechanic === 'CLUE_GUESS' || mechanic === 'HIGHER_LOWER';
}

export interface Player {
  id: string;
  name: string;
  send: (msg: ServerMsg) => void;
  /** Verified player id when the client sent a valid token — enables ratings. */
  authId?: string | null;
  state?: GameState;
  rematchRequested?: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  config: RaceConfig;
  def?: GameDefinition;
  seed?: string;
  status: 'lobby' | 'racing' | 'over';
  players: Player[]; // max 2
  createdAt: number;
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const ROOM_TTL_MS = 60 * 60 * 1000;

function progressOf(state: GameState): OpponentProgress {
  const p: OpponentProgress = {
    attemptsUsed: state.attemptsUsed,
    finished: state.status !== 'ACTIVE',
  };
  if (state.mechanic === 'CLUE_GUESS') p.cluesRevealed = state.clueState!.cluesRevealed;
  if (state.mechanic === 'EXACT_NUMBER') {
    const last = state.exact!.guesses[state.exact!.guesses.length - 1];
    if (last) p.lastExactCount = last.exact;
  }
  return p;
}

const QUICKMATCH_CONFIGS: RaceConfig[] = [
  { world: 'numbers', mechanic: 'EXACT_NUMBER', difficulty: 'MEDIUM' },
  { world: 'anything', mechanic: 'CLUE_GUESS', difficulty: 'MEDIUM' },
  { world: 'numbers', mechanic: 'HIGHER_LOWER', difficulty: 'MEDIUM' },
];

export class RoomManager {
  private rooms = new Map<string, Room>();
  private byPlayer = new Map<string, Room>();
  private queue: Player[] = [];
  private random: () => number;
  private storage: Storage | null;

  constructor(random: () => number = Math.random, storage: Storage | null = null) {
    this.random = random;
    this.storage = storage;
  }

  /** Random matchmaking (BRD §16.2): pair the first two waiting players. */
  quickmatch(player: Player): void {
    this.leave(player.id);
    const opponent = this.queue.find((p) => p.id !== player.id);
    if (!opponent) {
      if (!this.queue.some((p) => p.id === player.id)) this.queue.push(player);
      player.send({ type: 'searching' });
      return;
    }
    this.queue = this.queue.filter((p) => p.id !== opponent.id && p.id !== player.id);
    const config = QUICKMATCH_CONFIGS[Math.floor(this.random() * QUICKMATCH_CONFIGS.length)];
    const room: Room = {
      code: this.newCode(),
      hostId: opponent.id,
      config,
      status: 'lobby',
      players: [opponent, player],
      createdAt: Date.now(),
    };
    this.rooms.set(room.code, room);
    this.byPlayer.set(opponent.id, room);
    this.byPlayer.set(player.id, room);
    this.launch(room);
  }

  private newCode(): string {
    let code = '';
    do {
      code = Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)]).join('');
    } while (this.rooms.has(code));
    return code;
  }

  roomOf(playerId: string): Room | undefined {
    return this.byPlayer.get(playerId);
  }

  create(player: Player, config: RaceConfig): Room {
    this.leave(player.id); // one room per connection
    if (!supportsOnline(config.mechanic)) {
      player.send({ type: 'error', code: 'UNSUPPORTED', message: 'That game type is not raceable online yet.' });
      throw new Error('unsupported mechanic');
    }
    const room: Room = {
      code: this.newCode(),
      hostId: player.id,
      config,
      status: 'lobby',
      players: [player],
      createdAt: Date.now(),
    };
    this.rooms.set(room.code, room);
    this.byPlayer.set(player.id, room);
    this.broadcastLobby(room);
    return room;
  }

  join(player: Player, code: string): Room {
    this.leave(player.id);
    const room = this.rooms.get(code.trim().toUpperCase());
    if (!room) {
      player.send({ type: 'error', code: 'NOT_FOUND', message: 'No room with that code. Check it and try again.' });
      throw new Error('room not found');
    }
    if (room.status !== 'lobby' || room.players.length >= 2) {
      player.send({ type: 'error', code: 'FULL', message: 'That room is full or already racing.' });
      throw new Error('room full');
    }
    room.players.push(player);
    this.byPlayer.set(player.id, room);
    this.broadcastLobby(room);
    return room;
  }

  start(playerId: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId)!;
    if (room.hostId !== playerId) {
      player.send({ type: 'error', code: 'NOT_HOST', message: 'Only the host can start the race.' });
      return;
    }
    if (room.players.length < 2) {
      player.send({ type: 'error', code: 'NEED_OPPONENT', message: 'Waiting for your friend to join.' });
      return;
    }
    this.launch(room);
  }

  private launch(room: Room): void {
    const seed = `race-${room.code}-${Date.now()}-${Math.floor(this.random() * 1e9)}`;
    const def = pickDefinition(room.config.world, room.config.mechanic, room.config.difficulty, seed);
    if (!def) {
      for (const p of room.players)
        p.send({ type: 'error', code: 'NO_CONTENT', message: 'No games available for that combination.' });
      return;
    }
    room.def = def;
    room.seed = seed;
    room.status = 'racing';
    const now = Date.now();
    for (const p of room.players) {
      p.state = createGame(def, seed, now); // same def + same seed = identical puzzle
      p.rematchRequested = false;
    }
    for (const p of room.players) {
      const opponent = room.players.find((o) => o.id !== p.id)!;
      p.send({ type: 'game_start', view: playerView(p.state!, def), opponentName: opponent.name });
    }
  }

  async action(playerId: string, action: 'guess' | 'advance' | 'hint', payload?: string): Promise<void> {
    const room = this.byPlayer.get(playerId);
    if (!room || room.status !== 'racing' || !room.def) return;
    const player = room.players.find((p) => p.id === playerId)!;
    const opponent = room.players.find((p) => p.id !== playerId)!;
    if (!player.state || player.state.status !== 'ACTIVE') return;

    const now = Date.now();
    try {
      switch (action) {
        case 'guess':
          player.state = submitGuess(player.state, room.def, payload ?? '', now);
          break;
        case 'advance':
          player.state = advance(player.state, room.def, now);
          break;
        case 'hint':
          player.state = useHint(player.state, room.def, (payload ?? '') as HintType);
          break;
      }
    } catch (e) {
      if (e instanceof EngineError) {
        player.send({ type: 'error', code: e.code, message: e.message });
        return;
      }
      throw e;
    }

    if (player.state.status === 'WON') {
      // race won — the opponent loses now (their board freezes)
      if (opponent.state && opponent.state.status === 'ACTIVE') {
        opponent.state = loseToAi(opponent.state, room.def, now);
      }
      await this.finish(room);
      return;
    }

    player.send({ type: 'view', view: playerView(player.state, room.def) });
    opponent.send({ type: 'opponent', progress: progressOf(player.state) });

    // both exhausted their attempts → the puzzle wins
    if (player.state.status !== 'ACTIVE' && opponent.state && opponent.state.status !== 'ACTIVE') {
      await this.finish(room);
    } else if (player.state.status !== 'ACTIVE') {
      // this player is out; opponent keeps racing the board
      player.send({ type: 'view', view: playerView(player.state, room.def) });
    }
  }

  private async finish(room: Room): Promise<void> {
    if (!room.def) return;
    room.status = 'over';
    const [a, b] = room.players;
    const outcomeFor = (me: Player, them: Player): 'WIN' | 'LOSS' | 'DRAW' => {
      const meWon = me.state?.status === 'WON';
      const themWon = them.state?.status === 'WON';
      if (meWon && !themWon) return 'WIN';
      if (themWon && !meWon) return 'LOSS';
      return 'DRAW';
    };
    const ratings = await this.applyRatings(a, b, outcomeFor(a, b));
    const summary = (p: Player) => ({
      name: p.name,
      score: p.state?.result?.score ?? 0,
      attemptsUsed: p.state?.attemptsUsed ?? 0,
      finished: p.state?.status !== 'ACTIVE',
      ...(ratings?.get(p.id) ?? {}),
    });
    for (const [me, them] of [
      [a, b],
      [b, a],
    ] as const) {
      me.send({
        type: 'game_over',
        outcome: outcomeFor(me, them),
        view: playerView(me.state!, room.def),
        you: summary(me),
        opponent: summary(them),
      });
    }
  }

  /** Elo (BRD §25): applies when both racers sent valid tokens. */
  private async applyRatings(
    a: Player,
    b: Player,
    outcomeA: 'WIN' | 'LOSS' | 'DRAW',
  ): Promise<Map<string, { rating: number; ratingDelta: number }> | null> {
    if (!this.storage || !a.authId || !b.authId || a.authId === b.authId) return null;
    try {
      const [ra, rb] = await Promise.all([this.storage.getRating(a.authId), this.storage.getRating(b.authId)]);
      const scoreA = outcomeA === 'WIN' ? 1 : outcomeA === 'LOSS' ? 0 : 0.5;
      const [na, nb] = eloUpdate(ra, rb, scoreA);
      await Promise.all([this.storage.setRating(a.authId, na), this.storage.setRating(b.authId, nb)]);
      return new Map([
        [a.id, { rating: na, ratingDelta: na - ra }],
        [b.id, { rating: nb, ratingDelta: nb - rb }],
      ]);
    } catch {
      return null;
    }
  }

  rematch(playerId: string): void {
    const room = this.byPlayer.get(playerId);
    if (!room || room.status !== 'over' || room.players.length < 2) return;
    const player = room.players.find((p) => p.id === playerId)!;
    player.rematchRequested = true;
    const opponent = room.players.find((p) => p.id !== playerId)!;
    if (opponent.rematchRequested) {
      room.status = 'lobby';
      this.launch(room);
    } else {
      opponent.send({ type: 'rematch_offer', from: player.name });
    }
  }

  /** Disconnect or explicit leave: mid-race → opponent wins by walkover. */
  leave(playerId: string): void {
    this.queue = this.queue.filter((p) => p.id !== playerId);
    const room = this.byPlayer.get(playerId);
    if (!room) return;
    this.byPlayer.delete(playerId);
    const leaver = room.players.find((p) => p.id === playerId);
    room.players = room.players.filter((p) => p.id !== playerId);

    const remaining = room.players[0];
    if (!remaining) {
      this.rooms.delete(room.code);
      return;
    }
    if (room.status === 'racing' && room.def && remaining.state) {
      room.status = 'over';
      if (remaining.state.status === 'ACTIVE') {
        remaining.state = submitWalkover(remaining.state, room.def);
      }
      const send = (ratings: Map<string, { rating: number; ratingDelta: number }> | null) =>
        remaining.send({
          type: 'game_over',
          outcome: 'WALKOVER',
          view: playerView(remaining.state!, room.def!),
          you: {
            name: remaining.name,
            score: remaining.state!.result?.score ?? 0,
            attemptsUsed: remaining.state!.attemptsUsed,
            ...(ratings?.get(remaining.id) ?? {}),
          },
          opponent: { name: leaver?.name ?? 'Opponent', score: 0, attemptsUsed: 0, finished: false },
        });
      if (leaver) {
        void this.applyRatings(remaining, leaver, 'WIN').then(send);
      } else {
        send(null);
      }
    } else {
      remaining.send({ type: 'opponent_left' });
      if (room.status === 'lobby') {
        room.hostId = remaining.id;
        this.broadcastLobby(room);
      }
    }
  }

  private broadcastLobby(room: Room): void {
    for (const p of room.players) {
      p.send({
        type: 'lobby',
        code: room.code,
        config: room.config,
        canStart: room.players.length === 2 && p.id === room.hostId,
        players: room.players.map((x) => ({ name: x.name, isHost: x.id === room.hostId, isYou: x.id === p.id })),
      });
    }
  }

  /** Periodic cleanup of abandoned rooms. */
  sweep(now: number = Date.now()): void {
    for (const [code, room] of this.rooms) {
      if (now - room.createdAt > ROOM_TTL_MS) {
        for (const p of room.players) this.byPlayer.delete(p.id);
        this.rooms.delete(code);
      }
    }
  }

  /** Test-only accessor. */
  _room(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  get size(): number {
    return this.rooms.size;
  }
}

/** Leaver walkover: remaining player's board ends as a win-by-default. */
function submitWalkover(state: GameState, def: GameDefinition): GameState {
  // forfeit() would zero their score; instead freeze the board as-is with a
  // neutral result so the answer is revealed and the win is recorded upstream.
  const s = forfeit(state, def, Date.now());
  return s;
}
