export default function HowToPlayPage() {
  return (
    <main className="flex flex-col gap-4 pt-8">
      <h1 className="text-2xl font-extrabold">How to play</h1>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        Every game hides an answer — a person, a movie, a number, anything. Use the mechanic&apos;s
        feedback to reason your way to it. Guess early for bigger scores.
      </p>

      <section className="card p-4">
        <h2 className="font-bold">🔍 Clue Guess</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          Clues appear one at a time, vague first. Each extra clue costs points. Type your guess —
          aliases count (&quot;SRK&quot; works for Shah Rukh Khan). 5 wrong guesses and it&apos;s over.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">🔢 Crack the Code</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          A secret 5-digit code, all digits different. After each guess you learn how many digits are{' '}
          <b style={{ color: 'var(--accent-2)' }}>exact</b> (right digit, right place), how many are{' '}
          <b style={{ color: 'var(--warn)' }}>misplaced</b> (right digit, wrong place) and how many{' '}
          <b>miss</b>.
        </p>
        <div className="card-2 mt-2 p-3 text-xs" style={{ color: 'var(--text-dim)' }}>
          Secret <span className="digits">78391</span>, guess <span className="digits">74162</span> →
          1 exact (the 7), 1 misplaced (the 1), 3 miss.
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">⬆️ Higher / Lower</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          A real-world number hides in a range. Every guess tells you higher or lower and shrinks the
          bar. Binary search is your friend — attempts are tight.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">❓ Quick Pick</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          Four options, one correct, one ticking timer. Answering faster multiplies your score — up
          to 2× versus a last-second answer.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">🖼️ Image Reveal</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          A hidden picture sharpens step by step; each reveal costs points. Coming soon — awaiting a
          licensed image library.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">🤖 AI Battle</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          Race an AI mind on the same puzzle — Detective, Calculator or Machine, from Rookie to Hard.
          They think in real time, take clues like you do, and will absolutely gloat. After the game,
          see exactly how they solved it.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">Scoring</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          Start from 1000. Clues, reveals, wrong guesses and hints subtract; difficulty multiplies
          (Easy ×1 · Medium ×1.25 · Hard ×1.5). First-guess wins +250, no-hint wins +100. XP is
          separate — you always progress, win or lose.
        </p>
      </section>
    </main>
  );
}
