'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { generateDemoData } from './demo-data';
import { monthKey } from './format';
import { getSupabase, supabaseEnabled, toCamel, toSnake } from './supabase';
import {
  EMPTY_FINANCE_DATA,
  type CollectionKey,
  type FinanceData,
} from './types';

const DEMO_FLAG_KEY = 'finance-mode';
const DEMO_DATA_KEY = 'finance-demo-data';

const TABLE_NAMES: Record<CollectionKey, string> = {
  transactions: 'transactions',
  budgets: 'budgets',
  investments: 'investments',
  goals: 'goals',
  creditCards: 'credit_cards',
  emis: 'emis',
  assets: 'assets',
};

type Status = 'loading' | 'signedOut' | 'ready';
type Mode = 'demo' | 'cloud' | null;

interface FinanceContextValue {
  status: Status;
  mode: Mode;
  userEmail: string | null;
  supabaseEnabled: boolean;
  data: FinanceData;
  /** Selected month key 'YYYY-MM' driving every dashboard figure. */
  month: string;
  setMonth: (m: string) => void;
  addItem: <K extends CollectionKey>(key: K, item: Omit<FinanceData[K][number], 'id'>) => Promise<void>;
  updateItem: <K extends CollectionKey>(key: K, id: string, patch: Partial<FinanceData[K][number]>) => Promise<void>;
  deleteItem: (key: CollectionKey, id: string) => Promise<void>;
  enterDemo: () => void;
  signOut: () => Promise<void>;
  resetDemoData: () => void;
  /** Cloud-mode helper: seed the signed-in account with sample data. */
  loadSampleData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function readDemoData(): FinanceData {
  try {
    const raw = localStorage.getItem(DEMO_DATA_KEY);
    if (raw) return { ...EMPTY_FINANCE_DATA, ...(JSON.parse(raw) as FinanceData) };
  } catch {}
  const seeded = generateDemoData(new Date());
  try { localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(seeded)); } catch {}
  return seeded;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [mode, setMode] = useState<Mode>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [data, setData] = useState<FinanceData>(EMPTY_FINANCE_DATA);
  const now = new Date();
  const [month, setMonth] = useState(monthKey(now.getFullYear(), now.getMonth()));
  const userIdRef = useRef<string | null>(null);

  const persistDemo = useCallback((next: FinanceData) => {
    try { localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const loadCloudData = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const results = await Promise.all(
      (Object.keys(TABLE_NAMES) as CollectionKey[]).map(async (key) => {
        const { data: rows, error } = await supabase.from(TABLE_NAMES[key]).select('*');
        if (error) throw error;
        return [key, (rows ?? []).map((r) => toCamel(r))] as const;
      })
    );
    setData(Object.fromEntries(results) as unknown as FinanceData);
  }, []);

  // Resolve auth state on mount: cloud session > demo flag > signed out.
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabase();

    async function init() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          userIdRef.current = session.user.id;
          setUserEmail(session.user.email ?? null);
          setMode('cloud');
          try {
            await loadCloudData();
            if (!cancelled) setStatus('ready');
          } catch (err) {
            console.error('Failed to load data from Supabase', err);
            if (!cancelled) setStatus('ready');
          }
          return;
        }
      }
      if (localStorage.getItem(DEMO_FLAG_KEY) === 'demo') {
        setMode('demo');
        setData(readDemoData());
        setStatus('ready');
      } else {
        setStatus('signedOut');
      }
    }

    init();

    const sub = supabase?.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        userIdRef.current = session.user.id;
        setUserEmail(session.user.email ?? null);
        setMode('cloud');
        loadCloudData()
          .catch((err) => console.error('Failed to load data from Supabase', err))
          .finally(() => setStatus('ready'));
      } else if (userIdRef.current) {
        userIdRef.current = null;
        setUserEmail(null);
        setMode(null);
        setData(EMPTY_FINANCE_DATA);
        setStatus('signedOut');
      }
    });

    return () => {
      cancelled = true;
      sub?.data.subscription.unsubscribe();
    };
  }, [loadCloudData]);

  const addItem = useCallback(
    async <K extends CollectionKey>(key: K, item: Omit<FinanceData[K][number], 'id'>) => {
      const id = crypto.randomUUID();
      const full = { ...item, id } as FinanceData[K][number];
      setData((prev) => {
        const next = { ...prev, [key]: [...prev[key], full] };
        if (mode === 'demo') persistDemo(next);
        return next;
      });
      if (mode === 'cloud') {
        const supabase = getSupabase();
        const { error } = await supabase!
          .from(TABLE_NAMES[key])
          .insert({ ...toSnake(full as unknown as Record<string, unknown>), user_id: userIdRef.current });
        if (error) {
          console.error(`Insert into ${TABLE_NAMES[key]} failed`, error);
          throw new Error(error.message);
        }
      }
    },
    [mode, persistDemo]
  );

  const updateItem = useCallback(
    async <K extends CollectionKey>(key: K, id: string, patch: Partial<FinanceData[K][number]>) => {
      setData((prev) => {
        const next = {
          ...prev,
          [key]: prev[key].map((it) => (it.id === id ? { ...it, ...patch } : it)),
        };
        if (mode === 'demo') persistDemo(next);
        return next;
      });
      if (mode === 'cloud') {
        const supabase = getSupabase();
        const { error } = await supabase!
          .from(TABLE_NAMES[key])
          .update(toSnake(patch as unknown as Record<string, unknown>))
          .eq('id', id);
        if (error) {
          console.error(`Update ${TABLE_NAMES[key]} failed`, error);
          throw new Error(error.message);
        }
      }
    },
    [mode, persistDemo]
  );

  const deleteItem = useCallback(
    async (key: CollectionKey, id: string) => {
      setData((prev) => {
        const next = { ...prev, [key]: prev[key].filter((it) => it.id !== id) } as FinanceData;
        if (mode === 'demo') persistDemo(next);
        return next;
      });
      if (mode === 'cloud') {
        const supabase = getSupabase();
        const { error } = await supabase!.from(TABLE_NAMES[key]).delete().eq('id', id);
        if (error) {
          console.error(`Delete from ${TABLE_NAMES[key]} failed`, error);
          throw new Error(error.message);
        }
      }
    },
    [mode, persistDemo]
  );

  const enterDemo = useCallback(() => {
    try { localStorage.setItem(DEMO_FLAG_KEY, 'demo'); } catch {}
    setMode('demo');
    setData(readDemoData());
    setStatus('ready');
  }, []);

  const resetDemoData = useCallback(() => {
    try { localStorage.removeItem(DEMO_DATA_KEY); } catch {}
    setData(readDemoData());
  }, []);

  const signOut = useCallback(async () => {
    if (mode === 'cloud') {
      await getSupabase()?.auth.signOut();
      // onAuthStateChange resets state.
    } else {
      try { localStorage.removeItem(DEMO_FLAG_KEY); } catch {}
      setMode(null);
      setData(EMPTY_FINANCE_DATA);
      setStatus('signedOut');
    }
  }, [mode]);

  const loadSampleData = useCallback(async () => {
    if (mode !== 'cloud') return;
    const supabase = getSupabase();
    if (!supabase || !userIdRef.current) return;
    const sample = generateDemoData(new Date());
    for (const key of Object.keys(TABLE_NAMES) as CollectionKey[]) {
      const rows = sample[key].map((item) => {
        const rest = { ...(item as unknown as Record<string, unknown>) };
        delete rest.id;
        return { ...toSnake(rest), user_id: userIdRef.current };
      });
      if (rows.length === 0) continue;
      const { error } = await supabase.from(TABLE_NAMES[key]).insert(rows);
      if (error) {
        console.error(`Seeding ${TABLE_NAMES[key]} failed`, error);
        throw new Error(error.message);
      }
    }
    await loadCloudData();
  }, [mode, loadCloudData]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      status, mode, userEmail, supabaseEnabled, data, month, setMonth,
      addItem, updateItem, deleteItem, enterDemo, signOut, resetDemoData, loadSampleData,
    }),
    [status, mode, userEmail, data, month, addItem, updateItem, deleteItem, enterDemo, signOut, resetDemoData, loadSampleData]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>');
  return ctx;
}
