---
name: studio-gate-check
description: Validate whether a Unity studio project is ready to move to its next phase (concept → systems-design → technical-setup → pre-production → production → polish → release) - check the required artifacts for the target phase at the project's workflow tier with unity-harness studio status, run the build-health checks with the unity-harness CLI (rules, compile, EditMode tests, Play mode smoke), run the director phase-gate panel per review mode, return PASS / CONCERNS / NOT ASSESSED / FAIL with blockers, and on approval advance the stage with unity-harness studio set. Port of CCGS /gate-check. Use when the user asks "can we move to production?", "gate check", "ready for the next phase?", "qua phase", "kiểm tra cổng", "đủ điều kiện sang production chưa", "chuyển giai đoạn".
---

# Gate check

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

Prescriptive, not diagnostic: it answers "are we ready to advance?" with a formal verdict for one phase
transition. studio-help answers "where are we?".

References, read when the phase starts and again after a compaction:
- `references/gate-<target>.md`: the checklist of the one transition being checked (read only that one):
  `gate-systems-design.md`, `gate-technical-setup.md`, `gate-pre-production.md`, `gate-production.md`,
  `gate-polish.md`, `gate-release.md`.
- `references/run-checks.md`: phase 3 (tier reductions, artifact, quality and cross-reference checks).
- `references/panel-and-verdict.md`: phases 4-5 (manual checks, director panel, verdict, chain of verification).
- `references/stage-and-next.md`: phases 6-7 (stage write, rigor-fit note, next steps and follow-ups).

## Settings
Run `unity-harness studio config`, `unity-harness studio status --json` and `unity-harness config`. Keep `stage`,
`workflow`, `reviewMode`, `qaLevel`, `paths`, `unityVersion`, `targetPlatforms`, budgets (`targetFps`,
`drawCallBudget`, `memoryBudgetMb`), and from the harness config `testAssemblies` and `smoke`.
- `workflow` sets which artifacts the gate requires (each gate file states the full baseline, then its standard and
  minimal reductions).
- `qaLevel` relaxes the per-story test items only (phase 3); never the screenshots, never the smoke run.
- `reviewMode` decides whether the director panel runs; `workflow` decides its width (phase 4).
- Automation does not apply: a phase gate is a deliberate human checkpoint. Ask every question it raises, in every
  mode; the stage write is always asked (settings change).

## Stages
concept → systems-design → technical-setup → pre-production → production → polish → release. A gate is named by the
phase being entered: `systems-design` checks concept → systems-design.

## Phase 1: Pick the transition
- Argument given (`systems-design`, `technical-setup`, `pre-production`, `production`, `polish`, `release`) → that
  gate.
- No argument → take `stage` from `studio config`, propose the next transition, and confirm with `AskUserQuestion`:
  "Stage is `<stage>`. Run the `<stage>` → `<next>` gate?" Options: run this gate / pick another (then list the six
  transitions). Do not skip this confirmation.
- `stage` is `release` → nothing to gate; say so and stop.

## Phase 2: Load the gate
Read only `references/gate-<target>.md`. Apply the reduction for the resolved `workflow`.

## Phase 3: Run the checks
Read `references/run-checks.md` and follow it. Existence comes from `studio status`; adequacy from spot-reading the
artifacts the verdict turns on; build health from the harness CLI.

## Phases 4-5: Ask, panel, verdict
Read `references/panel-and-verdict.md` and follow it. Present the full report before touching any file.

## Phases 6-7: Stage and next step
Read `references/stage-and-next.md` and follow it.

## Rules
- **Never assume PASS for something you could not check.** It is MANUAL CHECK NEEDED until the user answers; an
  unanswered one makes the verdict NOT ASSESSED.
- **Never auto-fix.** Missing artifacts get a FAIL or CONCERNS line naming the skill that produces them. Do not
  create files or rerun the gate to manufacture a PASS.
- **Tier reductions relax what must exist, never what must work.** A build that fails `unity-harness all` or smoke
  fails the gate at every tier.
- **Artifacts from skills this plugin does not have** (art bible, UX specs, accessibility requirements, interaction
  patterns, player journey, entity inventory, difficulty curve, vertical slice, playtest reports, QA sign-off,
  release checklist, security audit, localization QA, cross-GDD review) are optional: list them as
  `not checked: no skill in this plugin yet`, never as a blocker. If the user created one anyway, check it like any
  other artifact. Questions they would have answered (is the core loop fun? has anyone played it?) are still asked.
- **The verdict only decides whether this skill writes the new stage.** It never stops the user from working.
  CONCERNS can advance only on an explicit acceptance of each listed risk; FAIL and NOT ASSESSED never advance.
- Do not run two harness commands at once; smoke takes over Play mode in the open Editor while it runs.
