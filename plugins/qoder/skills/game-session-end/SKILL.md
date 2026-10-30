---
name: game-session-end
description: Close a working session so the next conversation can resume cold - rewrite the session checkpoint, add a session note, log decisions, update project memory and list what is left uncommitted. Use at the end of a session or for "wrap up", "save progress", "kết thúc phiên", "lưu trạng thái", "chốt phiên làm việc".
---

# Session end

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

Writes the handoff that `game-session-start` reads next time. Everything it records must come from this session's
conversation, git or the files, never from guesses.

While a workflow that guards the working tree is running (e.g. `unity-dev`), any write to the project voids its verify
step. Stop and ask the user to run this skill after the run finishes.

## Step 1: Gather
- `unity-harness session brief --json`: changed and untracked files, commits after the old checkpoint, recent runs,
  studio status, memory folders. `unity-harness studio config` for `paths` and `automation`.
- This conversation: what was done, decisions and their reasons, user preferences or corrections, facts that cost
  time to find, open questions, what was promised next.
- If neither shows any work this session, say so and offer to stop without writing.

## Step 2: Draft the handoff
Draft every item, then show them together (path and content).

1. **Checkpoint.** Overwrite (never append) the block between `<!-- CHECKPOINT -->` and `<!-- /CHECKPOINT -->` in
   `paths.sessionState`. Create the file with just this block if it is missing; if it exists without markers, insert
   the block at the top. Keep these keys: `unity-harness studio status`, `game-help` and `game-dev` read them.
   ```
   <!-- CHECKPOINT -->
   Updated: <YYYY-MM-DD>
   Branch: <current branch>
   Current story: <story path | none>
   Current task: <what was being done, one line>
   Next step: <the exact skill or command to run first next time>
   Blocked on: nothing | <what>
   Files in progress: <uncommitted files that are work | none>
   Run result: <the last harness result line from this session, if any>
   Open questions: none | <question - who decides>
   <!-- /CHECKPOINT -->
   ```
   `Next step` must be runnable as written (`game-dev Docs/.../story-008-x.md`, not "continue the work").
2. **Session note.** Below the block, add `## Session <YYYY-MM-DD>` with 3-6 bullets: what got done (with commit
   hashes), what is half done and where, gotchas worth knowing next time. When the file passes ~150 lines, fold the
   oldest notes to one line each.
3. **Decision log.** For each real decision this session (scope, design, technical choice, process preference),
   append `- <YYYY-MM-DD> session: <decision> (<why>)` to `paths.decisionLog`; create it with a `# Decision log`
   header if missing. Routine steps are not decisions.
4. **Memory.** For each durable fact: update the file that already covers it, add a new file plus its index line, or
   fix or delete a file that proved wrong.
   Write to `.claude/memory/` (the repo copy) when it exists, using the memory format of this harness: frontmatter
   `name`, `description`, `metadata.type`; project and feedback files end with `**Why:**` and `**How to apply:**`.
   If it does not exist, recommend `game-memory` instead of creating it here.
   Skip what git or the code already records, secrets, and details that only mattered in this conversation. Use
   absolute dates.
5. **Leftovers.** Group uncommitted files into work and Editor noise. Propose a commit message for the work. Do not
   commit.

## Step 3: Approve and write
Ask with `AskUserQuestion` according to `automation`:
- `collaborative`: one approval for the whole set of files.
- `guided`: the checkpoint, session note and decision log are updates and go ahead after a one-line summary; new files
  and memory changes ask first.
- `autonomous`: write everything; the decision log already records the decisions.

An empty or dismissed answer is not approval: write nothing and ask again in plain text. Commits always ask, and follow
the user's commit rules (for example, no AI attribution lines).

## Step 4: Verify the handoff
Run `unity-harness session brief` again. The checkpoint must now be the newest record: no
`commits-after-checkpoint` except commits the user chose to leave out, and `Next step` filled. Fix the draft if not.

## Output
```
## Session saved
Checkpoint: <path> · Next: <next step>
Logged: <N decisions> · Memory: <files added/updated/deleted, or none>
Left uncommitted: <N files> → <suggested commit, or "clean">
Next conversation: run `game-session-start`.
```
