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
    const [battingRes, bowlingRes] = await Promise.all([
      fetch(
        `https://api.cricapi.com/v1/series_batting_stats?apikey=${apiKey}&id=${seriesId}&offset=0`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://api.cricapi.com/v1/series_bowling_stats?apikey=${apiKey}&id=${seriesId}&offset=0`,
        { next: { revalidate: 300 } }
      ),
    ]);

    const battingData = await battingRes.json();
    const bowlingData = await bowlingRes.json();

    if (battingData.status !== 'success' || bowlingData.status !== 'success') {
      return NextResponse.json(
        { error: 'CricAPI request failed. Using static data.', live: false },
        { status: 200 }
      );
    }

    const result = { 
      data: {
        batting: battingData.data,
        bowling: bowlingData.data
      },
      live: true 
    };
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