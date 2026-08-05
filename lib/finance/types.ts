// ── Personal Finance Tracker — core domain types ─────────────────────────────

export type TransactionType = 'income' | 'expense';

export type PaymentMode = 'UPI' | 'Credit Card' | 'Debit Card' | 'Auto Debit' | 'Cash';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  subcategory?: string;
  amount: number;
  paymentMode: PaymentMode;
  note?: string;
}

/** One budget line: how much is planned for a category in a given month. */
export interface Budget {
  id: string;
  month: string; // YYYY-MM
  category: string;
  amount: number;
}

export type InvestmentType =
  | 'SIP'
  | 'Stocks'
  | 'FD'
  | 'PPF'
  | 'SSY'
  | 'NPS'
  | 'Gold'
  | 'Other';

/** A contribution made into an investment on a date. */
export interface Investment {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: InvestmentType;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  icon?: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string; // YYYY-MM-DD
  /** Optional yearly contribution target (used for SSY-style schemes). */
  annualTarget?: number;
}

export interface CreditCard {
  id: string;
  name: string;
  bank?: string;
  dueAmount: number;
  dueDate: string; // YYYY-MM-DD
  creditLimit?: number;
  autopay?: boolean;
}

export interface Emi {
  id: string;
  name: string;
  monthlyAmount: number;
  /** Day of month the EMI is debited (1–28). */
  dueDay: number;
  remainingMonths: number;
  totalMonths?: number;
  interestRate?: number;
}

export type AssetType =
  | 'bank'
  | 'emergency'
  | 'cash'
  | 'property'
  | 'gold'
  | 'vehicle'
  | 'other'
  | 'liability';

/** A balance you own (or owe, when type = 'liability'). */
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
}

/** Everything a single user owns, loaded into the client store. */
export interface FinanceData {
  transactions: Transaction[];
  budgets: Budget[];
  investments: Investment[];
  goals: Goal[];
  creditCards: CreditCard[];
  emis: Emi[];
  assets: Asset[];
}

export const EMPTY_FINANCE_DATA: FinanceData = {
  transactions: [],
  budgets: [],
  investments: [],
  goals: [],
  creditCards: [],
  emis: [],
  assets: [],
};

export type CollectionKey = keyof FinanceData;
