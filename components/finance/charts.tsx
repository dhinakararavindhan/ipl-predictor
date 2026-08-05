'use client';

import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatINR, formatINRCompact, formatMonthTick } from '@/lib/finance/format';
import type { TrendPoint } from '@/lib/finance/metrics';

const AXIS_TICK = { fontSize: 10, fill: 'var(--fin-text-faint)' } as const;

interface LabeledPoint {
  label?: string;
}

type TextAnchor = 'start' | 'middle' | 'end';

/** Dot renderer that also prints the point's `label` (used for peak/latest). */
function labeledDot(color: string, r: number, anchor: (i: number, n: number) => TextAnchor) {
  function LabeledDot(props: { cx?: number; cy?: number; index?: number; payload?: LabeledPoint; points?: readonly unknown[] }) {
    const { cx, cy, index, payload } = props;
    if (cx === undefined || cy === undefined) return <g />;
    const total = props.points?.length ?? 0;
    return (
      <g key={`dot-${index}`}>
        <circle cx={cx} cy={cy} r={r} fill={color} />
        {payload?.label && (
          <text
            x={cx} y={cy - 10}
            textAnchor={anchor(index ?? 0, total)}
            fontSize={10} fontWeight={700} fill="var(--fin-text)"
          >
            {payload.label}
          </text>
        )}
      </g>
    );
  }
  return LabeledDot;
}

function ChartTooltip({
  active, payload, label, labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; payload?: Record<string, unknown> }>;
  label?: string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ background: 'var(--fin-card)', border: '1px solid var(--fin-border)', color: 'var(--fin-text)' }}
    >
      {label && (
        <p className="font-semibold mb-0.5">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="font-bold">{formatINR(p.value)}</p>
      ))}
    </div>
  );
}

// ── Monthly spending trend (12-month line) ──────────────────────────────────

export function SpendingTrendChart({ points, color = '#2a78d6' }: { points: TrendPoint[]; color?: string }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const maxIndex = points.findIndex((p) => p.value === max);
  const data = points.map((p, i) => ({
    ...p,
    // Selective direct labels: peak + latest month; the tooltip covers the rest.
    label: i === maxIndex || i === points.length - 1 ? formatINRCompact(p.value) : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 22, right: 26, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--fin-track)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month" tickFormatter={formatMonthTick} tick={AXIS_TICK}
          axisLine={{ stroke: 'var(--fin-border)' }} tickLine={false} interval="preserveStartEnd" minTickGap={18}
        />
        <YAxis
          tickFormatter={formatINRCompact} tick={AXIS_TICK} axisLine={false} tickLine={false} width={48}
        />
        <Tooltip content={<ChartTooltip labelFormatter={formatMonthTick} />} cursor={{ stroke: 'var(--fin-text-faint)', strokeDasharray: '3 3' }} />
        <Line
          type="monotone" dataKey="value" stroke={color} strokeWidth={2}
          dot={labeledDot(color, 3, (i, n) => (i >= n - 1 ? 'end' : 'middle'))}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Net worth trend (12-month area) ─────────────────────────────────────────

export function NetWorthTrendChart({ points }: { points: TrendPoint[] }) {
  const color = '#0e9f6e';
  const data = points.map((p, i) => ({
    ...p,
    label: i === 0 || i === points.length - 1 ? formatINRCompact(p.value) : undefined,
  }));
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const pad = Math.max((max - min) * 0.25, 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 22, right: 30, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--fin-track)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month" tickFormatter={formatMonthTick} tick={AXIS_TICK}
          axisLine={{ stroke: 'var(--fin-border)' }} tickLine={false} interval="preserveStartEnd" minTickGap={18}
        />
        <YAxis
          tickFormatter={formatINRCompact} tick={AXIS_TICK} axisLine={false} tickLine={false} width={48}
          domain={[Math.floor(min - pad), Math.ceil(max + pad)]}
        />
        <Tooltip content={<ChartTooltip labelFormatter={formatMonthTick} />} cursor={{ stroke: 'var(--fin-text-faint)', strokeDasharray: '3 3' }} />
        <Area
          type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#nwFill)"
          dot={labeledDot(color, 2.5, (i) => (i === 0 ? 'start' : 'end'))}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Donut with side legend (categories, payment modes) ──────────────────────

export interface DonutSlice {
  name: string;
  value: number;
  pct: number;
  color: string;
}

export function DonutWithLegend({
  slices,
  centerLabel,
  centerValue,
  onSliceClick,
}: {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  onSliceClick?: (name: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[150px] h-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices} dataKey="value" nameKey="name"
              innerRadius={48} outerRadius={72}
              paddingAngle={1.5} strokeWidth={0}
              onClick={
                onSliceClick
                  ? (entry: { name?: string | number }) => {
                      if (typeof entry?.name === 'string') onSliceClick(entry.name);
                    }
                  : undefined
              }
              style={onSliceClick ? { cursor: 'pointer' } : undefined}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-extrabold" style={{ color: 'var(--fin-text)' }}>{centerValue}</span>
          <span className="text-[10px]" style={{ color: 'var(--fin-text-muted)' }}>{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 min-w-0 space-y-1">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-[11.5px]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <button
              className={`truncate text-left ${onSliceClick ? 'hover:underline' : 'cursor-default'}`}
              style={{ color: 'var(--fin-text)' }}
              onClick={onSliceClick ? () => onSliceClick(s.name) : undefined}
              tabIndex={onSliceClick ? 0 : -1}
            >
              {s.name}
            </button>
            <span className="ml-auto font-semibold whitespace-nowrap" style={{ color: 'var(--fin-text)' }}>
              {formatINR(s.value)}
            </span>
            <span className="w-11 text-right whitespace-nowrap" style={{ color: 'var(--fin-text-faint)' }}>
              ({s.pct.toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Budget vs actual (HTML bars: gray budget track + colored actual) ────────

export interface BudgetBarRow {
  category: string;
  budget: number;
  actual: number;
  diff: number;
}

export function BudgetVsActualBars({ rows }: { rows: BudgetBarRow[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.budget, r.actual)), 1);
  return (
    <div>
      <div className="flex items-center gap-4 mb-2.5 text-[10.5px]" style={{ color: 'var(--fin-text-muted)' }}>
        <LegendSwatch color="var(--fin-track)" label="Budget" />
        <LegendSwatch color="var(--fin-good)" label="Actual" />
        <LegendSwatch color="var(--fin-bad)" label="Over budget" />
        <span className="ml-auto font-semibold">Left over</span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => {
          const over = r.diff < 0;
          return (
            <li key={r.category} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-20 truncate text-right shrink-0" style={{ color: 'var(--fin-text)' }}>
                {r.category}
              </span>
              <div
                className="relative flex-1 h-4 rounded overflow-hidden"
                style={{ background: 'var(--fin-track)' }}
                title={`Budget ${formatINR(r.budget)} · Spent ${formatINR(r.actual)}`}
              >
                {/* budget marker (end of gray track = budget) */}
                <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${(r.budget / max) * 100}%`, background: 'color-mix(in srgb, var(--fin-text-faint) 28%, var(--fin-track))' }} />
                <div
                  className="absolute inset-y-[3px] left-0 rounded"
                  style={{
                    width: `${(r.actual / max) * 100}%`,
                    background: over ? 'var(--fin-bad)' : 'var(--fin-good)',
                  }}
                />
              </div>
              <span className="w-16 text-right font-semibold whitespace-nowrap" style={{ color: 'var(--fin-text)' }}>
                {formatINR(r.actual)}
              </span>
              <span
                className="w-14 text-right font-bold whitespace-nowrap"
                style={{ color: over ? 'var(--fin-bad)' : 'var(--fin-good)' }}
              >
                {over ? `-${formatINRCompact(-r.diff).slice(1)}` : formatINRCompact(r.diff).slice(1)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
