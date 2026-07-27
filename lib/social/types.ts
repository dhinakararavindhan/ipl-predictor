// Social layer vocabulary:
//   Chant = a post under a match, Roar = a like on a Chant,
//   Call = a winner prediction for a match.

export interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  favoriteTeamId: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isBanned: boolean;
}

export type ChantAuthor = Pick<Profile, 'username' | 'displayName' | 'favoriteTeamId' | 'avatarUrl'>;

export interface Chant {
  id: string;
  matchId: string;
  userId: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: ChantAuthor;
  roarCount: number;
  roaredByMe: boolean;
  replies: Chant[]; // populated on top-level chants only
}

export interface Call {
  matchId: string;
  predictedTeamId: string;
  createdAt: string;
}

export interface CallSplit {
  total: number;
  byTeam: Record<string, number>; // teamId -> count
}

// ── Admin / moderation ──────────────────────────────────────────────────────

export interface Report {
  id: string;
  chantId: string;
  reason: string | null;
  createdAt: string;
  reporter: ChantAuthor;
  // the reported chant (null if it was already deleted)
  chant: {
    id: string;
    matchId: string;
    matchLabel: string;
    userId: string;
    body: string;
    createdAt: string;
    author: ChantAuthor & { userId: string; isBanned: boolean };
  } | null;
}

export interface AdminChant {
  id: string;
  matchId: string;
  matchLabel: string; // "KKR vs GT" — resolved for any sport
  userId: string;
  body: string;
  createdAt: string;
  author: ChantAuthor & { isBanned: boolean };
}

export interface AdminStats {
  fans: number;
  chants: number;
  roars: number;
  calls: number;
  reports: number;
}
