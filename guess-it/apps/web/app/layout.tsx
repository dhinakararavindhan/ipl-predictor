import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { SwRegister } from '@/components/SwRegister';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'GUESS IT — Think. Guess. Outsmart.',
  description:
    'The universal guessing game. Actors, movies, heroes, numbers, anything — crack it with clues, codes and deduction against AI opponents.',
  appleWebApp: { capable: true, title: 'GUESS IT', statusBarStyle: 'black-translucent' },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0b0e14',
  // edge-to-edge on notched iPhones/Android (safe areas handled below)
  viewportFit: 'cover',
};

const TABS = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/play', label: 'Play', emoji: '🎮' },
  { href: '/daily', label: 'Daily', emoji: '🎯' },
  { href: '/history', label: 'History', emoji: '📜' },
  { href: '/profile', label: 'Profile', emoji: '🧠' },
];

const DESKTOP_LINKS = [
  ...TABS,
  { href: '/weekly', label: 'Weekly', emoji: '🏁' },
  { href: '/party', label: 'Party', emoji: '🎪' },
  { href: '/online', label: 'Live Race', emoji: '🌎' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <SwRegister />
        {/* Desktop top nav — hidden on phones, where the bottom tab bar rules */}
        <header
          className="sticky top-0 z-40 hidden border-b lg:block"
          style={{ background: 'rgba(11,14,20,0.88)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}
        >
          <div className="mx-auto flex w-full max-w-[1120px] items-center gap-6 px-8 py-3">
            <Link href="/" className="font-display text-lg font-bold tracking-tight">
              GUESS <span className="brand-gradient">IT</span>
            </Link>
            <nav className="flex flex-1 items-center gap-1">
              {DESKTOP_LINKS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="rounded-xl px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {t.emoji} {t.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="mx-auto flex min-h-screen w-full flex-col px-4 pb-24 pt-[env(safe-area-inset-top)] lg:px-8 lg:pb-12">
          {children}
        </div>
        {/* Bottom tab bar (UI/UX §3) — phones and tablets only */}
        <nav
          className="fixed bottom-0 left-1/2 z-40 w-full max-w-[520px] -translate-x-1/2 border-t px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 lg:hidden"
          style={{ background: 'rgba(11,14,20,0.92)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center justify-around">
            {TABS.map((t) => (
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
