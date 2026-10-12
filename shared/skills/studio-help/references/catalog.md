# Studio phase catalog (Unity)

Each step: skill, required (R) or optional (O), and how to tell it is done. "Not in this plugin yet" marks CCGS
steps that have no port; use the fallback named. Doc paths are keys of `paths` from `unity-harness studio config`.

## Minimal path (rigor/workflow `minimal`)
No phases and no gates. Order:

| # | Step | Skill | Done when |
|---|---|---|---|
| 1 | Unity setup | `studio-setup` | Unity project exists, `.unity-harness/config.json` exists, `unityVersion` set in `studio config` |
| 2 | Game brief | `studio-brainstorm` | `paths.brief` exists (`studio status` → Brief) |
| 3 | Stories | `studio-create-stories` | at least one `story-*.md` under `paths.epicsDir` |
| 4 | Build the next story | `studio-dev-story` | no artifact check; story status drives it |
| 5 | Close the story | `studio-story-done` | story `Status: Complete` |

Never required at minimal: concept doc, GDDs, systems map, art bible, epics step, sprint plan, phase gates, sprint
close-out. They still run if the user asks.

## Phase ladder (`standard` / `full`)

### concept
| Step | R/O | Skill | Done when |
|---|---|---|---|
| Brainstorm | O | `studio-brainstorm` | — |
| Unity setup | R | `studio-setup` | `unityVersion` set, harness config exists |
| Game concept | R | `studio-brainstorm` | `paths.concept` exists |
| Concept review | O | `studio-design-review` on `paths.concept` | review report in `paths.gddReviewsDir` |
| Art bible | O (recommended at full) | not in this plugin yet (CCGS `/art-bible`); fallback: write `paths.artBible` by hand, art-director can review | `studio status` → design.artBible |
| Systems map | R | `studio-map-systems` | `paths.systemsIndex` exists (`studio status` → Systems index) |
| Gate | R | `studio-gate-check systems-design` | stage `systems-design` |

### systems-design
| Step | R/O | Skill | Done when |
|---|---|---|---|
| System GDDs | R | `studio-design-system` per system, in the systems index's design order (standard: Overview, Detailed Rules, Edge Cases, Dependencies, Acceptance Criteria, + Formulas for numeric rules; full: all 8 sections) | GDD count in `studio status` (repeatable, may be ongoing) |
| Per-system review | R | `studio-design-review` per GDD | review report per GDD in `paths.gddReviewsDir` |
| Cross-GDD review | O | not in this plugin yet (CCGS `/review-all-gdds`); fallback: ask `game-designer` to compare the GDDs for contradictions | — |
| Gate | R | `studio-gate-check technical-setup` | stage `technical-setup` |

### technical-setup
| Step | R/O | Skill | Done when |
|---|---|---|---|
| Architecture blueprint | R | `studio-create-architecture` | `paths.architectureDoc` exists |
| ADRs | R (full: all; standard: Foundation-layer) | `studio-architecture-decision` per decision | `studio status` → ADRs (count, by status) |
| Control manifest | R (standard/full) | `studio-create-control-manifest` (after ADRs are Accepted, before the review) | `paths.controlManifest` exists |
| Architecture review | R | `studio-architecture-review` | `paths.traceability` and an `architecture-review-*.md` in `paths.architectureDir` |
| Test setup | R | `studio-setup` (EditMode asmdef listed in `testAssemblies`) | `unity-harness config` → `testAssemblies` not empty |
| Accessibility / UX patterns | R at full | not in this plugin yet (CCGS `/ux-design`) | — |
| Gate | R | `studio-gate-check pre-production` | stage `pre-production` |

### pre-production
| Step | R/O | Skill | Done when |
|---|---|---|---|
| Prototype / vertical slice | O (vertical slice R at full) | not in this plugin yet (CCGS `/prototype`, `/vertical-slice`); fallback: `unity-ref-to-prototype`, or build a slice with `studio-dev-story` | — |
| Epics | R | `studio-create-epics` | `EPIC.md` under `paths.epicsDir` |
| Stories | R | `studio-create-stories` | `story-*.md` under `paths.epicsDir` |
| Sprint plan | R | `studio-sprint-plan` | `sprint-*.md` under `paths.sprintsDir` |
| QA plan | O | `studio-qa-plan sprint` (after the sprint plan) | `qa-plan-*.md` in `paths.qaDir` |
| Gate | R | `studio-gate-check production` | stage `production` |

### production
| Step | R/O | Skill | Done when |
|---|---|---|---|
| Sprint plan | R | `studio-sprint-plan` | current sprint file |
| QA plan per sprint | O | `studio-qa-plan sprint` (after the sprint plan) | `qa-plan-*.md` in `paths.qaDir` |
| Story readiness | O | `studio-story-readiness` | story validated |
| Implement | R | `studio-dev-story` | story status |
| Code review | O | `studio-code-review` (runs the `unity-reviewer` agent plus an architecture pass) | — |
| Close story | R | `studio-story-done` | `Status: Complete` |
| Sprint status | O | `studio-sprint-status` | — |
| Play-test feedback round | O | `unity-feedback-tweak` | — |
| Bug report, retrospective, scope check | O | not in this plugin yet | — |
| Gate | R | `studio-gate-check polish` | stage `polish` |

### polish / release
Not in this plugin yet (CCGS `/perf-profile`, `/balance-check`, `/playtest-report`, `/team-polish`,
`/release-checklist`, `/launch-checklist`). Fallbacks: `unity-perf-profiling` skill if installed, `unity-harness full`
for build health, play-test notes by hand.
Gate into release: `studio-gate-check release`.

## Phase gates
`studio-gate-check [target]` validates each transition (concept → systems-design → technical-setup → pre-production
→ production → polish → release) and, on PASS and the user's approval, moves the stage with
`unity-harness studio set stage=<next>`. When every required step of a phase is done, suggest it. At minimal there
is no phase ladder: the gate is optional and checks only the minimal floor.
