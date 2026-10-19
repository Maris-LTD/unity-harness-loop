# Phases 1-2: load and extract

## Phase 1: Load

### 1a. Freshness check
Find the newest `<paths.architectureDir>/architecture-review-*.md`. If there is one, take its date and list what
changed since:
- `git log --since=<report date> --name-only --format= -- <paths.architectureDir> <paths.gddDir>`
- `git status --porcelain -- <paths.architectureDir> <paths.gddDir>` (uncommitted edits)

Ignore the review reports themselves. Then:
- Nothing changed: show the prior report's date and verdict and ask with `ask_question`: `Stand on the prior report
  (Recommended)` / `Re-run the full review anyway`. guided takes the recommendation and says so; autonomous logs it.
- Some GDDs or ADRs changed: name them and recommend `single-gdd <path>` for the changed systems; a new or deleted
  ADR warrants a full run. The user picks.
- No prior report, or the project is not a git repository: full review.

### 1b. Denominators
Count GDDs in `paths.gddDir` (exclude game-concept, game-pillars, systems-index, art-bible; `studio status` already
does) as N_gdd, and `adr-*.md` in `paths.architectureDir` as N_adr. Report both. Section searches below narrow what
is read, never what is in scope.

### 1c. Section loads (not whole files)
GDDs: search each GDD for the sections that carry technical requirements and read only those:
`## Detailed Rules` or `## Detailed Design` (same section, either name), `## Formulas`, `## Dependencies`,
`## Tuning Knobs`, `## Acceptance Criteria` (about 40 lines after each heading). Overview and Player Fantasy carry
none. A GDD that matches no section predates the template: read it whole and say so.
Read `paths.systemsIndex` whole when it exists (it is the list of systems).

ADRs: read the status line (`> **Status**: ...`, or a `## Status` section in older ADRs) and the sections
`## Decision`, `## GDD Requirements Addressed`, `## Engine Compatibility`, `## ADR Dependencies`,
`## Performance Implications`. Interpret against N_adr:

| Result | Meaning | Action |
|---|---|---|
| every ADR has the sections | normal | proceed |
| some ADRs lack sections | missing sections | record each as a structural gap; a missing `## GDD Requirements Addressed` is a traceability finding |
| no ADR has any scannable section, N_adr > 0 | malformed ADRs, not "no architecture" | "<N> ADRs found, none in the template format: rewrite them with game-adr". Do not report zero coverage |

Read a whole ADR only when judging a conflict needs its reasoning (phase 4).
Read `paths.architectureDoc` if it exists.

### 1d. Unity reference
From unity-reference read `references/VERSION.md`, `breaking-changes.md`, `deprecated-apis.md`, and only the
module files the in-scope ADRs name in their Engine Compatibility section (references consulted, post-cutoff APIs).
No ADR names a module → read none and note that phase 5 has no engine claims to cross-check.

### 1e. Project standards
From `unity-harness config`: `rules` (house rules). From `studio config`: performance budgets. The project's
CLAUDE.md / AGENTS.md for forbidden patterns and allowed libraries.

Report: "Loaded <N> GDDs, <M> ADRs, Unity <unityVersion> (<renderPipeline>)". `unityVersion` empty → Unity
compatibility is NOT ASSESSED; suggest game-setup.

## Phase 2: Extract technical requirements

### 2a. TR registry first
Read `paths.trRegistry` if it exists. Index entries by `id` and by normalized requirement text. For each requirement
extracted below:
1. Exact or near match to an entry of the same system → reuse its TR-ID. If only the wording changed (same intent),
   update the text later and add `revised: <date>`.
2. No match → next free `TR-<system>-NNN` for that system (highest existing + 1). `<system>` is the GDD file stem.
3. Partial match, intent unclear → ask with `ask_question`: "Does '<new text>' mean the same as `TR-<system>-NNN: <text>`?"
   Options: `Same requirement` (reuse) / `New requirement` (new ID).
Skip entries with `status: deprecated`: they were removed from the GDD on purpose.

Registry format (`paths.trRegistry`):

```yaml
version: 1
last_updated: <YYYY-MM-DD>
requirements:
  - id: TR-combat-001
    system: combat
    gdd: combat.md
    requirement: Hit detection resolves within one physics step
    domain: Physics
    layer: Core
    status: active
```

### 2b. What counts as a technical requirement
Any statement that implies an architectural decision:

| Category | Example → decision needed |
|---|---|
| Data structures | "Each unit has health, max health, status effects" → data schema, ScriptableObject or plain C# model |
| Performance | "200 units at 60 fps on mid-range Android" → frame budget, pooling, maybe Jobs/Burst |
| Engine capability | "Characters aim with IK" → Animation Rigging decision |
| Cross-system communication | "Damage notifies UI and audio" → event architecture |
| Persistence | "Progress survives app restarts" → save system |
| Threading / timing | "Pathfinding off the main thread" → Jobs or async decision |
| Platform | "Touch and gamepad" → Input System setup |
| Content delivery | "Levels downloaded after install" → Addressables decision |

Per GDD:

```
GDD: <file>   System: <name>
  TR-<system>-001: <requirement> → Domain: <Physics/Rendering/UI/Data/...>  Layer: <Foundation/Core/Feature/Presentation>
```

This is the requirements baseline: everything the architecture must cover.
