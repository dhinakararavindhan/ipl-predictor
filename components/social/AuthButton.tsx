'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, Pencil, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSocial } from './SupabaseProvider';
import { SignInDialog } from './SignInDialog';
import { EditProfileDialog } from './EditProfileDialog';
import { UserAvatar } from './UserAvatar';

const ONBOARDED_KEY = 'stands-onboarded';

export function AuthButton() {
  const { configured, loading, user, profile, signOut } = useSocial();
  const [signInOpen, setSignInOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Fresh accounts still carry the generated fan_xxxxxxxx username — walk
  // them straight into picking a name and a favourite team, once.
  useEffect(() => {
    if (!profile || !/^fan_[0-9a-f]{8}$/.test(profile.username)) return;
    if (localStorage.getItem(ONBOARDED_KEY)) return;
    const timer = setTimeout(() => {
      localStorage.setItem(ONBOARDED_KEY, '1');
      setProfileOpen(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [profile]);

  if (!configured || loading) return null;

  if (!user) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setSignInOpen(true)}>
          <UserRound className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign in</span>
        </Button>
        <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      </>
    );
  }

  const author = profile ?? {
    username: user.email?.split('@')[0] ?? 'fan',
    displayName: null,
    favoriteTeamId: null,
  };

  return (
    <>
      <button
        onClick={() => setMenuOpen(true)}
        className="rounded-full transition-transform active:scale-95"
        aria-label="Account"
      >
        <UserAvatar author={author} size="sm" />
      </button>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent title={author.displayName || author.username} description={user.email ?? undefined}>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setMenuOpen(false);
                setProfileOpen(true);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit profile
            </Button>
            {profile?.isAdmin && (
              <Link href="/admin" className="block" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Moderation
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={async () => {
                await signOut();
                setMenuOpen(false);
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
