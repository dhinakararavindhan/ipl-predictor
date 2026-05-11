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

    const apiKey = process.env.CRICAPI_KEY;
    const seriesId = process.env.IPL_SERIES_ID ?? 'c75f8952-74d4-416f-b7b4-25c6d5e2b2b1';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No CRICAPI_KEY configured. Using static data.', live: false },
        { status: 200 }
      );
    }

    // Fetch player statistics from CricAPI
    const res = await fetch(
      `https://api.cricapi.com/v1/series_batting_stats?apikey=${apiKey}&id=${seriesId}&offset=0`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'CricAPI request failed. Using static data.', live: false },
        { status: 200 }
      );
    }

    const data = await res.json();

    if (data.status !== 'success') {
      return NextResponse.json(
        { error: 'CricAPI returned error. Using static data.', live: false },
        { status: 200 }
      );
    }

    const result = { data, live: true };
    cache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Player stats fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch player stats. Using static data.', live: false },
      { status: 200 }
    );
  }
}