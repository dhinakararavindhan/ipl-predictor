'use client';

import { useState } from 'react';
import { CreditCard as CardIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { ChartCard, EmptyState, ProgressBar } from '@/components/finance/cards';
import { Modal } from '@/components/finance/Modal';
import { formatDateShort, formatINR, todayISO } from '@/lib/finance/format';
import { useFinance } from '@/lib/finance/store';
import type { CreditCard, Emi } from '@/lib/finance/types';

export default function CreditPage() {
  const { data, addItem, updateItem, deleteItem } = useFinance();
  const [editingCard, setEditingCard] = useState<CreditCard | 'new' | null>(null);
  const [editingEmi, setEditingEmi] = useState<Emi | 'new' | null>(null);

  const totalDue = data.creditCards.reduce((a, c) => a + c.dueAmount, 0);
  const totalEmi = data.emis.filter((e) => e.remainingMonths > 0).reduce((a, e) => a + e.monthlyAmount, 0);
  const today = todayISO();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold" style={{ color: 'var(--fin-text)' }}>Credit Cards &amp; EMI</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="fin-card p-3.5">
          <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--fin-text-muted)' }}>Total card dues</p>
          <p className="text-xl font-extrabold" style={{ color: totalDue > 0 ? 'var(--fin-bad)' : 'var(--fin-good)' }}>{formatINR(totalDue)}</p>
        </div>
        <div className="fin-card p-3.5">
          <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--fin-text-muted)' }}>Monthly EMI outgo</p>
          <p className="text-xl font-extrabold" style={{ color: 'var(--fin-text)' }}>{formatINR(totalEmi)}</p>
        </div>
      </div>

      <ChartCard
        title="Credit cards"
        right={
          <button onClick={() => setEditingCard('new')} className="fin-btn-ghost !py-1.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add card
          </button>
        }
      >
        {data.creditCards.length === 0 ? (
          <EmptyState message="No credit cards added yet." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.creditCards.map((c) => {
              const overdue = c.dueAmount > 0 && c.dueDate < today;
              const utilization = c.creditLimit ? (c.dueAmount / c.creditLimit) * 100 : null;
              return (
                <div key={c.id} className="rounded-xl p-4 text-white relative overflow-hidden" style={{ background: 'var(--fin-sidebar)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-white/60">{c.bank ?? 'Card'}</p>
                      <p className="font-bold text-sm">{c.name}</p>
                    </div>
                    <CardIcon className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-white/60">Amount due</p>
                      <p className="text-lg font-extrabold">{formatINR(c.dueAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-white/60">Due date</p>
                      <p className={`text-xs font-bold ${overdue ? 'text-red-300' : ''}`}>
                        {formatDateShort(c.dueDate)}{overdue && ' · overdue'}
                      </p>
                    </div>
                  </div>
                  {utilization !== null && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-white/60 mb-1">
                        <span>Utilisation</span>
                        <span>{utilization.toFixed(0)}% of {formatINR(c.creditLimit!)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, utilization)}%`, background: utilization > 30 ? '#f87171' : '#34d399' }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-white/50">{c.autopay ? 'Autopay on' : 'Manual payment'}</span>
                    <span className="flex gap-1">
                      <button onClick={() => setEditingCard(c)} aria-label="Edit" className="p-1 text-white/70 hover:text-white">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Remove this card?')) deleteItem('creditCards', c.id); }}
                        aria-label="Delete" className="p-1 text-white/70 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="EMIs"
        right={
          <button onClick={() => setEditingEmi('new')} className="fin-btn-ghost !py-1.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add EMI
          </button>
        }
      >
        {data.emis.length === 0 ? (
          <EmptyState message="No EMIs tracked. Add car, phone or appliance EMIs to see them in your monthly plan." />
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--fin-border)' }}>
            {data.emis.map((e) => {
              const done = e.totalMonths ? e.totalMonths - e.remainingMonths : null;
              const pct = e.totalMonths && done !== null ? (done / e.totalMonths) * 100 : null;
              return (
                <li key={e.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[160px]">
                      <p className="text-sm font-medium" style={{ color: 'var(--fin-text)' }}>{e.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--fin-text-faint)' }}>
                        Debited on day {e.dueDay}
                        {e.interestRate ? ` · ${e.interestRate}% p.a.` : ''}
                      </p>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      {pct !== null ? (
                        <>
                          <ProgressBar pct={pct} color="var(--fin-accent)" height={6} />
                          <p className="text-[10.5px] mt-1" style={{ color: 'var(--fin-text-muted)' }}>
                            {done}/{e.totalMonths} paid · {e.remainingMonths} left
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px]" style={{ color: 'var(--fin-text-muted)' }}>{e.remainingMonths} months left</p>
                      )}
                    </div>
                    <span className="font-bold text-sm whitespace-nowrap" style={{ color: 'var(--fin-text)' }}>
                      {formatINR(e.monthlyAmount)}<span className="text-[10px] font-medium" style={{ color: 'var(--fin-text-faint)' }}>/mo</span>
                    </span>
                    <span className="flex gap-1">
                      <button onClick={() => setEditingEmi(e)} aria-label="Edit" style={{ color: 'var(--fin-text-muted)' }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Remove this EMI?')) deleteItem('emis', e.id); }}
                        aria-label="Delete" style={{ color: 'var(--fin-bad)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ChartCard>

      {editingCard && (
        <Modal title={editingCard === 'new' ? 'Add credit card' : 'Edit credit card'} onClose={() => setEditingCard(null)}>
          <CardForm
            initial={editingCard === 'new' ? null : editingCard}
            onSave={async (card) => {
              if (editingCard === 'new') await addItem('creditCards', card);
              else await updateItem('creditCards', editingCard.id, card);
              setEditingCard(null);
            }}
          />
        </Modal>
      )}
      {editingEmi && (
        <Modal title={editingEmi === 'new' ? 'Add EMI' : 'Edit EMI'} onClose={() => setEditingEmi(null)}>
          <EmiForm
            initial={editingEmi === 'new' ? null : editingEmi}
            onSave={async (emi) => {
              if (editingEmi === 'new') await addItem('emis', emi);
              else await updateItem('emis', editingEmi.id, emi);
              setEditingEmi(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function CardForm({ initial, onSave }: { initial: CreditCard | null; onSave: (c: Omit<CreditCard, 'id'>) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [bank, setBank] = useState(initial?.bank ?? '');
  const [dueAmount, setDueAmount] = useState(initial ? String(initial.dueAmount) : '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayISO());
  const [creditLimit, setCreditLimit] = useState(initial?.creditLimit ? String(initial.creditLimit) : '');
  const [autopay, setAutopay] = useState(initial?.autopay ?? false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({
        name: name.trim(), bank: bank.trim() || undefined,
        dueAmount: Number(dueAmount) || 0, dueDate,
        creditLimit: creditLimit ? Number(creditLimit) : undefined, autopay,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Card name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="fin-input" placeholder="e.g. Millennia" />
        </div>
        <div>
          <label className="fin-label">Bank</label>
          <input value={bank} onChange={(e) => setBank(e.target.value)} className="fin-input" placeholder="Optional" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Current due (₹)</label>
          <input type="number" min={0} value={dueAmount} onChange={(e) => setDueAmount(e.target.value)} className="fin-input" placeholder="0" />
        </div>
        <div>
          <label className="fin-label">Due date</label>
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="fin-input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="fin-label">Credit limit (₹)</label>
          <input type="number" min={0} value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className="fin-input" placeholder="Optional" />
        </div>
        <label className="flex items-center gap-2 text-sm py-2" style={{ color: 'var(--fin-text)' }}>
          <input type="checkbox" checked={autopay} onChange={(e) => setAutopay(e.target.checked)} />
          Autopay enabled
        </label>
      </div>
      <button type="submit" disabled={busy} className="fin-btn-primary w-full">{busy ? 'Saving…' : 'Save card'}</button>
    </form>
  );
}

function EmiForm({ initial, onSave }: { initial: Emi | null; onSave: (e: Omit<Emi, 'id'>) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [monthlyAmount, setMonthlyAmount] = useState(initial ? String(initial.monthlyAmount) : '');
  const [dueDay, setDueDay] = useState(initial ? String(initial.dueDay) : '5');
  const [remainingMonths, setRemainingMonths] = useState(initial ? String(initial.remainingMonths) : '');
  const [totalMonths, setTotalMonths] = useState(initial?.totalMonths ? String(initial.totalMonths) : '');
  const [interestRate, setInterestRate] = useState(initial?.interestRate !== undefined ? String(initial.interestRate) : '');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        monthlyAmount: Number(monthlyAmount) || 0,
        dueDay: Math.min(28, Math.max(1, Number(dueDay) || 1)),
        remainingMonths: Number(remainingMonths) || 0,
        totalMonths: totalMonths ? Number(totalMonths) : undefined,
        interestRate: interestRate ? Number(interestRate) : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="fin-label">EMI name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="fin-input" placeholder="e.g. Car Loan EMI" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Monthly amount (₹)</label>
          <input type="number" min={1} required value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} className="fin-input" />
        </div>
        <div>
          <label className="fin-label">Debit day (1–28)</label>
          <input type="number" min={1} max={28} required value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="fin-input" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="fin-label">Months left</label>
          <input type="number" min={0} required value={remainingMonths} onChange={(e) => setRemainingMonths(e.target.value)} className="fin-input" />
        </div>
        <div>
          <label className="fin-label">Total months</label>
          <input type="number" min={0} value={totalMonths} onChange={(e) => setTotalMonths(e.target.value)} className="fin-input" placeholder="Optional" />
        </div>
        <div>
          <label className="fin-label">Rate % p.a.</label>
          <input type="number" min={0} step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="fin-input" placeholder="Optional" />
        </div>
      </div>
      <button type="submit" disabled={busy} className="fin-btn-primary w-full">{busy ? 'Saving…' : 'Save EMI'}</button>
    </form>
  );
}
