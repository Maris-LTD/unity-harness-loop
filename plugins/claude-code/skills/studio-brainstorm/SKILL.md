---
name: studio-brainstorm
description: Guided game-concept ideation for a Unity project, port of CCGS /brainstorm. At rigor minimal it writes the one-page game brief (pitch, core loop, goal and fail state, MVP, out of scope, build order); at standard/full it runs the full ideation walk (creative discovery, three concepts, core loop, pillars, player types, scope and feasibility, with director gates) and writes the game concept document. Use when the user has no idea yet, a vague idea, or a clear concept that is not written down, or says "brainstorm", "game idea", "write the game brief", "nghĩ ý tưởng game", "brainstorm game", "viết game brief", "lên concept game".
---

# studio-brainstorm

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

Turns "no idea" or "a rough idea" into the design record the next skill builds from:
- workflow `minimal`: `paths.brief` (one page, from `references/game-brief-template.md`);
- workflow `standard` / `full`: `paths.concept` (from `references/game-concept-template.md`).

References in this skill:
- `references/full-flow.md`: phases 1-6 of the standard/full walk, with the questions, techniques and gates.
  Read it before Phase 1.
- `references/game-brief-template.md`: the one-page brief.
- `references/game-concept-template.md`: the full concept document.

## 0. Setup
- Run `unity-harness studio config`: read `workflow`, `reviewMode`, `automation`, `docsDensity`, `language`,
  `unityVersion`, `targetPlatforms`, `targetFps` and `paths`.
- If the project has a `References/` folder with an HTML/JS gameplay demo, target-look images or a pasted GDD
  prompt, offer `unity-ref-to-prototype` instead: it extracts the rules from the demo, writes a gameplay GDD and
  builds the prototype. Continue here only if the user prefers to ideate first.
- Argument: an optional genre/theme hint (`roguelike`, `cozy farming`), or `open` / nothing to start from scratch.
- `docsDensity` sets the depth of every section you write: `terse` = bullets; `balanced` = bullets with a short
  rationale; `thorough` = rationale plus alternatives considered.
- Branch on `workflow`: `minimal` runs section 1 and stops. `standard` / `full` run sections 2-5.

## 1. Lean brief (workflow minimal only)
A jam-sized session: capture the load-bearing thinking on one page, then get to code. A few exchanges, not fifteen.
No director gates and no concept document at this tier. If `paths.brief` exists, read it and refine instead of
starting over.

1. Concept: from the hint (or one open question if there is none), propose 2-3 one-line concepts, verb-first or
   mashup. Ask with `AskUserQuestion` to pick or combine. This is the one guaranteed creative question.
2. Fill the brief conversationally, not one prompt per field:
   - one-sentence pitch;
   - core loop (2-4 steps the player repeats);
   - player goal and fail state: what the player tries to do and how a run ends or fails. Story acceptance
     criteria trace back to this field, so make it concrete;
   - MVP: the short feature list that makes it the game; each item becomes a story. Past ~7, push back on scope;
   - out of scope: what is deliberately not built;
   - build order: risky / core-fun item first;
   - one line each, offered not forced: who it is for and what they feel, art and audio direction, reference
     game (the shipped game it is closest to and the ~10% of it the MVP keeps).
   Show the filled brief in full for one confirmation.
3. Write approval: "Brief is ready. May I write it to `<paths.brief>`?" with options write it / revise a field
   first. On revise, show before/after for that field and ask again. Write from the template, creating
   directories. Apply the automation mode per the studio protocol.
4. Next steps, short:
   - `studio-setup`, only when `unityVersion` in studio config is empty or `unity-harness studio status` shows no
     Unity project ("configure the Unity project, required before code");
   - `studio-create-stories`: turns the MVP list into stories. The epic is implicit at minimal; there is no
     `studio-create-epics` or `studio-sprint-plan` step, the brief's build order is the plan;
   - `studio-dev-story`: first line of game code.
   Then one summary line: pitch, MVP feature count, brief path.

Verdict: **COMPLETE** (game brief created).

## 2. Full flow (workflow standard / full)
1. Resume, do not restart: read `paths.concept` if it exists, and `<paths.gddDir>/game-pillars.md` if it exists.
2. Read `references/full-flow.md`, then run its phases interactively. Do not generate everything silently: you
   facilitate, the user owns the vision. Write the analysis in the conversation first, then capture each decision
   with `AskUserQuestion` using short labels.
3. Phases, in order:
   1. Creative discovery: emotional anchors, taste profile, practical constraints → a 3-5 sentence creative brief
      the user confirms.
   2. Concept generation: three distinct concepts (verb-first, mashup, experience-first). Concept selection always
      asks the user, in every automation mode: there is no defensible automatic pick.
   3. Core loop: 30-second, 5-minute, session and progression loops, plus a motivation check (autonomy,
      competence, relatedness).
   4. Pillars and anti-pillars, then gates CD-PILLARS and AD-CONCEPT-VISUAL in parallel; the chosen visual
      direction becomes the Visual Identity Anchor.
   5. Player type validation.
   6. Scope and feasibility: platform, art pipeline, content scope, MVP, risks, scope tiers, then gates
      TD-FEASIBILITY and PR-SCOPE.

Gates follow `reviewMode` per the studio protocol: none of them is a phase gate, so they run only at `full` and
are noted as skipped at `solo` and `lean`.

## 3. Write the concept
- Fill every section of `references/game-concept-template.md` from the conversation, including the MDA analysis,
  the motivation profile, flow design and the Visual Identity Anchor (direction name, one-line visual rule, 2-3
  supporting principles with design tests, color philosophy).
- Scope consistency: the Estimated Scope row must match the full-vision timeline in Scope Tiers, written as
  "Large (X-Y months, solo)" or "Large (X-Y months, team of N)".
- Record gate outcomes in the document header per the studio protocol.
- Ask: "Game concept is ready. May I write it to `<paths.concept>`?" with options write it / revise a section
  first. On revise, ask which section (Elevator Pitch, Core Fantasy and Unique Hook, Pillars, Core Loop, MVP
  Definition, Scope Tiers, Risks, something else), show before/after, then ask again. In `collaborative` repeat
  until the user picks write; in `guided` apply the one revision and write; in `autonomous` write and log the
  decision.

## 4. Next steps (standard / full)
List all of them, in order:

Design-first (the concept is well defined):
1. `studio-setup`, if the Unity project or `unityVersion` is not configured yet.
2. Art bible: not in this plugin yet. If visual assets will be produced, write `paths.artBible`
   by hand from the Visual Identity Anchor before asset work starts.
3. `studio-design-review` on the concept, then `studio-map-systems`: decompose the concept into systems with a
   dependency-ordered design order and MVP tiers (`paths.systemsIndex`), then `studio-gate-check systems-design`.
4. `studio-design-system` per system in that order (sections set by `workflow`), `studio-design-review` per GDD,
   then `studio-gate-check technical-setup`.
5. `studio-create-architecture` → `studio-architecture-decision` per ADR → `studio-create-control-manifest` →
   `studio-architecture-review` → `studio-gate-check pre-production`.
6. `studio-create-epics`, `studio-create-stories`, then `studio-sprint-plan`.

Prototype-first (the core mechanic is unproven):
1. `studio-setup`.
2. Build a throwaway prototype of the core mechanic first. `/prototype` is not in this plugin yet: use
   `unity-ref-to-prototype` when there is an HTML demo or reference images, otherwise build it on a scratch scene
   with a small `unity-harness:unity-feature` workflow run.
3. If it proves fun, continue with design-first steps 2-6 using what the prototype taught. If not, run
   `studio-brainstorm` again with the learnings.

Then a summary: elevator pitch, pillars, primary player type, biggest risk, file path.

## 5. Verdict
**COMPLETE** (game concept created and next steps named), or **BLOCKED** when the user stops before the write.
