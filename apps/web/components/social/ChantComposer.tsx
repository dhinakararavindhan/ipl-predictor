'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { postChant } from '@/lib/social/api';
import { useSocial } from './SupabaseProvider';

const MAX_LENGTH = 500;

export function ChantComposer({
  matchId,
  onPosted,
  onNeedSignIn,
}: {
  matchId: string;
  onPosted: () => void;
  onNeedSignIn: () => void;
}) {
  const { user } = useSocial();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNeedSignIn();
      return;
    }
    const trimmed = body.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await postChant(matchId, trimmed);
      setBody('');
      onPosted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(
        msg.includes('row-level security')
          ? "You can't post right now — your account may be restricted."
          : msg || 'Could not post your chant'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        rows={2}
        maxLength={MAX_LENGTH}
        placeholder={user ? 'Start a chant…' : 'Sign in to join the chants'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onClick={() => {
          if (!user) onNeedSignIn();
        }}
        readOnly={!user}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-faint">{body.length}/{MAX_LENGTH}</span>
        <Button type="submit" size="sm" disabled={busy || (user !== null && !body.trim())}>
          <Send className="w-3.5 h-3.5" />
          {busy ? 'Chanting…' : 'Chant'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
