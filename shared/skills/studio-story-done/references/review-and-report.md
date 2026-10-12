# studio-story-done - Phases 4-6: deviations, gates, report

Contents: deviation checks · QL-TEST-COVERAGE · LP-CODE-REVIEW · completion report · verdicts.

## Phase 4: Deviations
Tier (`workflow`):
- `full`: run checks 1-5.
- `standard`: check 1 against the GDD's required sections; check 3 only when a Foundation-layer (critical) ADR
  governs the story.
- `minimal`: acceptance-criteria only: skip checks 1 and 3; checks 2, 4 and 5 still run.
This tier governs only the deviation checks; evidence gates follow qaLevel.

1. **Design rules**: using the current requirement text (registry or GDD section), search the changed files for the
   names, data structures and rules it requires; flag what is missing or contradicted.
2. **Manifest staleness** (only if story field and manifest both exist): story older → advisory "Story was written
   against manifest v<story>; current is v<current>. Run studio-story-readiness." A `Manifest-Note` on the story is
   carried into Deviations without re-checking.
3. **ADR constraints**: from the `## Decision` held in phase 2 (no re-read); search for patterns the ADR or manifest
   forbids.
4. **Hardcoded values**: numeric literals in gameplay logic that belong in data.
5. **Scope**: files changed outside the story's files to create / modify (`git diff --name-only` plus untracked
   files, against the story's list).
Classify each finding:
- BLOCKING: contradicts the GDD or ADR; must be fixed before Complete;
- ADVISORY: drifts but is functionally equivalent; documented, user decides;
- OUT OF SCOPE: extra files touched; may be valid or scope creep.

## Phase 4b: QL-TEST-COVERAGE
Skip at qaLevel minimal ("QL-TEST-COVERAGE skipped - qaLevel minimal"), for Config/Data stories, and unless
`reviewMode` is `full` ("skipped (solo|lean)").
Spawn the qa-lead with {{spawn qa-lead}}, gate QL-TEST-COVERAGE, passing:
- story path and Type;
- test files found and their `unity-harness tests` result (or "none found");
- the story's `## QA Test Cases` and `## Acceptance Criteria`;
- the GDD's acceptance criteria and Edge Cases for the system, or "no GDD for this system" (at minimal the story's
  criteria are the spec; an absent GDD is information, not a missing input).
Verdicts:
- ADEQUATE → continue;
- GAPS → ADVISORY: "QA lead found coverage gaps: <list>. Story can complete; address them in a follow-up story.";
- INADEQUATE → BLOCKING: "critical logic is untested: <gaps>";
- NOT ASSESSED → name the missing input; supply it and re-run, or carry it (verdict at best NOT ASSESSED).

## Phase 5: LP-CODE-REVIEW
No implementation files → skip: "LP-CODE-REVIEW skipped - no implementation files".
First run the review yourself: spawn {{spawn unity-reviewer}} on the story's files (read-only; it checks the
project's Unity rules and correctness). Then by `reviewMode`:
- `solo`: report the unity-reviewer findings, no gate. Blocker findings are BLOCKING deviations; major / minor are
  advisory.
- `lean`: same as solo, and note "LP-CODE-REVIEW skipped (lean)". Record in the Completion Notes whether the user had
  the findings fixed.
- `full`: spawn the lead-programmer with {{spawn lead-programmer}}, gate LP-CODE-REVIEW, passing: implementation file
  paths, story path, the relevant GDD section (or brief feature), the governing ADR (or "none"), and the
  unity-reviewer findings.
  - APPROVE → continue;
  - CONCERNS → show them; ask with {{ask}}: revise the flagged issues / accept and proceed / discuss;
  - REJECT → no COMPLETE verdict until resolved;
  - NOT ASSESSED → name the missing input; supply it and re-run, or carry it.

## Phase 6: Completion report
Present before writing anything:
```
## Story Done: <story name>
Story: <path>
Date: <today>

### Harness
unity-harness all: rules <PASS/FAIL> | compile <PASS/FAIL> | tests <Assembly passed/total, ...>
Smoke / captures: <PASS + retained paths | n/a | NOT VERIFIED - reason>

### Acceptance Criteria: X/Y passing
- [x] <criterion> - auto-verified (<TestClass.Method> passed)
- [x] <criterion> - confirmed by the user
- [ ] <criterion> - FAILS: <reason>
- [?] <criterion> - DEFERRED: requires playtest

### Test-Criterion Traceability
<table from phase 3>

### Test Evidence
Story Type: <type | not declared>
Required: <EditMode test | test or playtest note | screenshot + sign-off | screenshot of each screen | smoke pass>
Found: <YES - path | NO - BLOCKING | NO - ADVISORY | waived at qaLevel minimal>

### Review
unity-reviewer: <n blocker / n major / n minor, or none>
Gates: <QL-TEST-COVERAGE: verdict | skipped (reason)>, <LP-CODE-REVIEW: verdict | skipped (reason)>

### Deviations
NONE | BLOCKING: <what> - <GDD/ADR reference> | ADVISORY: <what>

### Scope
All changes within stated scope | Extra files: <list> - <valid or scope creep>

### Verdict: COMPLETE | COMPLETE WITH NOTES | NOT ASSESSED | BLOCKED
```

## Verdicts
- **COMPLETE**: every criterion passes, harness green, no blocking deviation or evidence gap.
- **COMPLETE WITH NOTES**: every criterion passes or is DEFERRED, with advisory deviations, advisory gaps or deferred
  items listed so none is lost.
- **NOT ASSESSED**: a criterion could not be evaluated at all: it names no observable outcome; the user answered
  `Not tested yet`; a gate returned NOT ASSESSED and the input was not supplied; evidence exists but is unreadable;
  the Editor was not ready for `unity-harness all`; or a deviation's severity cannot be judged because its GDD / ADR
  is missing. Not the same as DEFERRED (evaluable, awaiting playtest). Missing evidence is decided by phase 3's gate
  level, not here.
- **BLOCKED**: a failing criterion, a failing harness check on the story's files, a blocking deviation, a blocking
  evidence gap, an INADEQUATE coverage gate or a REJECT review.
Precedence, first match wins: BLOCKED → NOT ASSESSED → COMPLETE WITH NOTES → COMPLETE.

BLOCKED or NOT ASSESSED: do not move on by yourself. List what must be fixed (or what would make it checkable) and
offer to help. Phase 7 is still reachable if the user explicitly asks to close anyway, and it always asks there.
