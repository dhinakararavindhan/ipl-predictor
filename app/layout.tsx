import type { Metadata } from 'next';
import './globals.css';
import { SimulationRunner } from '@/components/SimulationRunner';
import { ThemeProvider } from '@/lib/theme';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { Activity, BarChart3, Zap, Radio, Lightbulb, Target, Wrench, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'IPL Playoff Lab — Live Playoff Simulator',
  description:
    'Real-time IPL 2026 playoff qualification simulator with Monte Carlo simulation and AI insights.',
  keywords: ['IPL', 'cricket', 'playoffs', 'simulator', 'IPL 2026'],
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
                    <span className="text-white font-bold text-sm">🏏</span>
                  </div>
                  <div>
                    <span className="font-bold text-primary text-sm">IPL Playoff Lab</span>
                    <span className="hidden sm:inline text-xs text-muted ml-1">2026</span>
                  </div>
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-0.5 overflow-x-auto">
                  <Link
                    href="/match"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Match Predictor</span>
                  </Link>
                  <Link
                    href="/cap-predictor"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Cap Predictor</span>
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Standings</span>
                  </Link>
                  <Link
                    href="/live"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Radio className="w-3.5 h-3.5 text-red-500" />
                    <span className="hidden sm:inline">Live</span>
                  </Link>
                  <Link
                    href="/simulator"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Simulator</span>
                  </Link>
                  <Link
                    href="/scenarios"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Scenarios</span>
                  </Link>
                  <Link
                    href="/predict"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Predict</span>
                  </Link>
                  <Link
                    href="/tools"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Tools</span>
                  </Link>
                  <Link
                    href="/analytics"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Analytics</span>
                  </Link>
                </div>

                {/* Right side: live badge + theme toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">LIVE</span>
                  </div>
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
              <p>IPL Playoff Lab · Simulation-based predictions · Not affiliated with BCCI or IPL</p>
              <p className="mt-1">Probabilities based on 10,000 Monte Carlo simulations · Data from ESPNCricinfo</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
