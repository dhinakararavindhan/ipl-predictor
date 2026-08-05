'use client';

import { useState } from 'react';
import { Car, Coins, Gem, Home, Landmark, Pencil, PiggyBank, Plus, ShieldCheck, Trash2, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChartCard, EmptyState } from '@/components/finance/cards';
import { NetWorthTrendChart } from '@/components/finance/charts';
import { Modal } from '@/components/finance/Modal';
import { formatINR } from '@/lib/finance/format';
import { currentNetWorth, netWorthTrend, totalInvested } from '@/lib/finance/metrics';
import { useFinance } from '@/lib/finance/store';
import type { Asset, AssetType } from '@/lib/finance/types';

const ASSET_TYPES: Array<{ value: AssetType; label: string; icon: LucideIcon }> = [
  { value: 'bank', label: 'Bank account', icon: Wallet },
  { value: 'emergency', label: 'Emergency fund', icon: ShieldCheck },
  { value: 'cash', label: 'Cash', icon: Coins },
  { value: 'property', label: 'Property', icon: Home },
  { value: 'gold', label: 'Gold', icon: Gem },
  { value: 'vehicle', label: 'Vehicle', icon: Car },
  { value: 'other', label: 'Other asset', icon: PiggyBank },
  { value: 'liability', label: 'Liability (loan owed)', icon: Landmark },
];

export default function NetWorthPage() {
  const { data, month, addItem, updateItem, deleteItem } = useFinance();
  const [editing, setEditing] = useState<Asset | 'new' | null>(null);

  const invested = totalInvested(data);
  const assets = data.assets.filter((a) => a.type !== 'liability');
  const liabilities = data.assets.filter((a) => a.type === 'liability');
  const cardDues = data.creditCards.reduce((a, c) => a + c.dueAmount, 0);
  const netWorth = currentNetWorth(data);
  const trend = netWorthTrend(data, month, 12);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold mr-auto" style={{ color: 'var(--fin-text)' }}>Net Worth</h2>
        <button onClick={() => setEditing('new')} className="fin-btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add asset / liability
        </button>
      </div>

      <div className="fin-card p-5 text-center">
        <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--fin-text-muted)' }}>Current net worth</p>
        <p className="text-3xl font-extrabold mt-1" style={{ color: 'var(--fin-text)' }}>{formatINR(netWorth)}</p>
        <p className="text-xs mt-1.5" style={{ color: 'var(--fin-text-faint)' }}>
          Assets + investment contributions − loans − card dues
        </p>
      </div>

      <ChartCard title="Net worth trend" subtitle="(last 12 months, derived from monthly savings)">
        <NetWorthTrendChart points={trend} />
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-3">
        <ChartCard title="What you own" subtitle={`(${formatINR(assets.reduce((a, x) => a + x.value, 0) + invested)})`}>
          <ul className="divide-y" style={{ borderColor: 'var(--fin-border)' }}>
            {assets.map((a) => (
              <AssetRow key={a.id} asset={a} onEdit={() => setEditing(a)} onDelete={() => {
                if (confirm('Remove this entry?')) deleteItem('assets', a.id);
              }} />
            ))}
            <li className="flex items-center gap-3 py-2.5 text-sm">
              <PiggyBank className="w-4 h-4" style={{ color: 'var(--fin-accent)' }} />
              <span style={{ color: 'var(--fin-text)' }}>Investment contributions (tracked)</span>
              <span className="ml-auto font-bold" style={{ color: 'var(--fin-text)' }}>{formatINR(invested)}</span>
            </li>
            {assets.length === 0 && invested === 0 && (
              <EmptyState message="Add your bank balance, cash, gold and other assets." />
            )}
          </ul>
        </ChartCard>

        <ChartCard title="What you owe" subtitle={`(${formatINR(liabilities.reduce((a, x) => a + x.value, 0) + cardDues)})`}>
          <ul className="divide-y" style={{ borderColor: 'var(--fin-border)' }}>
            {liabilities.map((a) => (
              <AssetRow key={a.id} asset={a} negative onEdit={() => setEditing(a)} onDelete={() => {
                if (confirm('Remove this entry?')) deleteItem('assets', a.id);
              }} />
            ))}
            {cardDues > 0 && (
              <li className="flex items-center gap-3 py-2.5 text-sm">
                <Landmark className="w-4 h-4" style={{ color: 'var(--fin-bad)' }} />
                <span style={{ color: 'var(--fin-text)' }}>Credit card dues</span>
                <span className="ml-auto font-bold" style={{ color: 'var(--fin-bad)' }}>−{formatINR(cardDues)}</span>
              </li>
            )}
            {liabilities.length === 0 && cardDues === 0 && (
              <EmptyState message="No loans or dues — great position!" />
            )}
          </ul>
        </ChartCard>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add asset / liability' : 'Edit entry'} onClose={() => setEditing(null)}>
          <AssetForm
            initial={editing === 'new' ? null : editing}
            onSave={async (asset) => {
              if (editing === 'new') await addItem('assets', asset);
              else await updateItem('assets', editing.id, asset);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function AssetRow({
  asset, negative = false, onEdit, onDelete,
}: {
  asset: Asset; negative?: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const meta = ASSET_TYPES.find((t) => t.value === asset.type) ?? ASSET_TYPES[6];
  const Icon = meta.icon;
  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <Icon className="w-4 h-4" style={{ color: negative ? 'var(--fin-bad)' : 'var(--fin-accent)' }} />
      <div className="min-w-0">
        <p className="truncate" style={{ color: 'var(--fin-text)' }}>{asset.name}</p>
        <p className="text-[10.5px]" style={{ color: 'var(--fin-text-faint)' }}>{meta.label}</p>
      </div>
      <span className="ml-auto font-bold whitespace-nowrap" style={{ color: negative ? 'var(--fin-bad)' : 'var(--fin-text)' }}>
        {negative ? '−' : ''}{formatINR(asset.value)}
      </span>
      <button onClick={onEdit} aria-label="Edit" style={{ color: 'var(--fin-text-muted)' }}>
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDelete} aria-label="Delete" style={{ color: 'var(--fin-bad)' }}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function AssetForm({ initial, onSave }: { initial: Asset | null; onSave: (a: Omit<Asset, 'id'>) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<AssetType>(initial?.type ?? 'bank');
  const [value, setValue] = useState(initial ? String(initial.value) : '');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({ name: name.trim(), type, value: Number(value) || 0 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="fin-label">Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="fin-input" placeholder="e.g. Salary Account" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="fin-label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as AssetType)} className="fin-input">
            {ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="fin-label">Current value (₹)</label>
          <input type="number" min={0} required value={value} onChange={(e) => setValue(e.target.value)} className="fin-input" placeholder="0" />
        </div>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--fin-text-faint)' }}>
        Tip: update these values once a month — your net worth history is derived from your savings automatically.
      </p>
      <button type="submit" disabled={busy} className="fin-btn-primary w-full">{busy ? 'Saving…' : 'Save'}</button>
    </form>
  );
}
