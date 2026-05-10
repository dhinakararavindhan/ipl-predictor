import { NextRequest, NextResponse } from 'next/server';
import { Team, SimulationResult, AIInsight } from '@/lib/types';

// Simple in-memory cache
const cache = new Map<string, { insights: AIInsight[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { teams, simulationResults } = (await req.json()) as {
      teams: Team[];
      simulationResults: SimulationResult[];
    };

    // Cache key based on points state
    const cacheKey = teams.map((t) => `${t.id}:${t.points}`).join(',');
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ insights: cached.insights });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Return local insights if no API key
      return NextResponse.json({ insights: generateLocalInsights(teams, simulationResults) });
    }

    const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
    const resultMap = new Map(simulationResults.map((r) => [r.teamId, r]));

    const tableText = sortedTeams
      .map((t, i) => {
        const r = resultMap.get(t.id);
        return `${i + 1}. ${t.shortName}: ${t.points}pts, NRR ${t.nrr > 0 ? '+' : ''}${t.nrr.toFixed(3)}, Top4: ${r ? (r.top4Probability * 100).toFixed(0) : '?'}%`;
      })
      .join('\n');

    const prompt = `You are an IPL cricket analyst. Based on the current standings, generate 4 concise, insightful observations about the playoff race. Each insight should be 1-2 sentences, specific, and data-driven.

Current IPL 2026 Standings:
${tableText}

Generate insights as JSON array with format:
[{"type": "qualification|elimination|pressure|general", "teamId": "team_id_or_null", "text": "insight text"}]

Team IDs: rcb, srh, gt, pbks, csk, rr, kkr, dc, mi, lsg`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ insights: generateLocalInsights(teams, simulationResults) });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let insights: AIInsight[] = [];
    try {
      const parsed = JSON.parse(content);
      const raw = Array.isArray(parsed) ? parsed : parsed.insights ?? [];
      insights = raw.map((i: { type: AIInsight['type']; teamId?: string; text: string }) => ({
        ...i,
        timestamp: new Date().toISOString(),
      }));
    } catch {
      insights = generateLocalInsights(teams, simulationResults);
    }

    cache.set(cacheKey, { insights, timestamp: Date.now() });
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}

function generateLocalInsights(teams: Team[], simulationResults: SimulationResult[]): AIInsight[] {
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
  const resultMap = new Map(simulationResults.map((r) => [r.teamId, r]));
  const insights: AIInsight[] = [];
  const now = new Date().toISOString();

  const leader = sortedTeams[0];
  const leaderResult = resultMap.get(leader.id);
  if (leaderResult) {
    insights.push({
      type: 'qualification',
      teamId: leader.id,
      text: `${leader.shortName} are in pole position with ${leader.points} points and a ${(leaderResult.top4Probability * 100).toFixed(0)}% qualification probability. Their NRR of ${leader.nrr > 0 ? '+' : ''}${leader.nrr.toFixed(3)} provides a comfortable cushion.`,
      timestamp: now,
    });
  }

  const bubbleTeam = sortedTeams[4];
  const bubbleResult = resultMap.get(bubbleTeam?.id);
  if (bubbleTeam && bubbleResult) {
    insights.push({
      type: 'pressure',
      teamId: bubbleTeam.id,
      text: `${bubbleTeam.shortName} sit 5th with ${bubbleTeam.points} points — just outside the playoff zone. With a ${(bubbleResult.top4Probability * 100).toFixed(0)}% chance of qualifying, they need to win consistently to stay in contention.`,
      timestamp: now,
    });
  }

  const lastTeam = sortedTeams[sortedTeams.length - 1];
  const lastResult = resultMap.get(lastTeam?.id);
  if (lastTeam && lastResult && lastResult.eliminationProbability > 0.75) {
    insights.push({
      type: 'elimination',
      teamId: lastTeam.id,
      text: `${lastTeam.shortName} face a ${(lastResult.eliminationProbability * 100).toFixed(0)}% elimination probability. A mathematical miracle is still possible, but they need to win every remaining game and rely on other results.`,
      timestamp: now,
    });
  }

  const nrrBattle = sortedTeams.slice(2, 5);
  if (nrrBattle.length >= 2) {
    insights.push({
      type: 'general',
      text: `The battle for spots 3 and 4 is razor-thin. ${nrrBattle.map((t) => t.shortName).join(', ')} are locked in a tight contest where NRR could ultimately decide who advances to the playoffs.`,
      timestamp: now,
    });
  }

  return insights;
}
