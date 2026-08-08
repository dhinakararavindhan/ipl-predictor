/** Guess normalization for text-answer mechanics (Engine Spec §4, R-4.1/R-4.2). */

export function normalize(s: string): string {
  let out = s.normalize('NFKC').toLowerCase().trim();
  // strip diacritics
  out = out.normalize('NFD').replace(/[̀-ͯ]/g, '');
  // collapse whitespace, drop punctuation that players omit
  out = out.replace(/[.'’\-_,!?:]/g, ' ').replace(/\s+/g, ' ').trim();
  if (out.startsWith('the ')) out = out.slice(4);
  return out;
}

export function matchesAnswer(guess: string, name: string, aliases: string[]): boolean {
  const g = normalize(guess);
  if (g.length === 0) return false;
  if (g === normalize(name)) return true;
  return aliases.some((a) => normalize(a) === g);
}
