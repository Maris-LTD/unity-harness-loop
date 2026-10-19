---
name: game-manifest
description: Build the control manifest, a per-layer must-do / never-do rules sheet from Accepted ADRs and house rules. Use for "control manifest", "rules sheet", "tạo control manifest", "cập nhật manifest".
---

# Create control manifest


Writes `paths.controlManifest`: rules organised by layer (Foundation, Core, Feature, Presentation) plus global rules.
Every rule cites its source: an ADR, the harness `rules` block, a studio budget, the project's CLAUDE.md / AGENTS.md,
or a unity-reference file. Pipeline position: game-architecture → game-adr (×N,
accepted) → this skill → game-architecture-review → game-gate pre-production. Run it once the needed ADRs
are Accepted; re-run (`update`) whenever an ADR is accepted, revised or superseded.

Reference: `references/manifest-template.md` (the file format), read at phase 5.

## Settings
Run `unity-harness studio config` and `unity-harness config`. Keep `reviewMode`, `automation`, `paths`, `language`,
`unityVersion`, `renderPipeline`, `inputSystem`, `targetPlatforms`, `targetFps`, `drawCallBudget`,
`memoryBudgetMb`, and the harness `rules` (`maxLines`, `noComments`, `noDebugLog`, `compareTag`, `includePaths`).

## Phase 1: Load inputs
ADRs. Count `adr-*.md` in `paths.architectureDir` first (N). N = 0 → "No ADRs. Run game-adr
first." and stop. Read the status header of each (`> **Status**:` line) before reading any body:

| Result | Action |
|---|---|
| N with a Status line, some `Accepted` | The Accepted set is A. Name every excluded ADR and its status in the phase 4 preview. |
| N with a Status line, none `Accepted` | "N ADRs, none Accepted. A manifest from Proposed ADRs encodes decisions that may still change." Ask: proceed with Proposed / stop. Never write an empty manifest silently. |
| Some without a Status line | Malformed, not "not accepted". List them and send them to game-adr retrofit. Stop if none of the rest is Accepted. |

Other inputs:
- the harness `rules` block (house rules, apply to every layer);
- studio budgets (`targetFps`, `drawCallBudget`, `memoryBudgetMb`; 0 or empty means not set);
- naming and code conventions from the project's CLAUDE.md / AGENTS.md; if none are written, the conventions the
  existing code under `Assets/<Game>/` follows, marked as observed;
- unity-reference `references/VERSION.md`, `references/deprecated-apis.md`,
  `references/current-best-practices.md`;
- `Packages/manifest.json` (which packages the project actually uses) and the render pipeline, input system and
  2D/3D nature of the game (from `paths.architectureDoc` or the concept), to filter engine rules;
- existing `paths.controlManifest` (present → regeneration; read it before overwriting) and whether epics exist in
  `paths.epicsDir`.

Report: "Loaded <A> Accepted ADRs of <N>, Unity <unityVersion>."

## Phase 2: Extract rules per ADR
From each Accepted ADR read only `## Decision` (with `### Implementation Guidelines` and `### Key Interfaces` when
present), `## Alternatives Considered`, `## Performance Implications`, `## Engine Compatibility`. A section missing
in one ADR → note it and continue; missing in all of A → warn that that rule category will be empty. Read a full ADR
only when a scanned section points outside itself.
- Required patterns: every must / always / required statement in Decision, including Implementation Guidelines.
- Forbidden approaches: every rejected alternative becomes "never X, because Y"; plus explicit anti-patterns.
- Performance guardrails: ms per frame, memory, draw calls, allocations per frame.
- Engine API constraints: post-cutoff APIs needing verification, behaviour that differs from what the model assumes.
Classify each rule by layer: Foundation (bootstrap, composition root, scene flow, save/load, event bus, pooling),
Core (core loop, player systems, physics), Feature (secondary systems, AI), Presentation (UI, rendering, audio, VFX,
shaders). A rule spanning layers is copied into each. Quote ADR wording; do not paraphrase in ways that change it.

## Phase 3: Global rules
- House rules from the harness `rules` block, only those switched on: file length ≤ `maxLines`; no new comments
  (`noComments`); no new `Debug.Log*` (`noDebugLog`); `CompareTag` instead of `.tag ==` (`compareTag`). Source:
  `.unity-harness/config.json rules`. These override any engine best practice that suggests comments or logging.
- Budgets from `studio config`. Source: `studio config <key>`.
- Naming conventions with their source (CLAUDE.md / AGENTS.md, or "observed in <path>").
- Forbidden Unity APIs from `deprecated-apis.md`, filtered to what this project uses: drop or scope entries for a
  render pipeline, input system, 2D/3D mode or package the project does not use ("when using the Input System: …").
  Unsure whether one applies → scope it or leave it out and list it as unresolved. Do not copy the table wholesale.
- Required patterns from `current-best-practices.md` that apply to the project's version and packages.
- Studio protocol code rules that every layer follows: logic in plain C# testable from EditMode, tuning values as
  data (ScriptableObject or config asset), dependencies injected rather than new singletons. Source:
  studio protocol.

## Phase 4: Preview
```
## Control Manifest Preview
Unity: <unityVersion> (<renderPipeline>)
ADRs covered: <ids>
ADRs excluded: <ADR-NNNN (status), ... | None>
Rules:
  Foundation: <n> required, <m> forbidden, <p> guardrails
  Core: ...
  Feature: ...
  Presentation: ...
  Global: <h> house rules, <b> budgets, <c> naming, <f> forbidden APIs
Unresolved engine entries: <list | none>
```
Ask with `ask_question`: looks complete, run the review and write / add rules / remove rules / stop to review the ADRs.
Added rules must name a source; a rule without one is not added.

## Phase 4b: TD-MANIFEST
Per the studio protocol, only at `reviewMode: full`; otherwise note `TD-MANIFEST skipped (<mode>)`. Spawn
technical-director with `invoke_subagent` with the `technical-director` subagent, gate TD-MANIFEST. Context: the preview with the full rule list
and sources, the ADRs covered, `unityVersion`, and the rules sourced from house rules, budgets, conventions or
unity-reference. APPROVE → write. CONCERNS → ask: revise flagged rules / accept and proceed / discuss.
REJECT → do not write; fix the flagged rules and show the preview again. NOT ASSESSED → name the missing input;
supply it and re-run, or, if the user goes on without it, state `TD-MANIFEST: NOT ASSESSED - <input>` in the output.

## Phase 5: Write
Read `references/manifest-template.md`. Ask with `ask_question`: write `paths.controlManifest` / show the full draft first /
not yet. `Manifest Version` and `Last Updated` are today's date.

## Phase 6: Next steps
- No epics yet → game-epics, then game-tasks <epic>: stories embed the manifest version and the
  rules for their layer.
- Regeneration → list the rules that changed, especially new Forbidden entries; game-readiness flags stories
  written against an older `Manifest Version`.
- Update `paths.sessionState`: manifest version, ADRs covered, excluded ADRs.

Verdict: COMPLETE (written) or BLOCKED (user declined, or no usable ADRs).
