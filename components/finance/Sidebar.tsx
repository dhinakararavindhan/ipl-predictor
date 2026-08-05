'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, CalendarCheck, CreditCard, Landmark, LayoutDashboard, LogOut,
  PiggyBank, ReceiptText, Settings, Target, TrendingUp,
} from 'lucide-react';
import { useFinance } from '@/lib/finance/store';

const NAV_ITEMS = [
  { href: '/finance', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/finance/transactions', label: 'Transactions', icon: ReceiptText },
  { href: '/finance/budget', label: 'Budget', icon: PiggyBank },
  { href: '/finance/investments', label: 'Investments', icon: TrendingUp },
  { href: '/finance/credit', label: 'Credit Cards & EMI', icon: CreditCard },
  { href: '/finance/net-worth', label: 'Net Worth', icon: Landmark },
  { href: '/finance/goals', label: 'Goals', icon: Target },
  { href: '/finance/review', label: 'Monthly Review', icon: CalendarCheck },
  { href: '/finance/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/finance/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { mode, userEmail, signOut } = useFinance();

  return (
    <aside
      className="hidden md:flex w-60 shrink-0 flex-col text-white sticky top-0 h-screen overflow-y-auto"
      style={{ background: 'var(--fin-sidebar)' }}
    >
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-lg font-extrabold leading-snug tracking-wide uppercase">
          Personal Finance
          <br />
          Dashboard
        </h1>
        <p className="mt-1 text-[11px] text-white/60">Your money. Your goals. Your future.</p>
      </div>

      <nav className="px-3 space-y-1">
        {NAV_ITEMS.map((item, i) => {
          const active =
            item.href === '/finance' ? pathname === '/finance' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
              style={
                active
                  ? { background: 'var(--fin-sidebar-active)' }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--fin-sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = '';
              }}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-90" />
              <span className="truncate">
                {i + 1}. {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 pb-6 pt-8">
        <blockquote className="text-[11.5px] leading-relaxed text-white/70 italic">
          “Do not save what is left after spending, but spend what is left after saving.”
        </blockquote>
        <p className="mt-1.5 text-[11px] text-white/50">— Warren Buffett</p>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-[11px] text-white/60 truncate">
            {mode === 'cloud' ? userEmail : 'Demo mode — data stays on this device'}
          </p>
          <button
            onClick={() => signOut()}
            className="mt-2 flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {mode === 'cloud' ? 'Sign out' : 'Exit demo'}
          </button>
        </div>
      </div>
    </aside>
  );
}
