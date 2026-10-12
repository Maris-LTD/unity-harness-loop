# Story readiness checklist and output formats

Contents: Design Completeness · Architecture Completeness · Scope Clarity · Open Questions · Asset References ·
Definition of Done · Single-story output · Aggregate output.

Every item passes, fails, or is N/A with a stated reason. Tier rules from SKILL.md decide which failures block.

## Design Completeness
- **Design requirement referenced**: the story names a GDD under `paths.gddDir` and quotes or links a specific
  rule / criterion from it, not just the filename. At `minimal`, `paths.brief` stands in: the story names the MVP
  feature and the Player goal & fail state it traces to. When the story or its epic says `GDD: none yet`,
  `paths.concept` (standard/full) or `paths.brief` (minimal) is the design source: the story quotes the concept
  section (core mechanic, MVP item) it traces to, and the check passes on that.
- **Self-contained**: the acceptance criteria are understandable without opening the GDD.
- **Testable criteria**: each criterion is an observable condition. Bad: "Implement the jump." Good: "Jump reaches
  5 units within 0.3 s while the button is held."
- **No judgment calls** (auto-pass for `Type: Visual/Feel`): Logic, Integration, UI and Config/Data criteria such as
  "feels responsive" or "looks good" fail. For Visual/Feel, each subjective criterion must be paired with an
  evidence requirement, e.g. "evidence: screenshot `<paths.evidenceDir>/<story-slug>/01-<state>.png` + visual
  sign-off in studio-story-done"; purely subjective with no evidence = NEEDS WORK.

## Architecture Completeness
Optional in this plugin: when the project has no ADRs, TR registry or manifest, the items that depend on them
auto-pass. When they exist:
- **ADR referenced or N/A stated**: the story names at least one ADR, or says "No ADR applies - <reason>". A field
  reading `N/A (...)` counts as stated.
- **Referenced ADR is Accepted** (this one blocks at every tier):
  - Accepted → pass.
  - Proposed → BLOCKED: `BLOCKED: ADR-NNNN is Proposed - wait for acceptance before implementing.`
  - file missing → BLOCKED: referenced ADR is missing.
  - Deprecated / Superseded by ADR-XXXX → BLOCKED: point the story's ADR field at the successor (studio-create-stories
    never rewrites an existing story).
  - file exists, no readable Status line (`> **Status**:` or `## Status`) → NOT ASSESSED for this check; name the file.
- **TR-ID valid** (only if the story has one and `paths.trRegistry` exists): active → pass; deprecated / superseded → NEEDS
  WORK (point to the current ID); not found → NEEDS WORK.
- **Manifest version current** (only if both the story field and `paths.controlManifest` exist): older → NEEDS WORK.
- **Engine notes present**: for any Unity API that changed in Unity 6 or is new to the project (check
  unity-engine-reference), the story carries implementation notes or a verification requirement; or
  "N/A - no engine API involved" for pure data/config work.
- **Layer rules noted**: manifest rules for the story's layer referenced, or "N/A - no manifest".

## Scope Clarity
- **Estimate present**: hours, points or t-shirt size.
- **Out of scope stated**: an Out of Scope section or unambiguous wording of what the story does not include.
- **Dependencies listed**: story IDs that must be Complete first, or an explicit "None".

## Open Questions
- **No unresolved markers**: no `UNRESOLVED`, `TBD`, `TODO`, `?` placeholder in any criterion, note or rule.
  An UNRESOLVED design question with no owner → BLOCKED.
- **Dependencies exist**: each dependency file exists and has a Status line. Missing or unstatused → BLOCKED.

## Asset References
- Search the story text for asset paths (`Assets/...`, or `.png .jpg .psd .svg .wav .ogg .mp3 .fbx .glb .prefab
  .asset .mat .unity .anim .controller`). Check each exists.
  - any missing → NEEDS WORK: remove it, add a placeholder, or depend on an asset story;
  - all exist → "Referenced assets verified: N found";
  - none → "No asset references - skipped" (auto-pass).
  Existence only, never format or content.

## Definition of Done
- **Minimum testable criteria by `storyGranularity`**: coarse: Logic / Integration ≥ 3, Visual/Feel and UI ≥ 2,
  Config/Data ≥ 1; balanced: Logic / Integration ≥ 2, others ≥ 1; fine: ≥ 1 for every type.
- **Performance note**: a story touching the gameplay loop, rendering or physics carries a budget (frame time, draw
  calls, GC alloc; `targetFps`, `drawCallBudget` from studio config) or "no performance impact expected - <reason>".
- **Type declared**: `> **Type**: Logic | Integration | Visual/Feel | UI | Config/Data` in the header.
  Fix: add it; without it studio-story-done cannot enforce evidence.
- **Test evidence location clear**: a `## Test Evidence` section states where evidence goes:
  - Logic / Integration: the EditMode test file path inside an assembly listed in `testAssemblies`
    (`unity-harness config`), e.g. `Assets/<Game>/Tests/EditMode/<System>/<Story>Tests.cs`;
  - UI: a screenshot of each screen touched under `<paths.evidenceDir>/<story-slug>/`;
  - Visual/Feel: that plus the user's visual sign-off, asked in studio-story-done;
  - Config/Data: `unity-harness smoke` passes.
  Gate level per the protocol evidence table: blocking for Logic/Integration at qaLevel standard/full (auto-pass at
  minimal), blocking for UI and Visual/Feel at every level, advisory for Config/Data. A missing section at a
  blocking level = NEEDS WORK; at an advisory level it is listed but does not downgrade READY.

## Single-story output
```
## Story Readiness: <story title>
File: <path>
Verdict: READY | NEEDS WORK | BLOCKED | NOT ASSESSED

### Passing Checks (N/total)
Design Completeness: <items>
Architecture Completeness: <items, or "N/A - <reason>">
Scope Clarity: <items>
Open Questions: <items>
Asset References: <items, or "no asset references">
Definition of Done: <items>

### Gaps
- <item>: <what is missing or wrong>
  Fix: <exact text that would resolve it>

### Blockers (if BLOCKED)
- <what blocks>: <story ID or design question to resolve first>
```

## Aggregate output
```
## Story Readiness Summary - <scope> - <date>

Ready:        N
Needs Work:   N
Blocked:      N
Not Assessed: N

### Ready Stories
- <title> (<path>)

### Needs Work
- <title>: <primary gap, one line>

### Blocked Stories
- <title>: blocked by <story ID / design question>

### Not Assessed
- <title>: <what could not be read>
```
Then the full single-story block for every non-ready story.
