/**
 * Content catalog — worlds, cells, selection, namespaces, daily pick.
 * Implements the Content Model §3 cell rules and the deterministic daily
 * challenge (PRD D-8.2: same puzzle for everyone, rotating at 00:00 UTC).
 */
import type { Difficulty, GameDefinition, Mechanic } from '@guess-it/engine';
import { Rng } from '@guess-it/engine';
import { DEFINITIONS } from './definitions';

export { DEFINITIONS };

export interface World {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
}

export const WORLDS: World[] = [
  { id: 'actors', name: 'Actors', emoji: '🎬', blurb: 'Stars of screen, big and small' },
  { id: 'movies', name: 'Movies', emoji: '🎥', blurb: 'From Bollywood to blockbusters' },
  { id: 'heroes', name: 'Heroes', emoji: '🦸', blurb: 'Marvel, DC, anime & beyond' },
  { id: 'numbers', name: 'Numbers', emoji: '🔢', blurb: 'Codes, years, heights & records' },
  { id: 'emoji', name: 'Emoji Riddles', emoji: '🎭', blurb: 'Decode the emoji, name the thing' },
  { id: 'anything', name: 'Anything', emoji: '🎲', blurb: 'Chaos mode — it could be anything' },
];

export const MECHANIC_META: Record<
  Mechanic,
  { name: string; emoji: string; blurb: string; duration: string }
> = {
  CLUE_GUESS: { name: 'Clue Guess', emoji: '🔍', blurb: 'Clues drop one by one. Guess early, score big.', duration: '~2 min' },
  EXACT_NUMBER: { name: 'Crack the Code', emoji: '🔢', blurb: 'Find the secret 5-digit code from exact/misplaced feedback.', duration: '~4 min' },
  HIGHER_LOWER: { name: 'Higher / Lower', emoji: '⬆️', blurb: 'Zero in on the number before attempts run out.', duration: '~1 min' },
  IMAGE_REVEAL: { name: 'Image Reveal', emoji: '🖼️', blurb: 'The picture sharpens. The score drops. Your call.', duration: '~2 min' },
  MULTIPLE_CHOICE: { name: 'Quick Pick', emoji: '❓', blurb: 'Four options, one timer, no second chances.', duration: '~30 sec' },
};

/** EXACT_NUMBER is generative — it belongs to numbers + anything with no stored defs. */
const GENERATIVE_CELLS: { world: string; mechanic: Mechanic }[] = [
  { world: 'numbers', mechanic: 'EXACT_NUMBER' },
  { world: 'anything', mechanic: 'EXACT_NUMBER' },
];

export function mechanicsForWorld(world: string): Mechanic[] {
  const found = new Set<Mechanic>();
  for (const d of DEFINITIONS) {
    if (d.world === world) found.add(d.mechanic);
    if (world === 'anything') found.add(d.mechanic); // Anything draws from all pools
  }
  for (const g of GENERATIVE_CELLS) if (g.world === world) found.add(g.mechanic);
  // Image Reveal is content-gated until licensed images exist (Content Model §4)
  found.delete('IMAGE_REVEAL');
  return (['CLUE_GUESS', 'EXACT_NUMBER', 'HIGHER_LOWER', 'MULTIPLE_CHOICE'] as Mechanic[]).filter(
    (m) => found.has(m),
  );
}

function poolFor(world: string, mechanic: Mechanic, difficulty?: Difficulty): GameDefinition[] {
  return DEFINITIONS.filter(
    (d) =>
      d.mechanic === mechanic &&
      (world === 'anything' ? true : d.world === world) &&
      (difficulty ? d.difficulty === difficulty : true),
  );
}

const EXACT_TEMPLATE = (world: string, difficulty: Difficulty): GameDefinition => ({
  id: `gen-exact-${difficulty.toLowerCase()}`,
  mechanic: 'EXACT_NUMBER',
  world,
  difficulty,
});

/**
 * Pick a definition for a cell, avoiding recently played ids where possible.
 * `seed` makes the choice deterministic for a given (seed, cell).
 */
export function pickDefinition(
  world: string,
  mechanic: Mechanic,
  difficulty: Difficulty,
  seed: string,
  playedIds: string[] = [],
): GameDefinition | null {
  if (mechanic === 'EXACT_NUMBER') return EXACT_TEMPLATE(world, difficulty);
  let pool = poolFor(world, mechanic, difficulty);
  if (pool.length === 0) pool = poolFor(world, mechanic); // difficulty fallback
  if (pool.length === 0) return null;
  const fresh = pool.filter((d) => !playedIds.includes(d.id));
  const rng = new Rng(`pick:${seed}:${world}:${mechanic}:${difficulty}`);
  return rng.pick(fresh.length > 0 ? fresh : pool);
}

export function getDefinition(id: string, world?: string, difficulty?: Difficulty): GameDefinition | null {
  if (id.startsWith('gen-exact')) return EXACT_TEMPLATE(world ?? 'numbers', difficulty ?? 'MEDIUM');
  return DEFINITIONS.find((d) => d.id === id) ?? null;
}

/** Type-ahead namespace for a world (Content Model §5.4): names + decoys. */
export function namespaceFor(world: string): string[] {
  const names = new Set<string>();
  for (const d of DEFINITIONS) {
    if (d.answer && (world === 'anything' || d.world === world)) names.add(d.answer.name);
  }
  const decoys: Record<string, string[]> = {
    actors: ['Salman Khan', 'Brad Pitt', 'Angelina Jolie', 'Chris Hemsworth', 'Deepika Padukone', 'Ajith Kumar', 'Will Smith', 'Emma Stone', 'Ranbir Kapoor', 'Nayanthara'],
    movies: ['Dangal', 'KGF 2', 'Pushpa', 'Avengers: Endgame', 'The Godfather', 'Gladiator', 'Frozen', 'Oppenheimer', 'Barbie', 'Leo'],
    heroes: ['Captain America', 'Black Panther', 'Aquaman', 'Luffy', 'Sailor Moon', 'He-Man', 'Flash', 'Green Lantern', 'Wolverine', 'Deadpool'],
    emoji: ['Avatar', 'Shrek', 'Aladdin', 'Batman', 'WhatsApp', 'Instagram', 'Adidas', 'Pepsi', 'Harry Potter', 'Frozen'],
    anything: ['Amazon', 'Netflix', 'Statue of Liberty', 'Great Wall of China', 'Instagram', 'Tesla', 'PlayStation', 'McDonald’s', 'NASA', 'Mount Fuji'],
  };
  for (const d of decoys[world] ?? []) names.add(d);
  if (world === 'anything') for (const list of Object.values(decoys)) for (const n of list) names.add(n);
  return [...names].sort();
}

// ---------- Daily challenge (deterministic, shared worldwide) ----------

export interface DailyPick {
  dateKey: string; // YYYY-MM-DD (UTC)
  definition: GameDefinition;
}

export function utcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Rotates mechanic + difficulty by date so the daily varies day to day. */
export function dailyChallenge(dateKey: string = utcDateKey()): DailyPick {
  const rng = new Rng(`daily:${dateKey}`);
  const candidates = DEFINITIONS.filter((d) => d.mechanic !== 'IMAGE_REVEAL');
  const def = rng.pick(candidates);
  return { dateKey, definition: def };
}

/** The daily game seed — same for every player on a given date (PRD GI-6.1). */
export function dailySeed(dateKey: string): string {
  return `daily-seed:${dateKey}`;
}

// ---------- Weekly Gauntlet (BRD §23): 7 shared games per ISO week ----------

/** ISO week key, e.g. 2026-W32 (UTC). */
export function utcWeekKey(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday of this week decides the year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export interface WeeklyGauntlet {
  weekKey: string;
  games: GameDefinition[]; // 7 games, same for everyone that week
}

/** Deterministic 7-game gauntlet: varied mechanics/worlds, no repeated answers. */
export function weeklyGauntlet(weekKey: string = utcWeekKey()): WeeklyGauntlet {
  const rng = new Rng(`weekly:${weekKey}`);
  const pool = rng.shuffle(DEFINITIONS.filter((d) => d.mechanic !== 'IMAGE_REVEAL'));
  const games: GameDefinition[] = [];
  const usedAnswers = new Set<string>();
  const usedMechanics = new Map<string, number>();
  for (const def of pool) {
    if (games.length >= 6) break;
    const answer = def.answer?.name ?? def.id;
    if (usedAnswers.has(answer)) continue;
    if ((usedMechanics.get(def.mechanic) ?? 0) >= 2) continue; // variety
    usedAnswers.add(answer);
    usedMechanics.set(def.mechanic, (usedMechanics.get(def.mechanic) ?? 0) + 1);
    games.push(def);
  }
  // finale: always a generated code game
  games.push({ id: `gen-exact-weekly`, mechanic: 'EXACT_NUMBER', world: 'numbers', difficulty: 'MEDIUM' });
  return { weekKey, games };
}

export function weeklySeed(weekKey: string, index: number): string {
  return `weekly-seed:${weekKey}:${index}`;
}
