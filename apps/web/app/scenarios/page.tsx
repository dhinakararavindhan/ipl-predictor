'use client';

import { WhatIfScenarios } from '@/components/WhatIfScenarios';
import { PlayoffBracket } from '@/components/PlayoffBracket';
import { PointsTable } from '@/components/PointsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIPLStore } from '@/lib/store';
import { Lightbulb } from 'lucide-react';

export default function ScenariosPage() {
  const { simulationResults } = useIPLStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-3">
          <Lightbulb className="w-7 h-7 text-amber-500" />
          What-If Scenarios
        </h1>
        <p className="text-muted mt-1 text-sm">
          Explore different outcomes and see how the playoff picture changes
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Scenarios + Table */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>💡 Quick Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <WhatIfScenarios />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Resulting Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <PointsTable simulationResults={simulationResults} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🏆 Predicted Playoff Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayoffBracket />
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="text-sm font-medium text-primary">How it works</div>
              <div className="text-xs text-muted space-y-2">
                <p>1. Click a scenario to auto-fill match results</p>
                <p>2. The standings table updates instantly</p>
                <p>3. The playoff bracket shows the predicted top 4</p>
                <p>4. Probabilities recalculate via 10,000 simulations</p>
                <p>5. Click "Reset" to go back to real standings</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
