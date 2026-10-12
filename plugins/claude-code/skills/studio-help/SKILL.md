---
name: studio-help
description: Read-only "what do I do next?" for the studio workflow in a Unity project - reads the studio settings, the project state from unity-harness studio status and the session checkpoint, finds where the project is on the minimal path or the phase ladder, and names exactly one next skill plus what is optional and what comes after. Use when the user is stuck, lost, just finished a step, or asks what's next. Port of CCGS /help. Triggers: "help", "what's next", "what should I do next", "tiếp theo làm gì", "giờ làm gì", "đang ở bước nào", "bí rồi", "stuck".
---

# Studio help

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

Lightweight orientation, not an audit. Writes no files.

References: `references/catalog.md` holds the minimal path, the phase ladder, which steps are required, how each
is detected, and the fallbacks for steps not in this plugin yet. Read it in Step 1.

## Step 1: Load state
- `unity-harness studio config`: `rigor`, `workflow`, `stage`, `paths`. A stderr note "no studio block" means the
  project was never onboarded: recommend `studio-start` and stop.
- `unity-harness studio status --json`: brief, concept, GDDs, epics with status counts, `inProgress`,
  `nextReadyStory`, `currentSprint`, `activeStory`, evidence count. Use it instead of searching folders yourself.
- `references/catalog.md`.
- `unity-harness where`: if there is no Unity project or no harness config, the next step is
  `unity-harness-project-setup` or `studio-setup`; say so and stop.

## Step 2: Read the session checkpoint
If `paths.sessionState` exists, read only its CHECKPOINT block (between `<!-- CHECKPOINT -->` and
`<!-- /CHECKPOINT -->`); the narrative below can be long. A file without markers: read its last section. Extract
what was worked on last, the next step, blockers and open questions. This runs at every tier: at minimal it is how
you learn that a story's work is already written ("Next step: studio-story-done").

## Step 3: Choose the route
- `workflow` = `minimal` → Step 4m. Do not map `stage`: nothing on the minimal path advances it, so it reads
  `concept` however far the project has got.
- Otherwise take the phase from `stage`. If the studio block has no meaningful stage, infer the most advanced match:
  stories exist → `pre-production`; architecture doc or ADRs → `technical-setup`; GDDs beyond the concept →
  `systems-design`; otherwise `concept`. Then Step 4.

## Step 4: Phase ladder (standard / full)
For each step of the current phase in the catalog, decide Complete / Incomplete / MANUAL / UNKNOWN from the status
JSON or a single file check named in the catalog. A step with no check is never "done": mark it MANUAL and ask the
user, or UNKNOWN for repeatable work. If most of a phase is unknowable, say so instead of implying it is nearly done.
- Production: story statuses are authoritative. `inProgress` → "currently active"; `nextReadyStory` → "next up";
  `Blocked` counts → name each blocked story and its blocker (read the blocker from the story file).
- Repeatable steps (system GDDs): report what exists and note it may be ongoing.
- Then Step 5.

## Step 4m: Minimal path
The next step is the first that applies:
1. No Unity project / no harness config / empty `unityVersion` → `studio-setup` (or `unity-harness-project-setup`
   when there is no project).
2. No `design.brief` → `studio-brainstorm` (writes the one-page brief at minimal).
3. No stories → `studio-create-stories` with no argument (builds stories from the brief's MVP list).
4. Stories exist (statuses: Ready, In Progress, Blocked, Complete; a story with no Status line is not ready).
   Order: an `In Progress` story → the first `Ready` story in file (build) order.
   - In Progress → not done, whatever the code or commits suggest; only `studio-story-done` makes a story Complete.
     Recommend `studio-story-done <path>` only if the user, the checkpoint or the git log says the implementation is
     written; otherwise `studio-dev-story <path>`.
   - Ready → `studio-dev-story <path>`.
   - A Blocked story is never next up; name it with its blocker.
   - Nothing buildable but Blocked / unknown-status stories remain → the build order is not done. Name each with its
     status as written; next up is clearing the first (resolve its blocker, or give it a `Status:` line such as
     `Ready`).
   - Every story Complete → the brief's build order is done. Offer: play the build; add the next stories from the
     brief with `studio-create-stories`; or, if the game outgrew a one-page brief, raise rigor with
     `unity-harness studio set rigor=standard` (after approval).

At minimal never present the concept doc, art bible, systems map, GDDs, epics, a sprint plan, phase gates or sprint
close-out as required or blocking. Mention one only when the user asks about it. Skip Steps 5 and 7.

## Step 5: Position
1. Last confirmed complete required step.
2. Current blocker: the first incomplete required step (the one thing to do next).
3. Optional now: at `full` list all incomplete optional steps; at `standard` only those required for the current
   system or phase.
4. Coming up: required steps after the blocker.

If the user said what they just finished ("just finished brainstorm"), advance past it even when the check is
ambiguous. If the checkpoint shows an active task, put it first: "It looks like you were working on X", and ask
whether to continue or whether it is done.

## Step 6: Output
Keep it short. Phase ladder:

```
## Where you are: <Phase>
**In progress:** <from checkpoint, if any>
### ✓ Done
- <step>
### → Next up (required)
**<Step>**: <what it does>. Skill: `<skill>`
### ~ Also available (optional)
- **<Step>**: <what it does> → `<skill>`
### Coming up
- <step> (`<skill>`)
```

Minimal (no phase, no gate line; N counts only stories whose status is Complete):

```
## Where you are: Minimal path, <N> of <M> stories complete
**In progress:** <from checkpoint, if any>
### ✓ Done
- Unity <version> · Game brief · <N> stories
### → Next up
**<Story NNN: title>**: <what it delivers>. Skill: `studio-dev-story <path>` (or `studio-story-done <path>`)
### Coming up
- <next Ready stories in build order, at most 3>
```

A step with no skill (a not-yet-ported CCGS step) gets its fallback from the catalog instead of a skill name. For a
MANUAL step ask: "I can't tell if <step> is done; has it been completed?"

## Step 7: Phase transition (standard / full only)
If every required step of the current phase is complete or nearly so, add: "You're close to the <current> → <next>
transition. The CCGS gate check is not in this plugin yet; when you're satisfied, the stage moves with
`unity-harness studio set stage=<next>` (I'll ask before running it)." Skip when several required steps remain.

## Step 8: When the user is lost
Only if the user sounds confused ("stuck", "lost", "không biết"), add:
- `studio-start`: re-orient from scratch.
- Rigor feels wrong: lower it when the user sounds overwhelmed by process (and rigor is not already minimal); raise
  it when the project has outgrown it (many systems, or in production at minimal). The change is
  `unity-harness studio set rigor=<r>`, run only after approval.
Match the user's tone: a stressed user gets one action, not six.

## Rules
- Never run the next skill; recommend one, the user starts it.
- One primary recommendation. Optional and coming-up items are secondary.
- Ask about MANUAL steps instead of assuming.

Verdict: **COMPLETE**, next step identified.
