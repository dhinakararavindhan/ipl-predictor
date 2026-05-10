'use client';

export function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="w-6 h-6 rounded-full" style={{ background: 'var(--border)' }} />
          <div className="w-8 h-8 rounded-lg" style={{ background: 'var(--border)' }} />
          <div className="flex-1 h-4 rounded" style={{ background: 'var(--border)' }} />
          <div className="w-8 h-4 rounded" style={{ background: 'var(--border)' }} />
          <div className="w-8 h-4 rounded" style={{ background: 'var(--border)' }} />
          <div className="w-10 h-4 rounded" style={{ background: 'var(--border)' }} />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-4 animate-pulse space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg" style={{ background: 'var(--border)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded w-24" style={{ background: 'var(--border)' }} />
          <div className="h-3 rounded w-16" style={{ background: 'var(--border)' }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-2 rounded w-4/5" style={{ background: 'var(--border)' }} />
        <div className="h-2 rounded w-3/5" style={{ background: 'var(--border)' }} />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-48 rounded-xl animate-pulse flex items-end gap-2 p-4" style={{ background: 'var(--border)' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${20 + Math.random() * 60}%`, background: 'var(--border-card)' }}
        />
      ))}
    </div>
  );
}
