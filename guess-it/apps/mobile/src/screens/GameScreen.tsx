import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  COSTS,
  getCharacter,
  HINT_COSTS,
  normalize,
  potentialScore,
  type DigitMark,
  type GameDefinition,
  type GameState,
  type HintType,
} from '@guess-it/engine';
import { MECHANIC_META, namespaceFor } from '@guess-it/content';
import { Btn, C, Card, s } from '../theme';
import { ACHIEVEMENTS, useProfile, useSession } from '../store';

// ---------- mechanic bodies ----------

function markColors(m: DigitMark): { backgroundColor: string; color: string } {
  if (m === 'EXACT') return { backgroundColor: C.accent2, color: '#04291f' };
  if (m === 'MISPLACED') return { backgroundColor: C.warn, color: '#3a2600' };
  return { backgroundColor: C.surface2, color: C.dim };
}

function ExactNumberBody({ game, onGuess }: { game: GameState; onGuess: (g: string) => void }) {
  const [entry, setEntry] = useState('');
  const revealed = new Map(game.exact!.revealedPositions.map((r) => [r.index, r.digit]));
  const push = (d: string) => {
    if (entry.length < 5 && !entry.includes(d)) setEntry(entry + d);
  };
  return (
    <View style={{ gap: 12 }}>
      <Text style={[s.dim, { textAlign: 'center' }]}>
        Crack the secret 5-digit code. All digits are different.
      </Text>
      {revealed.size > 0 && (
        <Text style={{ color: C.info, textAlign: 'center', fontSize: 12 }}>
          Hint: {[...revealed.entries()].map(([i, d]) => `position ${i + 1} is ${d}`).join(', ')}
        </Text>
      )}
      <View style={{ gap: 6 }}>
        {game.exact!.guesses.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
            {row.digits.split('').map((d, j) => {
              const mc = markColors(row.perDigit[j]);
              return (
                <View
                  key={j}
                  style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: mc.backgroundColor }}
                >
                  <Text style={{ color: mc.color, fontWeight: '800', fontSize: 16 }}>{d}</Text>
                </View>
              );
            })}
            <Text style={[s.dim, { fontSize: 10, width: 44 }]}>
              {row.exact}E {row.misplaced}M
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[s.card2, { width: 44, height: 48, alignItems: 'center', justifyContent: 'center', borderColor: entry[i] ? C.accent : C.border }]}
          >
            <Text style={{ color: entry[i] ? C.text : 'rgba(77,163,255,0.4)', fontSize: 20, fontWeight: '800' }}>
              {entry[i] ?? revealed.get(i) ?? ''}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => {
          const used = entry.includes(d) || entry.length >= 5;
          return (
            <Pressable
              key={d}
              disabled={used}
              onPress={() => push(d)}
              style={[s.card2, { width: 52, height: 48, alignItems: 'center', justifyContent: 'center', opacity: used ? 0.3 : 1 }]}
            >
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '700' }}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Btn title="⌫ Delete" kind="ghost" style={{ flex: 1 }} onPress={() => setEntry(entry.slice(0, -1))} />
        <Btn
          title="GUESS"
          style={{ flex: 1 }}
          disabled={entry.length !== 5}
          onPress={() => {
            onGuess(entry);
            setEntry('');
          }}
        />
      </View>
    </View>
  );
}

function TextGuessInput({ world, onGuess }: { world: string; onGuess: (g: string) => void }) {
  const [text, setText] = useState('');
  const namespace = useMemo(() => namespaceFor(world), [world]);
  const suggestions = useMemo(() => {
    const q = normalize(text);
    if (q.length < 2) return [];
    return namespace.filter((n) => normalize(n).includes(q)).slice(0, 5);
  }, [text, namespace]);
  const submit = (v: string) => {
    if (!v.trim()) return;
    onGuess(v);
    setText('');
  };
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => submit(text)}
          placeholder="Type your guess…"
          placeholderTextColor={C.dim}
          style={[s.card2, { flex: 1, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14 }]}
        />
        <Btn title="GUESS" disabled={!text.trim()} onPress={() => submit(text)} style={{ paddingHorizontal: 18 }} />
      </View>
      {suggestions.length > 0 && (
        <View style={[s.card2, { overflow: 'hidden' }]}>
          {suggestions.map((sg) => (
            <Pressable key={sg} onPress={() => submit(sg)} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={s.body}>{sg}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function ClueBody({
  game,
  def,
  onGuess,
  onAdvance,
}: {
  game: GameState;
  def: GameDefinition;
  onGuess: (g: string) => void;
  onAdvance: () => void;
}) {
  const st = game.clueState!;
  const total = def.clue!.clues.length;
  return (
    <View style={{ gap: 10 }}>
      <Text style={[s.dim, { textAlign: 'center' }]}>Who or what am I? Fewer clues, bigger score.</Text>
      {def.clue!.clues.slice(0, st.cluesRevealed).map((c, i) => (
        <Card key={i} style={{ padding: 12 }}>
          <Text style={{ color: C.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
            CLUE {i + 1} / {total}
          </Text>
          <Text style={[s.body, { marginTop: 2 }]}>{c.text}</Text>
        </Card>
      ))}
      {st.firstLetter && (
        <Text style={{ color: C.info, textAlign: 'center', fontSize: 12 }}>Hint: it starts with “{st.firstLetter}”</Text>
      )}
      {st.wrongGuesses.length > 0 && (
        <Text style={{ color: C.danger, textAlign: 'center', fontSize: 12, textDecorationLine: 'line-through' }}>
          {st.wrongGuesses.join('   ')}
        </Text>
      )}
      <TextGuessInput world={game.world} onGuess={onGuess} />
      {st.cluesRevealed < total && (
        <Btn title={`GET NEXT CLUE (−${COSTS.CLUE_EXTRA_CLUE} pts)`} kind="ghost" onPress={onAdvance} />
      )}
    </View>
  );
}

function HigherLowerBody({
  game,
  def,
  onGuess,
}: {
  game: GameState;
  def: GameDefinition;
  onGuess: (g: string) => void;
}) {
  const [entry, setEntry] = useState('');
  const { curLo, curHi, history } = game.hl!;
  const { lo, hi, unit, prompt } = def.higherLower!;
  const span = hi - lo || 1;
  return (
    <View style={{ gap: 12 }}>
      <Text style={[s.h2, { textAlign: 'center' }]}>{prompt}</Text>
      <View>
        <View style={{ height: 10, borderRadius: 999, backgroundColor: C.surface2, overflow: 'hidden' }}>
          <View
            style={{
              position: 'absolute',
              left: `${((curLo - lo) / span) * 100}%` as unknown as number,
              width: `${Math.max(((curHi - curLo) / span) * 100, 2)}%` as unknown as number,
              height: '100%',
              backgroundColor: C.info,
              borderRadius: 999,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={s.dim}>{curLo.toLocaleString()}</Text>
          <Text style={s.dim}>{curHi.toLocaleString()}</Text>
        </View>
      </View>
      {history.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
          {history.map((hst, i) => (
            <View key={i} style={[s.card2, { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }]}>
              <Text style={s.body}>
                {hst.guess.toLocaleString()} {hst.verdict === 'TOO_LOW' ? '↑' : '↓'}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={entry}
          onChangeText={(t) => setEntry(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder={`${curLo.toLocaleString()} – ${curHi.toLocaleString()}${unit ? ` ${unit}` : ''}`}
          placeholderTextColor={C.dim}
          style={[s.card2, { flex: 1, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 16, textAlign: 'center' }]}
        />
        <Btn
          title="GUESS"
          disabled={!entry}
          onPress={() => {
            onGuess(entry);
            setEntry('');
          }}
          style={{ paddingHorizontal: 18 }}
        />
      </View>
    </View>
  );
}

function MultipleChoiceBody({
  game,
  def,
  onGuess,
}: {
  game: GameState;
  def: GameDefinition;
  onGuess: (i: string) => void;
}) {
  const { order, eliminated, timeLimitMs } = game.mc!;
  const [remaining, setRemaining] = useState(timeLimitMs);
  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, timeLimitMs - (Date.now() - game.startedAt))), 100);
    return () => clearInterval(t);
  }, [game.startedAt, timeLimitMs]);
  const pct = remaining / timeLimitMs;
  const letters = ['A', 'B', 'C', 'D'];
  return (
    <View style={{ gap: 12 }}>
      <View>
        <View style={{ height: 8, borderRadius: 999, backgroundColor: C.surface2, overflow: 'hidden' }}>
          <View
            style={{
              width: `${pct * 100}%` as unknown as number,
              height: '100%',
              backgroundColor: pct < 0.25 ? C.danger : C.accent,
              borderRadius: 999,
            }}
          />
        </View>
        <Text style={[s.dim, { textAlign: 'center', marginTop: 4 }]}>
          {(remaining / 1000).toFixed(1)}s — answer fast for a bigger score
        </Text>
      </View>
      <Text style={[s.h2, { textAlign: 'center' }]}>{def.multipleChoice!.question}</Text>
      <View style={{ gap: 8 }}>
        {order.map((optIdx, presIdx) => {
          const gone = eliminated.includes(presIdx);
          return (
            <Card key={presIdx} style={{ padding: 14, opacity: gone ? 0.25 : 1 }} onPress={gone ? undefined : () => onGuess(String(presIdx))}>
              <Text style={s.body}>
                <Text style={{ color: C.accent, fontWeight: '800' }}>{letters[presIdx]}  </Text>
                {gone ? '—' : def.multipleChoice!.options[optIdx]}
              </Text>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

// ---------- hint metadata ----------

function hintFor(mechanic: string): { type: HintType; label: string; cost: number } | null {
  switch (mechanic) {
    case 'EXACT_NUMBER':
      return { type: 'REVEAL_DIGIT', label: 'Reveal a digit', cost: HINT_COSTS.REVEAL_DIGIT };
    case 'CLUE_GUESS':
      return { type: 'FIRST_LETTER', label: 'First letter', cost: HINT_COSTS.FIRST_LETTER };
    case 'HIGHER_LOWER':
      return { type: 'SHRINK_RANGE', label: 'Shrink range', cost: HINT_COSTS.SHRINK_RANGE };
    case 'MULTIPLE_CHOICE':
      return { type: 'FIFTY_FIFTY', label: '50 / 50', cost: HINT_COSTS.FIFTY_FIFTY };
    default:
      return null;
  }
}

// ---------- screen ----------

export function GameScreen({ onExit, onPlayAgain }: { onExit: () => void; onPlayAgain: () => void }) {
  const session = useSession();
  const profile = useProfile();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const lastNonce = useRef(0);

  useEffect(() => {
    const t = setInterval(() => useSession.getState().heartbeat(), 700);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (session.errorNonce !== lastNonce.current && session.error) {
      lastNonce.current = session.errorNonce;
      setToast(session.error);
      const t = setTimeout(() => setToast(null), 2200);
      return () => clearTimeout(t);
    }
  }, [session.errorNonce, session.error]);

  const { game, def, ai } = session;
  if (!game || !def) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 36 }}>🎲</Text>
        <Text style={s.dim}>No game in progress.</Text>
        <Btn title="PICK A GAME" onPress={onExit} style={{ paddingHorizontal: 28 }} />
      </View>
    );
  }

  const meta = MECHANIC_META[game.mechanic];
  const hint = hintFor(game.mechanic);
  const active = game.status === 'ACTIVE';
  const result = game.result;
  const char = ai ? getCharacter(ai.character) : null;
  const lastLine = ai ? [...ai.events].reverse().find((e) => e.type === 'DIALOGUE')?.line : undefined;
  const unlocked = ACHIEVEMENTS.filter((a) => profile.newlyUnlocked.includes(a.key));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {/* chrome */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => (active ? setConfirmQuit(true) : onExit())}
            style={[s.card2, { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }]}
          >
            <Text style={{ color: C.text }}>✕</Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[s.body, { fontWeight: '700' }]}>
              {meta.emoji} {meta.name}
            </Text>
            <Text style={s.label}>
              {game.world.toUpperCase()} · {game.difficulty}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: C.accent2, fontWeight: '800' }}>
              {active ? potentialScore(game) : result?.score}
            </Text>
            <Text style={s.label}>PTS</Text>
          </View>
        </View>

        {/* attempts pips */}
        {game.attemptsMax > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
            {Array.from({ length: game.attemptsMax }).map((_, i) => (
              <View
                key={i}
                style={{ width: 16, height: 5, borderRadius: 999, backgroundColor: i < game.attemptsUsed ? C.danger : C.surface2 }}
              />
            ))}
          </View>
        )}

        {/* pass & play turn banner */}
        {session.duel && active && (
          <View style={[s.card2, { paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', borderColor: C.accent }]}>
            <Text style={[s.body, { fontWeight: '700' }]}>
              🎯 {session.duel.players[session.duel.current]}&apos;s turn
            </Text>
            <Text style={[s.dim, { fontSize: 11 }]}>
              {session.duel.players.map((p, i) => `${p}: ${session.duel!.guessCounts[i]}`).join(' · ')} guesses — first correct wins
            </Text>
          </View>
        )}

        {/* opponent */}
        {ai && char && (
          <View style={[s.card2, { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 }]}>
            <Text style={{ fontSize: 22 }}>{char.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.body, { fontWeight: '700', fontSize: 12 }]}>
                {char.name} <Text style={s.dim}>· {ai.level}</Text>
              </Text>
              <Text style={[s.dim, { fontSize: 11 }]} numberOfLines={1}>
                {ai.solved
                  ? 'Solved it!'
                  : `${game.mechanic === 'EXACT_NUMBER' ? `${ai.guessCount} guesses` : `${ai.cluesUsed} clues`} used${lastLine ? ` — “${lastLine}”` : ''}`}
              </Text>
            </View>
          </View>
        )}

        {/* body */}
        <View pointerEvents={active ? 'auto' : 'none'} style={{ opacity: active ? 1 : 0.5 }}>
          {game.mechanic === 'EXACT_NUMBER' && <ExactNumberBody game={game} onGuess={session.guess} />}
          {game.mechanic === 'CLUE_GUESS' && (
            <ClueBody game={game} def={def} onGuess={session.guess} onAdvance={session.advance} />
          )}
          {game.mechanic === 'HIGHER_LOWER' && <HigherLowerBody game={game} def={def} onGuess={session.guess} />}
          {game.mechanic === 'MULTIPLE_CHOICE' && <MultipleChoiceBody game={game} def={def} onGuess={session.guess} />}
        </View>

        {/* hint (disabled in Pass & Play) */}
        {active && hint && game.hintsRemaining > 0 && !session.duel && (
          <Btn
            title={`💡 ${hint.label} (−${hint.cost} pts) · ${game.hintsRemaining} left`}
            kind="ghost"
            onPress={() => session.hint(hint.type)}
          />
        )}

        {toast && (
          <View style={[s.card2, { padding: 10, alignItems: 'center' }]}>
            <Text style={{ color: C.warn, fontSize: 13 }}>{toast}</Text>
          </View>
        )}
      </ScrollView>

      {/* quit confirm */}
      <Modal visible={confirmQuit} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Card style={{ alignSelf: 'stretch', alignItems: 'center' }}>
            <Text style={[s.body, { fontWeight: '700' }]}>Give up this game?</Text>
            <Text style={[s.dim, { marginTop: 4, textAlign: 'center' }]}>Forfeiting scores 0 and reveals the answer.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, alignSelf: 'stretch' }}>
              <Btn title="Keep playing" kind="ghost" style={{ flex: 1 }} onPress={() => setConfirmQuit(false)} />
              <Btn
                title="Forfeit"
                kind="danger"
                style={{ flex: 1 }}
                onPress={() => {
                  setConfirmQuit(false);
                  session.forfeit();
                }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* result sheet */}
      <Modal visible={!!result} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          {result && (
            <View style={[s.card, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 22, paddingBottom: 40 }]}>
              {session.duel ? (
                <>
                  <Text style={{ fontSize: 36, textAlign: 'center' }}>
                    {session.duel.winnerIndex !== null ? '🏆' : '🤝'}
                  </Text>
                  <Text style={[s.h1, { textAlign: 'center', fontSize: 22 }]}>
                    {session.duel.winnerIndex !== null
                      ? `${session.duel.players[session.duel.winnerIndex].toUpperCase()} CRACKED IT!`
                      : 'THE PUZZLE WINS'}
                  </Text>
                  <Text style={[s.dim, { textAlign: 'center', marginTop: 4, fontSize: 11 }]}>
                    {session.duel.players.map((p, i) => `${p}: ${session.duel!.guessCounts[i]} guesses`).join(' · ')}
                  </Text>
                </>
              ) : result.outcome === 'WON' ? (
                <>
                  <Text style={{ fontSize: 36, textAlign: 'center' }}>🎉</Text>
                  <Text style={[s.h1, { textAlign: 'center', fontSize: 22 }]}>YOU CRACKED IT!</Text>
                </>
              ) : (
                <Text style={[s.h1, { textAlign: 'center', fontSize: 22, color: C.dim }]}>
                  {result.beatenByAi && char ? `${char.name} beat you to it` : 'GAME OVER'}
                </Text>
              )}
              <View style={[s.card2, { marginTop: 14, padding: 14, alignItems: 'center' }]}>
                <Text style={s.label}>THE ANSWER</Text>
                <Text style={[s.h2, { marginTop: 4 }]}>
                  {result.answerEmoji ? `${result.answerEmoji} ` : ''}
                  {result.answerName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 26, marginTop: 14 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: result.outcome === 'WON' ? C.accent2 : C.dim, fontSize: 22, fontWeight: '800' }}>
                    {result.score}
                  </Text>
                  <Text style={s.label}>SCORE</Text>
                </View>
                {session.lastXp && session.lastXp.total > 0 && (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: C.accent, fontSize: 22, fontWeight: '800' }}>+{session.lastXp.total}</Text>
                    <Text style={s.label}>XP</Text>
                  </View>
                )}
                {profile.streak.current > 0 && (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: C.warn, fontSize: 22, fontWeight: '800' }}>🔥{profile.streak.current}</Text>
                    <Text style={s.label}>STREAK</Text>
                  </View>
                )}
              </View>
              {result.perfect && result.outcome === 'WON' && (
                <Text style={{ color: C.accent2, textAlign: 'center', marginTop: 8, fontWeight: '700', fontSize: 12 }}>
                  💎 PERFECT GAME
                </Text>
              )}
              {unlocked.map((a) => (
                <Text key={a.key} style={{ color: C.warn, textAlign: 'center', marginTop: 6, fontWeight: '700', fontSize: 13 }}>
                  {a.emoji} Achievement unlocked: {a.name}
                </Text>
              ))}
              {ai && ai.log.length > 0 && (
                <View style={[s.card2, { marginTop: 12, padding: 12, maxHeight: 120 }]}>
                  <Text style={[s.label, { marginBottom: 4 }]}>HOW {char?.name.toUpperCase()} PLAYED</Text>
                  <ScrollView>
                    {ai.log.map((l, i) => (
                      <Text key={i} style={[s.dim, { fontSize: 11, marginBottom: 2 }]}>
                        {l.text}
                      </Text>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
                {!session.daily && <Btn title="PLAY AGAIN" style={{ flex: 1 }} onPress={onPlayAgain} />}
                <Btn title="HOME" kind="ghost" style={{ flex: 1 }} onPress={onExit} />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
