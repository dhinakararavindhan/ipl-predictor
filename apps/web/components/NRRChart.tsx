'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Team } from '@/lib/types';
import { formatNRR } from '@/lib/utils';

interface NRRChartProps {
  teams: Team[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Team; value: number }[];
}) => {
  if (active && payload && payload.length) {
    const team = payload[0].payload;
    return (
      <div
        className="rounded-xl p-3 shadow-xl text-sm"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <p className="font-bold">{team.shortName}</p>
        <p className="text-muted">
          NRR:{' '}
          <span className={team.nrr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
            {formatNRR(team.nrr)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function NRRChart({ teams }: NRRChartProps) {
  const sorted = [...teams].sort((a, b) => b.nrr - a.nrr);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={sorted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="shortName"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v.toFixed(2)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--row-hover)' }} />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
        <Bar dataKey="nrr" radius={[4, 4, 0, 0]}>
          {sorted.map((team) => (
            <Cell
              key={team.id}
              fill={team.nrr >= 0 ? '#10b981' : '#ef4444'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
