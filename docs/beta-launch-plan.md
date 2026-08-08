# BETA & LAUNCH PLAN

## GUESS IT — Universal Guessing Game Platform

**Document:** 11 of 11 (see BRD §81)
**Version:** 1.0
**Status:** Approved for build
**Scope:** Closed beta design, measurement, exit criteria, the public-launch checklist, rollout, and post-launch operations. Implements BRD §75–§76. Guiding metric: not downloads — *"do people come back and play again?"*

---

## 1. BETA COHORT (BRD §75: 50–200 testers)

- **Wave 1 (week 1): ~50** — friends/family/colleagues; high-touch feedback (shared chat group). Purpose: catastrophic-issue shakeout + fun-factor read.
- **Wave 2 (week 2–3): +100–150** — extended network + a small trivia/puzzle community invite. Purpose: cold-user onboarding truth (nobody explains the game to them) + retention signal.
- Mix targets: ≥ 40% mobile-first users, ≥ 30% outside the team's home region, ≥ 50% people who never saw the product before.

**Channels:** TestFlight (iOS), Play Internal → Closed testing track (Android), password-gated web on `beta.guessit.app` (prod infra, `beta` flag). All builds carry full analytics + Sentry.

**Duration:** 3 weeks minimum; extend in 1-week increments until exit criteria (§5) hold for 7 consecutive days.

---

## 2. WHAT WE MEASURE (dashboards live before Wave 1)

| Metric (BRD §75/§59) | Beta target |
|---|---|
| **North Star: completed games / active player / day** | ≥ 3.0 |
| Game completion rate (started → finished) | ≥ 85% |
| First-session: % completing ≥ 1 game | ≥ 90% |
| First-session: % starting a 2nd game unprompted | ≥ 60% (BRD §78.3) |
| D1 retention | ≥ 40% |
| D7 retention | ≥ 20% |
| Daily Challenge participation (of DAU) | ≥ 40% |
| Median session length | 4–10 min (BRD §4.1 band) |
| Abandonment hotspots | no single screen > 10% drop |
| AI difficulty satisfaction (survey) | ≥ 70% "felt fair" |
| Crash-free sessions | ≥ 99.5% |

Plus qualitative: weekly 15-min interviews with 5 testers (rotating), in-app one-tap post-game pulse ("Fun? 👍👎") sampled at 20%.

---

## 3. BETA OPERATING RHYTHM

- **Daily:** triage board sweep (QA §10 severities), Sentry review, KPI glance.
- **Weekly:** tuning review — scoring slopes, AI win-rate bands vs AI Spec §5 targets, difficulty calibration (Content identifiability fixes), each shipped as config-version bumps (Engine R-6.3.3) so history stays honest; cohort digest posted to the team.
- **Content rotation:** Daily Challenge queue reviewed 2 weeks ahead; flagged/too-hard definitions unpublished within 24 h.
- Build cadence: at most 2 beta releases/week; every release passes the QA §10 release gates.

---

## 4. EXPERIMENTS DURING BETA (small, decisive)

1. Upgrade-prompt timing: after first win vs after second session (metric: upgrade rate without D1 damage).
2. Exact Number wrong-guess cost −90 vs −70 (Engine open item resolved by data — fun vs score spread).
3. Daily Challenge push at local 09:00 vs none (Wave 2, opt-in only).

No more than one experiment per surface at a time; results logged in a decisions appendix in this file.

---

## 5. BETA EXIT CRITERIA (all required)

1. §2 table green for 7 consecutive days across both waves.
2. Zero P0/P1 open; P2 count < 10 and trending down.
3. Every BRD §74 "Definition of MVP Done" line item still holds on the release candidate.
4. Content bar: ≥ 300 published definitions (beta will consume seed content; restock past the Content Model §6 minimum), Daily queue filled 30 days ahead.
5. Support loop tested: a reported bug reaches triage within 24 h.
6. The subjective gate, honestly assessed: **would we be embarrassed if 10,000 strangers saw this tomorrow?** If yes anywhere, fix before launch.

---

## 6. LAUNCH READINESS CHECKLIST

**Stores & legal**

- [ ] App Store listing (name "GUESS IT — Think. Guess. Outsmart.", screenshots per device class, preview video ≤ 30 s, age rating questionnaire, privacy nutrition labels)
- [ ] Play Store listing (graphics, data-safety form, content rating)
- [ ] Privacy policy + Terms live at guessit.app/privacy · /terms (referenced in both stores and S12)
- [ ] Account deletion flow verified end-to-end (store requirement + PRD GI-9.1)
- [ ] Trademark screen on "GUESS IT" completed; domain + socials secured
- [ ] Image licensing audit: every published image has license + attribution (Content Model §4)

**Product & infra**

- [ ] Web prod domain live, SSR landing indexed, OG cards render in link previews
- [ ] Universal links / app links verified on both platforms
- [ ] Rate limits + WAF rules at prod values; secrets rotated out of beta
- [ ] Load test re-run at 4× beta peak; autoscaling verified
- [ ] Backups + restore drill re-verified on prod; on-call rotation + runbook (top 10 failure modes with responses) published
- [ ] Kill switches: feature flags for daily, challenges, sign-up (can shed load without full outage)
- [ ] Support inbox (support@guessit.app) + in-app report path wired (BRD §37)
- [ ] Status page (status.guessit.app)

**Measurement**

- [ ] North Star + KPI dashboards on prod data; alerting thresholds set (completion rate < 75%, crash-free < 99%, API 5xx > 0.5%)
- [ ] Store-review prompt configured (after 3rd win, never after a loss; platform-rate-limited)

---

## 7. ROLLOUT PLAN

1. **Soft launch (week 0):** web fully public + stores in phased release (iOS phased 7-day, Play staged 10% → 50% → 100%). No marketing push. Watch dashboards at 10% for 48 h; halt criteria = launch alert thresholds.
2. **Announce (week 1):** personal networks, Product Hunt-style communities, the share-card viral loop does the rest by design (BRD §64). Every early player is a challenge-link seed.
3. **Iterate (weeks 2–4):** ship the top friction fixes weekly; begin Phase 2 (social) once launch KPIs are stable — per BRD phasing, competitive (Phase 3) waits for social proof.

Launch-day war room: 3 people (eng, product, content), 12 h coverage, pre-agreed halt/rollback authority.

---

## 8. POST-LAUNCH OPERATIONS (steady state)

- **Daily:** Daily Challenge auto-publishes from the 30-day queue; anomaly alerts reviewed each morning; store reviews answered within 48 h.
- **Weekly:** KPI review vs §2 targets (now at public scale), content restock (≥ 20 new definitions/week toward Phase 4 scale), tuning config review.
- **Monthly:** retention cohort deep-dive; roadmap checkpoint against BRD §68–§71 phases; privacy/data-request audit.
- **Success reassessment at day 30** against BRD §78: if North Star ≥ 3 and D7 ≥ 20% at public scale, greenlight Phase 2 build; below that, run a diagnosis cycle (funnel + interviews) before adding features — per the BRD, engagement is proven before anything else is built.

---

## 9. RISKS & CONTINGENCIES

| Risk | Trigger | Response |
|---|---|---|
| Store rejection | Review feedback | Pre-checked compliance in §6; 48 h fix-and-resubmit SLA; web launch proceeds regardless |
| Viral spike | 10× load | Autoscale + kill switches (§6); leaderboard degrades to top-100-only mode |
| Content drought | Daily queue < 14 days | Content freeze-breaker week; pull Phase 4 generation forward for *review-queue-only* drafting |
| Fun-factor miss | Completion < 75% at scale | Stop feature work; tuning cycle on scoring/difficulty (the Sprint 4 gate playbook, re-run) |
| Cheating on daily board | Impossible scores/times | Replay-verification audit (Architecture §5) already blocks score forgery; add solve-time floor heuristics; quietly shadow-ban pending review |
