'use client';

/**
 * "Install app" affordance: captures the browser's beforeinstallprompt event
 * (Android/desktop Chrome) and offers a one-tap install. On iOS Safari —
 * which has no install event — shows the Add-to-Home-Screen hint instead.
 */
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return; // already installed
    if (localStorage.getItem('guessit-install-dismissed')) return;
    setDismissed(false);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua)) setIosHint(true);

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem('guessit-install-dismissed', '1');
    setDismissed(true);
  };

  if (dismissed || (!deferred && !iosHint)) return null;

  return (
    <div className="card pop-in flex items-center gap-3 p-3" style={{ borderColor: 'var(--accent)' }}>
      <span className="text-2xl">⬇️</span>
      <div className="flex-1">
        <p className="text-sm font-bold">Get the app</p>
        <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
          {deferred
            ? 'Install GUESS IT on your home screen — free, instant, works offline.'
            : 'iPhone: tap Share, then “Add to Home Screen”.'}
        </p>
      </div>
      {deferred && (
        <button
          className="btn btn-primary px-4 py-2 text-xs"
          onClick={async () => {
            await deferred.prompt();
            const choice = await deferred.userChoice;
            if (choice.outcome === 'accepted') dismiss();
            setDeferred(null);
          }}
        >
          INSTALL
        </button>
      )}
      <button className="text-xs" style={{ color: 'var(--text-dim)' }} onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
