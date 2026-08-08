export const metadata = { title: 'Privacy — GUESS IT' };

export default function PrivacyPage() {
  return (
    <main className="flex flex-col gap-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
        GUESS IT · Last updated August 2026
      </p>

      <section className="card p-4">
        <h2 className="font-bold">The short version</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          GUESS IT does not collect, store, or sell your personal data. There are no accounts, no
          sign-ups, and no ads. Your game progress lives on your own device.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">What stays on your device</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          Your chosen display name, XP, streaks, achievements and game history are stored locally
          (browser storage / app storage). They never leave your device. You can export or delete
          all of it anytime in Settings.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">Live races</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          When you play a live race, your display name and in-game moves are relayed to your
          opponent through our race server for the duration of the match. Races are held in memory
          only and are discarded when the room closes — nothing is written to a database.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">Anonymous usage statistics</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          If enabled in a given release, we count anonymous gameplay events (e.g. &quot;a game was
          completed&quot;) under a random identifier to understand which games people enjoy. These
          events contain no names, no contact details, and no content of what you typed. No
          advertising or cross-site tracking, ever.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">Children</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          GUESS IT is a general-audience trivia game with no chat, no user-generated content and no
          data collection, making it safe for younger players.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">Contact</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          Questions or requests: aravindhanott@gmail.com
        </p>
      </section>
    </main>
  );
}
