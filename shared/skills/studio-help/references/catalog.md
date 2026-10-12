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
| Concept review | O | not in this plugin yet (CCGS `/design-review`); fallback: ask `creative-director` to review the concept | — |
| Art bible | O (recommended at full) | not in this plugin yet (CCGS `/art-bible`); fallback: write `art-bible.md` by hand in the `design/` folder beside `paths.brief`, art-director can review | file exists |
| Systems map | O (recommended at full) | not in this plugin yet (CCGS `/map-systems`); fallback: list systems and build order in `paths.gddDir/systems-index.md` | file exists |

### systems-design
| Step | R/O | Skill | Done when |
|---|---|---|---|
| System GDDs | R | not in this plugin yet (CCGS `/design-system`); fallback: one GDD per system in `paths.gddDir` (standard: Overview, Detailed Rules, Edge Cases, Dependencies, Acceptance Criteria, + Formulas for numeric rules; full: all 8 sections), or `unity-ref-to-prototype` for GDD + prototype | GDD count in `studio status` (repeatable, may be ongoing) |
| Per-system / cross-GDD review | R | not in this plugin yet (CCGS `/design-review`, `/review-all-gdds`); fallback: game-designer or creative-director reviews each GDD | — |

### technical-setup
| Step | R/O | Skill | Done when |
|---|---|---|---|
| Architecture, ADRs, control manifest | R | not in this plugin yet (CCGS `/create-architecture`, `/architecture-decision`, `/create-control-manifest`); fallback: record key decisions in the concept doc; studio skills treat ADR fields as optional | — |
| Test setup | R | `studio-setup` (EditMode asmdef listed in `testAssemblies`) | `unity-harness config` → `testAssemblies` not empty |
| Accessibility / UX patterns | R at full | not in this plugin yet (CCGS `/ux-design`) | — |

### pre-production
| Step | R/O | Skill | Done when |
|---|---|---|---|
| Prototype / vertical slice | O (vertical slice R at full) | not in this plugin yet (CCGS `/prototype`, `/vertical-slice`); fallback: `unity-ref-to-prototype`, or build a slice with `studio-dev-story` | — |
| Epics | R | `studio-create-epics` | `EPIC.md` under `paths.epicsDir` |
| Stories | R | `studio-create-stories` | `story-*.md` under `paths.epicsDir` |
| Sprint plan | R | `studio-sprint-plan` | `sprint-*.md` under `paths.sprintsDir` |

### production
| Step | R/O | Skill | Done when |
|---|---|---|---|
| Sprint plan | R | `studio-sprint-plan` | current sprint file |
| Story readiness | O | `studio-story-readiness` | story validated |
| Implement | R | `studio-dev-story` | story status |
| Code review | O | `unity-reviewer` agent (CCGS `/code-review` not ported) | — |
| Close story | R | `studio-story-done` | `Status: Complete` |
| Sprint status | O | `studio-sprint-status` | — |
| Play-test feedback round | O | `unity-feedback-tweak` | — |
| QA plan, bug report, retrospective, scope check | O | not in this plugin yet | — |

### polish / release
Not in this plugin yet (CCGS `/perf-profile`, `/balance-check`, `/playtest-report`, `/team-polish`,
`/release-checklist`, `/launch-checklist`). Fallbacks: `unity-perf-profiling` skill if installed, `unity-harness full`
for build health, play-test notes by hand.

## Phase gates
CCGS `/gate-check` is not in this plugin yet. When every required step of a phase is done, say the user is close to
the next phase and that moving on is `unity-harness studio set stage=<next>` after their approval.
