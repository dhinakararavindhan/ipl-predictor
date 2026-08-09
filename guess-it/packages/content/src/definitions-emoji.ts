/**
 * 🎭 Emoji Riddles world — decode the emoji, name the thing.
 * Clue 1 is the emoji string itself; later clues are text hints.
 * Zero licensing concerns: emoji sequences authored in-house.
 */
import type { GameDefinition } from '@guess-it/engine';
import { clue } from './builders';

export const EMOJI_RIDDLES: GameDefinition[] = [
  clue('emo-titanic', 'emoji', 'EASY', 'Titanic', [], '🚢', [
    ['🚢🧊💔', 0.7],
    ['A 1997 romance on a doomed voyage.', 0.9],
    ['Jack and Rose. Near, far, wherever you are.', 0.97],
  ]),
  clue('emo-lionking', 'emoji', 'EASY', 'The Lion King', ['Lion King'], '🦁', [
    ['👑🦁🌅', 0.7],
    ['Hakuna Matata!', 0.9],
    ['Simba avenges Mufasa.', 0.95],
  ]),
  clue('emo-junglebook', 'emoji', 'MEDIUM', 'The Jungle Book', ['Jungle Book'], '🐻', [
    ['🧒🐻🐍🌴', 0.6],
    ['A man-cub raised by wolves needs only the bare necessities.', 0.9],
    ['Mowgli, Baloo and Bagheera.', 0.95],
  ]),
  clue('emo-jaws', 'emoji', 'MEDIUM', 'Jaws', [], '🦈', [
    ['🦈🏊😱', 0.7],
    ["You're gonna need a bigger boat.", 0.9],
    ["Spielberg's 1975 beach-emptying thriller.", 0.9],
  ]),
  clue('emo-lotr', 'emoji', 'MEDIUM', 'The Lord of the Rings', ['Lord of the Rings', 'LOTR'], '💍', [
    ['🧙‍♂️💍🌋', 0.7],
    ['One does not simply walk into Mordor.', 0.9],
    ['Frodo must destroy the One Ring.', 0.95],
  ]),
  clue('emo-nemo', 'emoji', 'EASY', 'Finding Nemo', [], '🐠', [
    ['🐠🔍🌊', 0.7],
    ['Just keep swimming, just keep swimming…', 0.9],
    ['A clownfish dad crosses the ocean for his son.', 0.95],
  ]),
  clue('emo-wizardofoz', 'emoji', 'HARD', 'The Wizard of Oz', ['Wizard of Oz'], '👠', [
    ['🌪️👠🌈', 0.6],
    ["There's no place like home.", 0.85],
    ['Dorothy follows the yellow brick road.', 0.95],
  ]),
  clue('emo-starwars', 'emoji', 'EASY', 'Star Wars', [], '⚔️', [
    ['⭐⚔️🤖', 0.7],
    ['May the Force be with you.', 0.95],
    ['A galaxy far, far away.', 0.9],
  ]),
  clue('emo-wonka', 'emoji', 'MEDIUM', 'Charlie and the Chocolate Factory', ['Willy Wonka', 'Wonka', 'Charlie & the Chocolate Factory'], '🍫', [
    ['🎫🍫🏭', 0.6],
    ['Five golden tickets, one eccentric chocolatier.', 0.9],
    ['Oompa Loompas work here.', 0.95],
  ]),
  clue('emo-kungfupanda', 'emoji', 'EASY', 'Kung Fu Panda', [], '🐼', [
    ['🐼🥋🍜', 0.75],
    ['There is no secret ingredient.', 0.85],
    ['Po becomes the Dragon Warrior.', 0.95],
  ]),
  clue('emo-ghostbusters', 'emoji', 'MEDIUM', 'Ghostbusters', [], '👻', [
    ['👻🚫🔫', 0.7],
    ['Who you gonna call?', 0.95],
    ['Proton packs and a giant marshmallow man.', 0.9],
  ]),
  clue('emo-tmnt', 'emoji', 'HARD', 'Teenage Mutant Ninja Turtles', ['TMNT', 'Ninja Turtles'], '🐢', [
    ['🐢🐢🐢🐢🍕', 0.7],
    ['Heroes in a half shell, named after Renaissance painters.', 0.9],
    ['Leonardo, Michelangelo, Donatello, Raphael.', 0.95],
  ]),
  clue('emo-ddlj', 'emoji', 'HARD', 'Dilwale Dulhania Le Jayenge', ['DDLJ'], '🚂', [
    ['🚂🏃‍♀️🤚🌾', 0.5],
    ['The longest-running film in Indian cinema history.', 0.8],
    ['Palat… palat… palat. Raj and Simran.', 0.95],
  ]),
  clue('emo-iphone', 'emoji', 'EASY', 'iPhone', [], '📱', [
    ['🍎📱', 0.8],
    ['It launched in 2007 and killed the keypad.', 0.9],
    ['“There’s an app for that.”', 0.85],
  ]),
  clue('emo-nike', 'emoji', 'MEDIUM', 'Nike', [], '👟', [
    ['👟✔️', 0.7],
    ['Named after the Greek goddess of victory.', 0.85],
    ['Just Do It.', 0.97],
  ]),
  clue('emo-twitter', 'emoji', 'MEDIUM', 'Twitter', ['X'], '🐦', [
    ['🐦➡️❌', 0.7],
    ['280 characters of chaos.', 0.85],
    ['The bird app that became a single letter.', 0.95],
  ]),
  clue('emo-spotify', 'emoji', 'MEDIUM', 'Spotify', [], '🎧', [
    ['🟢🎧🎵', 0.65],
    ['It Wrapped up your year in music.', 0.9],
    ['The world’s biggest music streaming service.', 0.9],
  ]),
];
