---
name: studio-start
description: First-time onboarding for the studio workflow in a Unity project - detects what already exists (Unity project, harness config, brief, stories), asks where the user is with their game idea, sets rigor (how much process), automation (how often to ask) and stage in the studio settings, then names the one next skill. Use at the start of a new game, when a project has no studio settings yet, or when the user does not know where to begin. Port of CCGS /start. Triggers: "start", "bắt đầu", "bắt đầu làm game", "onboarding", "tôi nên bắt đầu từ đâu", "setup studio", "làm game mới theo quy trình".
---

# Studio start


Entry point for new users. Assumes nothing: no idea, no experience, maybe no project. It asks first, writes the
studio settings once, and hands off. It never runs the next skill itself.

## Phase 1: Detect state (silently)
Gather facts before asking anything; use them to tailor advice, do not dump them on the user.
- `unity-harness where`: project root and whether `.unity-harness/config.json` exists (`hasConfig`).
- Unity project: `ProjectSettings/ProjectVersion.txt` exists (read `m_EditorVersion`).
- `unity-harness studio config`: `explicit` lists the studio keys someone has set; `rigor` or `automation` missing
  from it means that question was never answered. Keep the `paths` it prints.
- `unity-harness studio status`: brief, concept, GDD count, epics, stories by status, sprint, active story.
- Game code: count `.cs` files under `Assets/` outside third-party folders (Plugins, Packages caches, TextMesh Pro,
  vendor SDK folders). A handful of template scripts is not "existing work".
- A `References/` folder (images, HTML/JS demo, pasted brief) at the project root or its parent.

## Phase 2: Ask where the user is
If Phase 1 found a returning user (studio block present and a brief or concept exists), ask nothing here and use
the **Returning user** edge case. Otherwise ask with `ask_question`:
- Prompt: "Before I suggest anything, where are you with your game idea right now?"
- Options:
  - `A) No idea yet`: no concept at all; wants to explore what to make.
  - `B) Vague idea`: a theme, feeling or genre ("something with space", "cozy farming") but nothing concrete.
  - `C) Clear concept`: knows the core idea (genre, basic mechanics, maybe a pitch) but has not written it down.
  - `D) Existing work`: already has design docs, a prototype, code or significant planning.

Wait for the answer.

## Phase 3: Route
Name only the immediate next step here. The full path depends on rigor, asked in Phase 3b. Say: "I'll lay out the
full path once I know how much process you want, two quick questions away."

- **A: No idea yet.** Starting from zero is fine. `studio-brainstorm` turns "no idea" into a written design
  (open exploration, or a hint such as "space", "cozy", "horror"). Describe it tier-neutrally: at minimal it writes a
  one-page brief, above that a full concept doc; that difference belongs in Phase 4. Next step: `studio-brainstorm`.
- **B: Vague idea.** Ask for the idea in a few words (plain text). Accept it as a starting point, do not judge or
  redirect. Next step: `studio-brainstorm` with their hint.
- **C: Clear concept.** Ask for one sentence, genre plus core mechanic (plain text). Then ask with `ask_question`
  "How would you like to proceed?":
  - `Formalize it first`: `studio-brainstorm` with the concept (one-page brief at minimal, concept doc above).
  - `Jump straight in`: `studio-setup` now, write the design down afterwards.
- **D: Existing work.** Share what Phase 1 found ("I can see N scripts, a brief, M stories..."). Then:
  - No Unity project → `unity-harness-project-setup` creates it (also into a folder that already holds
    `References/`).
  - Unity project but no harness config, or Unity version not recorded → `studio-setup`.
  - Docs, GDDs or stories already exist → show the `unity-harness studio status` summary in a few lines. A file
    on disk is not the same as a file the studio skills can use: stories need a `Status:` line and the
    `paths.epicsDir/<epic>/story-NNN-<slug>.md` layout. CCGS `/adopt` and `/project-stage-detect` are not in this
    plugin yet; `studio-help` reads the current state and names the next step.
- **References folder found (any path).** Mention once that `unity-ref-to-prototype` is the fast path: it turns
  the references into a Vietnamese gameplay GDD plus a playable prototype built and verified by the harness.

## Phase 3b: Rigor, automation, stage
For each of `rigor` and `automation` already in `explicit`, show its value ("Rigor is `<r>`") and do not ask it
again. Ask only the missing ones below, then save them together with `stage` in one approved `studio set`. When
both are already set, ask nothing and go to Phase 4 with the current values.

**Rigor.** Seed a recommendation from what the user described:
- Many interacting systems (open world, sim, RPG, crafting plus factions), a team, a firm release date → `full`.
- Several systems that affect each other, or a design someone else will implement → `standard`.
- A small game, jam, prototype, first game, or no concept at all → `minimal`. With no concept add: "You can raise
  this after brainstorming once the concept is clearer."
- A vague idea still counts: "some kind of open-world survival sim" signals systems-heavy; seed from the signal,
  not from the path letter. If nothing points either way, recommend `minimal`.

Ask with `ask_question`, recommended option first with " (Recommended)" appended:
- Prompt: "What best describes what you're building? This sets how much process the project carries; it can be
  changed later."
- `Jam / prototype / first game`: short docs, coarse stories, tests optional but the screenshot of what you built
  is not. About 4 steps to the first line of code. The trade: no GDDs, so design problems surface in code.
- `Several systems that affect each other`: balanced docs, normal story size, standard QA evidence. Expect about 8
  design documents and an hour of design before code. Intending to finish is not the test; most small games ship
  faster on the jam path and move up later.
- `Big systems-heavy or team project`: thorough docs, fine-grained stories, evidence everywhere, director review on
  every step.

Map: Jam → `minimal`, Several systems → `standard`, Big → `full`. Rigor drives reviewMode, workflow,
storyGranularity, qaLevel and docsDensity (see `unity-harness studio config`); never set those here.

**Automation.** Ask with `ask_question`: "Last one: how much should I confirm with you as we work?"
- `Collaborative`: ask before each significant step, show drafts before writing. Most control.
- `Guided (recommended)`: decide the small stuff, stop for the big calls (scope, deletions, settings).
- `Autonomous`: proceed and log decisions instead of asking, except the always-ask categories. Fastest, costs more
  tokens; best for trusted, well-scoped runs.

**Stage.** Derive it, do not ask:
- Paths A, B, C, or D with nothing beyond a concept → `concept`.
- D with GDDs but no architecture document → `systems-design`.
- D with an architecture document or ADRs → `technical-setup`.
- D with stories already written → `pre-production`; with stories In Progress or Complete → `production`.

**Save.** The settings need `.unity-harness/config.json`:
- No Unity project: do not save. Keep the answers for this run and say they will be saved by running
  `studio-start` again after `unity-harness-project-setup`.
- Unity project without harness config: ask "May I run `unity-harness init` to create the harness config?" (a
  config change, always asked). Declined → keep the answers for this run and say they were not saved.
- Then ask: "May I save `stage=<s> rigor=<r> automation=<a>` to the studio settings?" On approval run
  `unity-harness studio set stage=<s> rigor=<r> automation=<a>` and show the resolved values it prints.
  Declined → nothing saved; say so.

## Phase 4: Show the path
Say first: "Here's your path at rigor `<r>`. Rigor changes what is required, not what is allowed: any skill can run
at any level."

**minimal: about 4 steps to running code**
1. `studio-setup`: record the Unity version, pipeline, platforms and budgets (skip if done).
2. `studio-brainstorm`: one-page `paths.brief` (replaces concept doc, systems map and GDDs).
3. `studio-create-stories`: stories straight from the brief's MVP list; the brief's build order is the plan (no
   epics step, no sprint plan).
4. `studio-dev-story` ↔ `studio-story-done`: first line of game code, then close each story with evidence.

**standard**
- Concept: `studio-setup` → `studio-brainstorm` (concept doc at `paths.concept`) → `studio-design-review` on the
  concept → `studio-map-systems` (systems index) → `studio-gate-check systems-design`. Art bible is optional here
  (recommended at full) and not in this plugin yet; see `studio-help` for the fallback.
- Systems design: `studio-design-system` per system (Overview, Detailed Rules, Edge Cases, Dependencies, Acceptance
  Criteria, + Formulas when it has numeric rules) → `studio-design-review` per GDD → `studio-gate-check
  technical-setup`. Cross-GDD review (CCGS `/review-all-gdds`) is not in this plugin yet.
- Technical setup: `studio-create-architecture` → `studio-architecture-decision` per ADR →
  `studio-create-control-manifest` → `studio-architecture-review` → `studio-gate-check pre-production`.
- Pre-production: `studio-create-epics` → `studio-create-stories` → `studio-sprint-plan` → `studio-qa-plan sprint` →
  `studio-gate-check production`.
- Production: `studio-story-readiness` → `studio-dev-story` → `studio-code-review` → `studio-story-done`;
  `studio-sprint-status` any time.

**full**: everything in standard, with all 8 GDD sections per system, director review on every gated step, and a
vertical slice plus playtest report before production (CCGS `/vertical-slice`, `/playtest-report`, not in this
plugin yet: build the slice with `studio-dev-story` and write the playtest notes by hand).

**Existing work (D with docs or stories)**: `studio-help` for the next step; at standard/full fill missing GDD
sections with `studio-design-system` (it can retrofit an existing GDD) before `studio-create-epics`.

Do not present minimal as lesser: its floor (Unity project, recorded setup, a filled brief) is the documented
minimum. Do not oversell it either: there are no GDDs to catch design problems before code.

If the chosen rigor contradicts what the user described (minimal for a multi-year commercial project, full for a
weekend jam), say so once in one sentence and mention `unity-harness studio set rigor=<r>`. Do not re-ask.

Then ask with `ask_question`: "Would you like to start with `<first step>`?" with `Yes, let's start with <first step>` and
`I'd like to do something else first`.

## Phase 5: Hand off
When the user confirms, answer with one short line naming how to start the skill, nothing else:
"Type `/<skill>` to begin."

Verdict: **COMPLETE**, user oriented and handed off.

## Edge cases
- **Picks D but the project is empty**: "This looks like a fresh project with no artifacts yet. Would A or B fit
  better?"
- **Picks A but game code exists**: "I noticed scripts under `Assets/<...>`. Did you mean D (existing work)?"
- **Returning user** (studio block and a brief or concept exist): skip onboarding. "You're already set up: Unity
  `<version>`, rigor `<r>` (review mode `<reviewMode>`), brief/concept at `<path>`. `studio-help` reads your
  progress and names the next step, or tell me what you'd like to work on."
- **Fits no option**: let the user describe the situation in their own words and adapt.
- **Settings already exist but the user wants to change them**: this skill does not overwrite them. Show
  `unity-harness studio set rigor=<r>` / `automation=<a>` and run it only after approval.
