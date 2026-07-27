import { NextRequest, NextResponse } from 'next/server';
import { Team, Fixture } from '@/lib/types';
import { runSimulation } from '@/lib/simulation';

export async function POST(req: NextRequest) {
  try {
    const { teams, fixtures } = (await req.json()) as {
      teams: Team[];
      fixtures: Fixture[];
    };

    const results = runSimulation(teams, fixtures);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
}
