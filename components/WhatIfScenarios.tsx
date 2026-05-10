'use client';

import { useState } from 'react';
import { useIPLStore } from '@/lib/store';
import { TEAMS } from '@/lib/data/teams';
import { FIXTURES } from '@/lib/data/fixtures';
import { TeamLogo } from './TeamLogo';
import { Button } from './ui/button';
import { Lightbulb, RotateCcw } from 'lucide-react';

type Scenario = {
  label: string;
  description: string;
  apply: (setWinner: (id: string, winner: string) => void) => void;
};

export function WhatIfScenarios() {
  const { setFixtureWinner, resetAllFixtures, fixtures, teams } = useIPLStore();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const pendingFixtures = fixtures.filter((f) => !f.isCompleted);

  // Build scenarios dynamically based on current teams
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
  const topTeam = sortedTeams[0];
  const bubbleTeam = sortedTeams[3]; // 4th place
  const fifthTeam = sortedTeams[4]; // 5th place

  const scenarios: Scenario[] = [
    {
      label: `${topTeam.shortName} loses all`,
      description: `What if ${topTeam.shortName} loses every remaining match?`,
      apply: (setWinner) => {
        const teamFixtures = pendingFixtures.filter(
          (f) => f.team1Id === topTeam.id || f.team2Id === topTeam.id
        );
        teamFixtures.forEach((f) => {
          const opponent = f.team1Id === topTeam.id ? f.team2Id : f.team1Id;
          setWinner(f.id, opponent);
        });
      },
    },
    {
      label: `${fifthTeam?.shortName ?? 'CSK'} wins all`,
      description: `What if ${fifthTeam?.shortName ?? 'CSK'} wins every remaining match?`,
      apply: (setWinner) => {
        const team = fifthTeam ?? sortedTeams[4];
        const teamFixtures = pendingFixtures.filter(
          (f) => f.team1Id === team.id || f.team2Id === team.id
        );
        teamFixtures.forEach((f) => {
          setWinner(f.id, team.id);
        });
      },
    },
    {
      label: 'All upsets',
      description: 'Every underdog wins their remaining matches',
      apply: (setWinner) => {
        const teamStrength = new Map(teams.map((t) => [t.id, t.baseStrength]));
        pendingFixtures.forEach((f) => {
          const s1 = teamStrength.get(f.team1Id) ?? 50;
          const s2 = teamStrength.get(f.team2Id) ?? 50;
          // Underdog = weaker team wins
          setWinner(f.id, s1 < s2 ? f.team1Id : f.team2Id);
        });
      },
    },
    {
      label: 'All favourites win',
      description: 'Every favourite wins their remaining matches',
      apply: (setWinner) => {
        const teamStrength = new Map(teams.map((t) => [t.id, t.baseStrength]));
        pendingFixtures.forEach((f) => {
          const s1 = teamStrength.get(f.team1Id) ?? 50;
          const s2 = teamStrength.get(f.team2Id) ?? 50;
          setWinner(f.id, s1 >= s2 ? f.team1Id : f.team2Id);
        });
      },
    },
    {
      label: `${bubbleTeam.shortName} collapses`,
      description: `What if ${bubbleTeam.shortName} (currently 4th) loses all remaining?`,
      apply: (setWinner) => {
        const teamFixtures = pendingFixtures.filter(
          (f) => f.team1Id === bubbleTeam.id || f.team2Id === bubbleTeam.id
        );
        teamFixtures.forEach((f) => {
          const opponent = f.team1Id === bubbleTeam.id ? f.team2Id : f.team1Id;
          setWinner(f.id, opponent);
        });
      },
    },
  ];

  const applyScenario = (scenario: Scenario) => {
    // Reset first
    resetAllFixtures();
    // Wait for reset to propagate, then apply
    setTimeout(() => {
      scenario.apply(setFixtureWinner);
      setActiveScenario(scenario.label);
    }, 50);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-primary">What If Scenarios</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.label}
            onClick={() => applyScenario(scenario)}
            className="text-left rounded-xl p-3 transition-all text-xs"
            style={{
              background: activeScenario === scenario.label ? 'var(--row-top4)' : 'var(--row-hover)',
              border: activeScenario === scenario.label ? '1.5px solid #6366f1' : '1px solid var(--border)',
            }}
          >
            <div className="font-semibold text-primary">{scenario.label}</div>
            <div className="text-muted mt-0.5">{scenario.description}</div>
          </button>
        ))}
      </div>

      {activeScenario && (
        <Button size="sm" variant="ghost" onClick={() => { resetAllFixtures(); setActiveScenario(null); }}>
          <RotateCcw className="w-3 h-3" />
          Reset to real standings
        </Button>
      )}
    </div>
  );
}
