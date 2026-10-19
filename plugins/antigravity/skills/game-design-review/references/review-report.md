# Review report, tracking and closing

## Report (printed in phase 4)

```markdown
## Design Review: <document title>
Specialists consulted: <agents, or "none (<reviewMode> review)">
Re-review: Yes, prior verdict <X> on <date> / No, first review

### Completeness: <X>/<N> required sections present (N = required at workflow <tier>, never 8 unless full)
<Missing REQUIRED sections only. Advisory gaps listed separately as "advisory at <tier>".>

### Dependency graph
- ✓ <system>.md exists
- ✗ <system>.md NOT FOUND

### Required before implementation
1. [<source>] <blocking issue>

### Recommended revisions
1. [<source>] <important, not blocking>

### Specialist disagreements
<Both sides of each disagreement; not resolved here.>

### Nice-to-have
- <minor>

### Senior verdict [creative-director]
<Synthesis (full review only).>

### Scope signal
Rough scope signal: <S|M|L|XL> (producer should verify before sprint planning)
- S: one system, no formulas, no new ADR, fewer than 3 dependencies
- M: 1-2 formulas, 3-6 dependencies
- L: multi-system, 3+ formulas, may need a new ADR
- XL: cross-cutting, 5+ dependencies, several new ADRs likely

### Verdict: APPROVED | NEEDS REVISION | MAJOR REVISION NEEDED | NOT ASSESSED
```

NOT ASSESSED outranks APPROVED in any aggregate but not the two revision verdicts.

## Closing (phase 5)
Ask everything with `ask_question`; in autonomous, pick the recommendation and log it to `paths.decisionLog`.

1. What next, by verdict:
   - APPROVED: go straight to the tracking writes.
   - NOT ASSESSED: no tracking writes; go to the closing question, leading with the skill that produces the missing
     input.
   - NEEDS REVISION / MAJOR REVISION NEEDED: revise the GDD now (all blocking items together) / stop and revise in a
     separate session / accept as-is (only when nothing is blocking).
   - Revise now: resolve blocking items from the GDD and existing docs; group the design decisions you cannot resolve
     into one question before editing. Then show a table (blocker → fix) and ask: re-review in a new session
     (recommended, especially when the context is half used) / accept the revisions for now and mark the system
     In Review / move to the next system with `game-design <next>` / stop.
2. Tracking writes:
   - APPROVED: one multi-select question: set the status to `Approved` / save the review report.
   - Revision verdicts: ask separately: set the status to `Needs Revision` (revisions outstanding) or `In Review`
     (revisions applied, awaiting re-review), never `Approved`; then save the review report.
   - "Status" means both places, always the same word: the system's row in `paths.systemsIndex` and the GDD's
     header line `> **Status**: <word>`. Concept mode has no status write.
   - Review report file: `<paths.gddReviewsDir>/<system>-review-<YYYY-MM-DD>.md` (concept mode:
     `game-concept-review-<YYYY-MM-DD>.md`) with the format below.
3. Closing question, built only from options that are really next:
   - `game-design-review <other GDD>` when another system is In Review or Needs Revision;
   - `game-design <next Not Started system in design order>` (name it);
   - `game-gate technical-setup` when every MVP system is Approved;
   - concept mode: `game-systems` (or `game-gate systems-design` once the systems index exists);
   - stop here.
   Mark the option that moves the pipeline furthest as recommended. Consistency checks across GDDs and the holistic
   review of all GDDs are not in this plugin yet.

## Review report file

```markdown
# Review — <system or game-concept> — <YYYY-MM-DD> — Verdict: <verdict>
Document: <path> (git hash-object <hash>)
Registry: <paths.entityRegistry> (git hash-object <hash>, or "absent")
Scope signal: <S|M|L|XL>
Specialists: <list or none>
Blocking items: <n> | Recommended: <n>
Prior verdict resolved: Yes | No | First review
Summary: <2-3 sentences from the senior verdict or the main review>
Findings:
- [BLOCKING] <section>: <one line>
- [RECOMMENDED] <section>: <one line>
```

Write `- none` under Findings when there are none. The two hashes are what the next run's freshness check compares.
