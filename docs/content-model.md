# CONTENT MODEL

## GUESS IT — Universal Guessing Game Platform

**Document:** 4 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** Entities, attributes, relationships, content tiering, game-definition storage, authoring and ingestion, validation, and the MVP seed-content plan.

The core BRD principle this document implements (BRD §79): **never hard-code a category.** Everything below is schema, not code — adding a new world is a data operation.

---

## 1. CORE MODEL

```
EntityType ──▶ Entity ──▶ Attribute (typed key/value)
                  │
                  └─────▶ Relationship (Entity ↔ Entity, typed)
GameDefinition ──▶ references one Entity (the answer) + mechanic content
```

### 1.1 EntityType

| Field | Type | Notes |
|---|---|---|
| id | slug | `actor`, `movie`, `hero`, `number`, `country`, … |
| name | string | Display name |
| world | slug | `people`, `entertainment`, `heroes`, `numbers`, `anything` (a type may appear in several worlds via mapping table) |
| schema | JSON Schema | Declares which attribute keys are required/optional for entities of this type |

New entity types are inserted rows, not migrations.

### 1.2 Entity

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| type_id | fk EntityType | |
| canonical_name | string | Display + match target |
| aliases | string[] | Match targets (engine R-4.2). Include nicknames, initials, common misspellings |
| popularity_tier | 1–5 | 1 = globally famous … 5 = deep cut. Drives difficulty (Engine Spec §8, R-8.2) |
| locale_tags | string[] | e.g. `in`, `global`, `us` — enables regional content packs later (BRD §63) |
| status | enum | `draft` \| `review` \| `published` \| `retired` |
| attributes | jsonb | Validated against EntityType.schema |
| images | ImageAsset[] | See §4 |

### 1.3 Attribute conventions

Attributes are typed values so the game generator can reason about them:

```json
{ "birth_year": { "t": "year", "v": 1965 },
  "nationality": { "t": "ref", "v": "country:india" },
  "debut_year": { "t": "year", "v": 1988 },
  "awards": { "t": "list", "v": ["Padma Shri"] },
  "box_office_usd": { "t": "number", "v": 723000000, "unit": "USD" } }
```

Types: `string`, `number`, `year`, `date`, `ref` (entity reference), `list`, `bool`. Numeric attributes carry `unit`. Every `ref` creates an implicit relationship edge.

### 1.4 Relationship

| Field | Notes |
|---|---|
| from_id, to_id | Entity fks |
| type | `acted_in`, `directed`, `co_starred_with`, `played_character`, `located_in`, `member_of`, `rival_of`, … (open vocabulary, registered in a `relationship_types` table) |
| meta | jsonb (e.g. `{ "year": 1995, "role": "Raj" }` ) |

Relationships power the Connection Game and clue generation (BRD §10.9, §33) — not required for MVP mechanics but populated from day one so they're free later.

### 1.5 Numeric entities

Numbers are first-class entities (BRD §8):

```json
{ "type": "number", "canonical_name": "Mount Everest elevation",
  "attributes": { "value": {"t":"number","v":8848.86,"unit":"m"},
                   "range_lo": {"t":"number","v":8000}, "range_hi": {"t":"number","v":9000} },
  "aliases": ["everest height"] }
```

`range_lo`/`range_hi` seed Higher/Lower bounds; `value` seeds Exact/Closest guesses. Pure abstract numbers (the 5-digit code game) need no entity at all — the engine generates the secret from the seed.

---

## 2. GAME DEFINITION

A GameDefinition is the immutable content object the engine consumes (Engine Spec §2).

| Field | Notes |
|---|---|
| id | uuid |
| mechanic | `EXACT_NUMBER` \| `CLUE_GUESS` \| `HIGHER_LOWER` \| `IMAGE_REVEAL` \| `MULTIPLE_CHOICE` |
| world | slug |
| difficulty | `EASY` \| `MEDIUM` \| `HARD` (EXPERT/MASTER reserved) |
| answer_entity_id | nullable fk (null for generated Exact Number) |
| content | jsonb, mechanic-specific (below) |
| overrides | jsonb, engine RuleConfig overrides (attempts, timer) |
| source | `manual` \| `generated` |
| confidence | 0–1 (generated content only, BRD §34) |
| status | `draft` \| `review` \| `published` \| `unpublished` |
| version | int — definitions are immutable once published; edits create a new version |

### 2.1 Mechanic content shapes

**CLUE_GUESS**
```json
{ "clues": [ { "text": "I was born in India.", "identifiability": 0.05 },
             { "text": "I debuted in television in 1988.", "identifiability": 0.30 },
             { "text": "I am called the King of Bollywood.", "identifiability": 0.97 } ] }
```
Ordered vaguest → most identifying. `identifiability` ∈ [0,1] is hand-authored at MVP (Engine Spec decision D-12.2) using the rubric in §5.3.

**IMAGE_REVEAL**
```json
{ "image_id": "img_...", "reveal_levels": [0.10, 0.25, 0.50, 0.75, 1.0] }
```

**MULTIPLE_CHOICE**
```json
{ "question": "Which movie earned the most worldwide?",
  "options": ["A…","B…","C…","D…"], "correct_index": 2 }
```
Stored order is authoring order; the engine shuffles per seed (R-5.5.1).

**HIGHER_LOWER**
```json
{ "secret": 8849, "lo": 8000, "hi": 9000, "unit": "m",
  "prompt": "How tall is Mount Everest, in meters (rounded)?" }
```

**EXACT_NUMBER** — no content; secret derived from game seed (Engine R-5.1.1).

### 2.2 Answer secrecy at rest

`answer_entity_id`, `content.secret`, `content.correct_index`, and clue text beyond the revealed index are **server-only columns**. The API layer maps GameDefinition → PlayerView through the engine, never serializes definitions directly (enforces Engine R-1.4).

---

## 3. WORLD & CELL MODEL

A **cell** = world × mechanic × difficulty. Playability rule (PRD decision D-8.5):

> A cell is playable only when it has ≥ 10 published GameDefinitions. The Anything world draws from all published pools and is playable when the union ≥ 50.

Valid MVP cells:

| World | CLUE | EXACT_NUMBER | HIGHER_LOWER | IMAGE | MC |
|---|---|---|---|---|---|
| Actors | ✅ | — | — | ✅ | ✅ |
| Movies | ✅ | — | ✅ (box office/years) | ✅ | ✅ |
| Heroes | ✅ | — | — | ✅ | ✅ |
| Numbers | — | ✅ | ✅ | — | ✅ |
| Anything | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. IMAGES

| Field | Notes |
|---|---|
| id, entity_id | |
| url | S3/CloudFront |
| license | `owned` \| `cc` \| `licensed` — **required**; unlicensed images cannot be published (BRD §34 copyright check) |
| attribution | string, shown on result screen when license requires |
| safe_crop | rect — region guaranteed identifiable at 100% reveal |

Reveal rendering (blur/tiles) is client-side; the asset itself is served only at the resolution the current reveal level needs, so a full image never reaches the client early (defense-in-depth for R-1.4).

---

## 5. AUTHORING & INGESTION

### 5.1 Manual authoring (MVP path)

MVP admin tooling is deliberately minimal (PRD §1.2): a protected route in the web app with three forms — Entity, GameDefinition, Review queue — plus **CSV/JSON bulk import** with schema validation. Full admin portal (BRD §35–36) is Phase 4.

### 5.2 Generated content (Phase 4, schema ready now)

Pipeline per BRD §33–34: attribute/relationship data → clue candidate generation (AI Spec §6) → validation checks (fact, uniqueness, ambiguity, duplicates, offensive content, copyright, staleness) → confidence score → `review` if confidence < 0.85, else `published`. The `source`/`confidence` fields exist from day one so generated and manual content share one lifecycle.

### 5.3 Identifiability rubric (hand-authoring)

| Value | Meaning | Test |
|---|---|---|
| 0.0–0.1 | Eliminates almost nothing | "Thousands of answers fit" |
| 0.2–0.4 | Narrows to a category/era | "Hundreds fit" |
| 0.5–0.7 | Narrows to a shortlist | "A fan lists < 10 candidates" |
| 0.8–1.0 | Effectively identifying | "Most target-audience players get it" |

Difficulty calibration (Engine §8): EASY definitions must reach ≥ 0.8 by clue 2; MEDIUM by clue 3–4; HARD only at clue 5+.

### 5.4 Answer namespaces (type-ahead)

Per PRD decision D-8.3, each world exposes a **namespace**: the published entities of its types, `(id, canonical_name, aliases)`, served as a versioned, cached, paginated index. The namespace deliberately includes many more entities than have games, so the type-ahead never leaks "what has a game."

---

## 6. MVP SEED CONTENT PLAN (Phase 0 bar: BRD §66)

Target: **≥ 100 published entities, ≥ 260 published GameDefinitions** before beta.

| World | Entities | Definitions (by mechanic) |
|---|---|---|
| Actors | 40 (tier 1–3, Indian + global mix) | 30 clue, 20 image, 20 MC |
| Movies | 40 | 30 clue, 15 image, 15 MC, 10 higher/lower |
| Heroes | 30 (Marvel/DC/anime/games) | 25 clue, 15 image, 15 MC |
| Numbers | 40 numeric entities | 25 higher/lower, 20 MC (+ Exact Number is generative: unlimited) |
| Anything | draws from above + 10 chaos-only entities (brands, landmarks) | 10 chaos clue sets |

Every cell in §3 must clear the 10-definition bar across all three difficulties (≥ 3 per difficulty). Content sign-off is a launch gate (Beta & Launch Plan §6).

---

## 7. LOCALIZATION & REGIONAL PACKS

- All player-visible strings in definitions (`clues[].text`, `question`, `prompt`) carry an implicit locale `en` at MVP; the schema supports `text_i18n: { "ta": … }` for later.
- `locale_tags` on entities enable future packs (Tamil Cinema Pack, IPL Pack — BRD §63) with zero schema change.

---

## 8. DATA QUALITY RULES (enforced at publish time)

1. Canonical name unique per EntityType (case-insensitive, post-normalization R-4.1).
2. Clue sets: monotonically non-decreasing identifiability; no two clues with normalized-identical text; final clue ≥ 0.8.
3. Multiple Choice: exactly one correct option; no normalized-duplicate options.
4. Higher/Lower: `lo < secret < hi` strictly, and range ≤ 10× attempts' binary-search capacity for the assigned difficulty.
5. Image games: license present, safe_crop present.
6. Answer uniqueness: for clue/image definitions, no *other* published entity in the same namespace satisfies all clues (checked against attributes; manual attestation at MVP, automated in Phase 4).
