/** Elo rating update (BRD §25). scoreA: 1 win, 0 loss, 0.5 draw. */
export function eloUpdate(ratingA: number, ratingB: number, scoreA: number, k = 32): [number, number] {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const deltaA = Math.round(k * (scoreA - expectedA));
  return [ratingA + deltaA, ratingB - deltaA];
}
