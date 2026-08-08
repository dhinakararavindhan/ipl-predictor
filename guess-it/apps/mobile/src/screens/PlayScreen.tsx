import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  AI_CHARACTERS,
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

export function PlayScreen({
  initialWorld,
  initialVersus,
  onStarted,
}: {
  initialWorld?: string;
  initialVersus?: boolean;
  onStarted: () => void;
}) {
  const start = useSession((st) => st.start);
  const firstGame = useProfile((st) => st.games === 0);
  const [world, setWorld] = useState<string | null>(initialWorld ?? null);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [versus, setVersus] = useState(!!initialVersus);
  const [aiCharacter, setAiCharacter] = useState<AiCharacterId>('machine');
  const [aiLevel, setAiLevel] = useState<AiLevel>(firstGame ? 'ROOKIE' : 'MEDIUM');

  const go = () => {
    if (!world || !mechanic) return;
    const ok = start({
      world,
      mechanic,
      difficulty,
      mode: versus && supportsVersus(mechanic) ? 'vs_ai' : 'solo',
      aiCharacter,
      aiLevel: firstGame ? 'ROOKIE' : aiLevel,
    });
    if (ok) onStarted();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
      <Text style={s.h1}>Pick your game</Text>

      <View>
        <Text style={[s.label, { marginBottom: 8 }]}>1 · WORLD</Text>
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
          <Text style={[s.label, { marginBottom: 8 }]}>2 · GAME</Text>
          <View style={{ gap: 8 }}>
            {mechanicsForWorld(world).map((m) => (
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
            <Text style={[s.label, { marginBottom: 8 }]}>3 · DIFFICULTY</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DIFFICULTIES.map((d) => (
                <Chip key={d} title={d} active={difficulty === d} onPress={() => setDifficulty(d)} />
              ))}
            </View>
          </View>

          {supportsVersus(mechanic) && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.label}>OPPONENT</Text>
                <Chip
                  title={versus ? '🤖 AI Battle ON' : 'Solo (tap for AI)'}
                  active={versus}
                  onPress={() => setVersus(!versus)}
                />
              </View>
              {versus && (
                <>
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
                </>
              )}
            </View>
          )}

          <Btn title="START →" onPress={go} />
        </View>
      )}
    </ScrollView>
  );
}
