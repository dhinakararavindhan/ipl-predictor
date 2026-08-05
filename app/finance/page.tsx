'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Banknote, Calendar, CheckCircle2, CreditCard, IndianRupee,
  Landmark, PiggyBank, ReceiptText, ShieldCheck, Sparkles, Target, TrendingUp, Wallet,
} from 'lucide-react';
import { ChartCard, EmptyState, ProgressBar, StatCard } from '@/components/finance/cards';
import {
  BudgetVsActualBars, DonutWithLegend, NetWorthTrendChart, SpendingTrendChart,
} from '@/components/finance/charts';
import { Modal } from '@/components/finance/Modal';
import { CATEGORY_COLORS, CATEGORY_ICONS, PALETTE, PAYMENT_MODE_COLORS } from '@/lib/finance/constants';
import { addMonths, formatINR, formatMonthKey } from '@/lib/finance/format';
import {
  budgetVsActual, cardsDueSoon, cashAvailable, currentNetWorth, emergencyFundMonths,
  emisDueSoon, expensesInMonth, incomeInMonth, investedInMonth, momChange,
  netWorthTrend, paymentModeSplit, quickInsights, spendByCategory, spendBySubcategory,
  spendingTrend, ssyProgress,
} from '@/lib/finance/metrics';
import { useFinance } from '@/lib/finance/store';

export default function DashboardPage() {
  const { data, month } = useFinance();
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const prevMonth = addMonths(month, -1);
  const prevLabel = `vs ${formatMonthKey(prevMonth)}`;
  const today = useMemo(() => new Date(), []);

  const m = useMemo(() => {
    const income = incomeInMonth(data, month);
    const prevIncome = incomeInMonth(data, prevMonth);
    const expenses = expensesInMonth(data, month);
    const prevExpenses = expensesInMonth(data, prevMonth);
    const savings = income - expenses;
    const invested = investedInMonth(data, month);
    const nwPoints = netWorthTrend(data, month, 12);
    const netWorth = currentNetWorth(data);
    const cardsDue = cardsDueSoon(data, today);
    const emisDue = emisDueSoon(data, today);
    return {
      income, prevIncome, expenses, prevExpenses, savings, invested,
      savingsRate: income > 0 ? (savings / income) * 100 : 0,
      investmentRate: income > 0 ? (invested / income) * 100 : 0,
      netWorth,
      nwPoints,
      nwChange: nwPoints.length >= 2
        ? momChange(nwPoints[nwPoints.length - 1].value, nwPoints[nwPoints.length - 2].value)
        : null,
      cash: cashAvailable(data),
      efMonths: emergencyFundMonths(data, month),
      cardsDueTotal: cardsDue.reduce((a, c) => a + c.dueAmount, 0),
      emisDueTotal: emisDue.reduce((a, e) => a + e.monthlyAmount, 0),
      ssy: ssyProgress(data, month),
      trend: spendingTrend(data, month, 12),
      categories: spendByCategory(data, month),
      budgetRows: budgetVsActual(data, month).filter((r) => r.budget > 0 || r.actual > 0),
      modes: paymentModeSplit(data, month),
      insights: quickInsights(data, month, today),
    };
  }, [data, month, prevMonth, today]);

  const hasExpenses = m.categories.length > 0;
  const catSlices = m.categories.map((c) => ({
    name: c.category, value: c.amount, pct: c.pct,
    color: CATEGORY_COLORS[c.category] ?? PALETTE.gray,
  }));
  const top5 = [...m.categories].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const modeSlices = m.modes.map((s) => ({
    name: s.mode, value: s.amount, pct: s.pct, color: PAYMENT_MODE_COLORS[s.mode],
  }));

  return (
    <div className="space-y-3">
      {/* ── KPI row 1 ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          icon={IndianRupee} iconColor={PALETTE.green} title="Total Income"
          value={formatINR(m.income)}
          delta={{ label: prevLabel, pct: momChange(m.income, m.prevIncome), goodWhen: 'up' }}
        />
        <StatCard
          icon={Calendar} iconColor={PALETTE.red} title="Total Expenses"
          value={formatINR(m.expenses)}
          delta={{ label: prevLabel, pct: momChange(m.expenses, m.prevExpenses), goodWhen: 'down' }}
        />
        <StatCard
          icon={PiggyBank} iconColor={PALETTE.blue} title="Savings"
          value={formatINR(m.savings)}
          sub="Savings Rate" subValue={`${m.savingsRate.toFixed(1)}%`}
        />
        <StatCard
          icon={TrendingUp} iconColor={PALETTE.violet} title="Investments"
          value={formatINR(m.invested)}
          sub="Investment Rate" subValue={`${m.investmentRate.toFixed(1)}%`}
        />
        <StatCard
          icon={Landmark} iconColor={PALETTE.aqua} title="Net Worth"
          value={formatINR(m.netWorth)}
          delta={{ label: prevLabel, pct: m.nwChange, goodWhen: 'up' }}
        />
      </div>

      {/* ── KPI row 2 ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          icon={Wallet} iconColor={PALETTE.green} title="Cash Available"
          value={formatINR(m.cash)} sub="in Bank Accounts"
        />
        <StatCard
          icon={ShieldCheck} iconColor={PALETTE.blue} title="Emergency Fund"
          value={m.efMonths.toFixed(1)} sub="Months of Expenses"
        />
        <StatCard
          icon={CreditCard} iconColor={PALETTE.red} title="Credit Card Due"
          value={formatINR(m.cardsDueTotal)} sub="Due in next 7 days"
        />
        <StatCard
          icon={Banknote} iconColor={PALETTE.orange} title="Upcoming EMIs"
          value={formatINR(m.emisDueTotal)} sub="Due in next 7 days"
        />
        <StatCard
          icon={Target} iconColor={PALETTE.magenta} title="SSY Progress"
          value={m.ssy ? `${Math.round(m.ssy.pct)}%` : '—'} sub="of Annual Target"
        />
      </div>

      {/* ── Charts row 1 ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
        <ChartCard title="Monthly Spending Trend">
          <SpendingTrendChart points={m.trend} />
        </ChartCard>

        <ChartCard title="Expenses by Category" subtitle="(this month)">
          {hasExpenses ? (
            <DonutWithLegend
              slices={catSlices}
              centerValue={formatINR(m.expenses)}
              centerLabel="Total"
              onSliceClick={setDrillCategory}
            />
          ) : (
            <EmptyState
              message="No expenses recorded for this month yet."
              action={<Link href="/finance/transactions" className="fin-btn-primary">Add a transaction</Link>}
            />
          )}
        </ChartCard>

        <ChartCard title="Budget vs Actual" subtitle="(this month)" className="lg:col-span-2 xl:col-span-1">
          {m.budgetRows.length > 0 ? (
            <BudgetVsActualBars rows={m.budgetRows} />
          ) : (
            <EmptyState
              message="No budget set for this month."
              action={<Link href="/finance/budget" className="fin-btn-primary">Set a budget</Link>}
            />
          )}
        </ChartCard>
      </div>

      {/* ── Charts row 2 ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
        <ChartCard title="Top 5 Category / Sub Category" subtitle="(this month)">
          {top5.length > 0 ? (
            <ul className="space-y-2">
              {top5.map((c, i) => (
                <li key={c.category} className="flex items-center gap-2.5 text-xs">
                  <span className="w-4 text-center font-bold" style={{ color: 'var(--fin-text-faint)' }}>{i + 1}</span>
                  <span className="text-base leading-none">{CATEGORY_ICONS[c.category] ?? '📦'}</span>
                  <span className="truncate font-medium" style={{ color: 'var(--fin-text)' }}>
                    {c.category} <span style={{ color: 'var(--fin-text-faint)' }}>(All)</span>
                  </span>
                  <span className="ml-auto font-bold whitespace-nowrap" style={{ color: 'var(--fin-text)' }}>
                    {formatINR(c.amount)}
                  </span>
                  <span className="w-11 text-right" style={{ color: 'var(--fin-text-muted)' }}>
                    {c.pct.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => setDrillCategory(c.category)}
                    className="text-[10px] font-bold uppercase tracking-wide rounded px-2 py-1"
                    style={{ background: 'var(--fin-accent-bg)', color: 'var(--fin-accent)' }}
                  >
                    Drill down
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Nothing spent this month yet." />
          )}
        </ChartCard>

        <ChartCard title="Payment Mode Split" subtitle="(this month)">
          {modeSlices.length > 0 ? (
            <DonutWithLegend
              slices={modeSlices}
              centerValue={formatINR(m.expenses)}
              centerLabel="Total"
            />
          ) : (
            <EmptyState message="No expenses recorded for this month yet." />
          )}
        </ChartCard>

        <ChartCard title="Net Worth Trend" subtitle="(last 12 months)" className="lg:col-span-2 xl:col-span-1">
          <NetWorthTrendChart points={m.nwPoints} />
        </ChartCard>
      </div>

      {/* ── Quick insights ────────────────────────────────────────────── */}
      <div className="fin-card p-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--fin-text)' }}>
          <Sparkles className="w-4 h-4" style={{ color: 'var(--fin-accent)' }} />
          Quick Insights
        </h3>
        {m.insights.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            {m.insights.map((ins, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg p-2.5"
                style={{ background: ins.tone === 'good' ? 'var(--fin-good-bg)' : 'var(--fin-bad-bg)' }}
              >
                {ins.tone === 'good' ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--fin-good)' }} />
                ) : (
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--fin-bad)' }} />
                )}
                <p className="text-[11.5px] leading-snug" style={{ color: 'var(--fin-text)' }}>
                  {ins.text}{' '}
                  {ins.highlight && (
                    <span className="font-bold" style={{ color: ins.tone === 'good' ? 'var(--fin-good)' : 'var(--fin-bad)' }}>
                      {ins.highlight}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--fin-text-muted)' }}>
            Add transactions and budgets and insights will appear here.
          </p>
        )}
      </div>

      {/* ── Category drill-down ───────────────────────────────────────── */}
      {drillCategory && (
        <Modal
          title={`${CATEGORY_ICONS[drillCategory] ?? ''} ${drillCategory} — ${formatMonthKey(month)}`}
          onClose={() => setDrillCategory(null)}
        >
          <DrillDown category={drillCategory} />
        </Modal>
      )}
    </div>
  );
}

function DrillDown({ category }: { category: string }) {
  const { data, month } = useFinance();
  const subs = spendBySubcategory(data, month, category);
  const total = subs.reduce((a, s) => a + s.amount, 0);
  const color = CATEGORY_COLORS[category] ?? PALETTE.gray;
  const txs = data.transactions
    .filter((t) => t.type === 'expense' && t.category === category && t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (subs.length === 0) {
    return <EmptyState message="No spending in this category this month." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--fin-text-muted)' }}>
          Total spent: <span className="font-bold" style={{ color: 'var(--fin-text)' }}>{formatINR(total)}</span>
          {' · '}{txs.length} transaction{txs.length === 1 ? '' : 's'}
        </p>
        <ul className="space-y-2.5">
          {subs.map((s) => (
            <li key={s.subcategory}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: 'var(--fin-text)' }}>{s.subcategory}</span>
                <span className="font-semibold" style={{ color: 'var(--fin-text)' }}>
                  {formatINR(s.amount)}{' '}
                  <span style={{ color: 'var(--fin-text-faint)' }}>({s.pct.toFixed(1)}%)</span>
                </span>
              </div>
              <ProgressBar pct={s.pct} color={color} height={6} />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--fin-text-muted)' }}>
          <ReceiptText className="w-3.5 h-3.5" /> Transactions
        </p>
        <ul className="divide-y" style={{ borderColor: 'var(--fin-border)' }}>
          {txs.map((t) => (
            <li key={t.id} className="flex items-center gap-2 py-1.5 text-xs" style={{ borderColor: 'var(--fin-border)' }}>
              <span className="w-14 shrink-0" style={{ color: 'var(--fin-text-faint)' }}>{t.date.slice(8)}/{t.date.slice(5, 7)}</span>
              <span className="truncate" style={{ color: 'var(--fin-text)' }}>{t.subcategory ?? t.note ?? '—'}</span>
              <span className="ml-auto font-semibold whitespace-nowrap" style={{ color: 'var(--fin-text)' }}>{formatINR(t.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
