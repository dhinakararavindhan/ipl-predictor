import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { titleForLevel, xpForLevel } from '@guess-it/engine';
import { MECHANIC_META, WORLDS } from '@guess-it/content';
import { ACHIEVEMENTS, playerLevel, useProfile, useSession } from '../store';
import { Btn, C, Card, s } from '../theme';

const AVATARS = ['🧠', '🕵️', '🦊', '🐯', '🚀', '🎯', '👾', '🐙', '🌟', '🔥'];

export function ProfileScreen() {
  const p = useProfile();
  const clearSession = useSession((st) => st.clear);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [confirmingReset, setConfirmingReset] = useState(false);

  const level = playerLevel(p.xp);
  const curFloor = xpForLevel(level);
  const nextNeed = xpForLevel(level + 1);
  const pct = nextNeed > curFloor ? Math.min(100, ((p.xp - curFloor) / (nextNeed - curFloor)) * 100) : 100;
  const winRate = p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable
          onPress={() => p.setAvatar(AVATARS[(AVATARS.indexOf(p.avatar) + 1) % AVATARS.length])}
          style={{
            width: 60,
            height: 60,
            borderRadius: 999,
            backgroundColor: C.surface2,
            borderWidth: 2,
            borderColor: C.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>{p.avatar}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          {editing ? (
            <TextInput
              autoFocus
              defaultValue={p.username}
              onChangeText={setName}
              onBlur={() => {
                if (name.trim()) p.setUsername(name);
                setEditing(false);
              }}
              style={[s.card2, { paddingHorizontal: 10, paddingVertical: 6, color: C.text, fontSize: 16, fontWeight: '700' }]}
            />
          ) : (
            <Pressable onPress={() => setEditing(true)}>
              <Text style={[s.h2, { fontSize: 20 }]}>
                {p.username} <Text style={{ fontSize: 11 }}>✏️</Text>
              </Text>
            </Pressable>
          )}
          <Text style={s.dim}>
            Level {level} · {titleForLevel(level)}
          </Text>
          <View style={{ height: 5, borderRadius: 999, backgroundColor: C.surface2, marginTop: 5, overflow: 'hidden' }}>
            <View style={{ width: `${pct}%` as unknown as number, height: '100%', backgroundColor: C.accent, borderRadius: 999 }} />
          </View>
          <Text style={[s.dim, { fontSize: 10, marginTop: 2 }]}>
            {p.xp.toLocaleString()} / {nextNeed.toLocaleString()} XP
          </Text>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(
          [
            ['GAMES', p.games],
            ['WINS', p.wins],
            ['WIN RATE', `${winRate}%`],
            ['BEST SCORE', p.bestScore],
            ['STREAK', `🔥 ${p.streak.current}`],
            ['BEST STREAK', `🔥 ${p.streak.best}`],
          ] as [string, string | number][]
        ).map(([label, value]) => (
          <Card key={label} style={{ width: '30%' as unknown as number, padding: 10, alignItems: 'center', flexGrow: 1 }}>
            <Text style={[s.body, { fontWeight: '800', fontSize: 16 }]}>{value}</Text>
            <Text style={[s.label, { fontSize: 8, marginTop: 2 }]}>{label}</Text>
          </Card>
        ))}
      </View>

      <View>
        <Text style={[s.label, { marginBottom: 8 }]}>ACHIEVEMENTS</Text>
        <View style={{ gap: 8 }}>
          {ACHIEVEMENTS.map((a) => {
            const unlocked = p.achievements.includes(a.key);
            return (
              <Card key={a.key} style={{ padding: 12, opacity: unlocked ? 1 : 0.4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 22 }}>{unlocked ? a.emoji : '🔒'}</Text>
                <View>
                  <Text style={[s.body, { fontWeight: '700' }]}>{a.name}</Text>
                  <Text style={[s.dim, { fontSize: 11 }]}>{a.blurb}</Text>
                </View>
              </Card>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={[s.label, { marginBottom: 8 }]}>RECENT GAMES</Text>
        {p.history.length === 0 ? (
          <Text style={[s.dim, { textAlign: 'center', paddingVertical: 16 }]}>
            No games yet — your story starts with one guess.
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {p.history.slice(0, 25).map((hEntry) => {
              const world = WORLDS.find((w) => w.id === hEntry.world);
              return (
                <Card key={hEntry.id + hEntry.endedAt} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 18 }}>{world?.emoji ?? '🎲'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.body, { fontWeight: '700', fontSize: 13 }]} numberOfLines={1}>
                      {MECHANIC_META[hEntry.mechanic].name}
                      {hEntry.daily ? ' · Daily' : ''}
                      {hEntry.mode === 'vs_ai' ? ` · vs ${hEntry.aiCharacter}` : ''}
                    </Text>
                    <Text style={[s.dim, { fontSize: 11 }]} numberOfLines={1}>
                      {hEntry.answerName} · {hEntry.difficulty} · {new Date(hEntry.endedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: hEntry.outcome === 'WON' ? C.accent2 : hEntry.outcome === 'LOST' ? C.danger : C.dim,
                      }}
                    >
                      {hEntry.outcome}
                    </Text>
                    <Text style={[s.dim, { fontSize: 11 }]}>{hEntry.score} pts</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      <Card>
        <Text style={[s.body, { fontWeight: '700' }]}>Privacy</Text>
        <Text style={[s.dim, { marginTop: 4 }]}>
          All game data lives on this device. Nothing is sent anywhere.
        </Text>
        {!confirmingReset ? (
          <Btn title="🗑️ Delete all my data" kind="ghost" style={{ marginTop: 10 }} onPress={() => setConfirmingReset(true)} />
        ) : (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Btn title="Cancel" kind="ghost" style={{ flex: 1 }} onPress={() => setConfirmingReset(false)} />
            <Btn
              title="Delete forever"
              kind="danger"
              style={{ flex: 1 }}
              onPress={() => {
                p.resetAll();
                clearSession();
                setConfirmingReset(false);
              }}
            />
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
