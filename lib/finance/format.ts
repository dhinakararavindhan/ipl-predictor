import { MONTH_SHORT } from './constants';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹1,20,000 — Indian digit grouping, no decimals. */
export function formatINR(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}₹${inr.format(Math.round(Math.abs(value)))}`;
}

/** ₹50.2K / ₹18.5L / ₹2.1Cr — compact Indian notation for axes and tiles. */
export function formatINRCompact(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `${sign}₹${trim(abs / 1_00_00_000)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${trim(abs / 1_00_000)}L`;
  if (abs >= 1_000) return `${sign}₹${trim(abs / 1_000)}K`;
  return `${sign}₹${inr.format(Math.round(abs))}`;
}

function trim(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

// ── Month helpers (month keys are 'YYYY-MM') ─────────────────────────────────

export function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function parseMonthKey(key: string): { year: number; monthIndex: number } {
  const [y, m] = key.split('-').map(Number);
  return { year: y, monthIndex: m - 1 };
}

export function monthKeyOfDate(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(key: string, delta: number): string {
  const { year, monthIndex } = parseMonthKey(key);
  const total = year * 12 + monthIndex + delta;
  return monthKey(Math.floor(total / 12), ((total % 12) + 12) % 12);
}

/** 'Jul 2026' */
export function formatMonthKey(key: string): string {
  const { year, monthIndex } = parseMonthKey(key);
  return `${MONTH_SHORT[monthIndex]} ${year}`;
}

/** "Jul'26" — tight tick label for 12-month axes. */
export function formatMonthTick(key: string): string {
  const { year, monthIndex } = parseMonthKey(key);
  return `${MONTH_SHORT[monthIndex]}'${String(year).slice(2)}`;
}

/** Last `count` month keys ending at (and including) `end`. */
export function lastMonths(end: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addMonths(end, i - (count - 1)));
}

export function daysInMonth(key: string): number {
  const { year, monthIndex } = parseMonthKey(key);
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function formatDateShort(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
