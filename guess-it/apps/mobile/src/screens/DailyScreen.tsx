import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { dailyChallenge, MECHANIC_META, utcDateKey, WORLDS } from '@guess-it/content';
import { Btn, C, Card, s } from '../theme';
import { useProfile, useSession } from '../store';

function msToNextUtcMidnight(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}

export function DailyScreen({ onStarted }: { onStarted: () => void }) {
  const startDaily = useSession((st) => st.startDaily);
  const dailyResults = useProfile((st) => st.dailyResults);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const t = setInterval(() => {
      const ms = msToNextUtcMidnight();
      setCountdown(`${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const dateKey = utcDateKey();
  const { definition } = dailyChallenge(dateKey);
  const world = WORLDS.find((w) => w.id === definition.world);
  const played = dailyResults[dateKey];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <Text style={s.h1}>🎯 Daily Mystery</Text>
      <Text style={s.dim}>
        One puzzle. The whole world. Same answer. Rolls over at 00:00 UTC — next in {countdown || '…'}.
      </Text>

      <Card style={{ alignItems: 'center', borderColor: C.accent }}>
        <Text style={s.label}>
          {dateKey} · TODAY&apos;S MYSTERY
        </Text>
        <Text style={{ fontSize: 36, marginTop: 8 }}>{world?.emoji}</Text>
        <Text style={[s.body, { fontWeight: '700', marginTop: 6 }]}>
          {world?.name} · {MECHANIC_META[definition.mechanic].name}
        </Text>
        <Text style={s.dim}>Difficulty: {definition.difficulty} · +200 XP for completing</Text>
        {played ? (
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={{ color: C.accent2, fontSize: 28, fontWeight: '800' }}>{played.score} pts</Text>
            <Text style={s.dim}>
              {played.outcome === 'WON' ? 'You cracked it! Come back tomorrow.' : 'The mystery won today. Tomorrow is yours.'}
            </Text>
          </View>
        ) : (
          <Btn
            title="PLAY TODAY'S MYSTERY"
            style={{ marginTop: 14, alignSelf: 'stretch' }}
            onPress={() => {
              if (startDaily()) onStarted();
            }}
          />
        )}
      </Card>

      <Card>
        <Text style={[s.body, { fontWeight: '700' }]}>🏆 Global leaderboard</Text>
        <Text style={[s.dim, { marginTop: 4 }]}>
          Shared leaderboards go live with online play in Phase 2 — your daily scores already count on
          this device.
        </Text>
        <View style={{ marginTop: 10, gap: 4 }}>
          {Object.entries(dailyResults)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7)
            .map(([date, r]) => (
              <View key={date} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.dim}>{date}</Text>
                <Text style={{ color: r.outcome === 'WON' ? C.accent2 : C.dim, fontSize: 12 }}>{r.score} pts</Text>
              </View>
            ))}
        </View>
      </Card>
    </ScrollView>
  );
}
