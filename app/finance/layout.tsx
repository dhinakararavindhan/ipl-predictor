import type { Metadata } from 'next';
import { FinanceShell } from '@/components/finance/FinanceShell';

export const metadata: Metadata = {
  title: 'Personal Finance Dashboard',
  description:
    'Track income, expenses, savings, investments, credit cards, EMIs, goals and net worth — all in one place.',
};

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FinanceShell>{children}</FinanceShell>;
}
