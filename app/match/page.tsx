'use client';

import { useState, useEffect } from 'react';
import { useIPLStore } from '@/lib/store';
import { getMatchPredictions } from '@/lib/simulation';
import { FIXTURES } from '@/lib/data/fixtures';
import { TeamLogo } from '@/components/TeamLogo';
import { WinProbabilityGraph } from '@/components/WinProbabilityGraph';
import { NRRCalculator } from '@/components/NRRCalculator';
import { PointsTable } from '@/components/PointsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNRR } from '@/lib/utils';
import { Trophy, Calculator, TrendingUp, Calendar, MapPin, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function MatchPredictorPage() {
  const { teams, fixtures, simulationResults } = useIPLStore();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showAllMatches, setShowAllMatches] = useState(false);

  // Find the first remaining match
  const selectedMatch = fixtures.find((f) => f.id === selectedMatchId) ?? fixtures.find((f) => !f.isCompleted);
  const predictions = getMatchPredictions(teams, fixtures);
  const predMap = new Map(predictions.map((p) => [p.fixtureId, p.team1WinProbability]));

  const filteredFixtures = showAllMatches
    ? fixtures.filter((f) => !f.isCompleted)
    : fixtures.filter((f) => !f.isCompleted).slice(0, 6);

  const sortedResults = [...simulationResults].sort(
    (a, b) => b.top4Probability - a.top4Probability
  );

  if (!selectedMatch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-primary">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted opacity-40 mb-4" />
          <h1 className="text-2xl font-bold text-primary">No Match Selected</h1>
          <p className="text-muted mt-2">Select a match from the list below</p>
        </div>
      </div>
    );
  }

  const team1 = teams.find((t) => t.id === selectedMatch.team1Id);
  const team2 = teams.find((t) => t.id === selectedMatch.team2Id);
  const pred = predMap.get(selectedMatch.id) ?? 0.5;
  const t1Prob = selectedMatch.team1Id === team1?.id ? pred : 1 - pred;
  const t2Prob = 1 - t1Prob;

  if (!team1 || !team2) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-primary">Match Not Found</h1>
        <p className="text-muted mt-2">The selected match could not be found</p>
      </div>
    );
  }

  // Get playoff odds (after null check)
  const team1Odds = sortedResults.find((r) => r.teamId === team1.id)?.top4Probability ?? 0;
  const team2Odds = sortedResults.find((r) => r.teamId === team2.id)?.top4Probability ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-primary">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <span className="text-muted">|</span>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
            {selectedMatch.importance === 'critical' ? 'Critical' : selectedMatch.importance === 'high' ? 'High' : 'Medium'} Match
          </span>
        </div>
        <button
          onClick={() => setShowAllMatches(!showAllMatches)}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}
        >
          {showAllMatches ? 'Show Next 6' : 'Show All Remaining'}
        </button>
      </div>

      {/* Match Header */}
      <div className="rounded-xl p-4 text-center space-y-3" style={{ background: 'var(--row-top2)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-center gap-2 text-muted text-xs">
          <Calendar className="w-3 h-3" />
          <span>{selectedMatch.date}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-muted" />
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[150px]">{selectedMatch.venue.split(',')[0]}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <TeamLogo team={team1} size="md" />
            <span className="font-bold text-primary text-sm">{team1.shortName}</span>
            <span className="text-[10px] text-muted">{team1.points} pts</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-muted">VS</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <TeamLogo team={team2} size="md" />
            <span className="font-bold text-primary text-sm">{team2.shortName}</span>
            <span className="text-[10px] text-muted">{team2.points} pts</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-[10px] text-muted">Win Prob</div>
            <div className="text-lg font-bold text-primary">{(t1Prob * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted">Win Prob</div>
            <div className="text-lg font-bold text-primary">{(t2Prob * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Win Probability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-indigo-500" />
              Win Probability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <WinProbabilityGraph
              team1Name={team1.shortName}
              team2Name={team2.shortName}
              team1Color={team1.color}
              team2Color={team2.color}
              score1={selectedMatch.score_1 || ''}
              score2={selectedMatch.score_2 || ''}
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Prediction</span>
                <span className="font-semibold text-primary">
                  {t1Prob > 0.5 ? team1.shortName : team2.shortName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Confidence</span>
                <span className="font-semibold text-primary">
                  {Math.abs(t1Prob - 0.5) * 200 > 50 ? 'High' : 'Medium'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NRR Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calculator className="w-4 h-4 text-emerald-500" />
              NRR Predictor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NRRCalculator 
              selectedTeamId={team1.id}
              targetTeamId={team2.id}
              liveTeam1Score={selectedMatch.score_1}
              liveTeam2Score={selectedMatch.score_2}
              liveTeam1Overs={selectedMatch.overs_1}
              liveTeam2Overs={selectedMatch.overs_2}
              liveTeam1Wickets={selectedMatch.wickets_1}
              liveTeam2Wickets={selectedMatch.wickets_2}
            />
          </CardContent>
        </Card>
      </div>

      {/* Live Standings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-emerald-500" />
            Live Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PointsTable simulationResults={simulationResults} />
        </CardContent>
      </Card>

      {/* Match Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Match Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg p-2" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] text-muted mb-1">Team 1 Playoff Odds</div>
              <div className="font-bold text-primary">
                {team1Odds * 100}%
              </div>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] text-muted mb-1">Team 2 Playoff Odds</div>
              <div className="font-bold text-primary">
                {team2Odds * 100}%
              </div>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] text-muted mb-1">Match Importance</div>
              <div className={`font-bold ${selectedMatch.importance === 'critical' ? 'text-red-500' : selectedMatch.importance === 'high' ? 'text-amber-500' : 'text-blue-500'}`}>
                {selectedMatch.importance?.toUpperCase() ?? 'MEDIUM'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Remaining Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted" />
            Remaining Fixtures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {filteredFixtures.map((fixture) => {
              const t1 = teams.find((t) => t.id === fixture.team1Id);
              const t2 = teams.find((t) => t.id === fixture.team2Id);
              const matchPred = predMap.get(fixture.id) ?? 0.5;
              const t1WinProb = fixture.team1Id === t1?.id ? matchPred : 1 - matchPred;

              if (!t1 || !t2) return null;

              return (
                <div
                  key={fixture.id}
                  onClick={() => setSelectedMatchId(fixture.id)}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
                  style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo team={t1} size="xs" />
                      <span className="font-semibold text-primary text-xs">{t1.shortName}</span>
                    </div>
                    <span className="text-[10px] text-muted">vs</span>
                    <div className="flex items-center gap-1.5">
                      <TeamLogo team={t2} size="xs" />
                      <span className="font-semibold text-primary text-xs">{t2.shortName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-muted">{fixture.date}</div>
                    </div>
                    <div className="w-12 text-center">
                      <div className="text-xs font-semibold text-primary">{(t1WinProb * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredFixtures.length === 0 && (
            <div className="text-center py-4 text-xs text-muted">
              All matches completed
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
