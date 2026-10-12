---
name: project-memory-in-repo
description: Keep an agent's project memory (architecture, goals, work in progress, user preferences) inside the repo at .claude/memory/ so git versions it and teammates and other agents get it. Links Claude Code's auto-memory folder to it with a junction or symlink, and fixes .gitignore rules that hide it. Use when starting work in a project that has no saved context, or when the user says "tạo bộ nhớ ngữ cảnh", "lưu context dự án", "đưa memory vào git", "cập nhật context". Also use when memory and the repo have drifted apart, or a past session's memory landed in the wrong folder.
---

# Project memory in the repo

Layout: `.claude/memory/MEMORY.md` is the index (one line per file, no content), with one file per topic. Use these
four to start: `project-overview`, `tech-setup`, `architecture`, `current-work`. Templates are in
`references/templates.md`.

| Script | Purpose |
|---|---|
| `scripts/link_memory.ps1 -Project <root> [-DryRun]` | Windows. Points Claude Code's memory folder at `<root>/.claude/memory` with a junction (no admin rights needed). Moves files that only exist in the old folder into the repo first. Stops if both places have different versions of a file |
| `scripts/link_memory.sh <root> [--dry-run]` | macOS/Linux. The same, with a symlink |

Run the PowerShell one as `powershell -NoProfile -ExecutionPolicy Bypass -File <skill>/scripts/link_memory.ps1 -Project <root>`.
`-DryRun` only prints the paths.

## Where Claude Code looks
- Claude Code loads `<config>/projects/<slug>/memory/MEMORY.md`. `<config>` is `~/.claude` or `CLAUDE_CONFIG_DIR`.
  `<slug>` is the absolute path of the folder the session **started in**, with every character that is not a letter
  or digit replaced by `-`. Example: `C:\Users\Admin\Works\Rope` becomes `C--Users-Admin-Works-Rope`.
- If the session started in a parent folder, such as the home folder, its memory and transcript are filed under that
  folder's slug. `/resume` inside the project then cannot find the session. Tell the user to start the agent in the
  project root. To find a lost session, grep `<config>/projects/*/*.jsonl` for the project path.

## Steps
1. **Check what exists:** `ls .claude/memory`, plus `-DryRun` to see the agent folder. If memory exists, read it and
   update it instead of starting over.
2. **Ask once:** in a project with no memory, ask the user whether to create it and whether git should version it.
   Do not ask again in later sessions once it exists.
3. **Wait for workflows:** while a workflow that guards the working tree is running (e.g. `unity-feature`), any write
   to the project voids its verify step. Draft the files in the scratchpad and move them in after it finishes.
4. **Write the files.** Use the frontmatter `name`, `description`, `metadata.type` (`project`, `user`, `feedback`,
   `reference`). End project and feedback files with `**Why:**` and `**How to apply:**`. Write `architecture` and
   `current-work` from the real code once it exists, not from the plan.
5. **Link:** run `link_memory.ps1` or `link_memory.sh`. Check that `ls <agent memory>` lists the repo files.
6. **Unignore:** run `git check-ignore -v .claude/memory/MEMORY.md || echo "not ignored"` and fix the rule it
   prints. Repeat until it says `not ignored`. Typical fixes:
   - `.claude` → `.claude/*` followed by `!.claude/memory/` (a directory that is ignored as a whole cannot be
     re-included)
   - a bare `memory` (matches at any depth) → `/memory/`
   - `docs` hides `Docs/` on case-insensitive file systems; add `!/[Dd]ocs/` if the GDD lives there
7. **Commit** the memory together with the work it describes. Follow the user's commit rules (e.g. no AI attribution
   lines).
8. **Other agents:** agents without Claude Code's auto-memory (e.g. Antigravity) do not load this folder. Ask the
   user before adding a line to the rules file that agent loads (such as `AGENTS.md` or `GEMINI.md`):
   "Read `.claude/memory/MEMORY.md` and the files it links before working; update them when project facts change."

## Keeping it current
- Update `current-work` after each milestone and each round of user feedback. Record the changes, with absolute
  dates, and where they live in code.
- Save the user's taste as a preference, with the reason. Example: "dislikes red-pink tones; keep UI blue/turquoise".
- Save environment facts that cost time to find. Examples: a push blocked by permissions, so ask the user to run it;
  a capture tool that is landscape-only; "the user plays in the Editor, do not enter Play mode without asking".
- Do not store what the code or git history already says, secrets, or conversation-only details.
- When a fact turns out to be wrong, fix or delete the file. Do not add a second file that contradicts it.
