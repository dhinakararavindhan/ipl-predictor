import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { SwRegister } from '@/components/SwRegister';

export const metadata: Metadata = {
  title: 'GUESS IT — Think. Guess. Outsmart.',
  description:
    'The universal guessing game. Actors, movies, heroes, numbers, anything — crack it with clues, codes and deduction against AI opponents.',
  appleWebApp: { capable: true, title: 'GUESS IT', statusBarStyle: 'black-translucent' },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0b0e14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SwRegister />
        <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-4 pb-24">
          {children}
        </div>
        {/* Bottom tab bar (UI/UX §3) */}
        <nav
          className="fixed bottom-0 left-1/2 z-40 w-full max-w-[520px] -translate-x-1/2 border-t px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2"
          style={{ background: 'rgba(11,14,20,0.92)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center justify-around">
            {[
              { href: '/', label: 'Home', emoji: '🏠' },
              { href: '/play', label: 'Play', emoji: '🎮' },
              { href: '/daily', label: 'Daily', emoji: '🎯' },
              { href: '/history', label: 'History', emoji: '📜' },
              { href: '/profile', label: 'Profile', emoji: '🧠' },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-medium"
                style={{ color: 'var(--text-dim)' }}
              >
                <span className="text-lg leading-none">{t.emoji}</span>
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}
