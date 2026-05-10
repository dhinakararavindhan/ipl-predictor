'use client';

import { useState } from 'react';
import { useIPLStore } from '@/lib/store';
import { Button } from './ui/button';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { AIInsight } from '@/lib/types';

const insightTypeColors: Record<AIInsight['type'], string> = {
  qualification: 'text-emerald-600 dark:text-emerald-400',
  elimination:   'text-red-500 dark:text-red-400',
  pressure:      'text-amber-600 dark:text-amber-400',
  general:       'text-blue-600 dark:text-blue-400',
};

const insightTypeIcons: Record<AIInsight['type'], string> = {
  qualification: '🎯',
  elimination:   '⚠️',
  pressure:      '🔥',
  general:       '📊',
};

export function AIInsightsPanel() {
  const { teams, simulationResults, insights, addInsight, clearInsights } = useIPLStore();
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams, simulationResults }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.insights) {
          data.insights.forEach((insight: AIInsight) => addInsight(insight));
        }
      } else {
        generateLocalInsights();
      }
    } catch {
      generateLocalInsights();
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalInsights = () => {
    const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
    const resultMap = new Map(simulationResults.map((r) => [r.teamId, r]));
    const newInsights: AIInsight[] = [];

    const leader = sortedTeams[0];
    const leaderResult = resultMap.get(leader.id);
    if (leaderResult) {
      newInsights.push({
        type: 'qualification',
        teamId: leader.id,
        text: `${leader.shortName} lead the table with ${leader.points} points and have a ${(leaderResult.top4Probability * 100).toFixed(0)}% chance of qualifying. Their NRR of ${leader.nrr > 0 ? '+' : ''}${leader.nrr.toFixed(3)} gives them a strong buffer.`,
        timestamp: new Date().toISOString(),
      });
    }

    const fifthTeam = sortedTeams[4];
    const fifthResult = resultMap.get(fifthTeam?.id);
    if (fifthTeam && fifthResult) {
      newInsights.push({
        type: 'pressure',
        teamId: fifthTeam.id,
        text: `${fifthTeam.shortName} are right on the bubble at 5th place with ${fifthTeam.points} points. They have a ${(fifthResult.top4Probability * 100).toFixed(0)}% chance of making the playoffs — every match is must-win territory.`,
        timestamp: new Date().toISOString(),
      });
    }

    const bottomTeam = sortedTeams[sortedTeams.length - 1];
    const bottomResult = resultMap.get(bottomTeam?.id);
    if (bottomTeam && bottomResult && bottomResult.eliminationProbability > 0.8) {
      newInsights.push({
        type: 'elimination',
        teamId: bottomTeam.id,
        text: `${bottomTeam.shortName} face a ${(bottomResult.eliminationProbability * 100).toFixed(0)}% elimination probability. They need to win all remaining matches and rely on other results going their way.`,
        timestamp: new Date().toISOString(),
      });
    }

    const nrrTeams = sortedTeams.slice(2, 5);
    if (nrrTeams.length >= 2) {
      const nrrDiff = Math.abs(nrrTeams[0].nrr - nrrTeams[nrrTeams.length - 1].nrr);
      newInsights.push({
        type: 'general',
        text: `The race for spots 3 and 4 is incredibly tight. ${nrrTeams.map((t) => t.shortName).join(', ')} are separated by just ${nrrDiff.toFixed(3)} NRR. Net Run Rate could be the decisive factor.`,
        timestamp: new Date().toISOString(),
      });
    }

    newInsights.forEach((insight) => addInsight(insight));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-primary">AI Analysis</span>
        </div>
        <div className="flex gap-2">
          {insights.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearInsights}>
              <X className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={generateInsights}
            disabled={isLoading || simulationResults.length === 0}
          >
            {isLoading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {isLoading ? 'Analyzing...' : 'Generate Insights'}
          </Button>
        </div>
      </div>

      {insights.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Click &quot;Generate Insights&quot; to get AI-powered analysis of the playoff race</p>
        </div>
      )}

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="rounded-xl p-4 space-y-1"
            style={{
              background: 'var(--row-hover)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-2">
              <span>{insightTypeIcons[insight.type]}</span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${insightTypeColors[insight.type]}`}>
                {insight.type}
              </span>
            </div>
            <p className="text-sm text-primary leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
