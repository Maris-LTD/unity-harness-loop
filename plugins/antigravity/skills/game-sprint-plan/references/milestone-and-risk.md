# Milestone and risk entry formats

Both are optional and hand-authored. `game-sprint-plan` reads them when present; no skill requires them.
Write only with the user's approval, per the studio protocol.

## Milestone: `milestones/<slug>.md` (next to `paths.sprintsDir`)

```markdown
# Milestone: [Name]

- **Target date**: [YYYY-MM-DD]
- **Type**: [Prototype | Vertical Slice | Alpha | Beta | Gold | Post-Launch]
- **Duration**: [N weeks], **Sprints**: [N]

## Goal
[2-3 sentences: what this milestone achieves and what can be demonstrated at its end.]

## Success Criteria
- [ ] [Specific, testable criterion]
- [ ] No open crash or blocker bug
- [ ] Frame rate at or above `targetFps` (studio config) on the target device
- [ ] `unity-harness full` passes on the milestone build

## Features
### Must ship
| Feature | Design doc | Owner | Sprint target |
|---------|------------|-------|---------------|
### Should ship (cuttable)
| Feature | Design doc | Owner | Sprint target | Cut impact |
|---------|------------|-------|---------------|------------|
### Stretch
| Feature | Design doc | Value add |
|---------|------------|-----------|

## Quality Gates
| Gate | Threshold | How measured |
|------|-----------|--------------|
| Frame rate | > [X] FPS on min spec | Unity Profiler on device |
| Load time | < [X] s | Timed from launch to first interactive frame |
| Draw calls | < `drawCallBudget` | Frame Debugger / Profiler |
| Memory | < `memoryBudgetMb` MB | Memory Profiler |
| Tests | all EditMode tests pass | `unity-harness tests` |

## Risks
| Risk | Probability | Impact | Mitigation | Owner | Status |
|------|-------------|--------|------------|-------|--------|

## Dependencies
| Feature | Depends on | Owner | Status |
|---------|------------|-------|--------|
```

## Risk entry: `risk-register/RISK-NNNN-<slug>.md` (next to `paths.sprintsDir`)

```markdown
# Risk: [Short title]

- **ID**: RISK-[NNNN]
- **Identified by / date**: [agent or person], [YYYY-MM-DD]
- **Category**: [Technical | Design | Schedule | Resource | External | Quality]
- **Probability**: [Very Low | Low | Medium | High | Very High]
- **Impact**: [Minimal | Minor | Moderate | Major | Critical]
- **Score**: [Low | Medium | High | Critical]

## Description
[What could go wrong, under what conditions.]

## Triggers
- [Observable sign that it is happening]

## Impact if it happens
- **Schedule**: [days/weeks] · **Quality**: [...] · **Scope**: [features affected]
- **Affected systems**: [...]

## Mitigation
- **Prevention**: [action, owner, deadline]
- **Contingency**: [action if it happens, owner]

## Status
- **Status**: [Open | Mitigating | Occurred | Closed] · **Last reviewed**: [date] · **Trend**: [Up | Stable | Down]
```
