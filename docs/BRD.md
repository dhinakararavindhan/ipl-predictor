# BUSINESS REQUIREMENTS DOCUMENT

## Universal Guessing Game Platform

**Working Product Name:** GUESS IT
**Tagline:** Think. Guess. Outsmart.

**Document Version:** 1.0
**Status:** Product Definition / Pre-Development
**Platforms:** Web + iOS + Android
**Primary Modes:** Single Player, Friend Multiplayer, Online Multiplayer
**Product Category:** Casual / Trivia / Deduction / Social Game

---

## 1. EXECUTIVE SUMMARY

GUESS IT is a universal guessing-game platform where players attempt to identify a hidden answer using clues, logic, numbers, images, relationships, questions, comparisons, or other game mechanics.

Unlike a traditional quiz application, GUESS IT does not restrict itself to one subject or one guessing mechanism.

The hidden answer could be:

- A person
- Actor
- Actress
- Hero
- Villain
- Athlete
- Singer
- Movie
- TV show
- Song
- Character
- Country
- City
- Landmark
- Brand
- Company
- Product
- Car
- Animal
- Food
- Planet
- Historical event
- Number
- Year
- Price
- Score
- Percentage
- Distance
- Age
- Quantity
- Or virtually any structured piece of information

The platform separates:

**CONTENT from GAME MECHANICS.**

This allows the same underlying content to power many different games.

For example, an actor can be used in:

- Clue Guess
- Image Reveal
- Yes/No
- Multiple Choice
- Who Doesn't Belong?
- Movie Connections
- Number/Year Guess
- Head-to-Head
- AI Battle

Similarly, a number can be used in:

- Exact Number Guess
- Higher/Lower
- Closest Guess
- Number Deduction
- 5-Digit Code
- Range Reduction

This architecture allows the platform to continuously introduce new games without rebuilding the entire application.

---

## 2. PRODUCT VISION

### Vision

Build the world's most flexible guessing-game platform where anything can become a game.

### Mission

Make guessing simple to learn, difficult to master, endlessly replayable, and naturally social.

### Product Promise

Every time the player opens the application, they should be able to think:

> "What am I going to guess today?"

---

## 3. PROBLEM STATEMENT

Existing guessing and trivia games typically fall into narrow categories.

Examples:

- Word games focus on words.
- Trivia games focus on questions.
- Number games focus on numbers.
- Character games focus on characters.
- Sports quizzes focus on sports.
- Movie quizzes focus on movies.

This creates fragmented experiences.

GUESS IT combines these experiences into a single platform.

The product should allow:

```
ANY CONTENT
     +
ANY GAME MECHANIC
     +
ANY DIFFICULTY
     +
ANY GAME MODE
     =
INFINITE GAME POSSIBILITIES
```

---

## 4. TARGET USERS

### 4.1 Casual Players

People who want short entertainment sessions.

Typical session: 2–10 minutes.

Needs:

- Easy onboarding
- Fast games
- Simple rules
- Instant feedback

### 4.2 Competitive Players

Players interested in:

- Ratings
- Leaderboards
- Streaks
- Rankings
- Tournaments
- Head-to-head competition

### 4.3 Friends / Social Players

Players who want to challenge:

- Friends
- Family
- Colleagues
- Social followers

### 4.4 Knowledge / Trivia Players

Players interested in:

- Movies
- Sports
- Celebrities
- Geography
- Science
- History
- General knowledge

### 4.5 Puzzle Players

Players who enjoy:

- Logic
- Deduction
- Elimination
- Strategy
- Pattern recognition

---

## 5. CORE PRODUCT PRINCIPLES

The product must follow these principles:

1. **Simple to start** — A new player should understand the game within seconds.
2. **Difficult to master** — Winning should require reasoning rather than random guessing.
3. **Short sessions** — Most games should take less than 5 minutes.
4. **Infinite variety** — The player should not feel that there are only a few game types.
5. **Social by design** — Every game should have a natural sharing/challenge/rematch opportunity.
6. **AI-first** — Players should never need another human opponent to enjoy the product.
7. **Content-driven** — New content should be addable without changing the core application.

---

## 6. PRODUCT STRUCTURE

The platform consists of five major layers.

```
                    GUESS IT
                       │
       ┌───────────────┼────────────────┐
       │               │                │
    CONTENT          GAME             PLAY
     ENGINE         ENGINE            MODES
       │               │                │
       │               │          ┌─────┼─────┐
       │               │          │     │     │
    Actors           Clues       Solo  Friend Online
    Movies           Images
    Heroes           Yes/No
    Numbers          Higher/
    Countries         Lower
    Sports            etc.
       │
       └──────────────┬──────────────────
                      │
                AI / PERSONALIZATION
```

---

## 7. CONTENT ENGINE

The Content Engine stores entities and relationships.

### Entity types

Initial entities:

**People**

- Actor
- Actress
- Singer
- Athlete
- Director
- Politician
- Entrepreneur
- Historical person

**Fictional**

- Hero
- Villain
- Character
- Anime character
- Game character

**Entertainment**

- Movie
- TV show
- Song
- Album

**Geography**

- Country
- City
- State
- Landmark

**Objects**

- Car
- Phone
- Product
- Brand
- Food
- Animal

**Numerical**

- Number
- Year
- Price
- Score
- Age
- Distance
- Percentage
- Population
- Quantity

---

## 8. CONTENT KNOWLEDGE MODEL

Each entity should contain structured attributes.

### Example: Actor

Name, Gender, Birth date, Nationality, Profession, Industry, Languages, Debut year, Movies, TV shows, Awards, Characters played, Directors worked with, Co-stars, Genres, Images, Related entities

### Example: Movie

Title, Release year, Language, Country, Genre, Director, Actors, Characters, Budget, Box office, Runtime, Awards, Images, Related movies

### Example: Number

Value, Minimum, Maximum, Unit, Category, Context, Related entity

Example:

```
Value: 8848.86
Unit: meters
Context: Mount Everest elevation
```

This allows the game engine to automatically create games.

---

## 9. GAME ENGINE

The Game Engine is the heart of the platform.

Every game is defined using:

```
Content Type + Game Mechanic + Difficulty + Rules + Scoring + Time Limit
```

Example:

```
Content = Actor
Mechanic = Clues
Difficulty = Hard
Time = 60 seconds
Attempts = 5
```

Another:

```
Content = Number
Mechanic = Higher/Lower
Difficulty = Medium
Attempts = 8
```

---

## 10. GAME MECHANICS

The platform should support multiple reusable mechanics.

### 10.1 Clue Guess

Player receives clues sequentially.

Example:

```
CLUE 1
I was born in India.
[GUESS]
[GET NEXT CLUE]
```

Each additional clue reduces the score.

### 10.2 Image Reveal

An image starts hidden/blurred. Player chooses when to reveal more.

Example: 10% revealed → 25% revealed → 50% revealed → 75% revealed → 100% revealed

Earlier guesses receive higher scores.

### 10.3 Yes / No

Player gets a limited number of questions.

Example:

```
20 QUESTIONS
Is this person an actor?
YES / NO
```

### 10.4 Multiple Choice

Four possible answers: A, B, C, D.

Score depends on:

- Correctness
- Time
- Difficulty

### 10.5 Higher / Lower

Primarily for numbers.

Example:

```
Guess a number between 1 and 1000.
Your guess: 500
TOO LOW ↑
```

### 10.6 Exact Number

Player attempts to identify an exact number.

Example:

```
Secret: 78391
Guess:  74162
EXACT: 1
MISPLACED: 1
MISS: 3
```

This is the original game concept.

### 10.7 Closest Guess

Multiple players guess a numerical answer. Closest wins.

Examples:

- Movie box office
- Population
- Price
- Distance
- Year
- Score

### 10.8 Progressive Reveal

Information is gradually revealed.

Example:

```
████████████
Reveal 1
Reveal 2
Reveal 3
Reveal 4
```

### 10.9 Connection Game

Player identifies an entity based on its relationships.

Example:

```
Actor A
Movie B
Director C
Character D
Who is connected to all four?
```

### 10.10 Odd One Out

Several entities are displayed. One doesn't belong. Player identifies it.

### 10.11 Sequence

Player identifies the next item.

Example:

```
2000, 2004, 2008, 2012, ?
Guess: 2016
```

### 10.12 Ranking

Player must determine order.

Example:

```
Which movie earned the most?
A, B, C, D
```

---

## 11. GAME CATEGORIES

The platform initially launches with:

**WORLD 1 — PEOPLE:** Actors, Actresses, Singers, Athletes, Famous people

**WORLD 2 — ENTERTAINMENT:** Movies, TV, Songs, Characters

**WORLD 3 — HEROES:** Marvel, DC, Anime, Games, Fictional characters

**WORLD 4 — SPORTS:** Cricket, Football, Tennis, Basketball, Formula 1

**WORLD 5 — WORLD:** Countries, Cities, Landmarks, Geography

**WORLD 6 — NUMBERS:** Numbers, Years, Prices, Scores, Population, Distances, Percentages

**WORLD 7 — EVERYTHING:** Mixed random content.

---

## 12. "ANYTHING" / CHAOS MODE

This is a flagship feature.

The player does not know what type of answer they will receive.

Example:

```
CHAOS MODE
Today's mystery:
CLUE 1
I was created in 1997.
[GUESS]
CLUE 2
Millions of people use me.
[GUESS]
CLUE 3
I am associated with the internet.
[GUESS]
```

The answer could be:

- A person
- Company
- Product
- Movie
- Number
- Country
- Place
- Concept

This mode creates unpredictability.

---

## 13. SINGLE PLAYER MODE

Single Player is a core product feature.

The player competes against computer-controlled opponents.

### AI levels

- **Rookie** — Beginner AI.
- **Easy** — Basic reasoning.
- **Medium** — Reasonable deduction.
- **Hard** — Advanced elimination.
- **Expert** — Information-maximization strategy.
- **Master** — Highly optimized strategy.

---

## 14. AI CHARACTER SYSTEM

Instead of showing a generic "Computer", create AI personalities.

Examples:

- 🕵️ **Detective** — Excellent at clue-based games.
- 🧠 **Professor** — Excellent at knowledge games.
- 🔢 **Calculator** — Excellent at numerical games.
- 😈 **Trickster** — Uses unusual strategies.
- 🤖 **Machine** — General-purpose expert.

Each AI can have:

Name, Avatar, Difficulty, Strengths, Weaknesses, Personality, Dialogue, Win reaction, Loss reaction

This creates emotional attachment.

---

## 15. SINGLE PLAYER GAME FLOW

```
Home
 ↓
Single Player
 ↓
Choose World
 ↓
Choose Game
 ↓
Choose Difficulty
 ↓
Choose AI
 ↓
Game
 ↓
Result
 ↓
XP / Rating / Rewards
 ↓
Rematch
```

---

## 16. MULTIPLAYER MODES

### 16.1 Friend Challenge

Player creates a game. System generates:

```
ROOM CODE
ABC742
```

Friend joins.

### 16.2 Online Matchmaking

Player selects **QUICK MATCH**. System finds an opponent.

### 16.3 Ranked

Players compete for rating.

### 16.4 Unranked

Casual games with no rating impact.

### 16.5 Tournament

Multiple players compete in brackets.

---

## 17. MULTIPLAYER GAME PRINCIPLE

The server must be authoritative.

The client must never determine:

- Winner
- Score
- Rating
- Correct answer
- Turn
- Game state

All critical calculations happen server-side.

---

## 18. GAME SCORING

Generic scoring formula:

```
Base Score
× Difficulty Multiplier
× Speed Multiplier
× Accuracy Multiplier
```

Additional bonuses:

- First guess
- No hints
- Streak
- Perfect game
- Win against higher-rated player

---

## 19. XP SYSTEM

Players earn XP.

Example:

```
Correct answer       +100 XP
Win                  +150 XP
Hard game            +50 XP
Perfect game         +100 XP
Daily challenge      +200 XP
```

XP should unlock:

- Levels
- Avatars
- Titles
- Themes
- Badges

---

## 20. PLAYER LEVELS

Example:

```
Level 1     Beginner
Level 5     Curious
Level 10    Thinker
Level 20    Detective
Level 30    Expert
Level 50    Master
Level 75    Legend
Level 100   Grandmaster
```

---

## 21. STREAKS

Daily engagement system.

🔥 1 day · 🔥 3 days · 🔥 7 days · 🔥 30 days · 🔥 100 days

Daily challenge completion maintains streak.

---

## 22. DAILY CHALLENGE

Every player receives the same challenge each day.

Example:

```
TODAY'S MYSTERY
Category: Actors
Mechanic: Clues
Difficulty: Hard
Everyone gets the same answer.
```

Leaderboard:

```
1. Alex        982
2. Rahul       971
3. Sam         956
```

---

## 23. WEEKLY CHALLENGE

A larger challenge consisting of multiple games.

Example:

```
WEEKLY CHALLENGE
10 Games
Actor, Number, Movie, Country, Sports, Hero, Random, Number, Movie, Chaos
```

Score accumulated across all games.

---

## 24. LEADERBOARDS

**Global:** Overall, Weekly, Monthly, All Time

**Category:** Actors, Movies, Numbers, Sports, Heroes

**Geographical:** Global, Country, Friends

---

## 25. RATING SYSTEM

Competitive modes use an Elo-style rating.

Initial rating: **1000**

Winning against stronger players provides greater rating gains.

Rating should be separate from XP.

- XP = progression
- Rating = competitive skill

---

## 26. FRIEND SYSTEM

Users can:

- Search users
- Add friends
- Accept requests
- Remove friends
- Challenge friends
- Rematch
- View friend stats

---

## 27. SHARING

After a game:

```
I cracked it in 4 guesses 🔥
GUESS IT
Can you beat me?
[CHALLENGE ME]
```

Generate a shareable result card.

---

## 28. PROFILE

Profile contains:

Avatar, Username, Level, XP, Rating, Games, Wins, Losses, Win Rate, Best Score, Best Streak, Average Solve Time, Favorite Categories, Achievements

---

## 29. ACHIEVEMENTS

Initial achievements:

- **First Guess** — Play first game.
- **Code Breaker** — Win 10 games.
- **Detective** — Solve 10 clue games.
- **Number Wizard** — Win 10 number games.
- **Movie Buff** — Win 25 movie games.
- **Perfect** — Win without using a hint.
- **Lightning** — Solve within the fastest time bracket.
- **Streak Master** — 7-day streak.
- **Legend** — 100 wins.

---

## 30. HINT SYSTEM

Players can request hints.

Examples:

- **Remove an option** — -1 hint
- **Reveal category** — "This is an actor."
- **Reveal letter/digit** — "First digit = 7"
- **Reveal clue**

Hints reduce score.

---

## 31. DIFFICULTY SYSTEM

Difficulty determined using:

- Number of possible answers
- Clue ambiguity
- Answer popularity
- Number of attempts
- Time
- Hint availability

Levels: **EASY, MEDIUM, HARD, EXPERT, MASTER**

---

## 32. PERSONALIZATION

The system learns:

- Favorite categories
- Weak categories
- Average difficulty
- Typical solve time
- Preferred game mechanics
- Win rate
- Abandonment patterns

It can recommend:

```
Recommended for you
🔥 Hard Actor Challenge
You usually perform well here.
```

---

## 33. CONTENT GENERATION

The platform should support manually created and automatically generated games.

### Manual

Admin creates: Answer, Clues, Difficulty, Category, Images, Questions

### Automated

System generates games from structured content.

Example:

```
Actor → Birth year → Movies → Awards → Co-stars → Characters
```

The system can construct clues.

---

## 34. AI-GENERATED GAME QUALITY CONTROL

AI-generated games must pass validation.

Check:

- Fact correctness
- Answer uniqueness
- Clue ambiguity
- Difficulty
- Duplicate clues
- Offensive content
- Copyright restrictions
- Outdated information

Games should have a confidence score.

Low-confidence games should go to moderation.

---

## 35. CONTENT ADMINISTRATION

Admin portal must allow:

- **Entity Management** — Create/edit/delete: People, Movies, Heroes, Countries, Numbers, etc.
- **Game Management** — Create/edit/publish/unpublish games.
- **Categories** — Create categories dynamically.
- **Difficulty** — Set difficulty.
- **Content Review** — Approve AI-generated content.

---

## 36. ADMIN DASHBOARD

Dashboard:

DAU, MAU, Games Today, Games Completed, Games Abandoned, Average Session, Retention, Top Categories, Top Games, AI Games Generated

---

## 37. USER SAFETY

Required:

- Report content
- Report user
- Block user
- Mute user
- Moderation
- Rate limiting
- Abuse detection

---

## 38. PRIVACY

Collect minimum required data.

User should be able to:

- View data
- Delete account
- Delete game history
- Disable personalization
- Disable notifications

---

## 39. AUTHENTICATION

Initial options:

- Apple
- Google
- Email
- Guest

Guest users can play immediately.

Account creation should be encouraged only after the player has experienced the game.

---

## 40. NOTIFICATIONS

Optional:

- Friend challenge
- Your turn
- Challenge accepted
- Daily challenge
- Streak reminder
- Tournament
- Friend request

Users control notification preferences.

---

## 41. WEB APPLICATION

Web application should provide:

**Public:** Landing page, How to play, Game categories, Leaderboards, Daily challenge

**Authenticated:** Home, Game, Profile, Friends, Leaderboards, History, Settings

---

## 42. MOBILE APPLICATION

iOS and Android.

Primary navigation: **HOME · PLAY · FRIENDS · LEADERBOARD · PROFILE**

The mobile experience should prioritize:

- One-handed use
- Large touch targets
- Haptics
- Animations
- Push notifications
- Fast loading

---

## 43. DESIGN LANGUAGE

The application should look like a modern 2026 game.

**Avoid:**

- Traditional quiz UI
- Excessive text
- Old-style buttons
- Spreadsheet-like interfaces
- Dense menus

**Prefer:**

- Dark-first UI
- Large typography
- Cards
- Motion
- Character illustrations
- Strong visual hierarchy
- Short text
- Modern transitions

---

## 44. HOME SCREEN

Example:

```
GOOD MORNING, ARAVIND 👋
🔥 7 DAY STREAK
┌───────────────────────────┐
│                           │
│     🎯 DAILY MYSTERY      │
│                           │
│     Everyone gets the     │
│     same challenge        │
│                           │
│          PLAY             │
└───────────────────────────┘
PLAY SOLO
🤖 AI BATTLE
PLAY WITH FRIEND
⚔️ CHALLENGE
ONLINE
🌎 QUICK MATCH
EXPLORE
🎬 ACTORS
🦸 HEROES
🔢 NUMBERS
🎥 MOVIES
🎲 ANYTHING
```

---

## 45. GAME SCREEN REQUIREMENTS

The game screen must clearly display:

- Current challenge
- Remaining attempts
- Timer
- Score
- Hints
- Guess input
- Previous guesses
- Opponent status when applicable

Never overload the screen.

---

## 46. RESULT SCREEN

**Winner:**

```
🎉 YOU CRACKED IT!
ANSWER
Shah Rukh Khan
Solved in: 3 clues
Score: 842
+150 XP
🔥 Streak: 8
[PLAY AGAIN] [SHARE] [HOME]
```

**Loser:**

```
GAME OVER
The answer was:
Shah Rukh Khan
Score: 420
[TRY AGAIN]
```

---

## 47. GAME HISTORY

Store:

Game, Category, Mechanic, Answer, Result, Score, Attempts, Time, Opponent, Date

Player can review previous games.

---

## 48. OFFLINE SUPPORT

Single-player games may support limited offline functionality.

Online multiplayer requires connectivity.

If disconnected:

```
Connection lost.
Reconnecting...
```

Game state must recover safely.

---

## 49. TECHNICAL ARCHITECTURE

Recommended architecture:

```
                 ┌─────────────────┐
                 │   Web / Mobile  │
                 └────────┬────────┘
                          │
                    API / WebSocket
                          │
                 ┌────────▼────────┐
                 │ API / Backend   │
                 └────────┬────────┘
                          │
          ┌───────────────┼────────────────┐
          │               │                │
     Game Engine     Content Engine    User Engine
          │               │                │
          │          Knowledge Graph       │
          │               │                │
          └───────────────┼────────────────┘
                          │
                 ┌────────▼────────┐
                 │   PostgreSQL    │
                 └─────────────────┘
```

---

## 50. RECOMMENDED TECHNOLOGY

**Web:** Next.js, React, TypeScript, Tailwind CSS

**Mobile:** React Native, Expo, TypeScript

**Backend:** Java 21, Spring Boot

**Database:** PostgreSQL

**Cache / Real-Time:** Redis, WebSocket

**Infrastructure:** AWS. Initial infrastructure should remain simple.

---

## 51. CORE SERVICES

Backend services/modules:

- **User Service** — Authentication and profiles.
- **Game Service** — Game lifecycle.
- **Game Engine** — Rules and scoring.
- **Content Service** — Entities and content.
- **AI Service** — Computer opponents and game generation.
- **Matchmaking Service** — Online players.
- **Social Service** — Friends/challenges.
- **Ranking Service** — XP/rating/leaderboards.
- **Notification Service** — Push notifications.
- **Analytics Service** — Product analytics.
- **Admin Service** — Content and moderation.

---

## 52. GAME ENGINE REQUIREMENTS

The game engine must be independent from the UI.

Example interface:

```
createGame()
startGame()
submitGuess()
evaluateGuess()
calculateScore()
useHint()
switchTurn()
determineWinner()
endGame()
```

The game engine must be deterministic.

Every rule must have automated tests.

---

## 53. NUMBER GAME REQUIREMENTS

The original 5-digit game becomes one official game type.

Rules:

- 5 digits
- 0–9
- No repeated digits initially
- Maximum 10 guesses
- Exact match
- Misplaced match
- Miss
- Server-authoritative

Example:

```
Secret: 78391
Guess:  74162
Result: 1 exact, 1 misplaced, 3 miss
```

Repeated-digit support can be added as an advanced mode.

---

## 54. AI NUMBER GAME

AI maintains candidate possibilities.

```
All possible answers
        ↓
Apply result
        ↓
Remove impossible answers
        ↓
Select next guess
        ↓
Repeat
```

Higher difficulty means better information optimization.

---

## 55. AI FOR KNOWLEDGE GAMES

AI should not have unrestricted access to answers.

It should play according to the same information available to the player.

The AI should:

- Interpret clues
- Eliminate candidates
- Make guesses
- Use strategic hints when permitted

Difficulty determines AI accuracy.

---

## 56. MATCHMAKING

Match players based on:

- Rating
- Region
- Latency
- Availability
- Game mode
- Difficulty

Initially keep matchmaking simple.

Expand the matching window if no opponent is found.

---

## 57. REAL-TIME COMMUNICATION

Use WebSockets for:

- Game state
- Turns
- Guess events
- Opponent connection
- Game completion

REST APIs handle persistent operations.

---

## 58. SECURITY

Critical requirements:

- HTTPS
- JWT
- Refresh tokens
- Server-side authorization
- Rate limiting
- Input validation
- WebSocket authentication
- Anti-cheat
- Secret protection
- Replay protection

The client must never receive an answer before the game ends.

---

## 59. ANALYTICS

Track:

App opened, Game started, Game completed, Game abandoned, Guess submitted, Hint used, Game won, Game lost, Friend challenge, Match found, Daily challenge, Share result, Rematch

Primary KPIs:

- DAU
- WAU
- MAU
- Games/player/day
- Session length
- Game completion rate
- D1 retention
- D7 retention
- D30 retention
- Multiplayer participation
- Daily challenge participation

---

## 60. NORTH STAR METRIC

The primary product metric should be:

**Completed Games Per Active Player**

This captures both:

- Engagement
- Actual gameplay

Secondary:

- D7 retention
- Games/session
- Multiplayer rate
- Daily challenge completion

---

## 61. MONETIZATION

Do NOT monetize aggressively at launch.

### Initial model: Free

- Single player
- AI
- Daily games
- Friend games
- Basic multiplayer

### Potential future: Premium

- Ad-free
- Advanced statistics
- Premium AI characters
- Themes
- Avatars
- Custom game creation
- Tournament features

### Ads

Optional rewarded ads: Watch an ad → receive a hint.

Avoid interruptive ads during the core game initially.

---

## 62. USER-GENERATED GAMES

Future feature:

Users can create:

```
My Game
Answer: ________
Category: Movies
Clues:
1.
2.
3.
4.
5.
```

Then share:

```
CODE5://challenge/ABC123
```

Friends play the custom game.

This can become a major viral loop.

---

## 63. CREATOR MODE

Eventually allow creators to publish game packs.

Examples:

Tamil Cinema Pack, Marvel Pack, IPL Pack, 90s Movies Pack, Indian Actors Pack, Chennai Pack, Anime Pack

Creators can see:

- Plays
- Completion
- Ratings
- Shares

---

## 64. VIRAL LOOP

The intended loop:

```
Play
 ↓
Win
 ↓
Share result
 ↓
Friend opens link
 ↓
Friend plays
 ↓
Friend challenges player
 ↓
Player returns
```

Every completed game should have an optional share action.

---

## 65. LAUNCH STRATEGY

Do NOT launch every category initially.

Launch with:

**Categories:** 1. Actors, 2. Movies, 3. Heroes, 4. Numbers, 5. General/Anything

**Mechanics:** 1. Clue Guess, 2. Exact Number, 3. Higher/Lower, 4. Image Reveal, 5. Multiple Choice

**Modes:** 1. Single Player vs AI, 2. Friend Challenge

This is enough for a strong MVP.

---

## 66. PHASE 0 — PRODUCT VALIDATION

Before coding everything:

Deliverables:

- Final name
- Logo
- Design direction
- Core rules
- 5 game mechanics
- 100–500 sample games
- AI difficulty model
- User flow

Build a clickable prototype.

Goal: Determine whether the game is fun.

---

## 67. PHASE 1 — MVP

Target: 6–8 weeks

Features:

- Web
- iOS/Android
- Authentication
- Guest mode
- Single player
- AI
- 5 categories
- 5 mechanics
- Game engine
- Profiles
- XP
- Streak
- Game history

No complex multiplayer initially.

---

## 68. PHASE 2 — SOCIAL

Target: 3–4 weeks

Add:

- Friends
- Friend challenges
- Room codes
- Rematch
- Sharing
- Basic multiplayer
- WebSockets

---

## 69. PHASE 3 — COMPETITIVE

Add:

- Ranked
- Rating
- Leaderboards
- Daily challenge
- Weekly challenge
- Achievements
- Tournaments

---

## 70. PHASE 4 — CONTENT SCALE

Add:

- More categories
- AI-generated games
- Creator mode
- User-generated games
- Game packs
- Personalization

---

## 71. PHASE 5 — MONETIZATION

Only after engagement is proven.

Test:

- Rewarded ads
- Premium
- Cosmetic purchases
- Game packs

---

## 72. DEVELOPMENT STRATEGY

Do NOT ask an AI coding tool to build the entire product in one prompt.

Build in controlled milestones.

- **Sprint 1** — Architecture + repository.
- **Sprint 2** — Design system + home/navigation.
- **Sprint 3** — Game engine.
- **Sprint 4** — Number game.
- **Sprint 5** — Clue game.
- **Sprint 6** — Image game.
- **Sprint 7** — AI engine.
- **Sprint 8** — Profiles + XP + history.
- **Sprint 9** — Mobile.
- **Sprint 10** — Friend multiplayer.
- **Sprint 11** — Online multiplayer.
- **Sprint 12** — Testing + security.
- **Sprint 13** — Beta.
- **Sprint 14** — Launch.

---

## 73. REPOSITORY STRUCTURE

```
guess-it/
  apps/
    web/
    mobile/
  services/
    api/
  packages/
    game-engine/
    content-engine/
    ai-engine/
    types/
    validation/
    ui/
  infrastructure/
    aws/
  database/
    migrations/
  docs/
    BRD.md
    PRD.md
    architecture.md
    game-rules.md
    api.md
  tests/
```

---

## 74. DEFINITION OF MVP DONE

MVP is complete when:

- Web works
- iOS works
- Android works
- Guest can play
- User can register
- Single-player works
- AI works
- Number game works
- Clue game works
- Image game works
- Multiple-choice works
- Higher/lower works
- Game results work
- XP works
- Streak works
- History works
- Profile works
- No game answer can be extracted before completion
- Core game engine has comprehensive tests
- App survives network interruptions
- Analytics are working
- Crash/error monitoring is working

---

## 75. LAUNCH BETA

Initial beta should target approximately: **50–200 testers**

Measure:

- Games per user
- Completion
- D1 retention
- D7 retention
- Most popular category
- Most popular mechanic
- AI difficulty satisfaction
- Game abandonment
- Bugs

Do not immediately optimize for downloads.

Optimize for:

> "Do people come back and play again?"

---

## 76. LAUNCH VERSION

The first public release should have:

**Worlds:** 🎬 Actors · 🎥 Movies · 🦸 Heroes · 🔢 Numbers · 🎲 Anything

**Mechanics:** 🔍 Clues · 🔢 Exact Guess · ⬆️ Higher / Lower · 🖼️ Reveal · ❓ Multiple Choice

**Modes:** 🤖 Solo vs AI · 👥 Friend Challenge · 🌎 Online Match

**Engagement:** 🔥 Streak · ⭐ XP · 🏆 Leaderboard · 🎯 Daily Challenge

---

## 77. LONG-TERM PRODUCT

The ultimate product is not:

> "An actor guessing game."

It is not:

> "A number guessing game."

It is:

**A UNIVERSAL GUESSING ENGINE**

The platform should allow:

```
Content + Relationships + Facts + Numbers + Images + Game Mechanics + AI
```

to continuously create new experiences.

The long-term ecosystem becomes:

```
                    GUESS IT
                       │
       ┌───────────────┼────────────────┐
       │               │                │
     CONTENT          GAMES            PLAY
       │               │                │
    People            Clues             Solo
    Movies            Numbers           Friend
    Heroes            Images            Online
    Sports            Yes/No            Ranked
    Places            Logic             Tournament
    Numbers           Battle
    Anything           Chaos
```

---

## 78. PRODUCT SUCCESS CRITERIA

The product succeeds if users:

1. Understand the game immediately.
2. Finish their first game.
3. Start another game without being prompted.
4. Return the next day.
5. Challenge a friend.
6. Share a result.
7. Develop favorite categories.
8. Develop favorite AI opponents.
9. Try increasingly difficult games.
10. Compete on leaderboards.

The ultimate success signal:

> A player opens the app intending to play one game and ends up playing ten.

---

## 79. FINAL PRODUCT PRINCIPLE

The most important architectural decision is:

**Never hard-code the product around Actors, Numbers, Movies, or any single category.**

Build:

```
ENTITY
    ↓
ATTRIBUTES
    ↓
RELATIONSHIPS
    ↓
GAME GENERATOR
    ↓
GAME MECHANIC
    ↓
DIFFICULTY
    ↓
PLAYER / AI
```

This allows us to add an entirely new category later without rebuilding the application.

For example:

Today: Actors, Movies, Heroes, Numbers

Tomorrow: Cars, Food, Companies, Countries, Animals, Science, History, Brands, Products

The engine remains the same.

---

## 80. THE PRODUCT IN ONE SENTENCE

GUESS IT is a cross-platform, AI-powered guessing-game universe where players can identify anything—from actors and heroes to numbers, movies, places and everyday objects—using multiple deduction mechanics against AI, friends or players around the world.

---

## 81. IMMEDIATE NEXT STEPS

The project should now move through these documents in order:

- **Document 1 — BRD** — Business requirements — this document.
- **Document 2 — PRD** — Every screen, feature, user story and acceptance criterion. (`docs/PRD.md`)
- **Document 3 — Game Engine Specification** — Exact rules for every game mechanic. (`docs/game-engine-spec.md`)
- **Document 4 — Content Model** — Entities, attributes, relationships and content ingestion.
- **Document 5 — AI Specification** — AI opponents, difficulty and game-generation AI.
- **Document 6 — System Architecture** — Web, mobile, backend, database, Redis, WebSockets, AWS.
- **Document 7 — API Specification** — Every endpoint, request, response and authorization rule.
- **Document 8 — UI/UX Specification** — Every screen and interaction.
- **Document 9 — Development Plan** — Sprint-by-sprint coding instructions for Claude/AI builder.
- **Document 10 — QA/Test Plan**
- **Document 11 — Beta & Launch Plan**

---

## 82. RECOMMENDED DEVELOPMENT ORDER

The actual coding should begin with:

```
STEP 1   Game Engine
STEP 2   One complete game: 5-digit Number Game
STEP 3   AI opponent
STEP 4   Game UI
STEP 5   Content Engine
STEP 6   Clue Game
STEP 7   Other mechanics
STEP 8   Profiles / XP / Streak
STEP 9   Mobile
STEP 10  Friend Multiplayer
STEP 11  Online Multiplayer
STEP 12  Daily / Ranked / Leaderboards
STEP 13  Beta
STEP 14  Launch
```

The most important thing: don't let the AI builder start by generating 50 screens and 20 services. First build a beautiful, fully playable vertical slice — one game, one AI opponent, one complete game loop. Once that feels genuinely fun, expand the engine around it.
