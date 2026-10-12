# Phases 7-9: findings document, write, hand-off

## Phase 7: Findings document

```
# Architecture Review
Date: <date>
Unity: <unityVersion> (<renderPipeline>)
Mode: <full / coverage / consistency / engine / single-gdd / rtm>
GDDs reviewed: <N>   ADRs reviewed: <M>
Reviewed files: <each GDD and ADR path with its last commit date, from git log -1 --format=%cs>

## Traceability summary
Total requirements: N | ✅ Covered: X | 🟡 Proposed: P | ⚠️ Partial: Y | ❌ Gaps: Z | ❓ Not assessed: Q

## Coverage gaps (no ADR)
❌ TR-<id>: <GDD> → <system> → <requirement>
   Suggested ADR: "<title>" (studio-architecture-decision)   Domain: <...>   Engine risk: LOW/MEDIUM/HIGH

## Cross-ADR conflicts
## ADR dependency order (+ unresolved dependencies, cycles)
## GDD revision flags
## Unity compatibility issues (+ Unity specialist findings)
## Architecture document coverage
## Not assessed (every check that could not run, and why)

## Verdict: PASS / CONCERNS / NOT ASSESSED / FAIL
## Blocking issues (FAIL only)
## Required ADRs (most foundational first)
```

### Verdict, first match wins
- **FAIL**: a Foundation or Core requirement is uncovered, or a blocking cross-ADR conflict or dependency cycle exists.
- **CONCERNS**: gaps, partial coverage, coverage resting on Proposed ADRs, or non-blocking conflicts.
- **NOT ASSESSED**: the review could not cover its stated scope. Emit it when:
  - no ADRs exist or none could be read (zero requirements traced is an untraced architecture, not full coverage);
  - there is no requirement source (no TR registry and no GDD requirements);
  - an ADR is unreadable or has no status, so its rows are ❓;
  - full mode and no architecture document (phase 6 did not run);
  - full or engine mode and `unityVersion` is not recorded (phase 5 had nothing to audit against).
  A CONCERNS or FAIL finding elsewhere still stands; NOT ASSESSED only replaces PASS.
- **PASS**: every requirement covered by Accepted ADRs, no conflicts, Unity-consistent, everything in scope assessed.
Never resolve a skipped check to PASS because nothing was found: nothing was looked for.

## Phase 8: Write
Show the document, then ask with `ask_question` (one approval for the listed set):
- `Write all`: `<paths.architectureDir>/architecture-review-<date>.md`, the traceability index
  `paths.traceability`, the TR registry `paths.trRegistry`.
- `Review document only`.
- `Nothing yet`.
In `rtm` mode the traceability index carries the extended matrix.

### Traceability index (`paths.traceability`)

```
# Requirements Traceability
Last updated: <date>   Unity: <unityVersion>   Mode: <mode>

## Coverage summary
Total, covered (%), proposed, partial, gaps; rtm: full-chain % (GDD → ADR → story → test)

## Full matrix
<phase 3 matrix, or the phase 3b RTM in rtm mode>

## Known gaps
<each ❌ with its suggested ADR, Foundation first, then Core, Feature, Presentation>

## Superseded requirements
<requirements whose GDD changed after the ADR was written>

## History
| Date | Coverage % | Full chain % | Notes |
```

Keep earlier History rows when rewriting the file.

### TR registry update
Re-read `paths.trRegistry` right before writing (another session may have changed it) and build the update from that
read, keeping every existing entry:
- append new TR-IDs;
- update the text and `revised: <date>` of entries whose GDD wording changed (ID unchanged);
- `status: deprecated` for entries whose requirement left the GDD (confirm with the user first);
- `status: "superseded-by: TR-<system>-NNN"` for split or replaced requirements (keep the quotes: valid YAML);
- never renumber or delete entries; update `last_updated` and bump `version`.
Stable TR-IDs are what stories reference across every later review.

### Checkpoint
After the writes, append to `paths.sessionState` (create it with this block if missing):

```
## Architecture review <date>
- Verdict: <verdict>
- Requirements: <N> total, <X> covered, <P> proposed, <Y> partial, <Z> gaps
- New TR-IDs: <N or none>
- GDD revision flags: <GDD names or none>
- Top ADR gaps: <top 3 titles or none>
- Review: <path>
```

## Phase 9: Hand-off
1. Immediate actions: the top 3 ADRs to write, Foundation before Feature.
2. Pre-gate checklist (mark ✅ / ❌):
   - an EditMode test asmdef listed in `testAssemblies` (`unity-harness config`); ❌ → studio-setup creates one;
   - smoke settings reviewed in `.unity-harness/config.json` (`smoke.waitForScene`, `smoke.expectTypes`); ❌ →
     studio-setup;
   - Accepted ADRs for every Foundation-layer system; ❌ → studio-architecture-decision.
   UX and accessibility documents and a CI test pipeline are recommended at full rigor; their CCGS skills (ux-design,
   test-setup) are not in this plugin yet, so list them as advisory, never as blockers.
3. Re-run trigger: "Run studio-architecture-review again after each new or revised ADR."

Close by asking with `ask_question`:
- ADR gaps or ❌ items remain: `Write a missing ADR (studio-architecture-decision <system>)` / `Fix setup
  (studio-setup)` (only when a setup item is ❌) / `Stop here`.
- Everything ✅ and no blocking gaps: `Run studio-gate-check pre-production` / `Stop here`. If
  `paths.controlManifest` is missing at workflow standard or full, lead with `Write the control manifest
  (studio-create-control-manifest), then re-run this review` instead: the manifest comes before this review.
Name the chosen skill; do not run it.
