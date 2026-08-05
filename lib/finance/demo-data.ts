import { EXPENSE_CATEGORIES, SUBCATEGORIES } from './constants';
import { addMonths, daysInMonth, lastMonths, monthKey, parseMonthKey } from './format';
import type { FinanceData, PaymentMode, Transaction } from './types';

// Deterministic PRNG so demo mode renders the same data on every load.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Long-run share of spending per category (mirrors a typical family budget).
const CATEGORY_WEIGHTS: Record<string, number> = {
  Groceries: 0.196,
  Baby: 0.168,
  'Eating Out': 0.122,
  Shopping: 0.119,
  Utilities: 0.086,
  Transport: 0.073,
  Health: 0.064,
  Entertainment: 0.048,
  Others: 0.124,
};

const MONTHLY_BUDGETS: Record<string, number> = {
  Groceries: 10_000,
  Baby: 9_000,
  'Eating Out': 6_250,
  Shopping: 5_000,
  Utilities: 5_500,
  Transport: 4_800,
  Health: 3_400,
  Entertainment: 3_000,
  Others: 4_500,
};

const MODE_WEIGHTS: Array<[PaymentMode, number]> = [
  ['UPI', 0.40],
  ['Credit Card', 0.36],
  ['Debit Card', 0.13],
  ['Auto Debit', 0.10],
  ['Cash', 0.01],
];

function pickMode(rand: () => number): PaymentMode {
  const r = rand();
  let acc = 0;
  for (const [mode, w] of MODE_WEIGHTS) {
    acc += w;
    if (r <= acc) return mode;
  }
  return 'UPI';
}

/**
 * Builds ~13 months of realistic finance data ending at the current month.
 * `today` is injected so the generator itself stays deterministic.
 */
export function generateDemoData(today: Date): FinanceData {
  const rand = mulberry32(42);
  let idCounter = 0;
  const id = () => `demo-${++idCounter}`;

  const currentMonth = monthKey(today.getFullYear(), today.getMonth());
  const months = lastMonths(currentMonth, 13);
  const transactions: Transaction[] = [];
  const investments: FinanceData['investments'] = [];
  const budgets: FinanceData['budgets'] = [];

  months.forEach((mk, i) => {
    const { year, monthIndex } = parseMonthKey(mk);
    const dim = daysInMonth(mk);
    const progress = i / (months.length - 1); // 0 → oldest, 1 → current month
    const date = (day: number) => `${mk}-${String(Math.min(day, dim)).padStart(2, '0')}`;

    // Income: salary credited on the 1st, grows over the year; interest quarterly.
    const salary = Math.round((104_000 + progress * 12_000 + (rand() - 0.5) * 2_000) / 100) * 100;
    transactions.push({
      id: id(), date: date(1), type: 'income', category: 'Salary',
      amount: salary, paymentMode: 'Auto Debit', note: 'Monthly salary credit',
    });
    if (monthIndex % 3 === 0) {
      transactions.push({
        id: id(), date: date(15), type: 'income', category: 'Interest',
        amount: Math.round(2_500 + rand() * 2_000), paymentMode: 'Auto Debit', note: 'FD interest payout',
      });
    }
    if (rand() < 0.35) {
      transactions.push({
        id: id(), date: date(20), type: 'income', category: 'Freelance',
        amount: Math.round(3_000 + rand() * 5_000), paymentMode: 'UPI', note: 'Side project',
      });
    }

    // Expenses: total spend drifts upward across the year with monthly noise.
    const monthTotal = 33_000 + progress * 16_000 + (rand() - 0.5) * 4_000;
    for (const category of EXPENSE_CATEGORIES) {
      const catTotal = monthTotal * CATEGORY_WEIGHTS[category] * (0.85 + rand() * 0.3);
      const txCount = 2 + Math.floor(rand() * 4);
      const subs = SUBCATEGORIES[category];
      let remaining = catTotal;
      for (let t = 0; t < txCount; t++) {
        const isLast = t === txCount - 1;
        const amount = Math.max(50, Math.round(isLast ? remaining : remaining * (0.2 + rand() * 0.4)));
        remaining -= amount;
        transactions.push({
          id: id(),
          date: date(2 + Math.floor(rand() * (dim - 3))),
          type: 'expense',
          category,
          subcategory: subs[Math.floor(rand() * subs.length)],
          amount,
          paymentMode: pickMode(rand),
        });
        if (remaining <= 50) break;
      }
    }

    // Budgets are set for every month in the demo.
    for (const category of EXPENSE_CATEGORIES) {
      budgets.push({ id: id(), month: mk, category, amount: MONTHLY_BUDGETS[category] });
    }

    // Investments: SIP + SSY every month, stocks now and then.
    investments.push({ id: id(), date: date(5), name: 'Nifty 50 Index Fund SIP', type: 'SIP', amount: 14_000 });
    investments.push({ id: id(), date: date(10), name: 'Sukanya Samriddhi Yojana', type: 'SSY', amount: 10_000 });
    if (rand() < 0.4) {
      investments.push({
        id: id(), date: date(18), name: 'Direct stocks', type: 'Stocks',
        amount: Math.round((2_000 + rand() * 6_000) / 500) * 500,
      });
    }
    void year;
  });

  // Card dues land within the coming week so the dashboard reminders light up.
  const soon = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  return {
    transactions,
    budgets,
    investments,
    goals: [
      { id: id(), name: 'Emergency Fund', icon: '🛡️', targetAmount: 3_00_000, savedAmount: 2_20_000 },
      { id: id(), name: 'Sukanya Samriddhi (SSY)', icon: '👧', targetAmount: 1_50_000, savedAmount: 1_20_000, annualTarget: 1_50_000 },
      { id: id(), name: 'Family Vacation', icon: '✈️', targetAmount: 1_20_000, savedAmount: 68_000, targetDate: addMonths(currentMonth, 5) + '-15' },
      { id: id(), name: "Child's Education", icon: '🎓', targetAmount: 10_00_000, savedAmount: 1_85_000 },
    ],
    creditCards: [
      { id: id(), name: 'Millennia Credit Card', bank: 'HDFC', dueAmount: 8_200, dueDate: soon(5), creditLimit: 1_50_000, autopay: false },
      { id: id(), name: 'Amazon Pay Card', bank: 'ICICI', dueAmount: 3_450, dueDate: soon(16), creditLimit: 1_00_000, autopay: true },
    ],
    emis: [
      { id: id(), name: 'Car Loan EMI', monthlyAmount: 12_450, dueDay: Math.min(28, today.getDate() + 4), remainingMonths: 28, totalMonths: 60, interestRate: 8.7 },
      { id: id(), name: 'Phone EMI', monthlyAmount: 3_500, dueDay: Math.min(28, today.getDate() + 6), remainingMonths: 5, totalMonths: 12, interestRate: 0 },
    ],
    assets: [
      { id: id(), name: 'Salary Account', type: 'bank', value: 1_45_230 },
      { id: id(), name: 'Emergency Fund (Liquid Fund)', type: 'emergency', value: 2_20_000 },
      { id: id(), name: 'Cash in hand', type: 'cash', value: 8_000 },
      { id: id(), name: 'Mutual fund corpus (pre-tracking)', type: 'other', value: 9_80_000 },
      { id: id(), name: 'Gold jewellery', type: 'gold', value: 2_40_000 },
      { id: id(), name: 'Car loan outstanding', type: 'liability', value: 3_10_000 },
    ],
  };
}
