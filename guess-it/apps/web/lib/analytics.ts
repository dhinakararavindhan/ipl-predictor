'use client';

/**
 * Anonymous gameplay analytics (QA Plan §9 events, privacy page contract).
 * Zero-dependency PostHog beacon. Completely inert unless
 * NEXT_PUBLIC_POSTHOG_KEY is set at build time — no key, no network calls.
 * Identifier is a random UUID per install; no personal data, no typed content.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

function anonId(): string {
  try {
    let id = localStorage.getItem('guessit-anon');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('guessit-anon', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export function track(event: string, properties: Record<string, unknown> = {}): void {
  if (!KEY || typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({
      api_key: KEY,
      event,
      distinct_id: anonId(),
      properties: { ...properties, $lib: 'guessit-beacon' },
      timestamp: new Date().toISOString(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${HOST}/capture/`, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(`${HOST}/capture/`, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(
        () => {},
      );
    }
  } catch {
    /* analytics must never break gameplay */
  }
}
