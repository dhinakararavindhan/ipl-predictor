'use client';

import { useState, useEffect } from 'react';
import { OrangeCapPredictor } from '@/components/OrangeCapPredictor';
import { PurpleCapPredictor } from '@/components/PurpleCapPredictor';
import { Trophy, Activity, Target, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayerStat {
  name: string;
  team: string;
  matches: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
  economy?: number;
}

interface PlayerStatsResponse {
  data: {
    batting: PlayerStat[];
    bowling: PlayerStat[];
  };
  live: boolean;
}

export default function CapPredictorPage() {
  const [activeTab, setActiveTab] = useState<'orange' | 'purple'>('orange');
  const [playerStats, setPlayerStats] = useState<PlayerStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        const res = await fetch('/api/player-stats');
        const data = await res.json();
        
        if (data.error) {
          console.warn('Using static player data:', data.error);
          // Fallback to static data
          setPlayerStats({
            data: {
              batting: [],
              bowling: []
            },
            live: false
          });
        } else {
          setPlayerStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch player stats:', err);
        setError('Failed to load player statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-slate-500 dark:text-slate-400">Loading player statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white mb-3">
          IPL 2026{' '}
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Cap Predictor
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Live player statistics from IPL 2026</p>
      </div>

      {/* Tab Navigation - Glassmorphism */}
      <div className="flex items-center justify-center gap-3 p-2 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 shadow-xl">
        <button
          onClick={() => setActiveTab('orange')}
          className={`flex items-center gap-3 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
            activeTab === 'orange'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-700/20'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span>Orange Cap (Runs)</span>
        </button>
        <button
          onClick={() => setActiveTab('purple')}
          className={`flex items-center gap-3 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
            activeTab === 'purple'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-700/20'
          }`}
        >
          <Target className="w-5 h-5" />
          <span>Purple Cap (Wickets)</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto">
        <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center justify-center gap-3 text-xl">
              {activeTab === 'orange' ? (
                <>
                  <Trophy className="w-6 h-6 text-amber-500" />
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Orange Cap Predictor
                  </span>
                </>
              ) : (
                <>
                  <Trophy className="w-6 h-6 text-indigo-500" />
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                    Purple Cap Predictor
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === 'orange' ? (
              <OrangeCapPredictor playerStats={playerStats} />
            ) : (
              <PurpleCapPredictor playerStats={playerStats} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="max-w-3xl mx-auto bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500 dark:text-slate-400 space-y-3">
          <p>
            <strong className="text-slate-800 dark:text-white">Orange Cap:</strong> Based on current runs, batting average, and remaining matches. Players with higher averages and strike rates are projected to score more runs.
          </p>
          <p>
            <strong className="text-slate-800 dark:text-white">Purple Cap:</strong> Based on current wickets, bowling average, and remaining matches. Players with lower averages and better economy rates are projected to take more wickets.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            *Data sourced from live IPL 2026 statistics. Predictions are updated in real-time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
