'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** True when Supabase env vars are configured — cloud accounts are available. */
export const supabaseEnabled = Boolean(url && anonKey);

export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (!client) client = createClient(url!, anonKey!);
  return client;
}

// ── Row mapping: DB uses snake_case, the app uses camelCase ─────────────────

export function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = v;
  }
  return out;
}

export function toCamel<T>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'user_id' || k === 'created_at') continue;
    out[k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = v ?? undefined;
  }
  return out as T;
}
