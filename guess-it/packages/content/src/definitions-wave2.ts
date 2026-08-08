/** Seed content wave 2 — toward the 260-definition beta bar (Content Model §6). */
import type { GameDefinition } from '@guess-it/engine';
import { clue, hl, mc } from './builders';

const actors: GameDefinition[] = [
  clue('act-salman', 'actors', 'EASY', 'Salman Khan', ['Salman', 'Bhai', 'Sallu'], '💪', [
    ['I was born in 1965 into a family of screenwriters.', 0.15],
    ['I host the reality show Bigg Boss.', 0.85],
    ['I played the fearless cop Chulbul Pandey.', 0.9],
  ]),
  clue('act-deepika', 'actors', 'MEDIUM', 'Deepika Padukone', ['Deepika'], '👑', [
    ['I was born in Copenhagen in 1986.', 0.15],
    ['My father is a badminton legend.', 0.6],
    ['I played the queen in Padmaavat.', 0.85],
  ]),
  clue('act-freeman', 'actors', 'MEDIUM', 'Morgan Freeman', ['Freeman'], '🎙️', [
    ['I was born in 1937 in Memphis.', 0.1],
    ['My voice narrates half of Hollywood.', 0.75],
    ['I found hope inside Shawshank prison.', 0.9],
  ]),
  clue('act-emma', 'actors', 'EASY', 'Emma Watson', ['Emma'], '📚', [
    ['I was born in Paris in 1990.', 0.1],
    ['I championed the HeForShe campaign at the UN.', 0.6],
    ['I grew up on screen as the brightest witch of her age.', 0.95],
  ]),
  clue('act-rock', 'actors', 'EASY', 'Dwayne Johnson', ['The Rock', 'Dwayne The Rock Johnson', 'Rock'], '🪨', [
    ['I was a professional wrestling champion first.', 0.6],
    ['Can you smell what I am cooking?', 0.9],
    ['My nickname is a geological formation.', 0.9],
  ]),
  clue('act-nayan', 'actors', 'HARD', 'Nayanthara', ['Nayan'], '🌟', [
    ['I was born in Kerala in 1984.', 0.2],
    ['I am one of the highest-paid actresses in South India.', 0.5],
    ['They call me the Lady Superstar.', 0.9],
  ]),
  clue('act-hemsworth', 'actors', 'EASY', 'Chris Hemsworth', ['Hemsworth'], '🔨', [
    ['I was born in Australia in 1983.', 0.2],
    ['I starred in a soap opera before Hollywood.', 0.35],
    ['I wield a hammer as the God of Thunder.', 0.9],
  ]),
  clue('act-rdj', 'actors', 'MEDIUM', 'Robert Downey Jr.', ['RDJ', 'Robert Downey Junior', 'Robert Downey'], '🤖', [
    ['My comeback story is one of Hollywood’s greatest.', 0.4],
    ['I won my first Oscar for playing a physicist’s rival in Oppenheimer.', 0.8],
    ['I am Iron Man.', 0.95],
  ]),
  clue('act-ranveer', 'actors', 'MEDIUM', 'Ranveer Singh', ['Ranveer'], '⚡', [
    ['I was born in Mumbai in 1985.', 0.15],
    ['My fashion choices make headlines as often as my films.', 0.5],
    ['I rapped my way through Gully Boy.', 0.9],
  ]),
  clue('act-will', 'actors', 'MEDIUM', 'Will Smith', ['Will'], '🎤', [
    ['I started as a rapper in Philadelphia.', 0.4],
    ['I was the Fresh Prince of a famous LA neighborhood.', 0.9],
    ['I won Best Actor for playing Venus and Serena’s father.', 0.85],
  ]),
];

const movies: GameDefinition[] = [
  clue('mov-oppenheimer', 'movies', 'MEDIUM', 'Oppenheimer', [], '💥', [
    ['I was released in 2023.', 0.05],
    ['I shared my opening weekend with a very pink rival.', 0.7],
    ['Now I am become death, the destroyer of worlds.', 0.9],
  ]),
  clue('mov-kgf2', 'movies', 'MEDIUM', 'KGF Chapter 2', ['KGF 2', 'KGF Chapter Two'], '⛏️', [
    ['I was released in 2022.', 0.05],
    ['My hero Rocky rules a gold mine.', 0.9],
    ['I am a Kannada blockbuster sequel.', 0.7],
  ]),
  clue('mov-dangal', 'movies', 'EASY', 'Dangal', [], '🤼', [
    ['I was released in 2016.', 0.05],
    ['I became the highest-grossing Indian film in China.', 0.6],
    ['A father trains his daughters to be wrestling champions.', 0.9],
  ]),
  clue('mov-godfather', 'movies', 'HARD', 'The Godfather', ['Godfather'], '🎩', [
    ['I was released in 1972.', 0.15],
    ['My family business is not exactly legal.', 0.6],
    ['I will make him an offer he can’t refuse.', 0.95],
  ]),
  clue('mov-endgame', 'movies', 'EASY', 'Avengers: Endgame', ['Avengers Endgame', 'Endgame'], '🧤', [
    ['I was released in 2019.', 0.05],
    ['I love you 3000.', 0.9],
    ['Half the universe returned in my final battle.', 0.85],
  ]),
  clue('mov-frozen', 'movies', 'EASY', 'Frozen', [], '❄️', [
    ['I was released in 2013.', 0.05],
    ['My queen accidentally freezes her kingdom.', 0.85],
    ['My biggest song tells you to Let It Go.', 0.95],
  ]),
  clue('mov-slumdog', 'movies', 'HARD', 'Slumdog Millionaire', ['Slumdog'], '💰', [
    ['I was released in 2008 and won 8 Oscars.', 0.4],
    ['My hero answers quiz questions using memories of his Mumbai childhood.', 0.9],
    ['Jai Ho played over my closing dance.', 0.85],
  ]),
  clue('mov-kantara', 'movies', 'HARD', 'Kantara', [], '🔥', [
    ['I was released in 2022.', 0.05],
    ['I brought coastal Karnataka folklore to the world.', 0.8],
    ['My climax divine dance left audiences shaken.', 0.7],
  ]),
  clue('mov-toystory', 'movies', 'EASY', 'Toy Story', [], '🤠', [
    ['I was released in 1995.', 0.1],
    ['I was the first feature film made entirely with computer animation.', 0.7],
    ['My cowboy and space ranger became best friends.', 0.95],
  ]),
  clue('mov-gladiator', 'movies', 'MEDIUM', 'Gladiator', [], '🗡️', [
    ['I was released in 2000.', 0.1],
    ['My hero was a general who became a slave.', 0.8],
    ['Are you not entertained?', 0.9],
  ]),
];

const heroes: GameDefinition[] = [
  clue('her-cap', 'heroes', 'EASY', 'Captain America', ['Steve Rogers', 'Cap'], '🛡️', [
    ['I was a skinny kid from Brooklyn.', 0.5],
    ['A super-soldier serum changed me in the 1940s.', 0.85],
    ['My weapon is a star-spangled shield.', 0.95],
  ]),
  clue('her-wolverine', 'heroes', 'MEDIUM', 'Wolverine', ['Logan'], '🐾', [
    ['My skeleton is laced with an indestructible metal.', 0.8],
    ['I heal from almost anything.', 0.6],
    ['Claws come out of my knuckles. Bub.', 0.95],
  ]),
  clue('her-luffy', 'heroes', 'MEDIUM', 'Luffy', ['Monkey D Luffy', 'Monkey D. Luffy'], '🏴‍☠️', [
    ['I ate a fruit that made my body rubber.', 0.85],
    ['I will be King of the Pirates!', 0.9],
    ['My straw hat is my treasure.', 0.9],
  ]),
  clue('her-panther', 'heroes', 'MEDIUM', 'Black Panther', ['TChalla', "T'Challa"], '🐆', [
    ['My country hides its technology from the world.', 0.7],
    ['My suit is woven from vibranium.', 0.85],
    ['Wakanda forever!', 0.95],
  ]),
  clue('her-harry', 'heroes', 'EASY', 'Harry Potter', ['Harry'], '⚡', [
    ['I lived in a cupboard under the stairs.', 0.8],
    ['My scar is shaped like lightning.', 0.9],
    ['I am the boy who lived.', 0.95],
  ]),
  clue('her-deadpool', 'heroes', 'HARD', 'Deadpool', ['Wade Wilson'], '🗡️', [
    ['I know I am in a movie, and I will tell you about it.', 0.85],
    ['My healing factor came with a terrible skincare routine.', 0.7],
    ['They call me the Merc with a Mouth.', 0.9],
  ]),
  clue('her-bheem', 'heroes', 'EASY', 'Chhota Bheem', ['Bheem'], '💪', [
    ['I live in Dholakpur.', 0.85],
    ['Laddoos give me my strength.', 0.9],
    ['I am India’s favorite cartoon strongman.', 0.8],
  ]),
  clue('her-elsa', 'heroes', 'EASY', 'Elsa', [], '❄️', [
    ['I was born with powers I had to hide.', 0.5],
    ['I built an ice palace in one song.', 0.9],
    ['I am the queen of Arendelle.', 0.9],
  ]),
];

const numbers: GameDefinition[] = [
  hl('num-burj', 'MEDIUM', 'How tall is the Burj Khalifa, in meters?', 828, 600, 1000, 'm'),
  hl('num-iphone', 'EASY', 'In which year was the first iPhone released?', 2007, 1995, 2020),
  hl('num-mariana', 'HARD', 'How deep is the Mariana Trench at its deepest, in meters?', 10935, 9000, 12500, 'm'),
  hl('num-berlin', 'MEDIUM', 'In which year did the Berlin Wall fall?', 1989, 1950, 2000),
  hl('num-www', 'MEDIUM', 'In which year was the World Wide Web invented?', 1989, 1970, 2010),
  hl('num-moon-orbit', 'MEDIUM', 'How many days does the Moon take to orbit Earth (rounded)?', 27, 10, 60, 'days'),
  hl('num-wc1983', 'EASY', 'In which year did India win their first Cricket World Cup?', 1983, 1950, 2010),
  hl('num-liberty', 'HARD', 'How tall is the Statue of Liberty including its pedestal, in meters?', 93, 50, 150, 'm'),
  hl('num-facebook', 'EASY', 'In which year was Facebook founded?', 2004, 1990, 2015),
  hl('num-africa', 'MEDIUM', 'How many countries are in Africa?', 54, 30, 80),
  hl('num-boiling', 'MEDIUM', 'What is the boiling point of water in °F?', 212, 150, 300, '°F'),
  hl('num-nile', 'HARD', 'How long is the Nile river, in kilometers (approx.)?', 6650, 5000, 8000, 'km'),
  hl('num-chess-pieces', 'EASY', 'How many chess pieces does each player start with?', 16, 8, 40),
];

const mcs: GameDefinition[] = [
  mc('mc-monalisa', 'anything', 'EASY', 'Who painted the Mona Lisa?',
    ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Van Gogh'], 1),
  mc('mc-oxygen', 'numbers', 'EASY', 'Which element has the chemical symbol O?',
    ['Gold', 'Osmium', 'Oxygen', 'Oganesson'], 2),
  mc('mc-dhoni', 'anything', 'EASY', 'Who captained India to the 2011 Cricket World Cup title?',
    ['Virat Kohli', 'MS Dhoni', 'Sachin Tendulkar', 'Sourav Ganguly'], 1),
  mc('mc-playstation', 'anything', 'EASY', 'Which company makes the PlayStation?',
    ['Microsoft', 'Nintendo', 'Sony', 'Sega'], 2),
  mc('mc-mercury', 'numbers', 'MEDIUM', 'Which is the smallest planet in the Solar System?',
    ['Mars', 'Mercury', 'Pluto', 'Venus'], 1),
  mc('mc-terminator', 'movies', 'MEDIUM', 'Which movie made "I\'ll be back" famous?',
    ['RoboCop', 'Predator', 'The Terminator', 'Total Recall'], 2),
  mc('mc-yen', 'anything', 'EASY', 'What is the currency of Japan?',
    ['Yuan', 'Won', 'Yen', 'Ringgit'], 2),
  mc('mc-mickey', 'anything', 'EASY', 'Who created Mickey Mouse?',
    ['Walt Disney', 'Chuck Jones', 'Hanna-Barbera', 'Stan Lee'], 0),
  mc('mc-alfred', 'heroes', 'EASY', "What is the name of Batman's butler?",
    ['Jarvis', 'Alfred', 'Edwin', 'Lucius'], 1),
  mc('mc-tiger', 'anything', 'EASY', 'What is the national animal of India?',
    ['Lion', 'Elephant', 'Bengal Tiger', 'Peacock'], 2),
  mc('mc-shakespeare', 'anything', 'MEDIUM', 'Who wrote Romeo and Juliet?',
    ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Oscar Wilde'], 1),
  mc('mc-longest-river', 'numbers', 'HARD', 'Which river is traditionally considered the longest in the world?',
    ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], 1),
  mc('mc-falcon', 'anything', 'HARD', 'What is the fastest bird in the world?',
    ['Golden eagle', 'Peregrine falcon', 'Swift', 'Albatross'], 1),
  mc('mc-pizza', 'anything', 'EASY', 'Which country is the birthplace of pizza?',
    ['France', 'Greece', 'Italy', 'Spain'], 2),
];

const chaos: GameDefinition[] = [
  clue('cha-youtube', 'anything', 'EASY', 'YouTube', [], '▶️', [
    ['I was founded in 2005 by three ex-PayPal employees.', 0.35],
    ['My first video was shot at a zoo.', 0.7],
    ['People say "don’t read my comments."', 0.6],
  ]),
  clue('cha-moon', 'anything', 'MEDIUM', 'The Moon', ['Moon'], '🌕', [
    ['Footprints on me last millions of years.', 0.6],
    ['I control your planet’s tides.', 0.9],
    ['Twelve humans have walked on me.', 0.9],
  ]),
  clue('cha-instagram', 'anything', 'EASY', 'Instagram', ['Insta', 'IG'], '📸', [
    ['I launched in 2010 as a photo-filter app.', 0.5],
    ['Facebook bought me for a billion dollars.', 0.7],
    ['My logo is a retro camera.', 0.85],
  ]),
  clue('cha-chess', 'anything', 'MEDIUM', 'Chess', [], '♟️', [
    ['I was born in India as chaturanga.', 0.7],
    ['My queen is my most powerful piece.', 0.9],
    ['My battles happen on 64 squares.', 0.9],
  ]),
  clue('cha-pizza', 'anything', 'EASY', 'Pizza', [], '🍕', [
    ['My most famous version is named after a queen.', 0.6],
    ['I was born in Naples.', 0.75],
    ['Pineapple on me starts wars.', 0.9],
  ]),
  clue('cha-olympics', 'anything', 'MEDIUM', 'The Olympics', ['Olympics', 'Olympic Games'], '🏅', [
    ['I began in ancient Greece.', 0.6],
    ['I happen every four years.', 0.7],
    ['My symbol is five interlocking rings.', 0.95],
  ]),
  clue('cha-tea', 'anything', 'HARD', 'Tea', ['Chai'], '🍵', [
    ['I am the most consumed drink on Earth after water.', 0.5],
    ['I come from the leaves of Camellia sinensis.', 0.8],
    ['The British once fought trade wars over me.', 0.7],
  ]),
  clue('cha-cricket', 'anything', 'EASY', 'Cricket', [], '🏏', [
    ['My pitch is exactly 22 yards long.', 0.8],
    ['I can last five days and still end in a draw.', 0.85],
    ['A billion Indians stop everything when I am on.', 0.8],
  ]),
];

export const WAVE2: GameDefinition[] = [...actors, ...movies, ...heroes, ...numbers, ...mcs, ...chaos];
