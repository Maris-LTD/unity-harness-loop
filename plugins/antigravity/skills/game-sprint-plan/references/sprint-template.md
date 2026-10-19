# Sprint plan template

Write to `paths.sprintsDir/sprint-NNN.md`. Story status is not tracked here: each row points at its story file,
whose `Status` line is the only source (`game-sprint-status` reads it).

```markdown
# Sprint [N] — [Start YYYY-MM-DD] to [End YYYY-MM-DD]

> **Producer review (PR-SPRINT)**: [APPROVED | CONCERNS accepted | REVISED | NOT ASSESSED: input | skipped (solo|lean)] [date]

## Sprint Goal
[One sentence: what this sprint achieves toward the milestone or the brief's build order.]

## Milestone Context
- **Current milestone**: [name, or "none defined"]
- **Milestone deadline**: [date or n/a]
- **Sprints remaining**: [N or n/a]

## Capacity
- **Total days**: [X]
- **Buffer (20%)**: [Y]
- **Available**: [Z]

## Stories

### Must Have (critical path)
| ID | Story file | Owner | Est. days | Depends on | Acceptance summary |
|----|------------|-------|-----------|------------|--------------------|
| S[N]-001 | `[paths.epicsDir]/[epic]/story-001-[slug].md` | gameplay-programmer | 1 | none | [one line] |

### Should Have
| ID | Story file | Owner | Est. days | Depends on | Acceptance summary |
|----|------------|-------|-----------|------------|--------------------|

### Nice to Have (cut first)
| ID | Story file | Owner | Est. days | Depends on | Acceptance summary |
|----|------------|-------|-----------|------------|--------------------|

## Carryover from Sprint [N-1]
| Original ID | Story file | Reason | New estimate | Priority change |
|-------------|------------|--------|--------------|-----------------|

## Risks
| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|

## External Dependencies
| Dependency | Status | Impact if delayed | Contingency |
|------------|--------|-------------------|-------------|

## QA
[QA plan: path | No QA plan: acceptance criteria and evidence type per story define done.]

## Definition of Done
- [ ] All Must Have stories `Complete` (closed through `game-done`)
- [ ] Each story meets its acceptance criteria
- [ ] Logic/Integration stories have passing EditMode tests in the `testAssemblies` asmdefs
- [ ] `unity-harness all` passes on the sprint's final state
- [ ] `unity-harness smoke` passes and its capture shows the expected scene
- [ ] Player-visible stories have a kept screenshot in `paths.evidenceDir`
- [ ] Design documents updated for any deviation
- [ ] No open crash or blocker bug in delivered features
```

Story IDs: `S[N]-001` upward for Must Have, `S[N]-010` for Should Have, `S[N]-020` for Nice to Have. Estimates are
days; at `coarse` granularity a story is feature-sized, so 1-3 days each is normal.
