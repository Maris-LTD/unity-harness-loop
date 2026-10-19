---
name: studio-code-review
description: Architectural review of Unity C# changes against ADRs, the control manifest, asmdef boundaries and story criteria, on top of unity-reviewer and the harness. Use for "code review", "review story này", "kiểm tra code trước khi đóng story".
---

# Code review


Read-only: changes no project file; its one write is the review line in Phase 8. Every agent it spawns reviews
only, and the working tree is fingerprinted around them. Argument: file paths and/or folders, optionally followed by a story path
(`<paths.epicsDir>/<epic>/story-NNN-<slug>.md`). No files given → the changed C# in the working tree
(`git diff HEAD -M --name-only -- '*.cs'` plus untracked `.cs`), limited to `rules.includePaths`.

## Settings
Run `unity-harness studio config` and `unity-harness config`. Keep `reviewMode`, `automation`, `workflow`,
`unityVersion`, `paths`, `rules`, `testAssemblies`.

## Phase 0: Inputs exist?
List each input as FOUND or ABSENT: the target files, the story (if given), the ADRs it references,
`paths.controlManifest`, `paths.architectureDoc`. A section whose input is ABSENT is `NOT ASSESSED — NO DATA`; never
infer it from a neighbouring file. No target files at all (empty diff, wrong path) → stop with the whole verdict
`NOT ASSESSED — no code to review` and say what was searched. A scan that matched nothing because nothing exists has
verified nothing.

## Phase 1: Load
Read the target files in full and the project's CLAUDE.md / AGENTS.md. With a story: its Type, Acceptance Criteria,
QA Test Cases, Context (GDD, ADR, TR-IDs) and Implementation Notes.

## Phase 2: Harness and rule review (run first, do not repeat their checks)
First run `unity-harness fingerprint save code-review`. Tell every agent spawned from here on: review only, never
create, edit, move or delete a file, report findings instead.
Then in parallel:
- `unity-harness all --files <comma-separated targets>` (rules on these files, compile, EditMode tests). Exit 2 →
  compile and tests are `NOT ASSESSED — Editor not ready`; ask the user to open the Editor, do not loop.
- Spawn the unity-reviewer with `invoke_subagent` with the `unity-reviewer` subagent, limited to the target files. It covers correctness
  (null refs, lifecycle order, unsubscribes, leaks, state reset), single responsibility, file length,
  `[SerializeField]` encapsulation, no LINQ / string concatenation / GetComponent / Find / allocations in
  Update-family methods, CompareTag, and the switched-on house rules (no new comments, no new Debug.Log).
The later phases consume these results; do not re-check those items.

## Phase 3: ADR compliance
Find ADR references, in order: the story's Context, then `git log --oneline -- <file>` messages (`ADR-NNNN`).
None → `NO ADRS FOUND` (not NOT ASSESSED; it does not block approval) and note "pass the story path for an ADR
check". For each ADR, read only its status line, `## Decision` and `## Consequences` (find the headings first, read
the spans between them). A referenced ADR that is missing or unreadable → `NOT ASSESSED — <ADR> could not be read`.
A referenced ADR that is Proposed, Deprecated or Superseded → flag it (the code follows an unaccepted decision).
Classify deviations:
- **ARCHITECTURAL VIOLATION** (blocking): uses a pattern the ADR rejects.
- **ADR DRIFT** (warning): diverges from the chosen approach without a forbidden pattern.
- **MINOR DEVIATION** (info): small difference that does not change the architecture.

## Phase 4: Control manifest and boundaries
If `paths.controlManifest` exists, take the rules for the files' layer (Foundation / Core / Feature / Presentation)
and check each Required, Forbidden and Guardrail item against the code; a Forbidden pattern is a violation.
Boundaries, from `paths.architectureDoc` when present, else from the codebase's existing pattern:
- dependency direction: Presentation → Feature → Core → Foundation, never reverse; check asmdef `references` of the
  touched assemblies for new upward or circular references;
- UI does not own game state; views read models or listen to events;
- cross-system communication through the project's event / service pattern, not new direct references or singletons;
- consistent with patterns already in the codebase (find a sibling system and compare).

## Phase 5: Testability and data
- Logic sits in plain C# classes an EditMode test can construct; MonoBehaviours are thin adapters.
- Dependencies injected (constructor, serialized reference, or the project's service locator / DI), no new static
  game state.
- Gameplay values come from ScriptableObjects or config assets, not literals in logic.
- Systems depend on interfaces where the architecture says so.
- Time-based logic uses `Time.deltaTime` / `fixedDeltaTime` or an injected clock (frame-rate independence, testable).
- Resources released: pooled objects returned, Addressables handles released, async operations cancelled on disable.
- Methods above ~40 lines or deeply nested branches: suggest a split (unity-reviewer judges file length).

## Phase 6: Specialist and QA second opinions (parallel)
Spawn every applicable reviewer at once, each the same way as `invoke_subagent` with the `unity-specialist` subagent with its agent id:
- `.shader`, `.hlsl`, `.shadergraph`, VFX → unity-shader-specialist;
- uGUI canvases/prefabs or UI Toolkit `.uxml` / `.uss` code → unity-ui-specialist;
- Addressables loading code → unity-addressables-specialist;
- Entities / Jobs / Burst → unity-dots-specialist;
- scene structure, lifecycle, cross-cutting or unclear → unity-specialist.
Pass the files, `unityVersion`, `renderPipeline` and the phase 2 findings so they do not repeat them.
With a Logic or Integration story, also spawn the qa-tester (`invoke_subagent` with the `qa-tester` subagent) with the files, the story's
QA Test Cases and Acceptance Criteria: are the test seams exposed, does each test case map to a reachable code path,
is any criterion untestable as written (hardcoded values, no injection seam), are there new edge cases or side effects
without a test? For Visual/Feel and UI stories: can the manual check reach the states it needs in Play mode?

Verify every finding before reporting it: file and line, the quoted code or the concrete input that triggers it, and
`VERIFIED` (you checked) or `UNVERIFIED — <agent> claim`. A claim you cannot verify is reported as unverified or
dropped, never promoted to a defect because it sounds confident.

## Phase 7: Gate
- `reviewMode` full: spawn the lead-programmer with `invoke_subagent` with the `lead-programmer` subagent, gate LP-CODE-REVIEW, passing the file
  paths, the story (acceptance criteria), the design section, the governing ADR (or "none") and the unity-reviewer
  findings. Apply its verdict per the studio protocol.
- solo / lean: note `LP-CODE-REVIEW skipped (<mode>)`; the review below stands on its own.

Then run `unity-harness fingerprint compare code-review`. Exit 1 lists the changed paths. Changes only to `.meta`,
`ProjectSettings/` or `Packages/packages-lock.json` are Unity noise: name them under Suggestions. Any other change
means a spawned agent edited the project: the verdict is NOT ASSESSED, list the paths, and ask the user whether to keep
or revert them; never revert them yourself.

## Phase 8: Output

```
## Code review: <files or system>
### Harness: rules <PASS/FAIL>, compile <PASS/FAIL/NOT ASSESSED>, tests <passed/total or NOT ASSESSED>
### unity-reviewer: <n blocker / n major / n minor, or none>
### Acceptance criteria: <N/A — no story / each AC: covered by <file:line> | not implemented | untestable>
### ADR compliance: <NOT ASSESSED / NO ADRS FOUND / COMPLIANT / DRIFT / VIOLATION>
### Control manifest and boundaries: <NOT ASSESSED / CLEAN / ISSUES>
### Testability and data: <CLEAN / GAPS / BLOCKING>
### Specialist findings: <CLEAN / ISSUES (each VERIFIED or UNVERIFIED)>
### Gate: <LP-CODE-REVIEW verdict | skipped (mode)>
### Positive observations (always include)
### Required changes (every blocker, ARCHITECTURAL VIOLATION and failing harness check)
### Suggestions
### Verdict: <NOT ASSESSED / APPROVED / APPROVED WITH SUGGESTIONS / CHANGES REQUIRED>
```

Verdict, first match wins:
- **CHANGES REQUIRED**: anything under Required changes, or LP-CODE-REVIEW REJECT.
- **NOT ASSESSED**: nothing to review, compile or tests did not run, a referenced ADR could not be read, a
  specialist that applied could not be spawned, or a spawned agent changed project files; name which. It ranks below CHANGES REQUIRED and above both approvals.
- **APPROVED WITH SUGGESTIONS**: only suggestions (or LP-CODE-REVIEW CONCERNS the user accepted).
- **APPROVED**: nothing required, nothing suggested.

When the review was for a story, record it so studio-story-done can reuse it: append one line under the checkpoint
block of `paths.sessionState` (the only write this skill makes; no ask needed):
`Code review: <story path> | <verdict> | LP-CODE-REVIEW <verdict or skipped (mode)> | <YYYY-MM-DD> | <file>=<git hash-object>, ...`
listing every reviewed file with its `git hash-object` at review time.

## Phase 9: Next step
Ask with `ask_question`, repeating the verdict word for word:
- APPROVED: `Close the story (studio-story-done)` / `Stop here`.
- APPROVED WITH SUGGESTIONS: `Apply the suggestions, then studio-story-done` / `studio-story-done now, suggestions
  noted` / `Stop here`.
- CHANGES REQUIRED: `Fix the issues and run studio-code-review again` / `studio-story-done with noted exceptions` /
  `Stop here`.
- NOT ASSESSED: `Fix what stopped the review (open the Editor, point me at the code, fix the ADR reference), then run
  again` / `Stop here`.

An ARCHITECTURAL VIOLATION against an existing ADR: fix the code to comply, or, if the design legitimately changed,
revise that ADR with studio-architecture-decision (never write a competing one). No ADR for the violated pattern:
document the right approach with studio-architecture-decision before fixing the code.
