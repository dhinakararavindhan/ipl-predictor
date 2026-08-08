'use client';

import { useEffect } from 'react';

/** Registers the service worker so the app is installable and works offline. */
export function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
      navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
        /* SW is progressive enhancement; ignore failures (e.g. private mode) */
      });
    }
  }, []);
  return null;
}
