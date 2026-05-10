'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SimulationResult, Team } from '@/lib/types';

interface ProbabilityChartProps {
  teams: Team[];
  results: SimulationResult[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl p-3 shadow-xl text-sm"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <p className="font-bold mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {(p.value * 100).toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ProbabilityChart({ teams, results }: ProbabilityChartProps) {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const data = results
    .sort((a, b) => b.top4Probability - a.top4Probability)
    .map((r) => ({
      name: teamMap.get(r.teamId)?.shortName ?? r.teamId,
      'Top 4': r.top4Probability,
      'Top 2': r.top2Probability,
    }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          domain={[0, 1]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--row-hover)' }} />
        <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: 12 }} />
        <Bar dataKey="Top 4" fill="#6366f1" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
        <Bar dataKey="Top 2" fill="#10b981" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  );
}
