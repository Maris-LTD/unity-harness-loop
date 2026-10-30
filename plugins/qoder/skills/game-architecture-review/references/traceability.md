# Phases 3 and 3b: traceability

## Phase 3: Matrix
For each requirement from phase 2, use the ADR sections already loaded (do not re-read):
1. Does an ADR's `## GDD Requirements Addressed` name the TR-ID, the requirement or its GDD?
2. Does an ADR's decision cover it implicitly?
3. Mark the status. Read each ADR's status line before marking: an unaccepted decision is not coverage.

| Mark | Meaning |
|---|---|
| ✅ Covered | an **Accepted** ADR addresses it |
| 🟡 Covered (Proposed) | an ADR addresses it but is still Proposed |
| ⚠️ Partial | partly covered, or coverage is ambiguous |
| ❌ Gap | no ADR addresses it |
| ❓ Not assessed | the ADR is unreadable or has no status |

🟡 is not a pass: it caps the verdict at CONCERNS. The way out is accepting the ADR through
game-adr (its accept step). Downstream skills (game-manifest,
game-epics, game-tasks, game-gate) require Accepted ADRs, so counting Proposed as
covered would send work forward that each of them refuses.

```
## Traceability Matrix
| Requirement ID | GDD | System | Requirement | ADR coverage | Status |
|---|---|---|---|---|---|
| TR-combat-001 | combat.md | Combat | Hit detection within one physics step | ADR-0003 | ✅ |
| TR-combat-002 | combat.md | Combat | Combo input window | — | ❌ Gap |
```

Totals: covered, proposed, partial, gaps, not assessed.

## Phase 3b: Story and test linkage (rtm mode, or full mode with stories)
Extends the matrix with the story that implements each requirement and the test that proves it.

### Stories
List story files under `paths.epicsDir/*/story-*.md` (denominator). Search them instead of reading each in full:
- lines containing `TR-` (the TR-IDs each story implements);
- the `## Test Evidence` section (about 8 lines: story type and test file path);
- the `> **Status**:` line.
Read a story whole only when its Test Evidence section is missing or unclear.

### Tests
EditMode tests live in the asmdefs listed in `testAssemblies` (`unity-harness config`), conventionally
`Assets/<Game>/Tests/EditMode/`. Index `*Tests.cs` files there by system folder. For each test path a story names,
check the file exists; a stated path that does not exist is MISSING. `testAssemblies` empty → say the test index
could not be built (suggest game-setup), never read it as "no tests".
Optional: `unity-harness tests --json` reports pass/fail per assembly when the Editor is open; a failing assembly
downgrades its COVERED rows to `COVERED (failing)`.

### Extended matrix

```
## Requirements Traceability Matrix (RTM)
| TR-ID | GDD | Requirement | ADR | Story | Test file | Test status |
|---|---|---|---|---|---|---|
| TR-combat-001 | combat.md | Hit detection | ADR-0003 | story-001-hit.md | Assets/Brawl/Tests/EditMode/Combat/HitDetectionTests.cs | COVERED |
| TR-combat-002 | combat.md | Combo window | — | story-002-combo.md | — | NONE (Visual/Feel) |
| TR-save-001 | save.md | Persistent progress | ADR-0005 | — | — | NO STORY |
```

Test status: COVERED (test file exists) / MISSING (path stated, not found) / NONE (no test path; Visual/Feel or UI
story, evidence is screenshots) / NO STORY (no story yet).

Summary: COVERED, MISSING test, NO STORY, NO ADR (phase 3 gaps), and the full-chain percentage.
