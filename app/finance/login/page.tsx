'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, PiggyBank, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { getSupabase, supabaseEnabled } from '@/lib/finance/supabase';
import { useFinance } from '@/lib/finance/store';

type FormMode = 'signin' | 'signup';

export default function LoginPage() {
  const { enterDemo } = useFinance();
  const [formMode, setFormMode] = useState<FormMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    try {
      if (formMode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (!data.session) {
          setNotice('Account created. Check your email to confirm, then sign in.');
        }
        // With email confirmation off, a session exists and the auth listener
        // in the store signs the user straight in.
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex w-[46%] flex-col justify-between p-10 text-white"
        style={{ background: 'var(--fin-sidebar)' }}
      >
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide leading-snug">
            Personal Finance
            <br />
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-white/60">Your money. Your goals. Your future.</p>
        </div>

        <div className="space-y-5">
          {[
            { icon: Wallet, title: 'Everything in one place', desc: 'Income, expenses, savings, credit cards, EMIs, investments and net worth.' },
            { icon: PiggyBank, title: 'Built for monthly budgets', desc: 'Made for salaried life — set a budget per category and see exactly where the month went.' },
            { icon: TrendingUp, title: 'Watch your net worth grow', desc: 'A 12-month trend of your wealth, updated from what you actually save.' },
            { icon: ShieldCheck, title: 'Private to you', desc: 'Your own login — every person sees only their own data.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-white/60 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <blockquote className="text-xs text-white/50 italic">
          “Do not save what is left after spending, but spend what is left after saving.” — Warren Buffett
        </blockquote>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-xl font-extrabold uppercase tracking-wide" style={{ color: 'var(--fin-text)' }}>
              Personal Finance Dashboard
            </h1>
            <p className="mt-1 text-xs" style={{ color: 'var(--fin-text-muted)' }}>
              Your money. Your goals. Your future.
            </p>
          </div>

          <div className="fin-card p-6">
            {supabaseEnabled ? (
              <>
                <h2 className="text-lg font-bold" style={{ color: 'var(--fin-text)' }}>
                  {formMode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--fin-text-muted)' }}>
                  {formMode === 'signin'
                    ? 'Sign in to see your dashboard.'
                    : 'Free forever. Your data is visible only to you.'}
                </p>

                <form onSubmit={submit} className="mt-5 space-y-4">
                  <div>
                    <label className="fin-label" htmlFor="email">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fin-text-faint)' }} />
                      <input
                        id="email" type="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="fin-input pl-9" placeholder="you@example.com" autoComplete="email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="fin-label" htmlFor="password">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fin-text-faint)' }} />
                      <input
                        id="password" type={showPassword ? 'text' : 'password'} required minLength={6}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="fin-input pl-9 pr-10" placeholder="••••••••"
                        autoComplete={formMode === 'signin' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button" onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--fin-text-faint)' }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--fin-bad)', background: 'var(--fin-bad-bg)' }}>
                      {error}
                    </p>
                  )}
                  {notice && (
                    <p className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--fin-good)', background: 'var(--fin-good-bg)' }}>
                      {notice}
                    </p>
                  )}

                  <button type="submit" disabled={busy} className="fin-btn-primary w-full">
                    {busy ? 'Please wait…' : formMode === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                </form>

                <p className="mt-4 text-xs text-center" style={{ color: 'var(--fin-text-muted)' }}>
                  {formMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    className="font-semibold"
                    style={{ color: 'var(--fin-accent)' }}
                    onClick={() => { setFormMode(formMode === 'signin' ? 'signup' : 'signin'); setError(null); setNotice(null); }}
                  >
                    {formMode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: 'var(--fin-border)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--fin-text-faint)' }}>or</span>
                  <div className="h-px flex-1" style={{ background: 'var(--fin-border)' }} />
                </div>
              </>
            ) : (
              <div className="mb-5">
                <h2 className="text-lg font-bold" style={{ color: 'var(--fin-text)' }}>Try the dashboard</h2>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--fin-text-muted)' }}>
                  Cloud accounts are not configured yet, so sign-in is disabled. Explore with demo
                  data below — everything stays on this device. To enable personal accounts, add
                  Supabase keys to <code>.env.local</code> and run <code>supabase/schema.sql</code>{' '}
                  (see README).
                </p>
              </div>
            )}

            <button onClick={enterDemo} className="fin-btn-ghost w-full flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--fin-accent)' }} />
              Continue in demo mode
            </button>
          </div>

          <p className="mt-4 text-center text-[11px]" style={{ color: 'var(--fin-text-faint)' }}>
            All amounts in INR · Built for everyday monthly budgeting
          </p>
        </div>
      </div>
    </div>
  );
}
