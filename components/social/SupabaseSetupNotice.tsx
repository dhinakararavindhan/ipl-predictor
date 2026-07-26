'use client';

import { Database } from 'lucide-react';

export function SupabaseSetupNotice({ feature = 'Social features' }: { feature?: string }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}
    >
      <Database className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
      <div className="text-sm font-medium text-primary mb-1">{feature} need Supabase</div>
      <p className="text-xs text-muted max-w-sm mx-auto">
        Copy <code>.env.example</code> to <code>.env.local</code>, add your Supabase URL and anon
        key, and run <code>supabase/migrations/0001_social.sql</code> in the SQL editor. See the
        README for details.
      </p>
    </div>
  );
}
