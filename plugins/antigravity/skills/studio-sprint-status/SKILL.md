---
name: studio-sprint-status
description: Fast read-only sprint snapshot for a Unity studio project — story status table, days remaining, burndown verdict, stale and blocked stories, Must Haves at risk and one recommended next action. At minimal rigor (no sprints) it reports progress through the brief's build order instead. Reads `unity-harness studio status --json`, the current sprint file and story Status lines; never writes. Port of CCGS /sprint-status. Use when the user asks "how is the sprint going", "sprint status", "what's next", "build order progress", "sprint thế nào rồi", "tiến độ sprint", "tiến độ build order", "còn story nào".
---

# studio-sprint-status


Situational awareness, not a sprint review. Read-only: never edits files, never changes a status, never proposes
scope cuts (that is `studio-sprint-plan update`), makes at most one recommendation. Aim for under 50 lines of
output; the story table is never truncated.

Grain of the read follows `storyGranularity`: feature-sized at `coarse`, task-sized at `balanced`, AC-sized at
`fine`.

## 1. State
- Run `unity-harness studio config` and `unity-harness studio status --json`. Story statuses come from the story
  files' `Status` lines (`Ready`, `In Progress`, `Blocked`, `Complete`; a story with no Status line is not ready,
  any other word is reported as written).
- Pick the sprint: an argument (`3`) matches `sprint-003.md` / `sprint-03.md` / `sprint-3.md` in
  `paths.sprintsDir` (say which file); no argument uses `currentSprint` from `studio status`.

## 2. No sprint files
- **`workflow: minimal`** (no sprints by design; the brief's build order is the plan). In under 15 lines:
  1. `Build order: [complete] of [total] stories complete` (only `Complete` counts).
  2. **Next**, in this order: the first `In Progress` story (`studio-dev-story <path>` to finish it, or
     `studio-story-done <path>` if the user says the work is written), else the first `Ready` in build order (story number order within the brief's epic) (`studio-dev-story <path>`). Name each `Blocked`
     story with its blocker (the `BLOCKED:` note in its file); a blocked story is never Next.
  3. All complete: "Build order done: [M] of [M] stories complete." Offer: play the build; add the next stories
     from the brief with `studio-create-stories`; or raise rigor with `unity-harness studio set rigor=standard` if
     the game has outgrown a one-page brief.
  4. No story files: "No stories yet. Run `studio-create-stories` to turn the brief's build order into stories."
  5. Unfinished stories but none `In Progress`/`Ready` (all `Blocked` or no status): there is no Next and the build
     order is not done; never say it is. Print the Build order line, each blocked story with its blocker and each
     other story with its status, then one step: what the first blocker needs, or finishing the first unstatused
     story and setting it `Ready`.
  Then stop.
- **standard / full**: "No sprint files found. Start a sprint with `studio-sprint-plan`." Stop.

## 3. Sprint facts
Read the sprint file in full: number, goal, start and end dates, each story row (story file, priority section,
owner, estimate). Then read each listed story file's `Status` line (search the Status lines; do not read bodies).
- Listed file missing: status `MISSING`.
- A row with no story file: scan the sprint plan for a status marker next to it, else `NOT STARTED`.

Days: total = end - start, elapsed, remaining, % time consumed. No dates: "Sprint dates not found, burndown
skipped."

## 4. Stale stories
One search across the story files for the date line (pattern
`\*{0,2}(Last Updated|Updated|last-updated|updated_at)\*{0,2}\s*:`; the `**` wrappers matter because
`studio-create-stories` writes `> **Last Updated**: ...`). For each `In Progress` story:
- dated more than 4 days ago: **STALE** with its own day count;
- no date line: "never stamped" (not stale, no age computed);
- inline task with no file: "inline task, cannot check staleness".
Any STALE story raises the burndown verdict to at least **At Risk**, with the reason
"At Risk: [S] stale story(ies): [title] ([D] days), ...".

## 5. Burndown
Complete % = complete / total. Compare with % time consumed:
- **On Track**: within 10 points or ahead.
- **At Risk**: 10-25 points behind.
- **Behind**: more than 25 points behind.
No dates: "On Track / At Risk / Behind: unknown (sprint dates not found)".

## 6. Flags (at the top of the output, above the table)
- Must Have stories `Blocked` or not started with < 40% of sprint time left:
  `SPRINT AT RISK: [N] Must Have stories are not complete with [X]% of sprint time remaining. Replan with studio-sprint-plan update.`
- All Must Have stories complete: `All Must Haves complete. Pull from the Should Have list.`
- Listed story files missing: `NOTE: [N] story files referenced in the sprint plan are missing.`

## 7. Output
```markdown
## Sprint [N] Status — [today]
**Sprint goal**: [...]
**Days remaining**: [N] of [total] ([%] time consumed)

### Progress: [complete/total] stories ([%])
| Story | Priority | Status | Owner | Blocker |
|-------|----------|--------|-------|---------|

### Attention Needed
| Story | Status | Last Updated | Days stale | Note |
|-------|--------|--------------|------------|------|
(omit when no In Progress story is stale or unstamped)

### Burndown: [On Track | At Risk | Behind]
[1-2 sentences: which Must Haves are at risk, or which Should Haves could be pulled.]

### Must-Haves at Risk
[Blocked or not-started Must Haves with < 40% time left, or "None."]

### Emerging Risks
[Missing files, cascading blockers, stories with no owner; omit when none.]

### Recommendation
[One action: `studio-story-done <path>` for an In Progress story whose work is written, `studio-dev-story <path>` for the next story,
`studio-sprint-plan update` when replanning is needed, or "Sprint is on track, no action needed."]
```

For one story's detail, read its file or run `studio-story-readiness <path>`.
