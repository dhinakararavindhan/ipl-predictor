import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
