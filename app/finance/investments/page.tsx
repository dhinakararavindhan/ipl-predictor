'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ChartCard, EmptyState, StatCard } from '@/components/finance/cards';
import { DonutWithLegend } from '@/components/finance/charts';
import { Modal } from '@/components/finance/Modal';
import { INVESTMENT_TYPES, PALETTE } from '@/lib/finance/constants';
import { formatDateShort, formatINR, formatMonthKey, todayISO } from '@/lib/finance/format';
import { investedInMonth, totalInvested } from '@/lib/finance/metrics';
import { useFinance } from '@/lib/finance/store';
import type { Investment, InvestmentType } from '@/lib/finance/types';
import { TrendingUp, Landmark, PiggyBank } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  SIP: PALETTE.blue,
  Stocks: PALETTE.orange,
  FD: PALETTE.aqua,
  PPF: PALETTE.yellow,
  SSY: PALETTE.magenta,
  NPS: PALETTE.green,
  Gold: PALETTE.violet,
  Other: PALETTE.gray,
};

export default function InvestmentsPage() {
  const { data, month, addItem, deleteItem } = useFinance();
  const [adding, setAdding] = useState(false);

  const thisMonth = investedInMonth(data, month);
  const allTime = totalInvested(data);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of data.investments) map.set(i.type, (map.get(i.type) ?? 0) + i.amount);
    const total = allTime || 1;
    return [...map.entries()]
      .map(([type, amount]) => ({
        name: type, value: amount, pct: (amount / total) * 100,
        color: TYPE_COLORS[type] ?? PALETTE.gray,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.investments, allTime]);

  const monthList = data.investments
    .filter((i) => i.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold mr-auto" style={{ color: 'var(--fin-text)' }}>
          Investments <span className="text-sm font-medium" style={{ color: 'var(--fin-text-muted)' }}>· {formatMonthKey(month)}</span>
        </h2>
        <button onClick={() => setAdding(true)} className="fin-btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add investment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={TrendingUp} iconColor={PALETTE.violet} title="Invested this month" value={formatINR(thisMonth)} sub={formatMonthKey(month)} />
        <StatCard icon={Landmark} iconColor={PALETTE.blue} title="Total contributions" value={formatINR(allTime)} sub="All time (tracked)" />
        <StatCard
          icon={PiggyBank} iconColor={PALETTE.aqua} title="Monthly average"
          value={formatINR(byType.length ? Math.round(allTime / new Set(data.investments.map((i) => i.date.slice(0, 7))).size) : 0)}
          sub="Across tracked months"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <ChartCard title="Allocation by type" subtitle="(all contributions)">
          {byType.length > 0 ? (
            <DonutWithLegend slices={byType} centerValue={formatINR(allTime)} centerLabel="Total" />
          ) : (
            <EmptyState message="No investments recorded yet." />
          )}
        </ChartCard>

        <ChartCard title="This month's contributions" subtitle={`(${monthList.length})`}>
          {monthList.length === 0 ? (
            <EmptyState
              message="Nothing invested this month yet."
              action={
                <button onClick={() => setAdding(true)} className="fin-btn-primary flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add investment
                </button>
              }
            />
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--fin-border)' }}>
              {monthList.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TYPE_COLORS[i.type] ?? PALETTE.gray }} />
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--fin-text)' }}>{i.name}</p>
                    <p style={{ color: 'var(--fin-text-faint)' }}>{i.type} · {formatDateShort(i.date)}</p>
                  </div>
                  <span className="ml-auto font-bold whitespace-nowrap" style={{ color: 'var(--fin-text)' }}>{formatINR(i.amount)}</span>
                  <button
                    onClick={() => { if (confirm('Delete this investment entry?')) deleteItem('investments', i.id); }}
                    aria-label="Delete" style={{ color: 'var(--fin-bad)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      {adding && (
        <Modal title="Add investment" onClose={() => setAdding(false)}>
          <InvestmentForm
            onSave={async (inv) => {
              await addItem('investments', inv);
              setAdding(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function InvestmentForm({ onSave }: { onSave: (inv: Omit<Investment, 'id'>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('SIP');
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) {
      setError('Give the investment a name and an amount above zero.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), type, date, amount: parsed });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="fin-label">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="fin-input" placeholder="e.g. Nifty 50 Index Fund SIP" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as InvestmentType)} className="fin-input">
            {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="fin-label">Amount (₹)</label>
          <input type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} className="fin-input" placeholder="0" />
        </div>
      </div>
      <div>
        <label className="fin-label">Date</label>
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="fin-input" />
      </div>
      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--fin-bad)', background: 'var(--fin-bad-bg)' }}>{error}</p>
      )}
      <button type="submit" disabled={busy} className="fin-btn-primary w-full">
        {busy ? 'Saving…' : 'Save investment'}
      </button>
    </form>
  );
}
