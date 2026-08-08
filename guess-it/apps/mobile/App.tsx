import React, { useState } from 'react';
import { Platform, Pressable, StatusBar as RNStatusBar, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from './src/theme';
import { useSession } from './src/store';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlayScreen } from './src/screens/PlayScreen';
import { GameScreen } from './src/screens/GameScreen';
import { DailyScreen } from './src/screens/DailyScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

type Tab = 'home' | 'play' | 'game' | 'daily' | 'profile';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'play', label: 'Play', emoji: '🎮' },
  { id: 'daily', label: 'Daily', emoji: '🎯' },
  { id: 'profile', label: 'Profile', emoji: '🧠' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [playConfig, setPlayConfig] = useState<{ world?: string; mode?: 'vs_ai' | 'duel' }>({});

  const openPlay = (world?: string, mode?: 'vs_ai' | 'duel') => {
    setPlayConfig({ world, mode });
    setTab('play');
  };

  const playAgain = () => {
    const st = useSession.getState();
    const { game, ai, duel } = st;
    if (!game) return;
    st.start({
      world: game.world,
      mechanic: game.mechanic,
      difficulty: game.difficulty,
      mode: duel ? 'duel' : ai ? 'vs_ai' : 'solo',
      aiCharacter: ai?.character,
      aiLevel: ai?.level,
      duelPlayers: duel?.players,
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.bg,
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 54,
      }}
    >
      <StatusBar style="light" />

      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen onPlay={openPlay} onDaily={() => setTab('daily')} />}
        {tab === 'play' && (
          <PlayScreen
            key={`${playConfig.world ?? ''}-${playConfig.mode ?? 'solo'}`}
            initialWorld={playConfig.world}
            initialMode={playConfig.mode}
            onStarted={() => setTab('game')}
          />
        )}
        {tab === 'game' && <GameScreen onExit={() => setTab('home')} onPlayAgain={playAgain} />}
        {tab === 'daily' && <DailyScreen onStarted={() => setTab('game')} />}
        {tab === 'profile' && <ProfileScreen />}
      </View>

      {/* bottom tabs — hidden during an active game screen */}
      {tab !== 'game' && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            borderTopWidth: 1,
            borderTopColor: C.border,
            backgroundColor: 'rgba(11,14,20,0.95)',
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          }}
        >
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ alignItems: 'center', paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
              <Text style={{ color: tab === t.id ? C.text : C.dim, fontSize: 10, fontWeight: '600', marginTop: 2 }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
