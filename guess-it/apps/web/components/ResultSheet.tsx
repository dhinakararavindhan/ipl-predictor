'use client';

/** Result overlay (UI/UX S7): outcome, answer, score breakdown, XP, actions. */
import Link from 'next/link';
import { useState } from 'react';
import type { AiRuntime, GameResult } from '@guess-it/engine';
import { getCharacter } from '@guess-it/engine';
import { MECHANIC_META } from '@guess-it/content';
import { challengeUrl, emojiGrid } from '@/lib/challenge';
import { ACHIEVEMENTS, useProfile, useSession } from '@/lib/store';

export function ResultSheet({
  result,
  ai,
  xp,
  onPlayAgain,
  daily,
}: {
  result: GameResult;
  ai: AiRuntime | null;
  xp: { total: number; parts: { label: string; amount: number }[] } | null;
  onPlayAgain: () => void;
  daily: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAiLog, setShowAiLog] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const profile = useProfile();
  const session = useSession();
  const won = result.outcome === 'WON';
  const unlocked = ACHIEVEMENTS.filter((a) => profile.newlyUnlocked.includes(a.key));
  const challenge = session.challenge;

  const copy = async (text: string, label: string) => {
    try {
      if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* user cancelled share sheet */
    }
  };

  const shareResult = () => {
    if (!session.game) return;
    copy(emojiGrid(session.game, MECHANIC_META[session.game.mechanic].name), 'Result copied!');
  };

  const shareChallenge = () => {
    const { game, def } = session;
    if (!game || !def) return;
    const url = challengeUrl({
      v: 1,
      d: def.id,
      w: game.world,
      df: game.difficulty,
      s: game.seed,
      n: profile.username,
      sc: result.score,
      at: result.attemptsUsed,
      o: result.outcome,
    });
    copy(`Can you beat me at GUESS IT? I scored ${result.score} 🔥\n${url}`, 'Challenge link copied!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="slide-up card w-full max-w-[520px] rounded-b-none p-6 pb-10" style={{ background: 'var(--surface)' }}>
        {won ? (
          <>
            <p className="text-center text-4xl">🎉</p>
            <h2 className="mt-1 text-center text-2xl font-extrabold">YOU CRACKED IT!</h2>
          </>
        ) : (
          <h2 className="text-center text-2xl font-extrabold" style={{ color: 'var(--text-dim)' }}>
            {result.beatenByAi ? `${ai ? getCharacter(ai.character).name : 'The AI'} beat you to it` : 'GAME OVER'}
          </h2>
        )}

        <div className="card-2 mt-4 p-4 text-center">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
            THE ANSWER
          </p>
          <p className="mt-1 text-xl font-extrabold">
            {result.answerEmoji && <span className="mr-2">{result.answerEmoji}</span>}
            {result.answerName}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 text-center">
          <div>
            <p className="digits text-2xl font-extrabold" style={{ color: won ? 'var(--accent-2)' : 'var(--text-dim)' }}>
              {result.score}
            </p>
            <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
              SCORE
            </p>
          </div>
          {xp && xp.total > 0 && (
            <div>
              <p className="digits text-2xl font-extrabold" style={{ color: 'var(--accent)' }}>
                +{xp.total}
              </p>
              <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
                XP
              </p>
            </div>
          )}
          {profile.streak.current > 0 && (
            <div>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--warn)' }}>
                🔥{profile.streak.current}
              </p>
              <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
                STREAK
              </p>
            </div>
          )}
        </div>

        {result.perfect && won && (
          <p className="mt-2 text-center text-xs font-bold" style={{ color: 'var(--accent-2)' }}>
            💎 PERFECT GAME
          </p>
        )}

        {/* head-to-head when this game came from a challenge link */}
        {challenge && (
          <div className="card-2 mt-3 p-3 text-center">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-dim)' }}>
              HEAD TO HEAD
            </p>
            <p className="mt-1 text-sm">
              You <b className="digits">{result.score}</b> · {challenge.name}{' '}
              <b className="digits">{challenge.score}</b>
            </p>
            <p className="mt-1 text-sm font-bold" style={{ color: result.score >= challenge.score ? 'var(--accent-2)' : 'var(--danger)' }}>
              {result.score > challenge.score
                ? '🏆 You win the duel!'
                : result.score === challenge.score
                  ? '🤝 Dead heat!'
                  : `${challenge.name} takes it.`}
            </p>
          </div>
        )}

        {unlocked.length > 0 && (
          <div className="mt-3 flex flex-col items-center gap-1">
            {unlocked.map((a) => (
              <p key={a.key} className="pop-in text-sm font-bold" style={{ color: 'var(--warn)' }}>
                {a.emoji} Achievement unlocked: {a.name}
              </p>
            ))}
          </div>
        )}

        <button className="mt-3 w-full text-center text-xs underline" style={{ color: 'var(--text-dim)' }} onClick={() => setShowBreakdown(!showBreakdown)}>
          {showBreakdown ? 'Hide' : 'Show'} score breakdown
        </button>
        {showBreakdown && (
          <div className="card-2 mt-2 p-3 text-xs" style={{ color: 'var(--text-dim)' }}>
            <div className="flex justify-between">
              <span>Base</span>
              <span className="digits">{result.breakdown.base}</span>
            </div>
            {result.breakdown.costs.map((c, i) => (
              <div key={i} className="flex justify-between" style={{ color: 'var(--danger)' }}>
                <span>{c.label}</span>
                <span className="digits">−{c.amount}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span>× {result.breakdown.difficultyMult} difficulty</span>
              {result.breakdown.speedMult !== 1 && <span>× {result.breakdown.speedMult.toFixed(2)} speed</span>}
            </div>
            {result.breakdown.bonuses.map((b, i) => (
              <div key={i} className="flex justify-between" style={{ color: 'var(--accent-2)' }}>
                <span>{b.label}</span>
                <span className="digits">+{b.amount}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t pt-1 font-bold" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              <span>Final</span>
              <span className="digits">{result.score}</span>
            </div>
          </div>
        )}

        {ai && ai.log.length > 0 && (
          <>
            <button className="mt-2 w-full text-center text-xs underline" style={{ color: 'var(--text-dim)' }} onClick={() => setShowAiLog(!showAiLog)}>
              {showAiLog ? 'Hide' : 'How'} {getCharacter(ai.character).name} played
            </button>
            {showAiLog && (
              <div className="card-2 mt-2 max-h-40 overflow-y-auto p-3 text-xs" style={{ color: 'var(--text-dim)' }}>
                {ai.log.map((l, i) => (
                  <p key={i} className="digits mb-1">
                    {l.text}
                  </p>
                ))}
              </div>
            )}
          </>
        )}

        {/* share (BRD §27, §64) */}
        <div className="mt-4 flex gap-2">
          <button className="btn btn-ghost flex-1 py-2.5 text-xs font-bold" onClick={shareResult}>
            📋 Copy result
          </button>
          <button className="btn btn-ghost flex-1 py-2.5 text-xs font-bold" onClick={shareChallenge}>
            ⚔️ Challenge a friend
          </button>
        </div>
        {copied && (
          <p className="pop-in mt-2 text-center text-xs font-bold" style={{ color: 'var(--accent-2)' }}>
            ✓ {copied}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          {!daily && (
            <button className="btn btn-primary flex-1 py-3 text-sm font-bold" onClick={onPlayAgain}>
              PLAY AGAIN
            </button>
          )}
          <Link href="/" className="btn btn-ghost flex-1 py-3 text-center text-sm font-bold">
            HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
