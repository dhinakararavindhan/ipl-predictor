/**
 * Seed content — published GameDefinitions (Content Model §6).
 * Clues are ordered vaguest → most identifying with hand-authored
 * identifiability per the Content Model §5.3 rubric.
 * Image Reveal ships engine-complete but content-gated until licensed
 * images exist (Content Model §4) — no image cells are published here.
 */
import type { GameDefinition } from '@guess-it/engine';
import { clue, hl, mc } from './builders';
import { WAVE2 } from './definitions-wave2';
import { EMOJI_RIDDLES } from './definitions-emoji';
import { CRICKET } from './definitions-cricket';

// ---------------- ACTORS — Clue Guess ----------------

const actorClues: GameDefinition[] = [
  clue('act-srk', 'actors', 'EASY', 'Shah Rukh Khan', ['SRK', 'Shahrukh Khan', 'Shah Rukh'], '🎬', [
    ['I was born in Delhi in 1965.', 0.1],
    ['I started my career on television before films.', 0.3],
    ['I co-own the Kolkata Knight Riders IPL team.', 0.85],
    ['People call me the King of Bollywood.', 0.97],
  ]),
  clue('act-bigb', 'actors', 'EASY', 'Amitabh Bachchan', ['Big B', 'Amitabh'], '🎬', [
    ['I was born in Allahabad in 1942.', 0.1],
    ['My angry-young-man roles defined 1970s Indian cinema.', 0.5],
    ['I have hosted Kaun Banega Crorepati for years.', 0.9],
    ['Fans call me Big B.', 0.97],
  ]),
  clue('act-rajini', 'actors', 'EASY', 'Rajinikanth', ['Rajni', 'Thalaivar', 'Rajini'], '🕶️', [
    ['I worked as a bus conductor before entering films.', 0.4],
    ['My on-screen style and sunglasses flips are legendary.', 0.7],
    ['My fans call me Thalaivar.', 0.95],
  ]),
  clue('act-cruise', 'actors', 'EASY', 'Tom Cruise', ['Cruise'], '✈️', [
    ['I was born in 1962 in New York state.', 0.1],
    ['I famously perform my own dangerous stunts.', 0.6],
    ['I played a navy fighter pilot named Maverick.', 0.95],
  ]),
  clue('act-leo', 'actors', 'MEDIUM', 'Leonardo DiCaprio', ['Leo', 'DiCaprio', 'Leonardo Di Caprio'], '🏆', [
    ['I am a committed environmental activist.', 0.15],
    ['I finally won my first Oscar for a film about survival in the wilderness.', 0.7],
    ['I stood at the bow of a doomed ship and felt like the king of the world.', 0.97],
  ]),
  clue('act-kamal', 'actors', 'MEDIUM', 'Kamal Haasan', ['Kamal', 'Kamal Hassan'], '🎭', [
    ['I entered films as a child artist in 1960.', 0.25],
    ['I founded a political party in Tamil Nadu.', 0.6],
    ['I played ten roles in a single film, Dasavathaaram.', 0.95],
  ]),
  clue('act-scarjo', 'actors', 'MEDIUM', 'Scarlett Johansson', ['ScarJo', 'Scarlett'], '🕷️', [
    ['I was born in New York in 1984.', 0.1],
    ['I voiced an AI assistant that a lonely writer falls in love with.', 0.6],
    ['I played Black Widow in the Avengers films.', 0.95],
  ]),
  clue('act-denzel', 'actors', 'MEDIUM', 'Denzel Washington', ['Denzel'], '🎖️', [
    ['I have won two Academy Awards for acting.', 0.2],
    ['I played Malcolm X on screen.', 0.75],
    ['I won Best Actor for playing a corrupt LAPD detective in Training Day.', 0.95],
  ]),
  clue('act-pc', 'actors', 'MEDIUM', 'Priyanka Chopra', ['Priyanka', 'PC', 'Priyanka Chopra Jonas'], '👑', [
    ['I won Miss World in the year 2000.', 0.55],
    ['I led an American network TV thriller called Quantico.', 0.85],
    ['I am married to one of the Jonas Brothers.', 0.95],
  ]),
  clue('act-jackie', 'actors', 'EASY', 'Jackie Chan', ['Jackie'], '🥋', [
    ['I was born in Hong Kong in 1954.', 0.2],
    ['My action comedies feature stunts I perform myself.', 0.7],
    ['I starred opposite Chris Tucker in the Rush Hour films.', 0.95],
  ]),
  clue('act-keanu', 'actors', 'MEDIUM', 'Keanu Reeves', ['Keanu'], '💊', [
    ['I was born in Beirut in 1964.', 0.15],
    ['The internet regularly declares me the nicest man in Hollywood.', 0.5],
    ['I chose the red pill.', 0.9],
    ['I am also a retired assassin who loves his dog.', 0.97],
  ]),
  clue('act-vijay', 'actors', 'HARD', 'Vijay', ['Thalapathy', 'Thalapathy Vijay', 'Joseph Vijay'], '⚡', [
    ['I was born in Chennai in 1974.', 0.2],
    ['I launched a political party in 2024.', 0.75],
    ['My fans call me Thalapathy.', 0.95],
  ]),
  clue('act-meryl', 'actors', 'HARD', 'Meryl Streep', ['Streep'], '🏅', [
    ['I hold the record for most acting Oscar nominations.', 0.7],
    ['I played a fearsome fashion magazine editor.', 0.85],
    ['The devil, they said, wears Prada.', 0.95],
  ]),
  clue('act-aamir', 'actors', 'HARD', 'Aamir Khan', ['Aamir'], '🎯', [
    ['I am known as the perfectionist of Bollywood.', 0.5],
    ['I played an engineering student who hid his real name, Phunsukh Wangdu.', 0.9],
    ['I also played a wrestling coach to my on-screen daughters in Dangal.', 0.95],
  ]),
];

// ---------------- MOVIES — Clue Guess ----------------

const movieClues: GameDefinition[] = [
  clue('mov-inception', 'movies', 'MEDIUM', 'Inception', [], '🌀', [
    ['I was released in 2010.', 0.05],
    ['A spinning top decides whether my ending is real.', 0.8],
    ['My heist happens inside dreams within dreams.', 0.95],
  ]),
  clue('mov-titanic', 'movies', 'EASY', 'Titanic', [], '🚢', [
    ['I was released in 1997.', 0.1],
    ['I won 11 Academy Awards.', 0.5],
    ['My story takes place on an unsinkable ship.', 0.95],
  ]),
  clue('mov-sholay', 'movies', 'EASY', 'Sholay', [], '🔥', [
    ['I was released in 1975.', 0.15],
    ['My villain asks: "Kitne aadmi the?"', 0.9],
    ['Jai and Veeru are my heroes.', 0.97],
  ]),
  clue('mov-baahubali', 'movies', 'EASY', 'Baahubali 2', ['Baahubali 2 The Conclusion', 'Bahubali 2', 'Baahubali'], '⚔️', [
    ['I was released in 2017.', 0.05],
    ['I finally answered why Kattappa did what he did.', 0.9],
    ['I was the highest-grossing Indian film when released.', 0.85],
  ]),
  clue('mov-tdk', 'movies', 'MEDIUM', 'The Dark Knight', ['Dark Knight'], '🃏', [
    ['I was released in 2008.', 0.05],
    ['My villain wanted to watch the world burn.', 0.7],
    ['Heath Ledger won a posthumous Oscar for my villain.', 0.95],
  ]),
  clue('mov-3idiots', 'movies', 'EASY', '3 Idiots', ['Three Idiots'], '🎓', [
    ['I was released in 2009.', 0.05],
    ['My catchphrase is "All is well".', 0.9],
    ['My hero topped his engineering class under a false name.', 0.9],
  ]),
  clue('mov-avatar', 'movies', 'EASY', 'Avatar', [], '🔵', [
    ['I was released in 2009.', 0.05],
    ['I was the highest-grossing film of all time.', 0.5],
    ['My story unfolds on a moon called Pandora.', 0.95],
  ]),
  clue('mov-interstellar', 'movies', 'MEDIUM', 'Interstellar', [], '🌌', [
    ['I was released in 2014.', 0.05],
    ['A father watches decades of messages after visiting one planet for hours.', 0.8],
    ['My characters fly into a black hole named Gargantua.', 0.95],
  ]),
  clue('mov-parasite', 'movies', 'HARD', 'Parasite', [], '🏠', [
    ['I was released in 2019.', 0.05],
    ['A poor family infiltrates a rich household one job at a time.', 0.85],
    ['I was the first non-English film to win Best Picture.', 0.9],
  ]),
  clue('mov-rrr', 'movies', 'EASY', 'RRR', [], '🕺', [
    ['I was released in 2022.', 0.05],
    ['My song Naatu Naatu won an Oscar.', 0.95],
    ['Two revolutionaries become friends without knowing their true identities.', 0.8],
  ]),
  clue('mov-jurassic', 'movies', 'EASY', 'Jurassic Park', [], '🦖', [
    ['I was released in 1993.', 0.1],
    ['Steven Spielberg directed me.', 0.4],
    ['My theme park attractions escaped their fences.', 0.95],
  ]),
  clue('mov-matrix', 'movies', 'MEDIUM', 'The Matrix', ['Matrix'], '🖥️', [
    ['I was released in 1999.', 0.1],
    ['My hero is offered two pills.', 0.9],
    ['There is no spoon.', 0.9],
  ]),
];

// ---------------- HEROES — Clue Guess ----------------

const heroClues: GameDefinition[] = [
  clue('her-spiderman', 'heroes', 'EASY', 'Spider-Man', ['Spiderman', 'Peter Parker'], '🕸️', [
    ['I live in Queens, New York.', 0.3],
    ['A radioactive bite changed my life.', 0.9],
    ['With great power comes great responsibility.', 0.95],
  ]),
  clue('her-batman', 'heroes', 'EASY', 'Batman', ['Bruce Wayne', 'The Dark Knight'], '🦇', [
    ['I have no superpowers, only money and rage.', 0.7],
    ['My butler Alfred keeps my secrets.', 0.9],
    ['I protect Gotham City.', 0.95],
  ]),
  clue('her-ironman', 'heroes', 'EASY', 'Iron Man', ['Tony Stark', 'Ironman'], '🤖', [
    ['I am a genius, billionaire, playboy, philanthropist.', 0.8],
    ['A reactor in my chest keeps me alive.', 0.85],
    ['I started the Marvel Cinematic Universe in 2008.', 0.9],
  ]),
  clue('her-ww', 'heroes', 'MEDIUM', 'Wonder Woman', ['Diana Prince', 'Diana'], '⚡', [
    ['I come from a hidden island of warrior women.', 0.8],
    ['My lasso forces people to tell the truth.', 0.9],
    ['I am an Amazon princess named Diana.', 0.95],
  ]),
  clue('her-goku', 'heroes', 'MEDIUM', 'Goku', ['Son Goku', 'Kakarot'], '🐉', [
    ['I was sent to Earth as a baby from a dying planet.', 0.5],
    ['I collect orbs that summon a wish-granting dragon.', 0.9],
    ['My signature attack is the Kamehameha.', 0.95],
  ]),
  clue('her-naruto', 'heroes', 'MEDIUM', 'Naruto', ['Naruto Uzumaki'], '🍥', [
    ['A nine-tailed beast is sealed inside me.', 0.85],
    ['I dream of leading my hidden village.', 0.7],
    ['I love ramen and never give up. Believe it!', 0.9],
  ]),
  clue('her-superman', 'heroes', 'EASY', 'Superman', ['Clark Kent', 'Kal-El'], '🦸', [
    ['My home planet exploded.', 0.6],
    ['I work at a newspaper wearing glasses as a disguise.', 0.85],
    ['A green mineral is my only weakness.', 0.9],
  ]),
  clue('her-thor', 'heroes', 'EASY', 'Thor', [], '🔨', [
    ['My father rules Asgard.', 0.8],
    ['My brother Loki keeps betraying me.', 0.85],
    ['Only the worthy can lift my hammer.', 0.9],
  ]),
  clue('her-hulk', 'heroes', 'EASY', 'Hulk', ['The Hulk', 'Bruce Banner'], '💚', [
    ['A gamma-ray experiment went wrong.', 0.7],
    ["You wouldn't like me when I'm angry.", 0.9],
    ['I am a scientist who turns big and green.', 0.95],
  ]),
  clue('her-doraemon', 'heroes', 'MEDIUM', 'Doraemon', [], '🐱', [
    ['I came from the 22nd century.', 0.6],
    ['My four-dimensional pocket holds endless gadgets.', 0.9],
    ['I am a robot cat who fears mice.', 0.95],
  ]),
  clue('her-vader', 'heroes', 'HARD', 'Darth Vader', ['Vader', 'Anakin Skywalker', 'Anakin'], '🌑', [
    ['I was once a slave boy who loved podracing.', 0.55],
    ['My breathing precedes me into every room.', 0.85],
    ['I am your father.', 0.9],
  ]),
  clue('her-pikachu', 'heroes', 'EASY', 'Pikachu', [], '⚡', [
    ['I refuse to stay inside my ball.', 0.6],
    ['My cheeks store electricity.', 0.9],
    ['I am the most famous Pokémon.', 0.95],
  ]),
];

// ---------------- NUMBERS — Higher/Lower ----------------

const numberHL: GameDefinition[] = [
  hl('num-everest', 'EASY', 'How tall is Mount Everest, in meters?', 8849, 8000, 9500, 'm'),
  hl('num-bones', 'EASY', 'How many bones does an adult human have?', 206, 100, 350),
  hl('num-un', 'MEDIUM', 'How many member states does the United Nations have?', 193, 120, 260),
  hl('num-light', 'MEDIUM', 'What is the speed of light, in km per second?', 299792, 200000, 400000, 'km/s'),
  hl('num-sachin', 'MEDIUM', 'How many international centuries did Sachin Tendulkar score?', 100, 60, 140),
  hl('num-piano', 'EASY', 'How many keys does a standard piano have?', 88, 40, 130),
  hl('num-eiffel', 'MEDIUM', 'How tall is the Eiffel Tower (with antennas), in meters?', 330, 200, 500, 'm'),
  hl('num-marathon', 'EASY', 'How long is a marathon, in kilometers (rounded)?', 42, 20, 80, 'km'),
  hl('num-chess', 'EASY', 'How many squares are on a chessboard?', 64, 16, 144),
  hl('num-titanic', 'MEDIUM', 'In which year did the Titanic sink?', 1912, 1880, 1950),
  hl('num-moon', 'EASY', 'In which year did humans first walk on the Moon?', 1969, 1940, 2000),
  hl('num-elements', 'HARD', 'How many elements are in the periodic table?', 118, 80, 160),
  hl('num-kilimanjaro', 'HARD', 'How tall is Mount Kilimanjaro, in meters?', 5895, 4500, 7000, 'm'),
  hl('num-t20', 'HARD', 'What is the highest team total in a men’s T20 international (as of 2024)?', 314, 200, 400, 'runs'),
  hl('num-olympics', 'MEDIUM', 'In which year were the first modern Olympic Games held?', 1896, 1850, 1950),
  hl('num-shakespeare', 'HARD', 'How many plays did Shakespeare write (commonly counted)?', 37, 15, 70),
];

// ---------------- MULTIPLE CHOICE (across worlds) ----------------

const mcDefs: GameDefinition[] = [
  mc('mc-joker', 'movies', 'EASY', 'Who played the Joker in The Dark Knight (2008)?',
    ['Jared Leto', 'Heath Ledger', 'Joaquin Phoenix', 'Jack Nicholson'], 1),
  mc('mc-parasite', 'movies', 'MEDIUM', 'Which film was the first non-English winner of the Best Picture Oscar?',
    ['Roma', 'Parasite', 'Crouching Tiger, Hidden Dragon', 'Amour'], 1),
  mc('mc-inception-dir', 'movies', 'EASY', 'Who directed Inception?',
    ['Steven Spielberg', 'James Cameron', 'Christopher Nolan', 'Denis Villeneuve'], 2),
  mc('mc-naatu', 'movies', 'MEDIUM', 'Which film’s song "Naatu Naatu" won an Academy Award?',
    ['Baahubali 2', 'RRR', 'Pushpa', 'KGF 2'], 1),
  mc('mc-everest-country', 'numbers', 'MEDIUM', 'Mount Everest sits on the border of Nepal and which country?',
    ['India', 'Bhutan', 'China', 'Pakistan'], 2),
  mc('mc-cricket-team', 'numbers', 'EASY', 'How many players are on a cricket team on the field?',
    ['9', '10', '11', '12'], 2),
  mc('mc-jupiter', 'numbers', 'EASY', 'Which is the largest planet in the Solar System?',
    ['Saturn', 'Jupiter', 'Neptune', 'Earth'], 1),
  mc('mc-canberra', 'anything', 'HARD', 'What is the capital of Australia?',
    ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2),
  mc('mc-bigb', 'actors', 'EASY', 'Which actor is known as "Big B"?',
    ['Shah Rukh Khan', 'Amitabh Bachchan', 'Salman Khan', 'Rajinikanth'], 1),
  mc('mc-mjolnir', 'heroes', 'EASY', 'Which hero wields the hammer Mjölnir?',
    ['Loki', 'Thor', 'Odin', 'Hercules'], 1),
  mc('mc-krypton', 'heroes', 'EASY', 'Superman was born on which planet?',
    ['Vulcan', 'Krypton', 'Xandar', 'Cybertron'], 1),
  mc('mc-webslinger', 'heroes', 'EASY', 'What is Spider-Man’s real name?',
    ['Miles Morales', 'Peter Parker', 'Ben Reilly', 'Eddie Brock'], 1),
  mc('mc-cheetah', 'anything', 'EASY', 'What is the fastest land animal?',
    ['Lion', 'Pronghorn', 'Cheetah', 'Greyhound'], 2),
  mc('mc-qatar', 'anything', 'MEDIUM', 'Which country hosted the 2022 FIFA World Cup?',
    ['Russia', 'Qatar', 'Brazil', 'UAE'], 1),
  mc('mc-mandarin', 'anything', 'HARD', 'Which language has the most native speakers worldwide?',
    ['English', 'Hindi', 'Spanish', 'Mandarin Chinese'], 3),
  mc('mc-burj', 'anything', 'EASY', 'What is the tallest building in the world?',
    ['Shanghai Tower', 'Burj Khalifa', 'Merdeka 118', 'One World Trade Center'], 1),
  mc('mc-oscars-titanic', 'movies', 'HARD', 'How many Oscars did Titanic (1997) win?',
    ['9', '10', '11', '13'], 2),
  mc('mc-tamil-superstar', 'actors', 'MEDIUM', 'Who is known as "Thalaivar"?',
    ['Kamal Haasan', 'Vijay', 'Rajinikanth', 'Ajith Kumar'], 2),
];

// ---------------- ANYTHING / CHAOS — Clue Guess ----------------

const chaosClues: GameDefinition[] = [
  clue('cha-google', 'anything', 'MEDIUM', 'Google', [], '🔍', [
    ['I was born in a garage in 1998.', 0.3],
    ['My name became a verb.', 0.8],
    ['I answer billions of questions a day.', 0.85],
  ]),
  clue('cha-eiffel', 'anything', 'EASY', 'Eiffel Tower', ['The Eiffel Tower', 'Eiffel'], '🗼', [
    ['I was built for a World’s Fair in 1889.', 0.5],
    ['Critics called me an iron monstrosity; now I define a skyline.', 0.8],
    ['I sparkle every night over Paris.', 0.95],
  ]),
  clue('cha-bitcoin', 'anything', 'HARD', 'Bitcoin', ['BTC'], '₿', [
    ['I was created in 2009 by someone who does not exist.', 0.6],
    ['My supply is capped at 21 million.', 0.9],
    ['People call me digital gold.', 0.9],
  ]),
  clue('cha-cocacola', 'anything', 'EASY', 'Coca-Cola', ['Coke', 'Coca Cola'], '🥤', [
    ['I was invented by a pharmacist in Atlanta in 1886.', 0.6],
    ['My recipe is one of the world’s most famous secrets.', 0.8],
    ['My red-and-white logo is recognized everywhere on Earth.', 0.85],
  ]),
  clue('cha-tajmahal', 'anything', 'EASY', 'Taj Mahal', ['The Taj Mahal', 'Taj'], '🕌', [
    ['I took over 20 years and 20,000 workers to build.', 0.4],
    ['I am made of white marble that changes color with the light.', 0.8],
    ['An emperor built me for the wife he lost.', 0.9],
  ]),
  clue('cha-whatsapp', 'anything', 'MEDIUM', 'WhatsApp', ['Whats App'], '💬', [
    ['I was founded in 2009 by two ex-Yahoo engineers.', 0.3],
    ['Facebook bought me for 19 billion dollars.', 0.8],
    ['My double blue ticks cause arguments worldwide.', 0.95],
  ]),
  clue('cha-lego', 'anything', 'MEDIUM', 'LEGO', ['Legos'], '🧱', [
    ['I come from Denmark.', 0.3],
    ['Stepping on me barefoot is legendary pain.', 0.9],
    ['My interlocking bricks build anything imaginable.', 0.95],
  ]),
  clue('cha-wifi', 'anything', 'HARD', 'Wi-Fi', ['Wifi', 'Wireless internet'], '📶', [
    ['I was born from a failed experiment to detect exploding mini black holes.', 0.35],
    ['Cafes advertise me for free to lure you in.', 0.8],
    ['You panic when my icon shows one bar.', 0.85],
  ]),
];

export const DEFINITIONS: GameDefinition[] = [
  ...actorClues,
  ...movieClues,
  ...heroClues,
  ...numberHL,
  ...mcDefs,
  ...chaosClues,
  ...WAVE2,
  ...EMOJI_RIDDLES,
  ...CRICKET,
];
