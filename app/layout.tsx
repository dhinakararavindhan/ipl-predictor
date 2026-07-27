import type { Metadata } from 'next';
import './globals.css';
import { SimulationRunner } from '@/components/SimulationRunner';
import { ThemeProvider } from '@/lib/theme';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SupabaseProvider } from '@/components/social/SupabaseProvider';
import { AuthButton } from '@/components/social/AuthButton';
import { NotificationsBell } from '@/components/social/NotificationsBell';
import Link from 'next/link';
import { Radio, Crown, Globe, Megaphone, Heart, BookOpen, MonitorPlay, FlaskConical } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    default: 'The Stands — The home crowd for every sport',
    template: '%s | The Stands',
  },
  description:
    'Every match has a home crowd. Chant, Roar, and make your Call on cricket, football, basketball and more — plus a full IPL playoff lab.',
  keywords: ['sports', 'fans', 'cricket', 'IPL', 'football', 'predictions', 'community'],
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
};

export const viewport = {
  themeColor: '#6366f1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script: apply saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ipl-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <ThemeProvider>
        <SupabaseProvider>
          <SimulationRunner />

          {/* Navigation */}
          <nav
            className="sticky top-0 z-50 border-b"
            style={{
              background: 'var(--bg-nav)',
              borderColor: 'var(--border)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">🏟️</span>
                  </div>
                  <div>
                    <span className="font-bold text-primary text-sm">The Stands</span>
                    <span className="hidden sm:inline text-xs text-muted ml-1">every fan&apos;s home</span>
                  </div>
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-0.5 overflow-x-auto">
                  <Link
                    href="/predict"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Predict</span>
                  </Link>
                  <Link
                    href="/live"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Radio className="w-3.5 h-3.5 text-red-500" />
                    <span className="hidden sm:inline">Live</span>
                  </Link>
                  <Link
                    href="/support"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Support</span>
                  </Link>
                  <Link
                    href="/blogs"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Blogs</span>
                  </Link>
                  <Link
                    href="/videos"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <MonitorPlay className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Videos</span>
                  </Link>
                  <Link
                    href="/sports"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Sports</span>
                  </Link>
                  <Link
                    href="/lab"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">IPL Lab</span>
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Fans</span>
                  </Link>
                </div>

                {/* Right side: live badge + theme toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">LIVE</span>
                  </div>
                  <NotificationsBell />
                  <AuthButton />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t mt-16 py-8" style={{ borderColor: 'var(--border)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-faint">
              <p>The Stands · The home crowd for every sport · Not affiliated with any league or team</p>
              <p className="mt-1">Cricket probabilities from 10,000 Monte Carlo simulations · Fan content moderated by the community</p>
            </div>
          </footer>
        </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
