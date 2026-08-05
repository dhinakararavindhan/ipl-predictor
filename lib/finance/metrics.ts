import { EXPENSE_CATEGORIES } from './constants';
import { addMonths, lastMonths, monthKeyOfDate, parseMonthKey } from './format';
import type { FinanceData, PaymentMode, Transaction } from './types';

// All functions here are pure: (data, month) → numbers the UI renders.

export function transactionsInMonth(data: FinanceData, month: string): Transaction[] {
  return data.transactions.filter((t) => monthKeyOfDate(t.date) === month);
}

export function incomeInMonth(data: FinanceData, month: string): number {
  return sum(transactionsInMonth(data, month).filter((t) => t.type === 'income'));
}

export function expensesInMonth(data: FinanceData, month: string): number {
  return sum(transactionsInMonth(data, month).filter((t) => t.type === 'expense'));
}

export function investedInMonth(data: FinanceData, month: string): number {
  return data.investments
    .filter((i) => monthKeyOfDate(i.date) === month)
    .reduce((acc, i) => acc + i.amount, 0);
}

function sum(txs: Transaction[]): number {
  return txs.reduce((acc, t) => acc + t.amount, 0);
}

/** Percent change vs the previous month; null when there is no baseline. */
export function momChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface CategorySlice {
  category: string;
  amount: number;
  pct: number;
}

export function spendByCategory(data: FinanceData, month: string): CategorySlice[] {
  const txs = transactionsInMonth(data, month).filter((t) => t.type === 'expense');
  const total = sum(txs);
  const byCat = new Map<string, number>();
  for (const t of txs) byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
  // Fixed category order keeps colors stable; unknown categories fold in at the end.
  const known = EXPENSE_CATEGORIES.filter((c) => byCat.has(c));
  const unknown = [...byCat.keys()].filter((c) => !(EXPENSE_CATEGORIES as readonly string[]).includes(c));
  return [...known, ...unknown].map((category) => {
    const amount = byCat.get(category)!;
    return { category, amount, pct: total > 0 ? (amount / total) * 100 : 0 };
  });
}

export interface SubcategorySlice {
  subcategory: string;
  amount: number;
  pct: number;
}

export function spendBySubcategory(data: FinanceData, month: string, category: string): SubcategorySlice[] {
  const txs = transactionsInMonth(data, month).filter(
    (t) => t.type === 'expense' && t.category === category
  );
  const total = sum(txs);
  const bySub = new Map<string, number>();
  for (const t of txs) {
    const key = t.subcategory ?? 'Unspecified';
    bySub.set(key, (bySub.get(key) ?? 0) + t.amount);
  }
  return [...bySub.entries()]
    .map(([subcategory, amount]) => ({ subcategory, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export interface BudgetRow {
  category: string;
  budget: number;
  actual: number;
  diff: number; // positive = money left, negative = over budget
}

export function budgetVsActual(data: FinanceData, month: string): BudgetRow[] {
  const actuals = new Map(spendByCategory(data, month).map((s) => [s.category, s.amount]));
  const budgets = new Map(
    data.budgets.filter((b) => b.month === month).map((b) => [b.category, b.amount])
  );
  const categories = [...new Set([...budgets.keys(), ...actuals.keys()])];
  const order = (c: string) => {
    const i = (EXPENSE_CATEGORIES as readonly string[]).indexOf(c);
    return i === -1 ? 999 : i;
  };
  return categories
    .sort((a, b) => order(a) - order(b))
    .map((category) => {
      const budget = budgets.get(category) ?? 0;
      const actual = actuals.get(category) ?? 0;
      return { category, budget, actual, diff: budget - actual };
    });
}

export interface TrendPoint {
  month: string;
  value: number;
}

export function spendingTrend(data: FinanceData, endMonth: string, count = 12): TrendPoint[] {
  return lastMonths(endMonth, count).map((m) => ({ month: m, value: expensesInMonth(data, m) }));
}

export function paymentModeSplit(data: FinanceData, month: string): Array<{ mode: PaymentMode; amount: number; pct: number }> {
  const txs = transactionsInMonth(data, month).filter((t) => t.type === 'expense');
  const total = sum(txs);
  const byMode = new Map<PaymentMode, number>();
  for (const t of txs) byMode.set(t.paymentMode, (byMode.get(t.paymentMode) ?? 0) + t.amount);
  return [...byMode.entries()]
    .map(([mode, amount]) => ({ mode, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

// ── Net worth ────────────────────────────────────────────────────────────────

export function totalInvested(data: FinanceData): number {
  return data.investments.reduce((acc, i) => acc + i.amount, 0);
}

export function cashAvailable(data: FinanceData): number {
  return data.assets
    .filter((a) => a.type === 'bank' || a.type === 'cash')
    .reduce((acc, a) => acc + a.value, 0);
}

export function emergencyFund(data: FinanceData): number {
  return data.assets.filter((a) => a.type === 'emergency').reduce((acc, a) => acc + a.value, 0);
}

/** Emergency fund expressed in months of typical spend (3-month average). */
export function emergencyFundMonths(data: FinanceData, month: string): number {
  const recent = lastMonths(month, 3).map((m) => expensesInMonth(data, m)).filter((v) => v > 0);
  if (recent.length === 0) return 0;
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  return avg > 0 ? emergencyFund(data) / avg : 0;
}

export function currentNetWorth(data: FinanceData): number {
  const own = data.assets
    .filter((a) => a.type !== 'liability')
    .reduce((acc, a) => acc + a.value, 0);
  const owed = data.assets
    .filter((a) => a.type === 'liability')
    .reduce((acc, a) => acc + a.value, 0);
  const cardDues = data.creditCards.reduce((acc, c) => acc + c.dueAmount, 0);
  return own + totalInvested(data) - owed - cardDues;
}

/**
 * Month-end net worth for the trailing window, derived backwards from today:
 * each earlier month-end is the later one minus that month's savings
 * (income − expenses). Investing moves money between pockets, so it does not
 * change net worth and is deliberately not subtracted.
 */
export function netWorthTrend(data: FinanceData, endMonth: string, count = 12): TrendPoint[] {
  const months = lastMonths(endMonth, count);
  const values = new Array<number>(count);
  let nw = currentNetWorth(data);
  for (let i = count - 1; i >= 0; i--) {
    values[i] = nw;
    const m = months[i];
    nw -= incomeInMonth(data, m) - expensesInMonth(data, m);
  }
  return months.map((month, i) => ({ month, value: values[i] }));
}

// ── Dues in the coming week ─────────────────────────────────────────────────

export function cardsDueSoon(data: FinanceData, today: Date, days = 7) {
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  const end = endDate.toISOString().slice(0, 10);
  return data.creditCards.filter((c) => c.dueAmount > 0 && c.dueDate >= start && c.dueDate <= end);
}

export function emisDueSoon(data: FinanceData, today: Date, days = 7) {
  return data.emis.filter((e) => {
    if (e.remainingMonths <= 0) return false;
    const due = new Date(today.getFullYear(), today.getMonth(), e.dueDay);
    if (due < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      due.setMonth(due.getMonth() + 1);
    }
    const diff = (due.getTime() - today.getTime()) / 86_400_000;
    return diff <= days;
  });
}

// ── SSY progress ─────────────────────────────────────────────────────────────

/** Indian financial year (Apr–Mar) key for a month, e.g. '2026-07' → '2026'. */
function fyStartYear(month: string): number {
  const { year, monthIndex } = parseMonthKey(month);
  return monthIndex >= 3 ? year : year - 1;
}

export function ssyProgress(data: FinanceData, month: string): { pct: number; contributed: number; target: number } | null {
  const goal = data.goals.find((g) => g.annualTarget && g.annualTarget > 0);
  if (!goal) return null;
  const fy = fyStartYear(month);
  const contributed = data.investments
    .filter((i) => i.type === 'SSY' && fyStartYear(monthKeyOfDate(i.date)) === fy)
    .reduce((acc, i) => acc + i.amount, 0);
  const target = goal.annualTarget!;
  return { pct: Math.min(100, (contributed / target) * 100), contributed, target };
}

// ── Quick insights ───────────────────────────────────────────────────────────

export type InsightTone = 'good' | 'warn';

export interface Insight {
  tone: InsightTone;
  text: string;
  highlight?: string;
}

export function quickInsights(data: FinanceData, month: string, today: Date): Insight[] {
  const insights: Insight[] = [];
  const prev = addMonths(month, -1);

  const rows = budgetVsActual(data, month).filter((r) => r.budget > 0);
  const under = rows.filter((r) => r.diff >= 0 && r.actual > 0)
    .sort((a, b) => b.diff / b.budget - a.diff / a.budget)[0];
  const over = rows.filter((r) => r.diff < 0).sort((a, b) => a.diff - b.diff)[0];
  if (under) {
    const pctUnder = ((under.diff / under.budget) * 100).toFixed(1);
    insights.push({ tone: 'good', text: `${under.category} spend is`, highlight: `${pctUnder}% below budget` });
  }
  if (over) {
    insights.push({ tone: 'warn', text: `${over.category} exceeded budget by`, highlight: `₹${Math.round(-over.diff).toLocaleString('en-IN')}` });
  }

  const income = incomeInMonth(data, month);
  const prevIncome = incomeInMonth(data, prev);
  const rate = income > 0 ? ((income - expensesInMonth(data, month)) / income) * 100 : 0;
  const prevRate = prevIncome > 0 ? ((prevIncome - expensesInMonth(data, prev)) / prevIncome) * 100 : 0;
  if (prevIncome > 0 && income > 0) {
    const delta = rate - prevRate;
    insights.push(
      delta >= 0
        ? { tone: 'good', text: 'Savings rate improved by', highlight: `${delta.toFixed(1)}% vs last month` }
        : { tone: 'warn', text: 'Savings rate dropped by', highlight: `${Math.abs(delta).toFixed(1)}% vs last month` }
    );
  }

  const overdue = data.creditCards.filter(
    (c) => c.dueAmount > 0 && c.dueDate < today.toISOString().slice(0, 10)
  );
  insights.push(
    overdue.length === 0
      ? { tone: 'good', text: 'All credit card bills are', highlight: 'paid on time' }
      : { tone: 'warn', text: `${overdue.length} credit card bill${overdue.length > 1 ? 's' : ''}`, highlight: 'overdue' }
  );

  const trend = netWorthTrend(data, month, 2);
  if (trend.length === 2 && trend[0].value > 0) {
    const diff = trend[1].value - trend[0].value;
    const pct = ((diff / trend[0].value) * 100).toFixed(1);
    if (diff >= 0) {
      insights.push({ tone: 'good', text: 'Net worth increased by', highlight: `₹${Math.round(diff).toLocaleString('en-IN')} (${pct}%)` });
    } else {
      insights.push({ tone: 'warn', text: 'Net worth decreased by', highlight: `₹${Math.round(-diff).toLocaleString('en-IN')}` });
    }
  }

  const ssy = ssyProgress(data, month);
  if (ssy) {
    insights.push(
      ssy.pct >= 60
        ? { tone: 'good', text: 'SSY is on track to meet', highlight: 'annual target' }
        : { tone: 'warn', text: 'SSY needs', highlight: `₹${Math.round(ssy.target - ssy.contributed).toLocaleString('en-IN')} more this FY` }
    );
  }

  return insights.slice(0, 6);
}
