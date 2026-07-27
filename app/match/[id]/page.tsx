import type { Metadata } from 'next';
import { FIXTURES } from '@/lib/data/fixtures';
import { getTeamById } from '@/lib/data/teams';
import { formatDate } from '@/lib/utils';
import { cricketMatchInfo } from '@/lib/social/matches';
import { MatchSocialHub } from '@/components/social/MatchSocialHub';
import { DbMatchHub } from '@/components/social/DbMatchHub';

function getFixture(id: string) {
  return FIXTURES.find((f) => f.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fixture = getFixture(id);
  // non-cricket matches resolve client-side; give them a generic share title
  if (!fixture) {
    return {
      title: 'Match Hub | The Stands',
      description: 'Chants, Roars and Calls — join the crowd on The Stands.',
    };
  }
  const team1 = getTeamById(fixture.team1Id);
  const team2 = getTeamById(fixture.team2Id);
  const title = `${team1?.shortName} vs ${team2?.shortName} · ${formatDate(fixture.date)} — Match Hub`;
  const description = `Chants, Roars and Calls for ${team1?.name} vs ${team2?.name} at ${fixture.venue}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function MatchHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fixture = getFixture(id);

  // Cricket fixtures resolve instantly from app data; anything else is
  // looked up in the matches table — any sport seeded there gets a hub.
  if (fixture) {
    return <MatchSocialHub match={cricketMatchInfo(fixture)} />;
  }
  return <DbMatchHub matchId={id} />;
}
