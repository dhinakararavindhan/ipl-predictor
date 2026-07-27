'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, Megaphone, MonitorPlay, Radio } from 'lucide-react';

const TABS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/predict', icon: Megaphone, label: 'Predict' },
  { href: '/live', icon: Radio, label: 'Live' },
  { href: '/blogs', icon: BookOpen, label: 'Blogs' },
  { href: '/videos', icon: MonitorPlay, label: 'Videos' },
];

// App-style bottom navigation on phones (and inside the Android/iOS shells).
// Hidden on sm+ where the top nav carries the tabs.
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t"
      style={{
        background: 'var(--bg-nav)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors"
              style={{ color: active ? '#6366f1' : 'var(--text-muted)' }}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
