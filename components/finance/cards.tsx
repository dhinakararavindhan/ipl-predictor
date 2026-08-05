'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

// ── KPI stat card ────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string; // hex — bubble background derives from it
  title: string;
  value: string;
  /** e.g. { label: 'vs Jun 2026', pct: 8.3, goodWhen: 'up' } */
  delta?: { label: string; pct: number | null; goodWhen: 'up' | 'down' } | null;
  /** Plain sub-line when there is no delta, e.g. 'in Bank Accounts'. */
  sub?: string;
  subValue?: string;
}

export function StatCard({ icon: Icon, iconColor, title, value, delta, sub, subValue }: StatCardProps) {
  return (
    <div className="fin-card p-3.5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: iconColor }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--fin-text-muted)' }}>
            {title}
          </p>
          <p className="text-xl font-extrabold leading-tight truncate" style={{ color: 'var(--fin-text)' }}>
            {value}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        {delta !== undefined && delta !== null ? (
          <>
            <span style={{ color: 'var(--fin-text-muted)' }}>{delta.label}</span>
            {delta.pct === null ? (
              <span style={{ color: 'var(--fin-text-faint)' }}>—</span>
            ) : (
              <DeltaBadge pct={delta.pct} goodWhen={delta.goodWhen} />
            )}
          </>
        ) : (
          <>
            <span style={{ color: 'var(--fin-text-muted)' }}>{sub}</span>
            {subValue && (
              <span className="font-bold" style={{ color: 'var(--fin-accent)' }}>{subValue}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DeltaBadge({ pct, goodWhen }: { pct: number; goodWhen: 'up' | 'down' }) {
  const isUp = pct >= 0;
  const good = goodWhen === 'up' ? isUp : !isUp;
  const color = good ? 'var(--fin-good)' : 'var(--fin-bad)';
  const Arrow = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-0.5 font-bold" style={{ color }}>
      <Arrow className="w-3 h-3" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

// ── Chart card wrapper ───────────────────────────────────────────────────────

export function ChartCard({
  title,
  subtitle,
  right,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`fin-card p-4 ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--fin-text)' }}>
          {title}
          {subtitle && (
            <span className="ml-1.5 font-medium normal-case text-[11px]" style={{ color: 'var(--fin-text-faint)' }}>
              {subtitle}
            </span>
          )}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

// ── Simple progress bar ──────────────────────────────────────────────────────

export function ProgressBar({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: 'var(--fin-track)', height }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm" style={{ color: 'var(--fin-text-muted)' }}>{message}</p>
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}
