/**
 * 🏏 Cricket world — legends, records & IPL fever.
 * Clue sets follow the Content Model §5.3 rubric (vaguest → most identifying);
 * every clue entry also feeds Party Mode's Mystery catalog automatically.
 */
import type { GameDefinition } from '@guess-it/engine';
import { clue, mc } from './builders';

export const CRICKET: GameDefinition[] = [
  // ---------------- Clue Guess — players & legends ----------------
  clue('crk-dhoni', 'cricket', 'EASY', 'MS Dhoni', ['Dhoni', 'Mahendra Singh Dhoni', 'MSD', 'Thala'], '🧤', [
    ['I was born in Ranchi in 1981.', 0.2],
    ['I finish games with a shot they named after a helicopter.', 0.8],
    ['I lifted the 2007 T20 and 2011 ODI World Cups as India’s captain.', 0.9],
    ['Chennai fans call me Thala — Captain Cool in yellow.', 0.97],
  ]),
  clue('crk-kohli', 'cricket', 'EASY', 'Virat Kohli', ['Kohli', 'King Kohli', 'Cheeku'], '👑', [
    ['I was born in Delhi in 1988.', 0.15],
    ['Number 18 is stitched on my back.', 0.6],
    ['They call me the Chase Master — bowl last, and I hunt any total down.', 0.85],
    ['I have played my whole IPL career for Bengaluru.', 0.95],
  ]),
  clue('crk-sachin', 'cricket', 'EASY', 'Sachin Tendulkar', ['Sachin', 'Tendulkar', 'Master Blaster', 'Little Master'], '🏏', [
    ['I made my debut for India at just 16.', 0.5],
    ['I am the only player with one hundred international centuries.', 0.9],
    ['A billion people call me the God of Cricket.', 0.95],
  ]),
  clue('crk-rohit', 'cricket', 'EASY', 'Rohit Sharma', ['Rohit', 'Hitman'], '💥', [
    ['My nickname is the Hitman.', 0.6],
    ['I own the highest one-day score ever — 264.', 0.85],
    ['I captained Mumbai Indians to five IPL titles.', 0.9],
  ]),
  clue('crk-bumrah', 'cricket', 'MEDIUM', 'Jasprit Bumrah', ['Bumrah', 'Boom Boom Bumrah'], '🎯', [
    ['Coaches said my bowling action was too strange to last.', 0.4],
    ['My toe-crushing yorkers arrive in the death overs.', 0.7],
    ['I lead India’s pace attack and play IPL for Mumbai.', 0.85],
  ]),
  clue('crk-abd', 'cricket', 'MEDIUM', 'AB de Villiers', ['AB', 'ABD', 'Mr 360', 'De Villiers'], '🌀', [
    ['I scored the fastest one-day hundred ever — 31 balls.', 0.7],
    ['They call me Mr. 360 because I scoop, ramp and reverse everywhere.', 0.9],
    ['South African by birth, Bengaluru royalty by IPL.', 0.95],
  ]),
  clue('crk-gayle', 'cricket', 'MEDIUM', 'Chris Gayle', ['Gayle', 'Universe Boss'], '😎', [
    ['I call myself the Universe Boss.', 0.75],
    ['I smashed 175 not out — the highest score in IPL history.', 0.9],
    ['The tallest six-hitter Jamaica ever produced.', 0.85],
  ]),
  clue('crk-dravid', 'cricket', 'MEDIUM', 'Rahul Dravid', ['Dravid', 'The Wall'], '🧱', [
    ['Bowlers spent whole days trying to get past me and failed.', 0.3],
    ['After retiring I coached India to a World Cup.', 0.6],
    ['They call me The Wall.', 0.95],
  ]),
  clue('crk-kapil', 'cricket', 'MEDIUM', 'Kapil Dev', ['Kapil'], '🏆', [
    ['I was India’s greatest fast-bowling all-rounder.', 0.4],
    ['My unbeaten 175 against Zimbabwe saved a World Cup campaign.', 0.8],
    ['I lifted India’s first World Cup at Lord’s in 1983.', 0.95],
  ]),
  clue('crk-lara', 'cricket', 'HARD', 'Brian Lara', ['Lara', 'Prince of Trinidad'], '🌴', [
    ['My backlift was the most theatrical in cricket.', 0.3],
    ['I come from Trinidad and captained the West Indies.', 0.6],
    ['My 400 not out is still the highest Test score.', 0.95],
  ]),
  clue('crk-warne', 'cricket', 'HARD', 'Shane Warne', ['Warne', 'Warnie'], '🌀', [
    ['My first Ashes delivery was called the Ball of the Century.', 0.85],
    ['I took 708 Test wickets with leg-spin.', 0.9],
    ['I captained Rajasthan Royals to the first-ever IPL title.', 0.85],
  ]),
  clue('crk-yuvraj', 'cricket', 'HARD', 'Yuvraj Singh', ['Yuvraj', 'Yuvi'], '6️⃣', [
    ['I beat cancer and came back to play for India.', 0.6],
    ['I was Player of the Tournament when India won the 2011 World Cup.', 0.8],
    ['I hit six sixes in one over at the 2007 T20 World Cup.', 0.95],
  ]),
  clue('crk-stokes', 'cricket', 'HARD', 'Ben Stokes', ['Stokes'], '🏴', [
    ['I am England’s talismanic all-rounder.', 0.5],
    ['My unbeaten 135 at Headingley won an unwinnable Ashes Test.', 0.85],
    ['I hit the winning runs in the 2019 World Cup final super-over drama.', 0.9],
  ]),
  clue('crk-murali', 'cricket', 'HARD', 'Muttiah Muralitharan', ['Murali', 'Muralitharan'], '🇱🇰', [
    ['My wrist did things biomechanists had to study.', 0.4],
    ['I am Sri Lanka’s greatest match-winner.', 0.6],
    ['No bowler has more than my 800 Test wickets.', 0.95],
  ]),

  // ---------------- Quick Pick — rules & records ----------------
  mc('crk-mc-team', 'cricket', 'EASY', 'How many players does each cricket team field?', ['9', '10', '11', '12'], 2),
  mc('crk-mc-over', 'cricket', 'EASY', 'How many legal balls make one over?', ['4', '5', '6', '8'], 2),
  mc('crk-mc-six', 'cricket', 'EASY', 'Clearing the boundary on the full scores…', ['2 runs', '4 runs', '5 runs', '6 runs'], 3),
  mc('crk-mc-pitch', 'cricket', 'MEDIUM', 'How long is a cricket pitch, stumps to stumps?', ['18 yards', '20 yards', '22 yards', '24 yards'], 2),
  mc('crk-mc-lbw', 'cricket', 'MEDIUM', 'In cricket, LBW stands for…', ['Long Ball Wide', 'Leg Before Wicket', 'Last Batter Walks', 'Left Bat Wrong'], 1),
  mc('crk-mc-1975', 'cricket', 'MEDIUM', 'Who won the first Cricket World Cup in 1975?', ['Australia', 'England', 'India', 'West Indies'], 3),
  mc('crk-mc-rcb', 'cricket', 'HARD', 'Which franchise finally won its first IPL title in 2025?', ['Royal Challengers Bengaluru', 'Delhi Capitals', 'Punjab Kings', 'Lucknow Super Giants'], 0),
  mc('crk-mc-400', 'cricket', 'HARD', 'Who holds the highest individual Test score — 400 not out?', ['Matthew Hayden', 'Brian Lara', 'Virender Sehwag', 'Don Bradman'], 1),
];
