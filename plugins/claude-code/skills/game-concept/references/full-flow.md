# Full brainstorm flow (workflow standard / full)

Contents: facilitation principles · Phase 1 creative discovery · Phase 2 concept generation · Phase 3 core loop ·
Phase 4 pillars + CD-PILLARS / AD-CONCEPT-VISUAL · Phase 5 player types · Phase 6 scope + TD-FEASIBILITY / PR-SCOPE.

## Facilitation principles
- Withhold judgment during exploration; build on ideas ("yes, and"), do not shoot them down.
- Encourage unusual ideas; use constraints as creative fuel.
- Time-box each phase to keep momentum.
- Ask constrained taste questions, concept selection, direction choices and pillar ranking with `AskUserQuestion`; ask open
  questions (favourite games, the concept in one sentence) in plain text so the user can type freely.

## Phase 1: Creative discovery
Understand the person before the game. Ask conversationally, not as a checklist:
- Emotional anchors: a moment in a game that moved or thrilled them, and what created it; a fantasy they never
  found in a game.
- Taste profile: the 3 games they played most and why they came back (plain text, never preset options); genres
  they love or avoid; whether they prefer challenge, relaxation, story or self-expression (with `AskUserQuestion`).
- Practical constraints, bundled into one `AskUserQuestion` call with three questions:
  - Experience: Challenge & Mastery / Story & Discovery / Expression & Creativity / Relaxation & Flow;
  - Timeline: Weeks / Months / 1-2 years / Multi-year;
  - Dev level: First game / Shipped before / Professional background.

Synthesize a creative brief (3-5 sentences: emotional goals, taste, constraints), read it back, confirm.

## Phase 2: Concept generation
Generate 3 concepts in different directions, using:
- Verb-first: start from the core player verb (build, fight, explore, solve, survive, create, manage, discover).
- Mashup: genre A + unexpected theme B; the tension is the hook.
- Experience-first (MDA backward): start from the target aesthetic (sensation, fantasy, narrative, challenge,
  fellowship, discovery, expression, submission) and work back to dynamics and mechanics.

For each concept: working title; elevator pitch (passes the 10-second test); core verb; core fantasy; unique hook
("like X, and also Y"); primary MDA aesthetic; estimated scope (small/medium/large); why it could work (one
sentence); biggest risk (one sentence).

Present all three, then ask with `AskUserQuestion`, a plain single-choice list: "Concept 1 — <title>", "Concept 2 —
<title>", "Concept 3 — <title>", "Combine elements across concepts", "Generate fresh directions". This question is
asked in every automation mode. Never pressure toward a choice.

## Phase 3: Core loop
If the 30-second loop is not fun on its own, nothing else saves the game.
- 30-second loop: ask with `AskUserQuestion`, deriving options from the chosen concept (never hardcoded), each with a
  free-text escape ("I'll describe it"):
  1. the primary feel of the core action (3-4 options fitting genre and tone);
  2. the most important design variable for this concept (world reactivity, pacing, agency...).
  Then analyze whether the action is intrinsically satisfying and what makes it feel good (audio feedback, visual
  juice, timing, tactical depth).
- 5-minute loop: what structures play into cycles, where "one more run" kicks in, which choices the player makes.
- Session loop (30-120 min): what a full session looks like, natural stopping points, the hook that brings them back.
- Progression loop (days/weeks): how the player grows (power, knowledge, options, story), the long-term goal,
  when the game is "done".
- Motivation (Self-Determination Theory): autonomy (meaningful choice), competence (felt skill growth),
  relatedness (connection to characters, players or world).

## Phase 4: Pillars and boundaries
Define 3-5 pillars together: a name, a one-sentence definition, and a design test ("if we debate X vs Y, this
pillar picks __"). Pillars should pull against each other a little; if all point the same way they do no work.
Then 3+ anti-pillars: "We will NOT do <thing> because it would compromise <pillar>".

Pillar confirmation with `AskUserQuestion`: "Do these pillars feel right for your game?" — Lock these in / Rename or reframe
one / Swap a pillar out / Something else. After a revision: "Pillars updated. Ready to lock these in?" — Lock these
in / Revise another pillar / Something else.
- `collaborative`: repeat until the user locks them in.
- `guided`: pillars are a major decision; ask once, apply the chosen revision, lock them in.
- `autonomous`: do not ask; lock in the draft and log it with the alternatives considered.

Gates (only at reviewMode `full`; note "skipped (solo)" / "skipped (lean)" otherwise). Spawn both at once, without
waiting for one before starting the other:
- creative-director, gate CD-PILLARS, with the `Agent` tool with `subagent_type: "unity-harness:creative-director"`. Context: full pillar set with design tests,
  anti-pillars, core fantasy, unique hook.
- art-director, gate AD-CONCEPT-VISUAL, with the `Agent` tool with `subagent_type: "unity-harness:art-director"`. Context: elevator pitch, core fantasy, unique
  hook, full pillar set with design tests, target platforms (from studio config or the conversation), reference
  games or visual touchstones the user mentioned.

When CD-PILLARS returns APPROVE, ask both decisions in one `AskUserQuestion` call:
- Pillars: the creative director's feedback; options Lock in as-is / Revise <pillar> / Discuss further.
- Visual anchor: the art director's 2-3 named directions, one option each, plus Combine elements across directions
  and Describe my own direction. On STRONG mark the dominant direction "(Recommended)". On CONCERNS (pillars do not
  yet differentiate a visual identity) show the reason and offer Revise pillars / Describe my own direction.

If CD-PILLARS returns CONCERNS or REJECT, resolve the pillars first (ask the pillar question alone), then ask the
visual anchor question alone: visual direction flows from confirmed pillars. NOT ASSESSED from either gate is not
approval: supply the missing input and re-run; failing that, treat CD-PILLARS NOT ASSESSED like CONCERNS, and with
no art-director directions offer only Describe my own direction.

The chosen direction (or the user's own description) is the Visual Identity Anchor; it goes into the concept
document and seeds the art bible.

## Phase 5: Player type validation
Using the Bartle taxonomy and the Quantic Foundry motivation model:
- primary player type (achievers, explorers, socializers, competitors, creators, storytellers) — who will love it;
- secondary appeal;
- who it is NOT for;
- market check: successful games serving a similar player, and what their audience size suggests.

## Phase 6: Scope and feasibility
- Target platforms: take `targetPlatforms` from studio config when set and confirm it. Otherwise ask with `AskUserQuestion`:
  PC (Steam / Epic) / Mobile (iOS / Android) / Console / Web (WebGL) / Multiple platforms. Recording it in the
  studio config is a settings change: ask first, then `unity-harness studio set targetPlatforms=<a,b>`. Note the
  Unity implications (mobile: touch input, thermal and draw-call budgets; WebGL: build size, no threads; console:
  platform modules and certification).
- Engine is Unity; the version is `unityVersion` from studio config, or "set by game-setup" when empty. Do not ask
  about the engine.
- Art pipeline: style and how labour-intensive it is.
- Content scope: levels/areas, items, hours of play.
- MVP: the smallest build that answers "is the core loop fun?".
- Biggest risks: technical, design, market.
- Scope tiers: full vision vs what ships if time runs out.

Gate TD-FEASIBILITY (reviewMode `full` only), after the technical risks are listed and before scope tiers: spawn
the technical director with the `Agent` tool with `subagent_type: "unity-harness:technical-director"`. Context: core loop, target platforms, engine "Unity
<unityVersion or undecided version>", identified technical risks. Verdicts VIABLE / CONCERNS / HIGH RISK. On HIGH
RISK offer to revisit scope before going on; on CONCERNS note them and continue; NOT ASSESSED means feasibility is
recorded as not assessed in the concept's risks, never as VIABLE.

Gate PR-SCOPE (reviewMode `full` only), after scope tiers: spawn the producer with the `Agent` tool with `subagent_type: "unity-harness:producer"`. Context:
full vision scope, MVP definition, scope tiers, timeline estimate, team size. Verdicts REALISTIC / OPTIMISTIC /
UNREALISTIC. On UNREALISTIC ask whether to adjust the MVP or tiers or keep them (the user decides; the concept is
never rejected for it). On OPTIMISTIC show the suggested adjustments and ask whether to apply them. On NOT ASSESSED
ask for the missing input (timeline, team size) and re-run, or record scope as not assessed, never as REALISTIC.
