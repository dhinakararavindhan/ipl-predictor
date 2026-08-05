'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { EmptyState, ProgressBar } from '@/components/finance/cards';
import { Modal } from '@/components/finance/Modal';
import { PALETTE } from '@/lib/finance/constants';
import { formatDateShort, formatINR } from '@/lib/finance/format';
import { useFinance } from '@/lib/finance/store';
import type { Goal } from '@/lib/finance/types';

export default function GoalsPage() {
  const { data, addItem, updateItem, deleteItem } = useFinance();
  const [editing, setEditing] = useState<Goal | 'new' | null>(null);
  const [addingTo, setAddingTo] = useState<Goal | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold mr-auto" style={{ color: 'var(--fin-text)' }}>Goals</h2>
        <button onClick={() => setEditing('new')} className="fin-btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New goal
        </button>
      </div>

      {data.goals.length === 0 ? (
        <div className="fin-card">
          <EmptyState
            message="No goals yet. A goal can be anything — an emergency fund, a vacation, a child's education."
            action={
              <button onClick={() => setEditing('new')} className="fin-btn-primary flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Create your first goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.goals.map((g) => {
            const pct = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
            const done = pct >= 100;
            return (
              <div key={g.id} className="fin-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl">{g.icon ?? '🎯'}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--fin-text)' }}>{g.name}</p>
                      {g.targetDate && (
                        <p className="text-[10.5px]" style={{ color: 'var(--fin-text-faint)' }}>by {formatDateShort(g.targetDate)}</p>
                      )}
                    </div>
                  </div>
                  <span className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(g)} aria-label="Edit" style={{ color: 'var(--fin-text-muted)' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this goal?')) deleteItem('goals', g.id); }}
                      aria-label="Delete" style={{ color: 'var(--fin-bad)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold" style={{ color: done ? 'var(--fin-good)' : 'var(--fin-text)' }}>
                      {formatINR(g.savedAmount)}
                    </span>
                    <span style={{ color: 'var(--fin-text-muted)' }}>of {formatINR(g.targetAmount)}</span>
                  </div>
                  <ProgressBar pct={pct} color={done ? 'var(--fin-good)' : PALETTE.blue} />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[11px] font-bold" style={{ color: done ? 'var(--fin-good)' : 'var(--fin-accent)' }}>
                      {Math.min(100, pct).toFixed(0)}%{done && ' · achieved 🎉'}
                    </span>
                    {!done && (
                      <button
                        onClick={() => setAddingTo(g)}
                        className="text-[10.5px] font-bold uppercase tracking-wide rounded px-2 py-1"
                        style={{ background: 'var(--fin-accent-bg)', color: 'var(--fin-accent)' }}
                      >
                        Add money
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New goal' : 'Edit goal'} onClose={() => setEditing(null)}>
          <GoalForm
            initial={editing === 'new' ? null : editing}
            onSave={async (goal) => {
              if (editing === 'new') await addItem('goals', goal);
              else await updateItem('goals', editing.id, goal);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {addingTo && (
        <Modal title={`Add money to ${addingTo.name}`} onClose={() => setAddingTo(null)}>
          <AddMoneyForm
            goal={addingTo}
            onSave={async (amount) => {
              await updateItem('goals', addingTo.id, { savedAmount: addingTo.savedAmount + amount });
              setAddingTo(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function GoalForm({ initial, onSave }: { initial: Goal | null; onSave: (g: Omit<Goal, 'id'>) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🎯');
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.targetAmount) : '');
  const [savedAmount, setSavedAmount] = useState(initial ? String(initial.savedAmount) : '0');
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '');
  const [annualTarget, setAnnualTarget] = useState(initial?.annualTarget ? String(initial.annualTarget) : '');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({
        name: name.trim(), icon: icon || undefined,
        targetAmount: Number(targetAmount) || 0,
        savedAmount: Number(savedAmount) || 0,
        targetDate: targetDate || undefined,
        annualTarget: annualTarget ? Number(annualTarget) : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-[64px_1fr] gap-3">
        <div>
          <label className="fin-label">Icon</label>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} className="fin-input text-center" maxLength={4} />
        </div>
        <div>
          <label className="fin-label">Goal name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="fin-input" placeholder="e.g. Family Vacation" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Target amount (₹)</label>
          <input type="number" min={1} required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="fin-input" />
        </div>
        <div>
          <label className="fin-label">Saved so far (₹)</label>
          <input type="number" min={0} value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} className="fin-input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Target date</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="fin-input" />
        </div>
        <div>
          <label className="fin-label">Annual target (₹)</label>
          <input
            type="number" min={0} value={annualTarget}
            onChange={(e) => setAnnualTarget(e.target.value)} className="fin-input" placeholder="For SSY/PPF-style schemes"
          />
        </div>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--fin-text-faint)' }}>
        Setting an annual target makes this goal power the “SSY Progress” tile on the dashboard
        (progress = SSY investments this financial year ÷ annual target).
      </p>
      <button type="submit" disabled={busy} className="fin-btn-primary w-full">{busy ? 'Saving…' : 'Save goal'}</button>
    </form>
  );
}

function AddMoneyForm({ goal, onSave }: { goal: Goal; onSave: (amount: number) => Promise<void> }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setBusy(true);
    try {
      await onSave(parsed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--fin-text-muted)' }}>
        {formatINR(remaining)} left to reach {formatINR(goal.targetAmount)}.
      </p>
      <div>
        <label className="fin-label">Amount to add (₹)</label>
        <input type="number" min={1} required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className="fin-input" />
      </div>
      <button type="submit" disabled={busy} className="fin-btn-primary w-full">{busy ? 'Adding…' : 'Add to goal'}</button>
    </form>
  );
}
