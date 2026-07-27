'use client';

import { MatchSimulator } from '@/components/MatchSimulator';
import { PointsTable } from '@/components/PointsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIPLStore } from '@/lib/store';
import { Zap } from 'lucide-react';

export default function SimulatorPage() {
  const { simulationResults } = useIPLStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-3">
          <Zap className="w-7 h-7 text-amber-500" />
          Match Simulator
        </h1>
        <p className="text-muted mt-1 text-sm">
          Toggle match results to see how the playoff picture changes in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Simulator */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>🏏 Remaining Fixtures</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchSimulator />
            </CardContent>
          </Card>
        </div>

        {/* Live Table */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>📊 Live Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <PointsTable simulationResults={simulationResults} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
