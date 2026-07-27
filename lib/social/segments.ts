// Pulse segments: the phases fans predict inside a match, per sport.
// Cricket goes over-by-over (in blocks), football half-by-half,
// basketball quarter-by-quarter. Keys are stored in pulse_calls.segment.

export interface Segment {
  key: string;
  label: string;
  question: string;
}

const CRICKET: Segment[] = [
  { key: 'ov1_5', label: 'Overs 1–5', question: 'Who wins the powerplay?' },
  { key: 'ov6_10', label: 'Overs 6–10', question: 'Who owns overs 6–10?' },
  { key: 'ov11_15', label: 'Overs 11–15', question: 'Who owns the middle overs?' },
  { key: 'ov16_20', label: 'Overs 16–20', question: 'Who wins the death overs?' },
];

const FOOTBALL: Segment[] = [
  { key: 'h1', label: 'First half', question: 'Who wins the first half?' },
  { key: 'h2', label: 'Second half', question: 'Who wins the second half?' },
];

const BASKETBALL: Segment[] = [
  { key: 'q1', label: 'Q1', question: 'Who takes the first quarter?' },
  { key: 'q2', label: 'Q2', question: 'Who takes the second quarter?' },
  { key: 'q3', label: 'Q3', question: 'Who takes the third quarter?' },
  { key: 'q4', label: 'Q4', question: 'Who takes the fourth quarter?' },
];

const HALVES: Segment[] = [
  { key: 'h1', label: 'First half', question: 'Who wins the first half?' },
  { key: 'h2', label: 'Second half', question: 'Who wins the second half?' },
];

export function segmentsForSport(sport: string): Segment[] {
  switch (sport) {
    case 'cricket':
      return CRICKET;
    case 'football':
      return FOOTBALL;
    case 'basketball':
      return BASKETBALL;
    default:
      return HALVES;
  }
}

export function segmentLabel(sport: string, key: string): string {
  return segmentsForSport(sport).find((s) => s.key === key)?.label ?? key;
}
