---
name: studio-architecture-review
description: Review the whole Unity architecture - GDD requirement to ADR traceability, ADR conflicts, Unity version checks - with a PASS/FAIL verdict. Use for "architecture review", "review ADRs", "rà soát kiến trúc", "ma trận truy vết".
---

# Architecture review


Validates that the full set of architectural decisions covers every design requirement, is internally consistent,
and targets the project's Unity version. Read-mostly: it writes the review report, the TR registry and the
traceability index, each only after approval.

Modes (argument):
- none / `full`: all phases.
- `coverage`: traceability only (phases 1-3, 7-8).
- `consistency`: cross-ADR conflicts only (phases 1, 4, 7).
- `engine`: Unity compatibility only (phases 1, 5, 7); GDDs are not needed.
- `single-gdd <path>`: coverage for one GDD and the ADRs that name its system.
- `rtm`: full matrix extended with story and EditMode test columns (production, once stories exist).

References, read when the phase starts and again after a compaction:
- `references/load-and-extract.md`: phases 1-2 (freshness check, section loads, TR registry, requirement extraction).
- `references/traceability.md`: phases 3 and 3b (coverage statuses, matrix, story and test linkage).
- `references/conflicts-and-engine.md`: phases 4-6 (conflicts, dependency order, Unity audit, GDD revision flags,
  architecture document coverage).
- `references/verdict-and-write.md`: phases 7-9 (findings document, verdict rules, writes, checkpoint, hand-off).

## Settings
Run `unity-harness studio config` and `unity-harness studio status`. Keep `workflow`, `automation`, `unityVersion`,
`renderPipeline`, `inputSystem`, `targetFps`, `drawCallBudget`, `memoryBudgetMb`, `paths`.

`workflow`:
- `full`: every GDD in `paths.gddDir` against every ADR.
- `standard`: `paths.architectureDoc` plus the critical ADRs (Foundation layer: bootstrap and scene flow, events,
  save/load, services, data loading); other ADRs are read for conflicts only.
- `minimal`: not applicable. Say "Architecture review is not required at rigor minimal: the brief is the design
  record", offer to run it anyway, and stop unless the user wants it.

`studio status` gives the denominators: `design.gdds`, `architecture.adrs`, `architecture.adrsByStatus`,
`architecture.doc`, `architecture.trRegistry`. No ADRs at all → the verdict is NOT ASSESSED (see report rules);
still produce the requirement list so the user sees what the ADRs must cover, and point to
studio-architecture-decision.

## Phase 1: Load
Read `references/load-and-extract.md` and follow phase 1.

## Phase 2: Extract technical requirements
Follow phase 2 of the same file. Result: the requirements baseline with stable TR-IDs.

## Phase 3: Traceability matrix
Read `references/traceability.md` and follow it. Phase 3b runs only in `rtm` mode, or in `full` mode when stories
exist (`studio status` stories.total > 0).

## Phases 4-6: Conflicts, Unity compatibility, architecture document
Read `references/conflicts-and-engine.md` and follow it. Phase 5 spawns the unity-specialist for a second opinion.

## Phases 7-9: Verdict, write, hand-off
Read `references/verdict-and-write.md` and follow it.

## Rules
- Read silently; show the matrix before asking to write anything.
- An ambiguous requirement is a question, not a guess: "Is <X> a technical requirement or a design preference?"
  (ask with `ask_question`).
- Show every file's content (or its diff) before the write approval; one approval covers the listed set.
- The verdict is advisory: the user decides whether to continue on CONCERNS or FAIL.
- A spawned agent that returns BLOCKED or fails: say so at once, do not continue past what depends on it, and still
  write a partial report naming the part that was not reviewed.
- An absent section is never an absent document, and zero matches is never full coverage.
