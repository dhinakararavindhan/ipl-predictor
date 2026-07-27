import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.CRICAPI_KEY;
    const seriesId = process.env.IPL_SERIES_ID ?? 'c75f8952-74d4-416f-b7b4-25c6d5e2b2b1';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No CRICAPI_KEY configured. Using static data.', live: false },
        { status: 200 }
      );
    }

    // Fetch player statistics from CricAPI - no caching
    const [battingRes, bowlingRes] = await Promise.all([
      fetch(
        `https://api.cricapi.com/v1/series_batting_stats?apikey=${apiKey}&id=${seriesId}&offset=0`,
        { cache: 'no-store' }
      ),
      fetch(
        `https://api.cricapi.com/v1/series_bowling_stats?apikey=${apiKey}&id=${seriesId}&offset=0`,
        { cache: 'no-store' }
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
      live: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Player stats fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch player stats. Using static data.', live: false },
      { status: 200 }
    );
  }
}