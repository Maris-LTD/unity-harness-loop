# Phase 3: Run the checks

## Tier and qaLevel
- Run the loaded gate's checklist, then apply its reduction for `workflow`: **drop** = not checked at this tier;
  **→ recommended** = absent is a CONCERNS line, never a blocker; items not named keep their baseline status.
  Reductions only relax.
- `qaLevel` relaxes per-story test evidence on its own axis: at `minimal` the test-file and unit-test items are not
  required at any workflow tier. It never relaxes:
  - the screenshots UI stories need, or the screenshots plus visual sign-off Visual/Feel stories need;
  - the build-health run (`unity-harness all` + `smoke`) where the gate asks for it: that is build health, not story
    evidence.
- **A gate with nothing left to check may not PASS.** After the reduction and the qaLevel relaxation, count the
  required items. Zero → verdict NOT ASSESSED, naming both reducers ("production → polish at workflow minimal +
  qaLevel minimal leaves no required artifact; this gate verified nothing"). The one exception is a gate its file
  marks "not applicable" at this tier (systems-design → technical-setup at minimal): PASS with that file's note.
- Performance budgets (`targetFps`, `drawCallBudget`, `memoryBudgetMb`) are checked at every tier where the gate
  names them; a breach is a CONCERNS line, never a blocker. A budget of 0 is unset: say so, it is not a pass.

## Artifact checks
- Existence and counts come from `unity-harness studio status --json`: `design.brief`, `design.concept`,
  `design.pillars`, `design.systemsIndex`, `design.artBible`, `design.gdds`, `architecture.doc`, `architecture.adrs`,
  `architecture.adrsByStatus`, `architecture.controlManifest`, `architecture.trRegistry`, `epics`, `stories`,
  `currentSprint`, `evidenceFiles`. For paths it does not report (`paths.traceability`, review reports in
  `paths.gddReviewsDir` and `paths.architectureDir`, QA plans in `paths.qaDir`), search the folder.
- **Existence is not adequacy.** For every artifact the verdict turns on, spot-read it and confirm real content, not
  a template skeleton or `[placeholder]` text. Do not spot-read artifacts the verdict does not turn on.
- Present but empty, unreadable or still placeholders → that item is NOT ASSESSED, not PASS.

## GDD section scan (gates that validate GDDs)
For each MVP GDD in `paths.gddDir` (MVP tier from the systems index), list its `## ` headings. Required at full: all
8 (Overview, Player Fantasy, Detailed Rules, Formulas, Edge Cases, Dependencies, Tuning Knobs, Acceptance Criteria).
Required at standard: Overview, Detailed Rules, Edge Cases, Dependencies, Acceptance Criteria, plus Formulas when the
system defines numeric rules (rates, curves, thresholds, costs). `## Detailed Design` satisfies Detailed Rules. A
missing required section blocks; a missing optional one is advisory. A heading with no content under it fails if
the verdict turns on it.

## ADR checks (technical-setup and later)
- Status comes from each ADR's `> **Status**:` line (`architecture.adrsByStatus`). ADRs carry no Layer field:
  take Foundation/Core from the architecture doc's Layer Map / Module Ownership (the module or system the ADR
  governs), or map the ADR's Engine Compatibility `Domain` through that layer map. No architecture doc → layer
  unknown: treat the ADR as Foundation (fail safe toward requiring it).
- Circular dependencies: read each ADR's ADR Dependencies / Depends On section, list the edges `adr-A -> adr-B`, and
  look for a cycle. A cycle → FAIL ("Circular ADR dependency: <nodes>. Neither can reach Accepted while the cycle
  exists. Remove one Depends On edge."). Several ADRs without a dependencies section → CONCERNS: the acyclic result
  is only as good as those sections.
- Engine: compare each ADR's Engine Compatibility version with `unityVersion`; grep the APIs it names against
  unity-reference `deprecated-apis.md`.

## Build health (production and later, and wherever a gate asks for tests)
Run, one at a time:
1. `unity-harness all` (rules + compile + EditMode tests).
2. `unity-harness smoke` when the gate asks for build health or playability. Warn first that it takes over Play mode.
   Open the capture (`smoke.capturePath`) and describe what is on screen.
Outcomes:
- Exit `0`: pass. Note the test totals; `0/0` tests right after a compile means the domain was reloading: rerun once.
- Exit `1`: each failing test or check is a blocker where the gate requires it, CONCERNS where it only recommends it.
- Exit `2` (Editor not ready): the check could not run → NOT ASSESSED, and ask the user to open the Editor. Never read
  it as a pass.
- `testAssemblies` empty while the tier requires tests → NOT ASSESSED ("no EditMode test assembly configured; run
  game-setup").
Check the stories too: Logic stories at qaLevel standard/full should have tests in the `testAssemblies` asmdefs;
UI and Visual/Feel stories marked Complete should have screenshots under `paths.evidenceDir/<story-slug>/`
(`evidenceFiles` counts them).

## Text externalisation (release, and polish when asked)
Search `Assets/<Game>/` C# for player-facing string literals assigned to UI text (`.text = "`, `SetText("`, label
fields) outside localization tables or data assets. List hits with file and line. Code root unknown → NOT ASSESSED.

## Cross-reference checks
- Systems in the systems index / brief against code folders and Complete stories.
- Systems named in the architecture doc have a code area or a story.
- Sprint plans reference story files that exist.
