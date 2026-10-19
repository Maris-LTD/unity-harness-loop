---
name: studio-story-done
description: Close a Unity studio story only when acceptance criteria, harness checks and screenshots prove it done, then name the next story. Use for "story done", "close story", "đóng story", "nghiệm thu story".
---

# Story done


Closes the loop between design and implementation: every acceptance criterion is verified before the story is
marked done, deviations from the design are written down instead of slipping in, code review is run instead of
forgotten, and the story file records what actually happened.

References, read when the phase starts and again after a compaction:
- `references/verify-criteria.md`: phases 2-3 (read the story, verify criteria, traceability, evidence gates).
- `references/review-and-report.md`: phases 4-6 (deviations, QL-TEST-COVERAGE, LP-CODE-REVIEW, report, verdict).
- `references/close-and-next.md`: phases 7-8 (approval, status writes, checkpoint, next story).

## Settings
Run `unity-harness studio config`, `unity-harness config` and `unity-harness studio status`. Keep `reviewMode`,
`automation`, `workflow`, `qaLevel`, `storyGranularity`, `paths`, `testAssemblies`, `smoke`.

What each knob changes here:
- `workflow`: which deviation checks run (phase 4).
- `qaLevel`: whether test evidence is required. minimal skips the Logic / Integration evidence checks, the >50%
  untested escalation and QL-TEST-COVERAGE; the criteria check, the screenshot gate and visual sign-off for
  Visual/Feel and UI, and the run-result check for other visible stories still run. standard: the story's own type
  requires evidence. full: every type does. Config/Data evidence (`unity-harness smoke`) is advisory at every level.
- `reviewMode`: which gates run (phases 4b and 5).
- `storyGranularity`: cadence only (coarse every 3-5 days, balanced 1-2 days, fine several per day).

## Phase 1: Find the story
- A path was given → read it.
- Otherwise: `Current story:` in `paths.sessionState`; else `inProgress` from
  `unity-harness studio status`.
  Several in progress → ask with `ask_question` which one. None → ask for the path.

## Phases 2-3: Read and verify
Read `references/verify-criteria.md` and follow it.

## Phases 4-6: Deviations, gates, report
Read `references/review-and-report.md` and follow it. Present the full report before touching any file.

## Phases 7-8: Close and hand off
Read `references/close-and-next.md` and follow it.

## Rules
- **Never mark a story Complete without the user's explicit approval** in phase 7, in every automation mode for a
  BLOCKED or NOT ASSESSED verdict (closing over blockers is a scope change: always asked). For a COMPLETE /
  COMPLETE WITH NOTES verdict, autonomous mode may pick "close" and log the decision in `paths.decisionLog`.
- **Never auto-fix failing criteria.** Report them and ask what to do; fixing is a studio-dev-story (or by-hand)
  round, then rerun this skill.
- **Deviations are facts, not judgments.** Present them neutrally; the user decides if they are acceptable.
- **BLOCKED and NOT ASSESSED are advisory to the user**, not a wall: the user may close anyway; record the risk. For
  NOT ASSESSED record which criteria were never evaluated, so the gap can be recovered later.
- **Never describe an image you have not opened.** A checkpoint's `Run result: OBSERVED - <text>` is
  studio-dev-story's description; quote it as such.
- Batch manual criterion questions (up to 4 per `ask_question` call).

## After closing
- `minimal`: studio-dev-story on the next story (studio-story-done for one already implemented). When every story is
  Complete: play the build, then studio-create-stories for more, or raise rigor with
  `unity-harness studio set rigor=standard` (asked first).
- With a sprint: studio-story-readiness on the next story before starting it.
- All Must Have stories of the sprint Complete: `unity-harness full` on the sprint, a playtest, then studio-qa-plan and
  studio-sprint-plan for the next sprint. At the end of production: `studio-gate-check polish`. (CCGS /smoke-check,
  /team-qa and /retrospective are not in this plugin yet.)
- Play-test feedback on what was just built: unity-feedback-tweak.
