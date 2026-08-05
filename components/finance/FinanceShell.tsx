'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FinanceProvider, useFinance } from '@/lib/finance/store';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function FinanceShell({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <ShellInner>{children}</ShellInner>
    </FinanceProvider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { status } = useFinance();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/finance/login';

  useEffect(() => {
    if (status === 'signedOut' && !isLogin) router.replace('/finance/login');
    if (status === 'ready' && isLogin) router.replace('/finance');
  }, [status, isLogin, router]);

  if (isLogin) {
    return <div className="finance-root min-h-screen">{children}</div>;
  }

  if (status !== 'ready') {
    return (
      <div className="finance-root min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-[var(--fin-track)] border-t-[var(--fin-accent)] animate-spin" />
          <p className="mt-4 text-sm" style={{ color: 'var(--fin-text-muted)' }}>
            Loading your finances…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="finance-root min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-5">{children}</main>
        <footer
          className="px-5 py-3 text-[11px] flex flex-wrap gap-x-6 gap-y-1 border-t"
          style={{ color: 'var(--fin-text-faint)', borderColor: 'var(--fin-border)' }}
        >
          <span>All amounts in INR</span>
          <span>Dashboard updates automatically based on the selected Month &amp; Year</span>
          <span>All data comes from your Transactions, Investments and other inputs</span>
        </footer>
      </div>
    </div>
  );
}
