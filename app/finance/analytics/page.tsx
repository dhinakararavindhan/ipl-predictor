'use client';

import { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ChartCard, StatCard } from '@/components/finance/cards';
import { CATEGORY_COLORS, PALETTE } from '@/lib/finance/constants';
import { formatINR, formatINRCompact, formatMonthTick, lastMonths } from '@/lib/finance/format';
import { expensesInMonth, incomeInMonth, investedInMonth, spendByCategory } from '@/lib/finance/metrics';
import { useFinance } from '@/lib/finance/store';
import { IndianRupee, PiggyBank, TrendingUp, Calendar } from 'lucide-react';

const AXIS_TICK = { fontSize: 10, fill: 'var(--fin-text-faint)' } as const;

export default function AnalyticsPage() {
  const { data, month } = useFinance();

  const a = useMemo(() => {
    const months = lastMonths(month, 12);
    const rows = months.map((m) => {
      const income = incomeInMonth(data, m);
      const expenses = expensesInMonth(data, m);
      return {
        month: m, income, expenses,
        invested: investedInMonth(data, m),
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      };
    });
    const totalIncome = rows.reduce((x, r) => x + r.income, 0);
    const totalExpenses = rows.reduce((x, r) => x + r.expenses, 0);

    // Category trends: top 3 categories over the window keep their fixed colors.
    // Three series validates all-pairs for line charts; the rest fold away.
    const catTotals = new Map<string, number>();
    for (const m of months) {
      for (const c of spendByCategory(data, m)) {
        catTotals.set(c.category, (catTotals.get(c.category) ?? 0) + c.amount);
      }
    }
    const topCats = [...catTotals.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([c]) => c);
    const catRows = months.map((m) => {
      const slices = new Map(spendByCategory(data, m).map((s) => [s.category, s.amount]));
      return { month: m, ...Object.fromEntries(topCats.map((c) => [c, slices.get(c) ?? 0])) };
    });

    return {
      rows, totalIncome, totalExpenses,
      totalInvested: rows.reduce((x, r) => x + r.invested, 0),
      avgSavingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      topCats, catRows,
    };
  }, [data, month]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold" style={{ color: 'var(--fin-text)' }}>
        Analytics <span className="text-sm font-medium" style={{ color: 'var(--fin-text-muted)' }}>· last 12 months</span>
      </h2>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={IndianRupee} iconColor={PALETTE.green} title="Total earned" value={formatINR(a.totalIncome)} sub="12 months" />
        <StatCard icon={Calendar} iconColor={PALETTE.red} title="Total spent" value={formatINR(a.totalExpenses)} sub="12 months" />
        <StatCard icon={TrendingUp} iconColor={PALETTE.violet} title="Total invested" value={formatINR(a.totalInvested)} sub="12 months" />
        <StatCard icon={PiggyBank} iconColor={PALETTE.blue} title="Avg savings rate" value={`${a.avgSavingsRate.toFixed(1)}%`} sub="12 months" />
      </div>

      <ChartCard title="Income vs Expenses" subtitle="(by month)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={a.rows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }} barGap={2}>
            <CartesianGrid stroke="var(--fin-track)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickFormatter={formatMonthTick} tick={AXIS_TICK} axisLine={{ stroke: 'var(--fin-border)' }} tickLine={false} />
            <YAxis tickFormatter={formatINRCompact} tick={AXIS_TICK} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              cursor={{ fill: 'var(--fin-track)', opacity: 0.4 }}
              contentStyle={{ background: 'var(--fin-card)', border: '1px solid var(--fin-border)', borderRadius: 8, fontSize: 12 }}
              labelFormatter={(l) => formatMonthTick(String(l))}
              formatter={(value, name) => [formatINR(Number(value)), name === 'income' ? 'Income' : 'Expenses']}
            />
            <Bar dataKey="income" name="income" fill={PALETTE.aqua} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="expenses" name="expenses" fill={PALETTE.orange} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1 text-[10.5px]" style={{ color: 'var(--fin-text-muted)' }}>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: PALETTE.aqua }} /> Income</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: PALETTE.orange }} /> Expenses</span>
        </div>
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-3">
        <ChartCard title="Savings rate" subtitle="(% of income saved each month)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={a.rows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--fin-track)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickFormatter={formatMonthTick} tick={AXIS_TICK} axisLine={{ stroke: 'var(--fin-border)' }} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
              <YAxis tickFormatter={(v: number) => `${v}%`} tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} domain={[0, 100]} />
              <Tooltip
                cursor={{ stroke: 'var(--fin-text-faint)', strokeDasharray: '3 3' }}
                contentStyle={{ background: 'var(--fin-card)', border: '1px solid var(--fin-border)', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(l) => formatMonthTick(String(l))}
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Savings rate']}
              />
              <Line type="monotone" dataKey="savingsRate" stroke={PALETTE.blue} strokeWidth={2} dot={{ r: 3, fill: PALETTE.blue, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top category trends" subtitle="(top 3 categories by 12-month spend)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={a.catRows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--fin-track)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickFormatter={formatMonthTick} tick={AXIS_TICK} axisLine={{ stroke: 'var(--fin-border)' }} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
              <YAxis tickFormatter={formatINRCompact} tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                cursor={{ stroke: 'var(--fin-text-faint)', strokeDasharray: '3 3' }}
                contentStyle={{ background: 'var(--fin-card)', border: '1px solid var(--fin-border)', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(l) => formatMonthTick(String(l))}
                formatter={(value, name) => [formatINR(Number(value)), String(name)]}
              />
              {a.topCats.map((c) => (
                <Line
                  key={c} type="monotone" dataKey={c}
                  stroke={CATEGORY_COLORS[c] ?? PALETTE.gray} strokeWidth={2}
                  dot={false} activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-1 text-[10.5px]" style={{ color: 'var(--fin-text-muted)' }}>
            {a.topCats.map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c] ?? PALETTE.gray }} />
                {c}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
