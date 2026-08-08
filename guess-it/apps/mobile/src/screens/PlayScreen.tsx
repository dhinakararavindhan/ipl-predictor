import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  AI_CHARACTERS,
  supportsDuel,
  supportsVersus,
  type AiCharacterId,
  type AiLevel,
  type Difficulty,
  type Mechanic,
} from '@guess-it/engine';
import { MECHANIC_META, mechanicsForWorld, WORLDS } from '@guess-it/content';
import { Btn, C, Card, Chip, s } from '../theme';
import { useProfile, useSession } from '../store';

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const AI_LEVELS: AiLevel[] = ['ROOKIE', 'EASY', 'MEDIUM', 'HARD'];
type Mode = 'solo' | 'vs_ai' | 'duel';

export function PlayScreen({
  initialWorld,
  initialMode,
  onStarted,
}: {
  initialWorld?: string;
  initialMode?: 'vs_ai' | 'duel';
  onStarted: () => void;
}) {
  const start = useSession((st) => st.start);
  const firstGame = useProfile((st) => st.games === 0);
  const [world, setWorld] = useState<string | null>(initialWorld ?? null);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [mode, setMode] = useState<Mode>(initialMode ?? 'solo');
  const [aiCharacter, setAiCharacter] = useState<AiCharacterId>('machine');
  const [aiLevel, setAiLevel] = useState<AiLevel>(firstGame ? 'ROOKIE' : 'MEDIUM');
  const [players, setPlayers] = useState<string[]>(['', '']);

  const effectiveMode: Mode = !mechanic
    ? mode
    : mode === 'vs_ai' && !supportsVersus(mechanic)
      ? 'solo'
      : mode === 'duel' && !supportsDuel(mechanic)
        ? 'solo'
        : mode;

  const go = () => {
    if (!world || !mechanic) return;
    const ok = start({
      world,
      mechanic,
      difficulty,
      mode: effectiveMode,
      aiCharacter,
      aiLevel: firstGame ? 'ROOKIE' : aiLevel,
      duelPlayers: players.map((p, i) => p.trim() || `Player ${i + 1}`),
    });
    if (ok) onStarted();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
      <Text style={s.h1}>Pick your game</Text>

      <View>
        <Text style={[s.label, { marginBottom: 8 }]}>1 · MODE</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip title="🧩 Solo" active={mode === 'solo'} onPress={() => setMode('solo')} />
          <Chip title="🤖 vs AI" active={mode === 'vs_ai'} onPress={() => setMode('vs_ai')} />
          <Chip title="👥 Pass & Play" active={mode === 'duel'} onPress={() => setMode('duel')} />
        </View>
        {mode === 'duel' && (
          <Text style={[s.dim, { fontSize: 11, marginTop: 6 }]}>
            One phone, 2–4 players, alternating guesses — first to crack it wins. Works with Crack
            the Code and Higher/Lower.
          </Text>
        )}
      </View>

      <View>
        <Text style={[s.label, { marginBottom: 8 }]}>2 · WORLD</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {WORLDS.map((w) => (
            <Card
              key={w.id}
              style={{ width: '47%' as unknown as number, padding: 12 }}
              active={world === w.id}
              onPress={() => {
                setWorld(w.id);
                setMechanic(null);
              }}
            >
              <Text style={{ fontSize: 22 }}>{w.emoji}</Text>
              <Text style={[s.body, { fontWeight: '700', marginTop: 2 }]}>{w.name}</Text>
              <Text style={[s.dim, { fontSize: 10 }]}>{w.blurb}</Text>
            </Card>
          ))}
        </View>
      </View>

      {world && (
        <View>
          <Text style={[s.label, { marginBottom: 8 }]}>3 · GAME</Text>
          <View style={{ gap: 8 }}>
            {mechanicsForWorld(world)
              .filter((m) => mode !== 'duel' || supportsDuel(m))
              .map((m) => (
              <Card key={m} style={{ padding: 12 }} active={mechanic === m} onPress={() => setMechanic(m)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 22 }}>{MECHANIC_META[m].emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.body, { fontWeight: '700' }]}>{MECHANIC_META[m].name}</Text>
                    <Text style={[s.dim, { fontSize: 11 }]}>{MECHANIC_META[m].blurb}</Text>
                  </View>
                  <Text style={s.dim}>{MECHANIC_META[m].duration}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {world && mechanic && (
        <View style={{ gap: 14 }}>
          <View>
            <Text style={[s.label, { marginBottom: 8 }]}>4 · DIFFICULTY</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DIFFICULTIES.map((d) => (
                <Chip key={d} title={d} active={difficulty === d} onPress={() => setDifficulty(d)} />
              ))}
            </View>
          </View>

          {effectiveMode === 'duel' && (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>PLAYERS ({players.length})</Text>
              {players.map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    value={p}
                    onChangeText={(t) => setPlayers(players.map((x, j) => (j === i ? t.slice(0, 14) : x)))}
                    placeholder={`Player ${i + 1}`}
                    placeholderTextColor={C.dim}
                    style={[s.card2, { flex: 1, paddingHorizontal: 14, paddingVertical: 10, color: C.text, fontSize: 14 }]}
                  />
                  {players.length > 2 && (
                    <Pressable
                      onPress={() => setPlayers(players.filter((_, j) => j !== i))}
                      style={[s.card2, { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }]}
                    >
                      <Text style={{ color: C.text }}>✕</Text>
                    </Pressable>
                  )}
                </View>
              ))}
              {players.length < 4 && <Btn title="+ Add player" kind="ghost" onPress={() => setPlayers([...players, ''])} />}
              <Text style={[s.dim, { fontSize: 11 }]}>Party mode: no hints, no XP — just bragging rights.</Text>
            </View>
          )}

          {effectiveMode === 'vs_ai' && (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>OPPONENT</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {AI_CHARACTERS.map((c) => (
                  <Card
                    key={c.id}
                    style={{ flex: 1, padding: 10, alignItems: 'center' }}
                    active={aiCharacter === c.id}
                    onPress={() => setAiCharacter(c.id)}
                  >
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                    <Text style={[s.body, { fontWeight: '700', fontSize: 12 }]}>{c.name}</Text>
                  </Card>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {AI_LEVELS.map((l) => (
                  <Chip
                    key={l}
                    title={l}
                    active={(firstGame ? 'ROOKIE' : aiLevel) === l}
                    disabled={firstGame && l !== 'ROOKIE'}
                    onPress={() => setAiLevel(l)}
                  />
                ))}
              </View>
              {firstGame && (
                <Text style={[s.dim, { fontSize: 11 }]}>
                  First game starts vs Rookie — beat it to unlock stronger minds.
                </Text>
              )}
            </View>
          )}

          <Btn title="START →" onPress={go} />
        </View>
      )}
    </ScrollView>
  );
}
