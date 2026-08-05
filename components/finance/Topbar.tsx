'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { MONTH_SHORT } from '@/lib/finance/constants';
import { monthKey, parseMonthKey } from '@/lib/finance/format';
import { useFinance } from '@/lib/finance/store';

const MOBILE_LINKS = [
  { href: '/finance', label: 'Dashboard' },
  { href: '/finance/transactions', label: 'Transactions' },
  { href: '/finance/budget', label: 'Budget' },
  { href: '/finance/investments', label: 'Investments' },
  { href: '/finance/credit', label: 'Cards & EMI' },
  { href: '/finance/net-worth', label: 'Net Worth' },
  { href: '/finance/goals', label: 'Goals' },
  { href: '/finance/review', label: 'Review' },
  { href: '/finance/analytics', label: 'Analytics' },
  { href: '/finance/settings', label: 'Settings' },
];

export function Topbar() {
  const { month, setMonth } = useFinance();
  const pathname = usePathname();
  const { year, monthIndex } = parseMonthKey(month);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const stamp = () =>
    setUpdatedAt(
      new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    );

  // Stamped after mount (async) so the static HTML and first client render match.
  useEffect(() => {
    const t = setTimeout(stamp, 0);
    return () => clearTimeout(t);
  }, []);

  const nowYear = new Date().getFullYear();
  const years = Array.from({ length: nowYear - 2023 + 2 }, (_, i) => 2023 + i);

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
  };

  return (
    <header className="text-white" style={{ background: 'var(--fin-topbar)' }}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 h-14">
        <span className="md:hidden text-sm font-extrabold tracking-wide uppercase">Finance</span>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <label className="hidden sm:block text-xs text-white/70">Select Month</label>
          <select
            value={monthIndex}
            onChange={(e) => setMonth(monthKey(year, Number(e.target.value)))}
            className="rounded-md px-2 py-1.5 text-sm font-medium outline-none"
            style={selectStyle}
            aria-label="Select month"
          >
            {MONTH_SHORT.map((m, i) => (
              <option key={m} value={i} className="text-slate-900">
                {m} {year}
              </option>
            ))}
          </select>

          <label className="hidden sm:block text-xs text-white/70">Year</label>
          <select
            value={year}
            onChange={(e) => setMonth(monthKey(Number(e.target.value), monthIndex))}
            className="rounded-md px-2 py-1.5 text-sm font-medium outline-none"
            style={selectStyle}
            aria-label="Select year"
          >
            {years.map((y) => (
              <option key={y} value={y} className="text-slate-900">
                {y}
              </option>
            ))}
          </select>

          <div className="hidden lg:block text-right leading-tight border-l border-white/20 pl-3">
            <p className="text-[10px] text-white/60">Last Updated</p>
            <p className="text-[11px] font-medium">{updatedAt ?? '—'}</p>
          </div>
          <button
            onClick={stamp}
            aria-label="Refresh"
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav (sidebar is hidden below md) */}
      <nav className="md:hidden flex gap-1 overflow-x-auto px-2 pb-2">
        {MOBILE_LINKS.map((l) => {
          const active = l.href === '/finance' ? pathname === '/finance' : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                active ? 'bg-white/20' : 'text-white/70 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
