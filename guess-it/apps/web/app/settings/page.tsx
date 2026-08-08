'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile, useSession } from '@/lib/store';

export default function SettingsPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const resetAll = useProfile((s) => s.resetAll);
  const clearSession = useSession((s) => s.clear);

  const exportData = () => {
    const data = {
      profile: useProfile.getState(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guessit-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex flex-col gap-4 pt-8">
      <h1 className="text-2xl font-extrabold">⚙️ Settings</h1>

      <div className="card p-4">
        <h2 className="text-sm font-bold">Account</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
          You&apos;re playing as a guest. Progress lives on this device. Sign-in with progress
          sync arrives with the online release.
        </p>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-bold">Privacy</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
          All game data is stored locally on this device. Nothing is sent anywhere.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button className="btn btn-ghost py-2.5 text-sm" onClick={exportData}>
            📤 Export my data (JSON)
          </button>
          {!confirming ? (
            <button
              className="btn py-2.5 text-sm font-bold"
              style={{ background: 'rgba(255,92,122,0.15)', color: 'var(--danger)' }}
              onClick={() => setConfirming(true)}
            >
              🗑️ Delete all my data
            </button>
          ) : (
            <div className="card-2 p-3">
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                This wipes your profile, XP, streak and history forever. Type <b>DELETE</b> to confirm.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="card mt-2 w-full px-3 py-2 text-sm outline-none"
                placeholder="DELETE"
              />
              <div className="mt-2 flex gap-2">
                <button className="btn btn-ghost flex-1 py-2 text-xs" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
                <button
                  className="btn flex-1 py-2 text-xs font-bold disabled:opacity-40"
                  style={{ background: 'var(--danger)', color: 'white' }}
                  disabled={confirmText !== 'DELETE'}
                  onClick={() => {
                    resetAll();
                    clearSession();
                    router.push('/');
                  }}
                >
                  Delete everything
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-bold">About</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
          GUESS IT · MVP build · engine v1.0.0 · Think. Guess. Outsmart.
        </p>
      </div>
    </main>
  );
}
