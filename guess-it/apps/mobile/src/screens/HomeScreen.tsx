import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { WORLDS, utcDateKey } from '@guess-it/content';
import { Btn, C, Card, Chip, s } from '../theme';
import { playerLevel, useProfile } from '../store';

export function HomeScreen({
  onPlay,
  onDaily,
}: {
  onPlay: (world?: string, mode?: 'vs_ai' | 'duel') => void;
  onDaily: () => void;
}) {
  const p = useProfile();
  const h = new Date().getHours();
  const salutation = h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const dailyDone = !!p.dailyResults[utcDateKey()];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <View>
        <Text style={s.label}>
          {salutation}, {p.username.toUpperCase()} 👋
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[s.h1, { fontSize: 32 }]}>
            GUESS <Text style={{ color: C.accent }}>IT</Text>
          </Text>
          {p.streak.current > 0 && (
            <Text style={{ color: C.warn, fontWeight: '800' }}>🔥 {p.streak.current}d</Text>
          )}
        </View>
        <Text style={s.dim}>
          Level {playerLevel(p.xp)} · {p.xp.toLocaleString()} XP
        </Text>
      </View>

      <Card style={{ alignItems: 'center', borderColor: C.accent }} onPress={onDaily}>
        <Text style={{ fontSize: 34 }}>🎯</Text>
        <Text style={[s.h2, { marginTop: 4 }]}>DAILY MYSTERY</Text>
        <Text style={s.dim}>Everyone on Earth gets the same challenge</Text>
        <Btn
          title={dailyDone ? `Played ✓ — ${p.dailyResults[utcDateKey()].score} pts` : 'PLAY'}
          onPress={onDaily}
          kind={dailyDone ? 'ghost' : 'primary'}
          style={{ marginTop: 12, alignSelf: 'stretch' }}
        />
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }} onPress={() => onPlay(undefined, 'vs_ai')}>
          <Text style={{ fontSize: 24 }}>🤖</Text>
          <Text style={[s.body, { fontWeight: '700', marginTop: 4 }]}>AI Battle</Text>
          <Text style={s.dim}>Race an AI mind</Text>
        </Card>
        <Card style={{ flex: 1 }} onPress={() => onPlay()}>
          <Text style={{ fontSize: 24 }}>🧩</Text>
          <Text style={[s.body, { fontWeight: '700', marginTop: 4 }]}>Play Solo</Text>
          <Text style={s.dim}>You vs the puzzle</Text>
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }} onPress={() => onPlay(undefined, 'duel')}>
          <Text style={{ fontSize: 24 }}>👥</Text>
          <Text style={[s.body, { fontWeight: '700', marginTop: 4 }]}>Pass &amp; Play</Text>
          <Text style={s.dim}>Duel friends on this phone</Text>
        </Card>
        <Card style={{ flex: 1, opacity: 0.45 }}>
          <Text style={{ fontSize: 24 }}>🌎</Text>
          <Text style={[s.body, { fontWeight: '700', marginTop: 4 }]}>Quick Match</Text>
          <Text style={s.dim}>Online — Phase 2</Text>
        </Card>
      </View>

      <View>
        <Text style={[s.label, { marginBottom: 8 }]}>EXPLORE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {WORLDS.map((w) => (
            <Chip key={w.id} title={`${w.emoji} ${w.name}`} onPress={() => onPlay(w.id)} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
