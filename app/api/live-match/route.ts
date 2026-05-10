import { NextResponse } from 'next/server';

// Free IPL API — no key required
const FREE_API_BASE = 'https://ipl-okn0.onrender.com';

// Cache for 30 seconds
let cache: { data: Record<string, unknown>; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000;

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  // Try the free IPL API first (no key needed)
  try {
    const [liveRes, live2Res, live3Res] = await Promise.allSettled([
      fetch(`${FREE_API_BASE}/ipl-2026-live-score`, { cache: 'no-store' }),
      fetch(`${FREE_API_BASE}/ipl-2026-live-score-s2`, { cache: 'no-store' }),
      fetch(`${FREE_API_BASE}/ipl-2026-live-score-s3`, { cache: 'no-store' }),
    ]);

    // Try source 3 (Cricbuzz) first — most reliable
    let liveData: Record<string, unknown> | null = null;
    let source = '';
    let isLive = false;

    for (const [res, src] of [
      [live3Res, 'cricbuzz'],
      [liveRes, 'sportskeeda'],
      [live2Res, 'crex'],
    ] as const) {
      if (res.status === 'fulfilled' && res.value.ok) {
        const json = await res.value.json();
        if (json.status_code === 200) {
          // Accept any response with matches — live or completed
          const hasMatches = json.matches && Object.keys(json.matches).length > 0;
          const hasLiveScore = json.live_score && Object.keys(json.live_score).length > 0;
          if (hasMatches || hasLiveScore || json.live_count > 0) {
            liveData = json;
            source = src;
            isLive = json.live_count > 0;
            break;
          }
        }
      }
    }

    if (liveData) {
      const result = { live: isLive, source, data: liveData };
      cache = { data: result, timestamp: now };
      return NextResponse.json(result);
    }
  } catch (err) {
    console.error('Free API error:', err);
  }

  // Fallback to CricAPI if free API is down
  const apiKey = process.env.CRICAPI_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const json = await res.json();
        const iplMatches = (json.data ?? []).filter(
          (m: Record<string, unknown>) =>
            typeof m.name === 'string' &&
            ((m.name as string).includes('Indian Premier League') ||
              (m.name as string).includes('IPL'))
        );
        const result = {
          live: iplMatches.length > 0,
          source: 'cricapi',
          matches: iplMatches,
        };
        cache = { data: result, timestamp: now };
        return NextResponse.json(result);
      }
    } catch (err) {
      console.error('CricAPI fallback error:', err);
    }
  }

  return NextResponse.json({ live: false, error: 'All sources failed' });
}
