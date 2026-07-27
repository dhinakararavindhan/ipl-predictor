'use client';

import { useState } from 'react';
import { Mail, Smartphone } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSupabase } from '@/lib/supabase/client';

type Method = 'social' | 'email' | 'phone';
type EmailMode = 'signin' | 'signup';

const OAUTH_PROVIDERS = [
  { id: 'google' as const, label: 'Continue with Google', mark: 'G', color: '#4285F4' },
  { id: 'apple' as const, label: 'Continue with Apple', mark: '', color: 'var(--text)' },
  { id: 'facebook' as const, label: 'Continue with Facebook', mark: 'f', color: '#1877F2' },
];

function friendlyAuthError(message: string): string {
  if (/provider is not enabled|Unsupported provider/i.test(message)) {
    return 'That sign-in method is not switched on yet — enable it in Supabase → Authentication → Providers (see README).';
  }
  if (/sms|phone/i.test(message) && /disabled|not enabled/i.test(message)) {
    return 'Phone sign-in is not switched on yet — enable an SMS provider in Supabase (see README).';
  }
  return message;
}

export function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [method, setMethod] = useState<Method>('social');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setError(null);
    setNotice(null);
  };

  const oauth = async (provider: 'google' | 'apple' | 'facebook') => {
    const supabase = getSupabase();
    if (!supabase) return;
    reset();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    if (error) setError(friendlyAuthError(error.message));
    // on success the browser navigates away to the provider
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    reset();
    try {
      if (emailMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onOpenChange(false);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          onOpenChange(false);
        } else {
          // "Confirm email" is enabled on the Supabase project
          setNotice('Check your email to confirm your account, then sign in.');
        }
      }
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : 'Something went wrong'));
    } finally {
      setBusy(false);
    }
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    reset();
    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        setOtpSent(true);
        setNotice('We texted you a 6-digit code.');
      } else {
        const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
        if (error) throw error;
        onOpenChange(false);
      }
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : 'Something went wrong'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Join the crowd"
        description="Every fan needs a place to stand. Pick your gate."
      >
        <div className="space-y-3">
          {/* Social providers */}
          {method === 'social' && (
            <div className="space-y-2">
              {OAUTH_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => oauth(provider.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary transition-all active:scale-[0.99]"
                  style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
                >
                  <span className="font-bold text-base" style={{ color: provider.color }}>
                    {provider.mark}
                  </span>
                  {provider.label}
                </button>
              ))}

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-[10px] text-faint">or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { setMethod('email'); reset(); }}>
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </Button>
                <Button variant="outline" onClick={() => { setMethod('phone'); reset(); }}>
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile
                </Button>
              </div>
            </div>
          )}

          {/* Email + password */}
          {method === 'email' && (
            <form onSubmit={submitEmail} className="space-y-3">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                required
                minLength={6}
                autoComplete={emailMode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Working…' : emailMode === 'signin' ? 'Sign in' : 'Sign up'}
              </Button>
              <button
                type="button"
                className="text-xs text-muted hover:text-primary transition-colors"
                onClick={() => {
                  setEmailMode(emailMode === 'signin' ? 'signup' : 'signin');
                  reset();
                }}
              >
                {emailMode === 'signin'
                  ? 'New here? Create an account'
                  : 'Already have an account? Sign in'}
              </button>
            </form>
          )}

          {/* Phone OTP */}
          {method === 'phone' && (
            <form onSubmit={submitPhone} className="space-y-3">
              <Input
                type="tel"
                required
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^+0-9]/g, ''))}
                disabled={otpSent}
              />
              {otpSent && (
                <Input
                  inputMode="numeric"
                  required
                  minLength={6}
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              )}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Working…' : otpSent ? 'Verify code' : 'Text me a code'}
              </Button>
              {otpSent && (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-primary transition-colors"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    reset();
                  }}
                >
                  Different number?
                </button>
              )}
            </form>
          )}

          {method !== 'social' && (
            <button
              type="button"
              className="text-xs text-muted hover:text-primary transition-colors"
              onClick={() => { setMethod('social'); reset(); }}
            >
              ← All sign-in options
            </button>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          {notice && <p className="text-xs text-emerald-600 dark:text-emerald-400">{notice}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
