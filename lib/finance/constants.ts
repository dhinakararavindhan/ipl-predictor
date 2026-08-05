import type { InvestmentType, PaymentMode } from './types';

// ── Categories ───────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Baby',
  'Eating Out',
  'Shopping',
  'Utilities',
  'Transport',
  'Health',
  'Entertainment',
  'Others',
] as const;

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Interest', 'Other Income'] as const;

export const SUBCATEGORIES: Record<string, string[]> = {
  Groceries: ['Vegetables & Fruits', 'Staples', 'Dairy', 'Supermarket'],
  Baby: ['Diapers', 'Food & Formula', 'Clothes', 'Toys', 'Daycare'],
  'Eating Out': ['Restaurants', 'Food Delivery', 'Coffee & Snacks'],
  Shopping: ['Clothing', 'Electronics', 'Home & Kitchen', 'Online'],
  Utilities: ['Electricity', 'Water', 'Gas', 'Internet', 'Mobile'],
  Transport: ['Fuel', 'Cab & Auto', 'Metro & Bus', 'Vehicle Service'],
  Health: ['Pharmacy', 'Doctor', 'Insurance', 'Fitness'],
  Entertainment: ['OTT Subscriptions', 'Movies', 'Outings'],
  Others: ['Gifts', 'Donations', 'Fees', 'Miscellaneous'],
};

export const PAYMENT_MODES: PaymentMode[] = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Auto Debit',
  'Cash',
];

export const INVESTMENT_TYPES: InvestmentType[] = [
  'SIP',
  'Stocks',
  'FD',
  'PPF',
  'SSY',
  'NPS',
  'Gold',
  'Other',
];

// ── Chart palette ────────────────────────────────────────────────────────────
// Validated categorical palette (colorblind-safe adjacent ordering).
// "Others"/"Cash" style catch-alls take neutral gray, never a hue.

export const PALETTE = {
  blue: '#2a78d6',
  orange: '#eb6834',
  aqua: '#1baf7a',
  yellow: '#eda100',
  magenta: '#e87ba4',
  green: '#008300',
  violet: '#4a3aa7',
  red: '#e34948',
  gray: '#8a8f98',
} as const;

/** Fixed category → color mapping. Color follows the entity, never its rank. */
export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: PALETTE.blue,
  Baby: PALETTE.orange,
  'Eating Out': PALETTE.aqua,
  Shopping: PALETTE.yellow,
  Utilities: PALETTE.magenta,
  Transport: PALETTE.green,
  Health: PALETTE.violet,
  Entertainment: PALETTE.red,
  Others: PALETTE.gray,
};

export const PAYMENT_MODE_COLORS: Record<PaymentMode, string> = {
  UPI: PALETTE.blue,
  'Credit Card': PALETTE.orange,
  'Debit Card': PALETTE.aqua,
  'Auto Debit': PALETTE.yellow,
  Cash: PALETTE.gray,
};

export const CATEGORY_ICONS: Record<string, string> = {
  Groceries: '🛒',
  Baby: '👶',
  'Eating Out': '🍽️',
  Shopping: '🛍️',
  Utilities: '⚡',
  Transport: '🚗',
  Health: '🩺',
  Entertainment: '🎬',
  Others: '📦',
  Salary: '💼',
  Freelance: '🧑‍💻',
  Interest: '🏦',
  'Other Income': '💰',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;
