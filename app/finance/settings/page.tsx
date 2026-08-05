'use client';

import { useRef, useState } from 'react';
import { Download, RefreshCw, Sparkles, Upload } from 'lucide-react';
import { ChartCard } from '@/components/finance/cards';
import { useFinance } from '@/lib/finance/store';
import { EMPTY_FINANCE_DATA, type CollectionKey, type FinanceData } from '@/lib/finance/types';

export default function SettingsPage() {
  const { mode, userEmail, supabaseEnabled, data, resetDemoData, loadSampleData, signOut, addItem } = useFinance();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    setBusy('import');
    setMessage(null);
    try {
      const parsed = JSON.parse(await file.text()) as Partial<FinanceData>;
      let count = 0;
      for (const key of Object.keys(EMPTY_FINANCE_DATA) as CollectionKey[]) {
        for (const item of parsed[key] ?? []) {
          const rest = { ...(item as unknown as Record<string, unknown>) };
          delete rest.id;
          await addItem(key, rest as never);
          count++;
        }
      }
      setMessage(`Imported ${count} records.`);
    } catch {
      setMessage('Import failed — the file is not a valid backup.');
    } finally {
      setBusy(null);
    }
  }

  const counts = (Object.keys(data) as CollectionKey[]).map((k) => ({ key: k, count: data[k].length }));

  return (
    <div className="space-y-3 max-w-3xl">
      <h2 className="text-lg font-bold" style={{ color: 'var(--fin-text)' }}>Settings</h2>

      <ChartCard title="Account">
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt style={{ color: 'var(--fin-text-muted)' }}>Signed in as</dt>
            <dd className="font-medium" style={{ color: 'var(--fin-text)' }}>
              {mode === 'cloud' ? userEmail : 'Demo user (local only)'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: 'var(--fin-text-muted)' }}>Storage</dt>
            <dd className="font-medium" style={{ color: 'var(--fin-text)' }}>
              {mode === 'cloud' ? 'Supabase cloud — synced across devices' : 'This browser (localStorage)'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: 'var(--fin-text-muted)' }}>Cloud accounts</dt>
            <dd className="font-medium" style={{ color: supabaseEnabled ? 'var(--fin-good)' : 'var(--fin-text-muted)' }}>
              {supabaseEnabled ? 'Configured' : 'Not configured'}
            </dd>
          </div>
        </dl>
        {!supabaseEnabled && (
          <p className="mt-3 text-xs rounded-lg p-3 leading-relaxed" style={{ background: 'var(--fin-accent-bg)', color: 'var(--fin-text)' }}>
            To enable personal accounts with cloud sync: create a free Supabase project, run{' '}
            <code>supabase/schema.sql</code> in its SQL editor, and set{' '}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
            <code>.env.local</code>. Each user then gets their own private data, enforced by
            row-level security.
          </p>
        )}
        <button onClick={() => signOut()} className="fin-btn-ghost mt-4">
          {mode === 'cloud' ? 'Sign out' : 'Exit demo mode'}
        </button>
      </ChartCard>

      <ChartCard title="Your data">
        <div className="flex flex-wrap gap-2 text-[11px] mb-4">
          {counts.map((c) => (
            <span key={c.key} className="rounded-full px-2.5 py-1" style={{ background: 'var(--fin-track)', color: 'var(--fin-text-muted)' }}>
              {c.key}: <b style={{ color: 'var(--fin-text)' }}>{c.count}</b>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportJson} className="fin-btn-ghost flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export backup (JSON)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy === 'import'}
            className="fin-btn-ghost flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> {busy === 'import' ? 'Importing…' : 'Import backup'}
          </button>
          <input
            ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = '';
            }}
          />
          {mode === 'demo' && (
            <button
              onClick={() => { if (confirm('Reset demo data to the original sample? Your changes will be lost.')) resetDemoData(); }}
              className="fin-btn-ghost flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Reset demo data
            </button>
          )}
          {mode === 'cloud' && data.transactions.length === 0 && (
            <button
              onClick={async () => {
                setBusy('sample');
                try {
                  await loadSampleData();
                  setMessage('Sample data loaded — explore the dashboard!');
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : 'Could not load sample data.');
                } finally {
                  setBusy(null);
                }
              }}
              disabled={busy === 'sample'}
              className="fin-btn-primary flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> {busy === 'sample' ? 'Loading…' : 'Load sample data'}
            </button>
          )}
        </div>
        {message && (
          <p className="mt-3 text-xs" style={{ color: 'var(--fin-text-muted)' }}>{message}</p>
        )}
      </ChartCard>

      <ChartCard title="About">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--fin-text-muted)' }}>
          Personal Finance Dashboard — built for everyday monthly budgeting. Track income, expenses,
          budgets, investments, credit cards, EMIs, goals and net worth in one place. All amounts in
          INR. The dashboard updates automatically based on the selected Month &amp; Year, and every
          figure is derived from the data you enter here.
        </p>
      </ChartCard>
    </div>
  );
}
