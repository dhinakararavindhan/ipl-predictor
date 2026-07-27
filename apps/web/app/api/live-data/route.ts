import { NextResponse } from 'next/server';

// Cache for 5 minutes
let cache: { data: Record<string, unknown>; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    // Return cached data if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cache.data, cached: true });
    }

    // CricAPI free tier — requires CRICAPI_KEY env var
    const apiKey = process.env.CRICAPI_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No CRICAPI_KEY configured. Using static data.', live: false },
        { status: 200 }
      );
    }

    // Fetch IPL 2026 series standings from CricAPI
    // Series ID for IPL 2026 — update if needed
    const seriesId = process.env.IPL_SERIES_ID ?? 'c75f8952-74d4-416f-b7b4-25c6d5e2b2b1';

    const [standingsRes, matchesRes] = await Promise.all([
      fetch(
        `https://api.cricapi.com/v1/series_points?apikey=${apiKey}&id=${seriesId}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://api.cricapi.com/v1/series_schedule?apikey=${apiKey}&id=${seriesId}`,
        { next: { revalidate: 300 } }
      ),
    ]);

    if (!standingsRes.ok || !matchesRes.ok) {
      return NextResponse.json(
        { error: 'CricAPI request failed. Using static data.', live: false },
        { status: 200 }
      );
    }

    const standings = await standingsRes.json();
    const matches = await matchesRes.json();

    const result = { standings, matches, live: true };
    cache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Live data fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch live data. Using static data.', live: false },
      { status: 200 }
    );
  }
}
