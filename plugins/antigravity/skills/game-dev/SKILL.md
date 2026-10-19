---
name: game-dev
description: Implement one Unity studio story end to end - code, EditMode test and harness verification - without closing it. Use for "implement story", "dev story", "làm story tiếp theo", "code story này", "tiếp tục story đang dở".
---

# Dev story


Bridges planning and code: reads one story in full, assembles the context a programmer needs, routes it to the
right agent, drives implementation to a verified result, and leaves the story ready for game-done.

The loop per story:
- `minimal`: game-dev → game-done (no readiness check, no sprint; story-done names the next story).
- `standard` / `full`: game-readiness → game-dev → game-code-review → game-done
  (story-done also runs unity-reviewer as its LP-CODE-REVIEW input).

References, read when the phase starts and again after a compaction:
- `references/load-context.md`: phase 2 (story fields, ADR and dependency gates, In Progress).
- `references/implement.md`: phases 3-4 (routing table, agent brief, Antigravity implementation path).
- `references/collect.md`: phases 5-6 (verification, evidence, summary, session checkpoint).

## Settings
Run `unity-harness studio config` and `unity-harness config`. Keep:
- `automation`, `workflow`, `storyGranularity`, `qaLevel`, `paths`, `language`, `unityVersion`, budgets;
- from the harness config: `testAssemblies`, `rules`, `smoke`.

`storyGranularity` sets the expected cycle (coarse: multi-day, give the agent broad context; balanced: 1-2 days;
fine: hours, tight context). It does not change any gate. `qaLevel` decides whether the brief carries a test
requirement (minimal: no tests for Logic/Integration; standard: per-type requirement; full: also a coverage target).

## Phase 1: Find the story
- A path was given → read it.
- No argument → read `paths.sessionState`; if it names a current story, confirm "Continuing <title> - correct?".
  Otherwise run `unity-harness studio status`, list the In Progress and Ready stories, and ask with `ask_question`.

## Phase 2: Load context
Read `references/load-context.md` and follow it. It ends with the story marked In Progress, or BLOCKED with a
reason (then stop: no agent is spawned).

## Phases 3-4: Route and implement
Read `references/implement.md` and follow it. Config/Data stories skip routing: edit the data asset directly after
showing from → to values.

## Phases 5-6: Verify, collect, checkpoint
Read `references/collect.md` and follow it. Never print "Implementation Complete" over unverified or broken code.

## Rules that hold in every phase
- **Load before implementing.** Do not start coding until the story, dependencies and design context are loaded.
- **The ADR is the law** when one governs the story. If its guideline conflicts with what seems better, follow it
  and flag the conflict in the summary.
- **Stay in scope.** Out of Scope is a contract. If a criterion needs a file outside it, stop and ask: proceed, or
  create a separate story?
- **Tuning values are data** (ScriptableObject / config asset), never literals in logic.
- **Logic stories are test-first** at qaLevel standard/full: the EditMode test exists before the story is called
  implemented, one or more test methods per acceptance criterion. At qaLevel minimal tests are waived for
  Logic/Integration; say so in the summary.
- **The look is observed, never deferred.** Visual/Feel and UI stories get a retained screenshot in this skill
  (phase 5). Only the feel half of a Visual/Feel criterion (timing, weight, responsiveness) is DEFERRED to a
  playtest.
- **Ask before structural decisions** the story or ADR does not cover: "The ADR does not say how to handle <case>.
  My plan is <X>. Proceed?" (major decision).
- **Project rules win**: `unity-harness config` rules (no new comments, no new `Debug.Log*`, `CompareTag`, max file
  length) and the project's CLAUDE.md / AGENTS.md override any generic advice, including doc comments.

## Writes this skill makes itself
Everything else (code, tests) is written by the implementing agent or workflow.
- The story's `Status` / `Last Updated` (phase 2, one ask in collaborative mode).
- A dependency's `Status: Complete` when the user says it is done but unmarked (phase 2, asked).
- ADR-refresh edits to the story (phase 2, option chosen = the ask).
- A Config/Data story's data asset (asked with the from → to diff).
- Evidence screenshots copied into `paths.evidenceDir` (phase 5).
- `paths.sessionState` checkpoint (no ask).

## Errors and blockers
- An agent or workflow that returns BLOCKED, errors, or stops early: surface it at once, do not advance past what it
  blocks, and produce a partial report.
- A named output that is not on disk is a failed step, however fluent the report reads. Resume the agent naming
  the unmet item.
- Common blockers: story or design file missing → the skill that creates it (game-tasks,
  game-concept); referenced ADR Proposed → accept it first; scope too large → split via game-tasks;
  ADR and story conflict → surface it, do not guess.

## Ending
Always end with the summary from `references/collect.md` and the line:
`Next: game-done <story-path>` (at standard/full, after any reviewer findings are fixed).
Do not mark the story Complete here; closing is game-done's job.
