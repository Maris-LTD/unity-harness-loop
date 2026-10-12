# Phases 6-7: Stage write and next step

## 6. Save the report and advance the stage
- Ask "May I write this gate report to `gate-checks/gate-<target>-<date>.md` in the folder that holds
  `paths.sprintsDir`?" (default `Docs/production/gate-checks/`). Write it only on yes.
- **PASS**: ask "Gate passed. May I set the stage to `<target>`?" On yes run
  `unity-harness studio set stage=<target>`, then `unity-harness studio config` and confirm it shows the new stage.
- **CONCERNS**: do not offer the stage write by default. If the user asks to advance anyway, list every concern and
  ask: "Accept these risks - <list> - and set the stage to `<target>`?" Only on an explicit yes: add an
  `### Accepted risks` section to the report (each concern, accepted by the user, date) and run the `studio set`.
- **FAIL / NOT ASSESSED**: never advance. Fix the blockers or produce the missing input, then rerun this gate.
- Append to `paths.sessionState`: `Gate: <current> → <target> <verdict> <date>` and whether the stage moved.
- Rigor fit (advisory, once): if the new stage is `production` or later while `workflow` is `minimal`, add one line:
  "You are entering <stage> on rigor minimal - most projects this size run standard. Raise it with
  `unity-harness studio set rigor=standard`?" Never change it yourself.

## 7. Next step
Close with `AskUserQuestion`, tailored to the gate that ran.
- **workflow minimal**: skip the ladder; offer the first unfinished minimal step: studio-setup → studio-brainstorm →
  studio-create-stories → studio-dev-story on the next Ready story.
- **systems-design PASS**: studio-map-systems if `paths.systemsIndex` does not exist, else studio-design-system for
  the first system in the index's design order / revisit the concept / stop.
- **technical-setup PASS**: studio-create-architecture (the blueprint and ADR work plan, before any ADR) / design
  more GDDs first / stop.
- **pre-production PASS**: build a vertical slice (CCGS `/vertical-slice` is not in this plugin yet: build it with
  studio-dev-story or unity-ref-to-prototype, then play it) / studio-create-epics / stop. The control manifest was
  already required by this gate (it comes before studio-architecture-review).
  Recommended pre-production order: vertical slice and a played session → studio-create-epics (foundation, then
  core) → studio-create-stories per epic → studio-sprint-plan → studio-qa-plan sprint. Validate fun before planning in
  detail: epics written before a core-loop change are partly wrong.
- **Other gates**: the two most logical next steps for that phase, plus stop.

## Follow-ups by gap
- No concept → studio-brainstorm. No systems index → studio-map-systems. Missing or incomplete GDD →
  studio-design-system. Concept or GDD not reviewed → studio-design-review.
- No architecture doc → studio-create-architecture. Missing ADRs or ADRs without Engine Compatibility →
  studio-architecture-decision. No traceability or review report → studio-architecture-review. No control
  manifest → studio-create-control-manifest (needs Accepted ADRs).
- Missing epics → studio-create-epics; missing stories → studio-create-stories; stories not ready →
  studio-story-readiness; no sprint plan → studio-sprint-plan; no QA plan → studio-qa-plan.
- No test assembly → studio-setup. Tests or smoke failing → studio-dev-story on the failing story, or the
  qa-tester / lead-programmer agents; recheck with unity-verify.
- Code not reviewed → studio-code-review.
- Performance unknown → the unity-perf-profiling skill if installed, else profile in the Editor and on device.
- Art bible, UX specs, accessibility, playtest reports, balance, localization, release checklist, security audit:
  not in this plugin yet; write them by hand if the project needs them.
