# Project Memory: unity-harness-loop

Verification harness and studio workflow for Unity projects driven by AI coding agents (Claude Code, Antigravity).

## Architecture & Structure
- `bin/unity-harness.js`: Main CLI entrypoint (`rules`, `compile`, `tests`, `smoke`, `all`, `full`, `studio`, `hook`, `run-log`).
- `lib/`:
  - `hooks.js`: Lifecycle hooks handler for `claude` and `antigravity` (`session-start`, `turn-start`, `stop`, `pre-tool-use`).
  - `readonly-guard.js`: PreToolUse guard preventing read-only agents (`unity-verifier`, `unity-reviewer`, etc.) from modifying files or running destructive shell commands.
  - `tree-guard.js`: Fingerprints working tree to detect unauthorized file changes.
  - `rule-checks.js`: Enforces C# coding standards (file length, comments, debug statements, SRP).
  - `studio.js` & `studio-status.js`: Studio workflow management and status scanning.
  - `studio-protocol.md`: Studio rules protocol.
- `shared/`: Source templates for skills, agents, and workflows.
- `scripts/build-plugins.js`: Compiles `shared/` into deployable plugins for `claude-code` and `antigravity`.
- `plugins/`:
  - `claude-code/`: Claude Code plugin.
  - `antigravity/`: Antigravity plugin (`plugin.json`, `hooks.json`, `rules/AGENTS.md`, `skills/`, `agents/`).

## Antigravity Integration Stance
- Hook contracts: `SessionStart` (injects studio status), `PreInvocation` (turn-start snapshot), `Stop` (stop-gate verification with terminationReason handling). Note: `PreToolUse` is excluded from Antigravity hooks.json because Antigravity's payload lacks caller identity, preventing safe discrimination without bypassing user permissions.
- Subagents: 22 studio & workflow agents (`plan-loader`, `run-log-writer`, `run-log-auditor`, `unity-verifier`, `unity-reviewer`, etc.) mapped with Antigravity tools (`view_file`, `write_to_file`, `replace_file_content`, `run_command`, `search_web`).
- Rules: `rules/AGENTS.md` automatically ingested by Antigravity.
- Workflows & Skills: `unity-dev` ported to both Antigravity skill (`skills/unity-dev/SKILL.md`) and dynamic Python workflow (`workflows/unity_dev.py`), running the 6-phase engineering loop (Init → Plan → Implement → Verify → Fix → Log).

## Lessons Learned & Technical Constraints
- [antigravity-gotchas.md](antigravity-gotchas.md): Technical lessons and analysis on Antigravity IPC, permission safety, Stop hook terminationReason handling, and defensive payload parsing.
