---
name: studio-create-architecture
description: Write the master architecture document for a Unity studio project - layers, asmdef modules, data flow, ADRs still needed. Use for "create architecture", "architecture doc", "thiết kế kiến trúc", "kiến trúc tổng thể".
---

# Create architecture


Produces `paths.architectureDoc`: the whole-system blueprint that turns the approved GDDs into Unity layers,
asmdef modules, data flows and contracts. ADRs (studio-architecture-decision) record single decisions; this
document gives them their context. It must exist before epics and sprint planning at standard/full.

References, read when the phase starts and again after a compaction:
- `references/load-context.md`: phase 0 (engine context, design inputs, technical requirements baseline, ADR scan,
  knowledge-gap inventory, existing document).
- `references/sections.md`: phases 1-6 (layers, module ownership, data flow, API boundaries, ADR audit, missing ADRs).
- `references/write-and-handoff.md`: phases 7-8 (document template, write, TD-ARCHITECTURE + LP-FEASIBILITY
  sign-off, handoff).

## Settings
Run `unity-harness studio config` and `unity-harness config`. Keep `reviewMode`, `automation`, `workflow`,
`docsDensity`, `paths`, `language`, `unityVersion`, `renderPipeline`, `inputSystem`, `targetPlatforms`,
`targetFps`, `drawCallBudget`, `memoryBudgetMb`, and the harness `rules` and `testAssemblies`.

`workflow` sets scope:
- `full`: every section (layers, module ownership, data flow, API boundaries, full ADR audit).
- `standard`: layer map, module list with owners, initialisation order, and the critical (Foundation-layer) ADR
  list only. Skip the detailed API boundaries and the per-ADR quality table.
- `minimal`: not required. Run it only when the user asks, from `paths.brief`.

`docsDensity` sets depth per section: `terse` = diagrams and decision bullets; `balanced` = diagrams plus a
paragraph per layer choice; `thorough` = full prose with trade-offs and alternatives per layer.

## Arguments
- none / `full`: the whole walkthrough.
- `layers`, `data-flow`, `api-boundaries`, `adr-audit`: update only that section of an existing document (phase 1,
  3, 4 or 5). With no document yet, say so and offer the full walkthrough.

## Phase 0: Load context
Read `references/load-context.md` and follow it. It stops when `unityVersion` is unknown (send to studio-setup),
when the systems index is missing at standard/full (send to studio-map-systems), or when there is no design record
at all. It ends with the Technical Requirements Baseline and the knowledge-gap inventory on screen.

## Phases 1-6: Author the sections
Read `references/sections.md` and follow it. Each section is drafted, shown, and approved before the next. Record
each approved section's decisions in `paths.sessionState` as you go, so a crash loses nothing; the document itself
is written once, in phase 7.

Major decisions (ask with `ask_question` even in guided mode): layer assignment of a system, module (asmdef) boundaries,
the composition-root / DI approach, the event architecture, the save/load owner, anything that changes a GDD
requirement. Minor (state and continue in guided mode): section order, diagram style, naming of private helpers.

## Phases 7-8: Write, sign off, hand off
Read `references/write-and-handoff.md` and follow it.

## Rules
- Never make a binding architectural decision without the user. When they are unsure, give 2-4 options with
  trade-offs and a recommendation.
- Every requirement in the baseline ends the session covered by an architectural decision or listed as a required
  ADR. Report any GDD that contributed no requirement instead of letting it drop out.
- Every Unity API named in the document is checked against `unity-engine-reference` for the project's
  `unityVersion`; post-cutoff APIs are flagged with their risk level.
- Architecture follows the project's existing patterns when code already exists (read `Assets/<Game>/` asmdefs and
  bootstrap first); propose a migration only when the user asks for one.
- An existing document is updated, never replaced unasked.

## Next steps (name them, do not run them)
- studio-architecture-decision for each required ADR, Foundation layer first, then `accept` each one.
- studio-create-control-manifest once the required ADRs are Accepted.
- studio-architecture-review in a fresh session: builds `paths.traceability` and appends to `paths.trRegistry`.
- studio-gate-check pre-production when ADRs, manifest and review are done.
