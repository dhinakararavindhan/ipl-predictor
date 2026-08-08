export const metadata = { title: 'Terms — GUESS IT' };

export default function TermsPage() {
  return (
    <main className="flex flex-col gap-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold">Terms of Use</h1>
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
        GUESS IT · Last updated August 2026
      </p>
      <div className="card flex flex-col gap-3 p-4 text-sm" style={{ color: 'var(--text-dim)' }}>
        <p>1. GUESS IT is a free game provided as-is, for fun. Play nice.</p>
        <p>
          2. In live races, choose a display name that isn&apos;t offensive or impersonating —
          rooms are between you and people you invite.
        </p>
        <p>
          3. Trivia content references publicly known facts about films, public figures, places and
          things for quiz purposes. Names and titles belong to their respective owners; no
          affiliation or endorsement is implied.
        </p>
        <p>
          4. Don&apos;t attempt to disrupt the service (attacks, exploits, automated abuse). We may
          block abusive connections.
        </p>
        <p>5. We may update the game and these terms; continued play means you accept the changes.</p>
        <p>6. Contact: aravindhanott@gmail.com</p>
      </div>
    </main>
  );
}
