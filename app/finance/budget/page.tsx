'use client';

import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { ChartCard, ProgressBar } from '@/components/finance/cards';
import { CATEGORY_ICONS, EXPENSE_CATEGORIES } from '@/lib/finance/constants';
import { addMonths, formatINR, formatMonthKey } from '@/lib/finance/format';
import { budgetVsActual } from '@/lib/finance/metrics';
import { useFinance } from '@/lib/finance/store';

export default function BudgetPage() {
  const { data, month, addItem, updateItem, deleteItem } = useFinance();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const prevMonth = addMonths(month, -1);

  const monthBudgets = useMemo(
    () => new Map(data.budgets.filter((b) => b.month === month).map((b) => [b.category, b])),
    [data.budgets, month]
  );
  const prevBudgets = data.budgets.filter((b) => b.month === prevMonth);
  const rows = budgetVsActual(data, month);
  const actuals = new Map(rows.map((r) => [r.category, r.actual]));

  const totalBudget = [...monthBudgets.values()].reduce((a, b) => a + b.amount, 0);
  const totalActual = rows.reduce((a, r) => a + r.actual, 0);

  async function save(category: string) {
    const raw = drafts[category];
    if (raw === undefined) return;
    const value = Number(raw);
    const existing = monthBudgets.get(category);
    if (!raw.trim() || value <= 0) {
      if (existing) await deleteItem('budgets', existing.id);
    } else if (existing) {
      if (existing.amount !== value) await updateItem('budgets', existing.id, { amount: value });
    } else {
      await addItem('budgets', { month, category, amount: value });
    }
    setDrafts((d) => {
      const next = { ...d };
      delete next[category];
      return next;
    });
  }

  async function copyFromPrevious() {
    for (const b of prevBudgets) {
      const existing = monthBudgets.get(b.category);
      if (existing) await updateItem('budgets', existing.id, { amount: b.amount });
      else await addItem('budgets', { month, category: b.category, amount: b.amount });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold mr-auto" style={{ color: 'var(--fin-text)' }}>
          Budget <span className="text-sm font-medium" style={{ color: 'var(--fin-text-muted)' }}>· {formatMonthKey(month)}</span>
        </h2>
        {prevBudgets.length > 0 && (
          <button onClick={copyFromPrevious} className="fin-btn-ghost flex items-center gap-1.5">
            <Copy className="w-4 h-4" /> Copy from {formatMonthKey(prevMonth)}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="fin-card p-3.5">
          <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--fin-text-muted)' }}>Total budget</p>
          <p className="text-xl font-extrabold" style={{ color: 'var(--fin-text)' }}>{formatINR(totalBudget)}</p>
        </div>
        <div className="fin-card p-3.5">
          <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--fin-text-muted)' }}>Spent so far</p>
          <p className="text-xl font-extrabold" style={{ color: 'var(--fin-text)' }}>{formatINR(totalActual)}</p>
        </div>
        <div className="fin-card p-3.5">
          <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--fin-text-muted)' }}>Left to spend</p>
          <p
            className="text-xl font-extrabold"
            style={{ color: totalBudget - totalActual >= 0 ? 'var(--fin-good)' : 'var(--fin-bad)' }}
          >
            {formatINR(totalBudget - totalActual)}
          </p>
        </div>
      </div>

      <ChartCard title="Category budgets" subtitle="Set how much you plan to spend — progress fills as you add expenses">
        <ul className="divide-y" style={{ borderColor: 'var(--fin-border)' }}>
          {EXPENSE_CATEGORIES.map((category) => {
            const budget = monthBudgets.get(category);
            const actual = actuals.get(category) ?? 0;
            const amount = budget?.amount ?? 0;
            const pct = amount > 0 ? (actual / amount) * 100 : 0;
            const over = amount > 0 && actual > amount;
            const draft = drafts[category];
            return (
              <li key={category} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-40 text-sm font-medium" style={{ color: 'var(--fin-text)' }}>
                    {CATEGORY_ICONS[category]} {category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: 'var(--fin-text-muted)' }}>₹</span>
                    <input
                      type="number" min={0}
                      value={draft ?? (budget ? String(budget.amount) : '')}
                      placeholder="No budget"
                      onChange={(e) => setDrafts((d) => ({ ...d, [category]: e.target.value }))}
                      onBlur={() => save(category)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      className="fin-input !w-28 !py-1.5"
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    {amount > 0 ? (
                      <ProgressBar pct={pct} color={over ? 'var(--fin-bad)' : 'var(--fin-good)'} />
                    ) : (
                      <p className="text-[11px]" style={{ color: 'var(--fin-text-faint)' }}>Set a budget to track this category</p>
                    )}
                  </div>
                  <span className="w-40 text-right text-xs whitespace-nowrap" style={{ color: 'var(--fin-text-muted)' }}>
                    Spent <span className="font-bold" style={{ color: over ? 'var(--fin-bad)' : 'var(--fin-text)' }}>{formatINR(actual)}</span>
                    {amount > 0 && <> of {formatINR(amount)}</>}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </ChartCard>
    </div>
  );
}
