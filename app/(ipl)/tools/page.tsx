'use client';

import { useIPLStore } from '@/lib/store';
import { NRRCalculator } from '@/components/NRRCalculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-3">
          <Wrench className="w-7 h-7 text-slate-500" />
          Tools
        </h1>
        <p className="text-muted mt-1 text-sm">
          NRR impact calculator and playoff scenario analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NRR Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>📐 NRR Impact Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <NRRCalculator />
          </CardContent>
        </Card>

        {/* Additional info card */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ About NRR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <p>
              <strong className="text-primary">Net Run Rate (NRR)</strong> is calculated as the difference between runs scored per over and runs conceded per over across all matches.
            </p>
            <div className="rounded-xl p-3" style={{ background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-mono text-primary">
                NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
              </div>
            </div>
            <p>
              NRR becomes crucial when teams are tied on points. A higher NRR can be the difference between making the playoffs or going home.
            </p>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-primary">Key Points:</div>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Winning by large margins improves NRR</li>
                <li>Losing by small margins minimizes NRR damage</li>
                <li>Overs matter: scoring quickly or restricting overs helps</li>
                <li>All-out innings count as full 20 overs for the batting team</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
