'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TEAMS } from '@/lib/data/teams';
import { updateProfile } from '@/lib/social/api';
import { Profile } from '@/lib/social/types';
import { useSocial } from './SupabaseProvider';

// Separate form component: it mounts fresh each time the dialog opens, so
// initial state can come straight from the profile without prop-sync effects.
function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const { refreshProfile } = useSocial();
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [favoriteTeamId, setFavoriteTeamId] = useState<string | null>(profile.favoriteTeamId);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateProfile(profile.id, {
        username: username.trim(),
        displayName: displayName.trim() || null,
        favoriteTeamId,
      });
      await refreshProfile();
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save profile';
      setError(msg.includes('duplicate') ? 'That username is taken' : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs text-muted mb-1 block">Username (3–20 letters, numbers, _)</label>
        <Input
          required
          pattern="[a-zA-Z0-9_]{3,20}"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted mb-1 block">Display name (optional)</label>
        <Input
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted mb-1 block">Favourite team</label>
        <div className="grid grid-cols-5 gap-1.5">
          {TEAMS.map((team) => {
            const selected = favoriteTeamId === team.id;
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => setFavoriteTeamId(selected ? null : team.id)}
                className="rounded-lg py-1.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: selected ? `${team.color}20` : 'var(--row-hover)',
                  color: team.color,
                  border: selected ? `1.5px solid ${team.color}` : '1px solid var(--border)',
                }}
                title={team.name}
              >
                {team.shortName}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}

export function EditProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile } = useSocial();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Your profile" description="How you appear in the crowd.">
        {profile ? (
          <ProfileForm profile={profile} onSaved={() => onOpenChange(false)} />
        ) : (
          <p className="text-sm text-muted">Loading your profile…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
