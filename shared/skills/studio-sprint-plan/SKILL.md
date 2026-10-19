---
name: studio-sprint-plan
description: Create or update a Unity studio sprint plan from Ready stories, carryover and capacity. Use for "plan a sprint", "new sprint", "sprint plan", "lên kế hoạch sprint", "tạo sprint mới".
---

# studio-sprint-plan

{{#claude}}
If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.
{{/claude}}

Modes: `new` (default), `update`. For a progress snapshot use `studio-sprint-status`.

References:
- `references/sprint-template.md`: the sprint plan format. Read it before drafting (Phase 2).
- `references/milestone-and-risk.md`: the milestone and risk-entry formats, for when the user wants to author one.

## 0. Settings and state
- Run `unity-harness studio config` and `unity-harness studio status --json`. Use `reviewMode`, `automation`,
  `storyGranularity`, `workflow` and `paths`.
- Milestones and the risk register live in `milestones/` and `risk-register/` next to `paths.sprintsDir`.
- **At `workflow: minimal` this skill is optional**: the brief's build order (`paths.brief`) is the plan and the
  story files carry it. Say so in one line and ask with {{ask}} whether the user still wants a sprint plan. If not,
  point to `studio-sprint-status` (build-order progress) and `studio-dev-story` (next story), and stop.
- Stories per sprint, scaled by velocity: 2-4 at `coarse`, 6-10 at `balanced`, 15-25 at `fine`. A Ready backlog
  smaller than the range is planned whole; never pad with invented stories.

## 1. Gather context
1. **Milestone**: read the newest file in `milestones/` if it exists. It is hand-written; absent is normal. Say "no
   milestone defined, planning against the story backlog alone" and continue. Never infer one from sprint files.
2. **Previous sprint**: the newest `sprint-NNN.md` in `paths.sprintsDir` (`studio status` gives it as
   `currentSprint`). In `new` mode the new number is the highest existing plus one, three digits (`001` when none).
   Every story of the previous sprint whose story file Status is not `Complete` goes in the Carryover table with a
   reason and a new estimate, and only there, never again as new Must/Should/Nice work.
3. **Backlog**: stories are `paths.epicsDir/<epic>/story-NNN-<slug>.md`. Use the per-epic status counts from
   `studio status`, then search the `Status` lines across the story files to get each story's title and status
   without reading bodies. Plan from `Ready` stories.
   - No story files: "No stories found. Run `studio-create-stories` first (at standard/full, `studio-create-epics`
     before it)." Verdict **BLOCKED**, stop. Never invent work items.
4. **Design context**: GDDs in `paths.gddDir` for the features those stories implement; at `minimal` use
   `paths.brief` and do not treat absent GDDs as missing work.
5. **Risk register**: read `risk-register/` if it exists, else say once "no risk register, risks assessed from the
   sprint contents only".

## 2. Draft
`new`: draft the plan from `references/sprint-template.md` and show it. Do not ask to write yet; the gate and the
QA check run first and may change it.
- Must Have = the critical path toward the sprint goal; Should Have and Nice to Have hold the rest.
- Each row names the story file path, the owner agent (gameplay-programmer, ui-programmer, ai-programmer,
  engine-programmer, unity-* specialist), an estimate, dependencies (other story IDs) and the story's acceptance
  summary. Story status is not copied into the plan; the story file's `Status` line is the only source.
- Order rows by dependency. Capacity keeps a 20% buffer.

`update`:
1. Read the newest sprint plan and each listed story's current `Status`.
2. Ask with {{ask}} what to change: add, remove, reprioritize, re-estimate. Scope changes are always asked.
3. Never reset a status: `In Progress` and `Complete` stories stay. Only `Ready` (and unstatused) stories move or
   drop freely.
4. Re-present the full revised plan, then rerun Phase 3 on it.

## 3. Gate PR-SPRINT (producer)
Runs at `reviewMode: full` only (it is not a phase gate); otherwise note `PR-SPRINT skipped (solo|lean)`.
Spawn the producer with {{spawn producer}}, gate PR-SPRINT, passing: the proposed story list (titles, estimates,
dependencies), capacity in days, carryover from the previous sprint, milestone constraints and deadline (or "no
milestone").
- REALISTIC: continue.
- UNREALISTIC: defer the stories it names to Should/Nice to Have, re-present, continue.
- CONCERNS: ask with {{ask}}: proceed and accept the risk / adjust scope (defer Should Have stories) / extend the
  sprint dates. Apply and re-present.
- NOT ASSESSED: name the missing input; supply it and rerun, or record `NOT ASSESSED: <input>` in the plan header
  and repeat it at the write ask.

## 4. QA check
Look for a QA plan in `paths.qaDir` (`qa-plan-<sprint-slug>-<date>.md`, written by studio-qa-plan) whose name or
content references this sprint.
- Found: add `QA plan: <path>` to the plan.
- Not found: do not proceed silently. Say that without a QA plan the test requirements per story are undefined and
  the production → polish gate will flag it, then ask with {{ask}} (a separate question from the write ask):
  - A (recommended): run studio-qa-plan for this sprint before implementation starts → add to the plan
    "QA plan: run studio-qa-plan before implementation begins."
  - B: skip for now → add a warning block: "> **No QA plan**: this sprint started without one. Run studio-qa-plan
    before the last story is implemented; until then each story's acceptance criteria and evidence type define
    done, `unity-harness all` must pass and player-visible stories need a kept screenshot."

## 5. Write
Ask "May I write `paths.sprintsDir/sprint-NNN.md`?" (per the studio protocol for the current `automation` mode;
in `update` it is an existing file). Create the folder if needed. Yes: verdict **COMPLETE**. No: verdict
**BLOCKED** (write declined).

If the sprint holds stories beyond the original epic or brief scope, say so in one line: that is scope growth the
user should confirm.

## 6. Next steps (name them, do not run them)
- `studio-story-readiness <story>` before starting a story (standard/full).
- `studio-dev-story <story>` for the first Must Have story.
- `studio-sprint-status` mid-sprint.
