---
name: studio-qa-plan
description: Write the QA plan for a Unity sprint, feature, epic or single story before implementation starts - classify each story Logic / Integration / Visual/Feel / UI / Config/Data, list the EditMode tests to automate (file path in the test asmdef, cases from GDD formulas and edge cases), the manual Play mode checks and screenshots to keep, the smoke scope for unity-harness smoke, playtest needs and the sprint's definition of done, then optionally back-fill each story's QA Test Cases. Port of CCGS /qa-plan. Use when the user says "qa plan", "test plan", "kế hoạch test", "lên kế hoạch QA cho sprint", "cần test gì cho sprint này", or after studio-sprint-plan.
---

# QA plan

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

Tells developers up front what to automate, what to check by hand in Play mode, what smoke must cover and when a
playtest is needed. Run it before the sprint; a test plan written after implementation is a post-mortem.

Output: `<paths.qaDir>/qa-plan-<sprint-slug>-<date>.md` (sprint slug, epic slug, system name or story slug).
Template: `references/qa-plan-template.md`, read in phase 4.

## Settings
Run `unity-harness studio config`, `unity-harness config` and `unity-harness studio status`. Keep `workflow`,
`qaLevel`, `automation`, `paths`, `testAssemblies`, `smoke`, `targetFps`, `drawCallBudget`, `memoryBudgetMb`.

- `qaLevel` minimal: a smoke-and-screenshot plan only. Drop the automated-test rows and the test-file line of the
  definition of done. Never drop the Visual/Feel and UI screenshot rows: tests are waived at minimal, the look is not.
- `qaLevel` standard: a full plan per story type. `qaLevel` full: also a coverage target per system.
- `workflow` sets how many GDD sections are mined (phase 2).

## Phase 1: Scope
Argument: `sprint`, `feature: <system>`, `epic: <slug>`, `story: <path>`. None → ask with `AskUserQuestion`: `Current sprint` /
`A feature (system name)` / `An epic` / `One story (path)`.
- `sprint`: `currentSprint` from `studio status` (newest `sprint-NNN.md` in `paths.sprintsDir`); take every story path
  it lists.
- `feature:`: story files under `paths.epicsDir/*/story-*.md` whose path or title contains the system name, plus that
  epic's EPIC.md.
- `epic:`: every story in `paths.epicsDir/<slug>/`.
- `story:`: that file.
Report "Building QA plan for <N> stories in <scope>". A listed story file that does not exist is MISSING; continue
with the rest.

**Zero stories in scope → stop** with `NOT ASSESSED — no stories in scope`, naming the scope and the empty path:
- no sprint file → "No sprint plan. Run studio-sprint-plan." At rigor minimal there are no sprints by design: offer
  `epic: <slug>` or `story: <path>` instead.
- a sprint that lists no stories → "Sprint <path> lists no stories. Run studio-create-stories <epic>."
- `feature:` / `epic:` / `story:` matched nothing → name what was searched.
A QA plan for zero stories looks exactly like a finished plan, so never write one.

## Phase 2: Load inputs
Search the in-scope stories instead of reading each whole:
- the `## Acceptance Criteria` section (about 15 lines);
- the header lines `> **Type**:`, `> **Status**:`, `> **Estimate**:`;
- the `## Context` and `## Dependencies` sections (GDD, ADR, TR-IDs, dependencies);
- the existing `## QA Test Cases` section.
Read a story whole only when its test plan depends on its implementation notes, or when it matched no Acceptance
Criteria (say so: a story with no testable criteria is a QA finding, not a story to skip).

Once, not per story:
- `paths.systemsIndex` if it exists (priorities, which GDDs are approved).
- For each GDD the stories reference, mine test material by `workflow`: full → all sections; standard → Acceptance
  Criteria and Edge Cases, plus Formulas when the system defines numeric rules; minimal → Acceptance Criteria only
  (the design source is often `paths.brief`). No Edge Cases section → note "edge cases inferred from acceptance
  criteria only" for that GDD.
- `paths.controlManifest` if it exists: Forbidden patterns that tests could guard against.
A story with no GDD reference is a gap to note, not a blocker: classify it from its criteria.

## Phase 3: Classify
- A story with a `Type` header keeps it as declared; do not re-classify.
- No `Type` → infer it and flag "type inferred, declare it before implementation":

| Type | Indicators in the criteria |
|---|---|
| Logic | calculations, formulas, thresholds, state transitions, AI decisions, validation, stacking, economy transactions |
| Integration | two or more systems interacting, events across system boundaries, save/load round trips, scene loading, persistence |
| Visual/Feel | animation, VFX, shaders, "feels responsive", timing, screen shake, particles, audio sync, feedback juice |
| UI | menus, HUD, buttons, screens, popups, inventory panels, tooltips |
| Config/Data | only tuning values, ScriptableObject or config data, no new logic |

Mixed stories: the primary type is the criteria with the highest implementation risk; note the secondary type. When
torn between Logic and Integration, pick Integration (it needs both kinds of test).
Show the classification table before phase 4.

## Phase 4: Generate the plan
Read `references/qa-plan-template.md` and fill it with the real story titles, criteria, GDD formulas and edge cases
from phase 2. No placeholder text and no invented test cases: a formula missing from the GDD is flagged, not guessed.
Unity specifics:
- EditMode test files go in the asmdef listed in `testAssemblies`, at
  `Assets/<Game>/Tests/EditMode/<System>/<StoryName>Tests.cs` (or the project's existing test layout). An empty
  `testAssemblies` is a blocking finding for any Logic story: studio-setup creates the asmdef.
- Integration tests: EditMode when the systems can be wired without a scene; otherwise a PlayMode test or a
  written playtest note at `<paths.evidenceDir>/<story-slug>/playtest.md`.
- Screenshots: `<paths.evidenceDir>/<story-slug>/NN-<what>.png`, captured with `unity-harness smoke` or
  unity-playmode-capture (which can force a state such as a win panel before capturing).
- Smoke scope: what `unity-harness smoke` must show for this sprint. Compare the components the sprint adds with
  `smoke.expectTypes` and `smoke.waitForScene`; propose additions (a config change, so the user approves it and
  studio-setup or the user edits it).
- Performance: stories that touch hot paths or rendering get a check against `targetFps` / `drawCallBudget` /
  `memoryBudgetMb` (unity-perf-profiling if installed, else the Profiler by hand).

## Phase 5: Write
Show the plan (or a summary when it is long), then ask with `AskUserQuestion`, multi-select:
- `Write the QA plan to <paths.qaDir>/qa-plan-<slug>-<date>.md`
- `Also back-fill each story's ## QA Test Cases (Recommended: studio-dev-story and studio-code-review use them)`
Write the plan exactly as shown. Back-fill: for each Logic and Integration story, replace the content of its
`## QA Test Cases` section with the Given/When/Then cases from the plan; Visual/Feel and UI stories get
Setup / Verify / Pass condition steps. No such section → add it before `## Test Evidence`. Do not touch other sections
or the Status line.

Then append one line to `paths.sessionState` (create the file if missing):
`QA plan <date>: <scope> → <plan path>`

Tell the user: share the plan before implementation; create the listed test files with each story (studio-dev-story
writes them, studio-story-done checks them); run `unity-harness full` once the sprint's stories are implemented, not
before.

Verdict: **COMPLETE** (plan written), **COMPLETE** (plan shown, not written) when the write was declined, or the
phase 1 `NOT ASSESSED — no stories in scope`.

## Rules
- Never write without the phase 5 approval.
- Playtest requirements are advisory: flag borderline Visual/Feel stories, the user decides.
- Ask only for the scope; everything else is presented, then approved once.
