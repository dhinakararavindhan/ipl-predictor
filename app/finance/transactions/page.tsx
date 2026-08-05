'use client';

import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ChartCard, EmptyState } from '@/components/finance/cards';
import { Modal } from '@/components/finance/Modal';
import {
  CATEGORY_ICONS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_MODES, SUBCATEGORIES,
} from '@/lib/finance/constants';
import { formatDateShort, formatINR, formatMonthKey, todayISO } from '@/lib/finance/format';
import { useFinance } from '@/lib/finance/store';
import type { PaymentMode, Transaction, TransactionType } from '@/lib/finance/types';

export default function TransactionsPage() {
  const { data, month, addItem, updateItem, deleteItem } = useFinance();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null);

  const monthTxs = useMemo(
    () =>
      data.transactions
        .filter((t) => t.date.startsWith(month))
        .filter((t) => typeFilter === 'all' || t.type === typeFilter)
        .filter((t) => categoryFilter === 'all' || t.category === categoryFilter)
        .filter((t) => {
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return [t.category, t.subcategory, t.note, t.paymentMode]
            .filter(Boolean)
            .some((s) => s!.toLowerCase().includes(q));
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.transactions, month, typeFilter, categoryFilter, search]
  );

  const income = monthTxs.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = monthTxs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const categories = ['all', ...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold mr-auto" style={{ color: 'var(--fin-text)' }}>
          Transactions <span className="text-sm font-medium" style={{ color: 'var(--fin-text-muted)' }}>· {formatMonthKey(month)}</span>
        </h2>
        <button onClick={() => setEditing('new')} className="fin-btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add transaction
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="fin-card p-3 flex items-center gap-3">
          <ArrowUpRight className="w-5 h-5" style={{ color: 'var(--fin-good)' }} />
          <div>
            <p className="text-[11px]" style={{ color: 'var(--fin-text-muted)' }}>Money in (filtered)</p>
            <p className="font-bold" style={{ color: 'var(--fin-good)' }}>{formatINR(income)}</p>
          </div>
        </div>
        <div className="fin-card p-3 flex items-center gap-3">
          <ArrowDownRight className="w-5 h-5" style={{ color: 'var(--fin-bad)' }} />
          <div>
            <p className="text-[11px]" style={{ color: 'var(--fin-text-muted)' }}>Money out (filtered)</p>
            <p className="font-bold" style={{ color: 'var(--fin-bad)' }}>{formatINR(expense)}</p>
          </div>
        </div>
        <div className="fin-card p-3 flex items-center gap-3">
          <div>
            <p className="text-[11px]" style={{ color: 'var(--fin-text-muted)' }}>Net</p>
            <p className="font-bold" style={{ color: 'var(--fin-text)' }}>{formatINR(income - expense)}</p>
          </div>
        </div>
      </div>

      <ChartCard
        title="All entries"
        subtitle={`(${monthTxs.length})`}
        right={
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--fin-text-faint)' }} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…" className="fin-input pl-8 !py-1.5 !w-40"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | TransactionType)} className="fin-input !py-1.5 !w-auto">
              <option value="all">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="fin-input !py-1.5 !w-auto">
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>
          </div>
        }
      >
        {monthTxs.length === 0 ? (
          <EmptyState
            message="No transactions match. Add your first one for this month."
            action={
              <button onClick={() => setEditing('new')} className="fin-btn-primary flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add transaction
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left" style={{ color: 'var(--fin-text-muted)' }}>
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Category</th>
                  <th className="py-2 pr-3 font-semibold hidden sm:table-cell">Sub category</th>
                  <th className="py-2 pr-3 font-semibold hidden md:table-cell">Payment</th>
                  <th className="py-2 pr-3 font-semibold hidden lg:table-cell">Note</th>
                  <th className="py-2 pr-3 font-semibold text-right">Amount</th>
                  <th className="py-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {monthTxs.map((t) => (
                  <tr key={t.id} className="border-t" style={{ borderColor: 'var(--fin-border)' }}>
                    <td className="py-2 pr-3 whitespace-nowrap" style={{ color: 'var(--fin-text-muted)' }}>
                      {formatDateShort(t.date)}
                    </td>
                    <td className="py-2 pr-3 font-medium whitespace-nowrap" style={{ color: 'var(--fin-text)' }}>
                      {CATEGORY_ICONS[t.category] ?? '•'} {t.category}
                    </td>
                    <td className="py-2 pr-3 hidden sm:table-cell" style={{ color: 'var(--fin-text-muted)' }}>
                      {t.subcategory ?? '—'}
                    </td>
                    <td className="py-2 pr-3 hidden md:table-cell" style={{ color: 'var(--fin-text-muted)' }}>
                      {t.paymentMode}
                    </td>
                    <td className="py-2 pr-3 hidden lg:table-cell max-w-[180px] truncate" style={{ color: 'var(--fin-text-faint)' }}>
                      {t.note ?? '—'}
                    </td>
                    <td
                      className="py-2 pr-3 text-right font-bold whitespace-nowrap"
                      style={{ color: t.type === 'income' ? 'var(--fin-good)' : 'var(--fin-text)' }}
                    >
                      {t.type === 'income' ? '+' : '−'}{formatINR(t.amount)}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(t)} aria-label="Edit" className="p-1" style={{ color: 'var(--fin-text-muted)' }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this transaction?')) deleteItem('transactions', t.id); }}
                        aria-label="Delete" className="p-1" style={{ color: 'var(--fin-bad)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add transaction' : 'Edit transaction'}
          onClose={() => setEditing(null)}
        >
          <TransactionForm
            initial={editing === 'new' ? null : editing}
            onSave={async (tx) => {
              if (editing === 'new') await addItem('transactions', tx);
              else await updateItem('transactions', editing.id, tx);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function TransactionForm({
  initial,
  onSave,
}: {
  initial: Transaction | null;
  onSave: (tx: Omit<Transaction, 'id'>) => Promise<void>;
}) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [category, setCategory] = useState(initial?.category ?? 'Groceries');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initial?.paymentMode ?? 'UPI');
  const [note, setNote] = useState(initial?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const subs = SUBCATEGORIES[category] ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({
        type, date, category,
        subcategory: subcategory || undefined,
        amount: parsed, paymentMode,
        note: note.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t} type="button"
            onClick={() => { setType(t); setCategory(t === 'expense' ? 'Groceries' : 'Salary'); setSubcategory(''); }}
            className="rounded-lg py-2 text-sm font-semibold border transition-colors"
            style={
              type === t
                ? { background: t === 'expense' ? 'var(--fin-bad-bg)' : 'var(--fin-good-bg)', borderColor: t === 'expense' ? 'var(--fin-bad)' : 'var(--fin-good)', color: t === 'expense' ? 'var(--fin-bad)' : 'var(--fin-good)' }
                : { borderColor: 'var(--fin-border)', color: 'var(--fin-text-muted)' }
            }
          >
            {t === 'expense' ? 'Expense' : 'Income'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Date</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="fin-input" />
        </div>
        <div>
          <label className="fin-label">Amount (₹)</label>
          <input
            type="number" required min={1} step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} className="fin-input" placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Category</label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }} className="fin-input">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="fin-label">Sub category</label>
          {subs.length > 0 ? (
            <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="fin-input">
              <option value="">—</option>
              {subs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="fin-input" placeholder="Optional" />
          )}
        </div>
      </div>

      <div>
        <label className="fin-label">Payment mode</label>
        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)} className="fin-input">
          {PAYMENT_MODES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="fin-label">Note</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="fin-input" placeholder="Optional" />
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--fin-bad)', background: 'var(--fin-bad-bg)' }}>
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="fin-btn-primary w-full">
        {busy ? 'Saving…' : 'Save transaction'}
      </button>
    </form>
  );
}
