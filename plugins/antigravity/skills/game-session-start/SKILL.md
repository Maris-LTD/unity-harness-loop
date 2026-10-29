---
name: game-session-start
description: Open a new conversation on a Unity harness project - read the checkpoint, git, run logs, decision log and memory left by earlier sessions, flag drift, check the Editor, recommend one next step and preload what it needs. Use at the start of a session or for "resume", "where was I", "bắt đầu phiên mới", "tiếp tục dự án", "kiểm tra trạng thái dự án".
---

# Session start


Orientation for a fresh conversation, built on what earlier sessions left behind. Read-only, except the fixes the
user approves in Step 6. It recommends the next skill and never runs it. Its partner is `game-session-end`, which
writes the checkpoint, decision log and memory this skill reads.

## Steps 1-5: Delegate to the scout
Antigravity skills cannot pick a model, so the read-heavy part runs in a cheaper subagent. It keeps `session brief` JSON,
memory files and logs out of this conversation.

Invoke `invoke_subagent` with the `session-scout` subagent. Request: "Orient on this project: project root `<cwd>`, `language` from
`unity-harness config`." It collects the facts, reads memory and logs, reconciles drift, checks the workbench and
chooses the next step, then returns the report described under Output. Do not repeat its reads.

Show the report as it is. When it says `hasConfig: false` or no Unity project, the next step is `unity-init` or
`game-setup`; stop there. When the invocation fails or returns nothing usable, run `unity-harness session brief --json`
yourself and continue by judgment.

Treat the report as facts to verify only where it matters: before editing a file it names, open it.

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
