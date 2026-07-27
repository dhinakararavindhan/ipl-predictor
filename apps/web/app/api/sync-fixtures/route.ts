import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, runSync } from '@thestands/core';

// Fixture sync, serverless flavour: a cron (vercel.json) hits this route on
// a schedule. The identical engine also runs as the standalone
// services/fixtures-sync worker — pick whichever fits your hosting.
// Protected by CRON_SECRET (Vercel cron sends it as a Bearer token).

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
      { status: 500 }
    );
  }
  const result = await runSync(supabase);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export const POST = GET;
