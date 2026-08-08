'use client';

import { useEffect } from 'react';

/** Registers the service worker so the app is installable and works offline. */
export function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* SW is progressive enhancement; ignore failures (e.g. private mode) */
      });
    }
  }, []);
  return null;
}
