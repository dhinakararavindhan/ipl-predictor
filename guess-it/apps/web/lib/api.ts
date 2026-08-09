'use client';

/**
 * REST client for the GUESS IT backend (services/realtime /api routes).
 * Base URL is derived from NEXT_PUBLIC_REALTIME_URL (wss://host/ws → https://host).
 * All calls no-op gracefully when the backend isn't configured.
 */
import type { PlayerView } from '@guess-it/engine';
import { REALTIME_URL } from './online';

export const API_BASE = REALTIME_URL
  ? REALTIME_URL.replace(/^ws/, 'http').replace(/\/ws\/?$/, '')
  : '';

interface Identity {
  playerId: string;
  token: string;
}

async function req<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok && res.status !== 422) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

/** Get (or create) this device's server identity. */
export async function ensurePlayer(name: string): Promise<Identity> {
  try {
    const saved = localStorage.getItem('guessit-player');
    if (saved) return JSON.parse(saved) as Identity;
  } catch {}
  const id = await req<Identity>('/api/players', { method: 'POST', body: JSON.stringify({ name }) });
  try {
    localStorage.setItem('guessit-player', JSON.stringify(id));
  } catch {}
  return id;
}

export interface DailyStartResponse {
  gameId?: string;
  view?: PlayerView;
  dateKey?: string;
  alreadyPlayed?: { score: number; outcome: string };
}

export function dailyStart(identity: Identity, name: string): Promise<DailyStartResponse> {
  return req('/api/daily/start', { method: 'POST', body: JSON.stringify({ name }) }, identity.token);
}

export interface DailyActionResponse {
  view?: PlayerView;
  result?: {
    view: PlayerView;
    xp: { total: number; parts: { label: string; amount: number }[] };
    rank: { rank: number; total: number } | null;
  };
  error?: string;
  code?: string;
}

export function dailyAction(
  identity: Identity,
  gameId: string,
  action: 'guess' | 'advance' | 'hint' | 'forfeit' | 'tick',
  payload?: string,
): Promise<DailyActionResponse> {
  return req(
    '/api/daily/action',
    { method: 'POST', body: JSON.stringify({ gameId, action, payload }) },
    identity.token,
  );
}

export interface DailyLeaderboard {
  dateKey: string;
  top: { rank: number; name: string; score: number; isYou: boolean }[];
  me: { rank: number; total: number; score: number } | null;
}

export function dailyLeaderboard(identity: Identity | null): Promise<DailyLeaderboard> {
  return req('/api/daily/leaderboard', { method: 'GET' }, identity?.token);
}
