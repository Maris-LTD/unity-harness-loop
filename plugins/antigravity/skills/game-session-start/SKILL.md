---
name: game-session-start
description: Open a new conversation on a Unity harness project - read the checkpoint, git, run logs, decision log and memory left by earlier sessions, flag drift, check the Editor, recommend one next step and preload what it needs. Use at the start of a session or for "resume", "where was I", "bắt đầu phiên mới", "tiếp tục dự án", "kiểm tra trạng thái dự án".
---

# Session start


Orientation for a fresh conversation, built on what earlier sessions left behind. Read-only, except the fixes the
user approves in Step 6. It recommends the next skill and never runs it. Its partner is `game-session-end`, which
writes the checkpoint, decision log and memory this skill reads.

## Step 1: Collect the facts
Run `unity-harness session brief --json`. It reads files and git only (no Unity) and returns:
- `checkpoint`: the CHECKPOINT block of `paths.sessionState` as `fields` (`Updated`, `Branch`, `Current story`,
  `Current task`, `Next step`, `Blocked on`, `Files in progress`, `Open questions`).
- `git`: branch, head, `recent` commits, `changed` and `untracked` files, `commitsAfterCheckpoint` with
  `minutesAfterCheckpoint` (anchored on the last commit of the checkpoint file, or on its modified time when the file is
  ignored or has uncommitted edits), `upstream` ahead/behind as of the last fetch.
- `runs`: the last rows of `.unity-harness/runs/INDEX.md` (verdict, log audit, title, report path) and `unfinished`
  run folders that never reached the index.
- `decisionLog`: the last lines of `paths.decisionLog`.
- `memory`: `repo` (`.claude/memory`) and `agent` (Claude Code's memory folder for this project) with file dates;
  `linked` when one is a junction to the other.
- `studio`: rigor, workflow, stage, story counts, `inProgress`, `blocked`, `nextReadyStory`, `activeStory`.
- `signals`: drift the CLI detects mechanically. You judge what each one means.

If the CLI answers with a usage error, it predates this skill: tell the user to update it
(`npm i -g github:Maris-LTD/unity-harness-loop`) and gather the same facts by hand: `unity-harness studio status`,
the checkpoint block, `git status --short`, `git log -10 --oneline`, the tail of the runs INDEX.md.

`hasConfig: false` or no Unity project → the next step is `unity-init` or `game-setup`; say so and stop.

## Step 2: Read memory and logs
Stop reading as soon as you can explain where the project stands.
1. Memory: Antigravity loads no memory on its own. Read `.claude/memory/MEMORY.md` (or the folder in `memory.agent`)
   and open only the files whose description touches the checkpoint's task or the likely next step: goals, current
   work, user preferences and feedback.
2. The whole session-state file when `Blocked on` or `Open questions` is not empty, or the block is thin. Entries
   below the block (`## Session <date>`) are the narrative of earlier sessions; read the latest one.
3. For the last run whose verdict is not `pass`: the summary and open items of its `report.md`, nothing more.
4. `decisionLog.last`.

Memory records what was true when it was written. Before relying on a file, function or flag it names, check that it
still exists. Git, files and story statuses win over memory.

## Step 3: Reconcile drift
Turn each signal into a judged sentence with an action. Do not repeat the raw signal.

| Signal | How to judge it |
|---|---|
| `commits-after-checkpoint` | Commits a few minutes after the checkpoint are usually the commit of the work it describes. Compare each subject with the checkpoint: a commit that adds work it does not mention (a feature, content, a fix) means the checkpoint is stale; offer to refresh it in Step 6 |
| `checkpoint-uncommitted` | Fine if the session-state folder is meant to stay local; otherwise remind to commit it with the work |
| `branch-changed` | Ask whether the checkpoint's task belongs to the other branch |
| `uncommitted-changes` | List the files (at most 10), split into work in progress and Editor noise (`ProjectSettings/*.json`, `.meta` churn, TMP autosize). Say which look intentional |
| `unfinished-runs` | A `unity-dev` run that never finalized: interrupted, or running in another window. Read its `plan.md` if present and recommend resuming or abandoning it. Never delete it |
| `last-run-not-pass` | Name its open items and whether a later commit addressed them |
| `active-story-not-in-progress` | The checkpoint names a story whose status says otherwise; the story status wins (only `game-done` closes a story) |
| `behind-upstream` | Suggest `git pull` before working; the count is from the last fetch |
| `no-checkpoint`, `no-memory` | Nothing to resume from. Recommend `game-session-end` at the end of this session, and `game-memory` for memory |

Without a signal, also look for memory that contradicts the repo: a named file that is gone, "current work" that the
stories already mark Complete, a decision the decision log later reversed.

## Step 4: Check the workbench
The goal is no surprise when the first real command runs.
- `unity status --json --no-banner`: find the instance whose `project` is this project and check it is `ready`.
  Several Editors may be listed. If none matches, say so first; harness checks, captures and Play mode need it.
- When it is ready: `unity command recompile_status --json --no-banner`. `compilationFailed` makes fixing the listed
  `errors` the next step, whatever the plan says.
- Skip both when the next step does not need Unity (design or docs work).
- Do not run `unity-harness all`, recompile or enter Play mode here: they are slow and change Editor state.

## Step 5: Choose the next step
Take the first that applies:
1. A blocker for any work: compile errors, the Editor on another project, an unfinished run holding the tree.
2. The checkpoint's unfinished task (`Current task` / `Next step` set, and git or story statuses do not show it done):
   "It looks like you were doing X. Continue?"
3. Studio routing, same as `game-help`: an In Progress story → `game-dev <path>`, or `game-done <path>` when the
   checkpoint or git says its code is written; else `nextReadyStory` → `game-dev <path>`; a Blocked story → its
   unblocking action; every story Complete → play the build, add the next stories with `game-tasks`, or raise rigor.
   At standard/full rigor, point to `game-help` for the phase ladder instead of rebuilding it here.
4. No studio stories: the checkpoint's `Next step`, else the open items of the last run.

One recommendation with the exact command to run, plus at most two alternatives.

## Step 6: Prepare the start
Offer, in one `ask_question` with multiple selection, only the items that apply:
- Refresh a stale checkpoint with the reconciled facts (block format in `game-session-end`).
- Fix or delete a memory file that turned out wrong.
- Commit leftover work (show files and a message), or leave it. Never discard changes without an explicit yes.
- `git pull` when behind.

An empty or dismissed answer is not a yes: write nothing. Writes follow `automation` from the studio protocol.
Commits always ask, and follow the user's commit rules.

Then preload what the next step needs, so the first working turn starts warm: the story file, the brief or GDD section
it cites, the files in `Files in progress`. Read them; do not summarize them back.

## Output
Under 30 lines, in the project `language`:

```
## Session start: <project> · <date>
**Last time:** <checkpoint task or last commit> (<Updated>)
**Since then:** <commits after the checkpoint, uncommitted work, or "nothing">
### ⚠ Needs attention
- <judged signal> → <action>
### Workbench
Editor: <ready | not open | N compile errors> · Branch: <branch> (<ahead/behind>)
### → Next step
**<what>**: <why, one line>. Run: `<skill or command>`
Alternatives: <a> · <b>
### Ready for you
- <files preloaded, fixes offered>
```

Leave out a section that has nothing in it.

## Rules
- Read-only, except what the user approves in Step 6.
- One primary recommendation. Never run the next skill yourself.
- Report what the facts show; when a fact is missing (no checkpoint, Editor closed), say so instead of guessing.
