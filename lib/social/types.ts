// Social layer vocabulary:
//   Chant = a post under a match, Roar = a like on a Chant,
//   Call = a winner prediction for a match.

export interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  favoriteTeamId: string | null;
  avatarUrl: string | null;
}

export type ChantAuthor = Pick<Profile, 'username' | 'displayName' | 'favoriteTeamId' | 'avatarUrl'>;

export interface Chant {
  id: string;
  matchId: string;
  userId: string;
  body: string;
  createdAt: string;
  author: ChantAuthor;
  roarCount: number;
  roaredByMe: boolean;
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
