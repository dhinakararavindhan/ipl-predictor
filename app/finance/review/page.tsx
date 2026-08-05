'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ChartCard, ProgressBar } from '@/components/finance/cards';
import { CATEGORY_COLORS, CATEGORY_ICONS, PALETTE } from '@/lib/finance/constants';
import { addMonths, formatINR, formatMonthKey } from '@/lib/finance/format';
import {
  budgetVsActual, expensesInMonth, incomeInMonth, investedInMonth,
  quickInsights, spendByCategory,
} from '@/lib/finance/metrics';
import { useFinance } from '@/lib/finance/store';

export default function MonthlyReviewPage() {
  const { data, month } = useFinance();
  const prev = addMonths(month, -1);
  const today = useMemo(() => new Date(), []);

  const r = useMemo(() => {
    const income = incomeInMonth(data, month);
    const expenses = expensesInMonth(data, month);
    const invested = investedInMonth(data, month);
    const savings = income - expenses;
    return {
      income, expenses, invested, savings,
      savingsRate: income > 0 ? (savings / income) * 100 : 0,
      prevIncome: incomeInMonth(data, prev),
      prevExpenses: expensesInMonth(data, prev),
      prevInvested: investedInMonth(data, prev),
      categories: spendByCategory(data, month),
      budgetRows: budgetVsActual(data, month).filter((b) => b.budget > 0),
      insights: quickInsights(data, month, today),
    };
  }, [data, month, prev, today]);

  const overBudget = r.budgetRows.filter((b) => b.diff < 0);
  const withinBudget = r.budgetRows.filter((b) => b.diff >= 0 && b.actual > 0);
  const compliance = r.budgetRows.length > 0 ? (withinBudget.length / r.budgetRows.length) * 100 : 0;

  const scoreParts = [
    { label: 'Savings rate ≥ 20%', pass: r.savingsRate >= 20 },
    { label: 'Stayed within budget in most categories', pass: compliance >= 60 },
    { label: 'Invested something this month', pass: r.invested > 0 },
    { label: 'Spent less than last month', pass: r.prevExpenses === 0 || r.expenses <= r.prevExpenses },
  ];
  const score = scoreParts.filter((p) => p.pass).length;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold" style={{ color: 'var(--fin-text)' }}>
        Monthly Review <span className="text-sm font-medium" style={{ color: 'var(--fin-text-muted)' }}>· {formatMonthKey(month)}</span>
      </h2>

      {/* Month at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Earned', value: r.income, prev: r.prevIncome, color: 'var(--fin-good)' },
          { label: 'Spent', value: r.expenses, prev: r.prevExpenses, color: 'var(--fin-bad)' },
          { label: 'Saved', value: r.savings, prev: null, color: 'var(--fin-accent)' },
          { label: 'Invested', value: r.invested, prev: r.prevInvested, color: PALETTE.violet },
        ].map((item) => (
          <div key={item.label} className="fin-card p-3.5">
            <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--fin-text-muted)' }}>{item.label}</p>
            <p className="text-xl font-extrabold" style={{ color: item.color }}>{formatINR(item.value)}</p>
            {item.prev !== null && item.prev > 0 && (
              <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--fin-text-faint)' }}>
                {formatMonthKey(prev)}: {formatINR(item.prev)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Month health check */}
        <ChartCard title="Month health check" subtitle={`${score}/4`}>
          <ul className="space-y-2.5">
            {scoreParts.map((p) => (
              <li key={p.label} className="flex items-center gap-2.5 text-sm">
                {p.pass ? (
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0" style={{ color: 'var(--fin-good)' }} />
                ) : (
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" style={{ color: 'var(--fin-bad)' }} />
                )}
                <span style={{ color: 'var(--fin-text)' }}>{p.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--fin-text-muted)' }}>Savings rate</span>
              <span className="font-bold" style={{ color: 'var(--fin-text)' }}>{r.savingsRate.toFixed(1)}%</span>
            </div>
            <ProgressBar pct={r.savingsRate} color={r.savingsRate >= 20 ? 'var(--fin-good)' : PALETTE.yellow} />
          </div>
        </ChartCard>

        {/* Budget compliance */}
        <ChartCard title="Budget report" subtitle={`(${withinBudget.length} within · ${overBudget.length} over)`}>
          {r.budgetRows.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--fin-text-muted)' }}>
              No budgets set for this month.
            </p>
          ) : (
            <>
              {overBudget.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                  {overBudget.map((b) => (
                    <li key={b.category} className="flex justify-between text-xs rounded-lg px-3 py-2" style={{ background: 'var(--fin-bad-bg)' }}>
                      <span style={{ color: 'var(--fin-text)' }}>{CATEGORY_ICONS[b.category]} {b.category}</span>
                      <span className="font-bold" style={{ color: 'var(--fin-bad)' }}>over by {formatINR(-b.diff)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {withinBudget.length > 0 && (
                <ul className="space-y-1.5">
                  {withinBudget.slice(0, 5).map((b) => (
                    <li key={b.category} className="flex justify-between text-xs rounded-lg px-3 py-2" style={{ background: 'var(--fin-good-bg)' }}>
                      <span style={{ color: 'var(--fin-text)' }}>{CATEGORY_ICONS[b.category]} {b.category}</span>
                      <span className="font-bold" style={{ color: 'var(--fin-good)' }}>{formatINR(b.diff)} left</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </ChartCard>
      </div>

      {/* Where the money went */}
      <ChartCard title="Where the money went">
        {r.categories.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--fin-text-muted)' }}>No expenses this month.</p>
        ) : (
          <ul className="space-y-2.5">
            {r.categories
              .slice()
              .sort((a, b) => b.amount - a.amount)
              .map((c) => (
                <li key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--fin-text)' }}>{CATEGORY_ICONS[c.category]} {c.category}</span>
                    <span className="font-semibold" style={{ color: 'var(--fin-text)' }}>
                      {formatINR(c.amount)} <span style={{ color: 'var(--fin-text-faint)' }}>({c.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <ProgressBar pct={c.pct} color={CATEGORY_COLORS[c.category] ?? PALETTE.gray} height={6} />
                </li>
              ))}
          </ul>
        )}
      </ChartCard>

      {/* Insights */}
      <ChartCard title="Takeaways">
        <ul className="grid sm:grid-cols-2 gap-2">
          {r.insights.map((ins, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg p-2.5 text-xs"
              style={{ background: ins.tone === 'good' ? 'var(--fin-good-bg)' : 'var(--fin-bad-bg)', color: 'var(--fin-text)' }}
            >
              {ins.tone === 'good' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--fin-good)' }} />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--fin-bad)' }} />
              )}
              <span>
                {ins.text}{' '}
                <span className="font-bold" style={{ color: ins.tone === 'good' ? 'var(--fin-good)' : 'var(--fin-bad)' }}>
                  {ins.highlight}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}
