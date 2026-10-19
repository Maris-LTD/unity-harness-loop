# unity-harness-loop

A verification loop for Unity projects worked on by AI coding agents. One CLI (`unity-harness`) does the checks; thin plugins make **Claude Code** and **Google Antigravity** use it.

| Check | What it does |
|---|---|
| `rules` | Static check of the `.cs` lines you added (rename-aware; a flagged line counts as moved, not new, when the same line was removed from a `.cs` file in the same change): no new comments, no new `Debug.Log*`, `CompareTag`, max file length. Each rule can be switched off. |
| `compile` | Asks the open Editor to recompile and waits for the result. |
| `tests` | Runs EditMode test assemblies. |
| `smoke` | Enters Play mode, waits for a scene, checks that components exist, scans for missing scripts and console errors, saves a Game view capture. Runs with the Editor in the background: it turns on `PlayerSettings.runInBackground` for the run and restores it afterwards, because with it off an unfocused Editor stops ticking Play mode. |
| `all` / `full` | `rules + compile + tests` / `all + smoke`. |

On top of that:
- **Stop gate** (Claude Code and Antigravity): when the agent tries to finish a turn after editing `.cs` files, it runs `rules + compile` and sends the agent back to fix failures (up to `stopGate.maxBlocks` times). On Antigravity, it respects `terminationReason` (`USER_CANCELED`, `ERROR`, etc.) and only blocks normal completions (`NO_TOOL_CALL`).
- **Read-only guard** (Claude Code): a `PreToolUse` hook denies `Write`/`Edit` and file-writing Bash commands (redirection outside `$TEMP`, `rm`/`mv`/`cp`/`tee`, `sed -i`, tree-changing `git`, asset-saving `unity command`) to `unity-verifier`, `unity-reviewer`, `run-log-auditor` and `plan-loader`. (Note: on Antigravity, `PreToolUse` is intentionally excluded because Antigravity's PreToolUse IPC payload does not identify the calling agent, avoiding unsafe blanket permission grants).
- **Agents**: `unity-verifier` (read-only pass/fail verdict), `unity-reviewer` (diff review against Unity rules), and specialized studio/engineering subagents for both platforms.
- **Workflow & Feature Loop**: `unity-feature` plans → implements → verifies and reviews → fixes → writes an audited run report under `.unity-harness/runs/`. Supported as a Claude Code workflow (`unity-harness:unity-feature`) and an Antigravity skill (`unity-feature`, with dynamic Python runner `workflows/unity_feature.py`).
- **Skill `unity-juicy-anim`**: recipes and reference C# for jelly-style DOTween animations (squash/stretch lift and land, punch, hop with a content swap, slot row shift, merge, shuffle into a container that pours them back), a procedural prop mesh script, and a way to verify animations in Play mode from the CLI. It came out of the Food Hunt boosters.
- **Skill `unity-ui-reskin`**: reskin or rebuild uGUI prefabs to match a mockup with a given sprite folder, sync sibling prefabs (page vs popup), and verify the result before reporting: a numeric audit (stretched art, crushed 9-slices, text overflow) against a baseline, plus real Game view captures at phone, 16:9 and tablet resolutions. Ships Bash + `unity command eval` scripts for prefab dump/edit, audit, Game view sizing/capture, and image crop/stack.
- **Skill `penpot-game-ui`**: design mobile game screens and popups directly in Penpot through the Penpot MCP, from a sprite pack and an optional demo image, under fixed UI/UX rules: button color by intent (Primary green / Secondary blue / Negative red, Play by difficulty), text outline matching the button, optical icon sizing, one theme across header/navbar/popups, soft shade under header and navbar, glow. Ships a JS helper library for `execute_code` (design tokens, 3D button components with variants, gradient + dot background, shades, an `audit` for the rules), the rules sheet and a gotchas list. Does not need the Unity Editor.
- **Skill `unity-ref-to-prototype`**: turn a `References/` folder (target image, HTML/JS demo, pasted brief) into a Vietnamese gameplay-only GDD plus a playable prototype built by `unity-feature`. Ships the GDD prompt template, the workflow brief template, and the test patterns that tie every GDD number to the tuning class and prove every level solvable. It came out of Snap Jam 3D.
- **Skill `unity-harness-project-setup`**: create a Unity project with the CLI, also into a folder that already holds references; add `com.unity.pipeline` and `com.unity.ai.assistant`; set up git and `unity-harness init` with the real names; wait for the Editor to be ready; commit a clean baseline. Ships scripts for project creation, manifest edits, harness config and the Editor ready wait.
- **Skill `project-memory-in-repo`**: keep agent project memory in `.claude/memory/` under git, link Claude Code's memory folder to it (junction/symlink scripts that merge existing files and stop on conflicts), and fix `.gitignore` rules that hide it.
- **Skill `unity-playmode-capture`**: enter Play mode, wait for a component, force a state with an eval (peak interaction, win/lose panel), capture the Game view at a phone resolution, then leave Play mode. Ships Bash scripts plus a gotchas list.
- **Skill `unity-feedback-tweak`**: apply a play-test feedback round without rerunning the workflow, keeping rule code, tests, tuning, GDD and memory in sync, with an on-screen check for each change.
- **Skill `audit-agent-plugin`**: a 6-point audit runbook (IPC fidelity, permission safety, lifecycle termination, type robustness, semantic skill portability, subagent tool compatibility) for agent plugins.
- **Studio workflow** (skills `studio-*`, both agents): a Unity-only port of [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) — see [Studio workflow](#studio-workflow).

## Studio workflow

A brief → stories → done pipeline with director, lead and specialist agents, adapted from Claude Code Game Studios (MIT, see `THIRD_PARTY_NOTICES.md`) to Unity and to both Claude Code and Antigravity. Implementation and verification go through this harness: `studio-dev-story` runs the `unity-feature` workflow on Claude Code and the programmer agents plus `unity-harness all` on Antigravity; `studio-story-done` closes a story only with passing harness checks and, for anything the player sees, a kept screenshot.

| Skill | Does |
|---|---|
| `studio-start` | Onboarding: where you are, then rigor (`minimal`/`standard`/`full`) and automation (`collaborative`/`guided`/`autonomous`) |
| `studio-setup` | Records Unity version, render pipeline, input system, platforms and budgets; checks the EditMode test asmdef |
| `studio-brainstorm` | One-page game brief (minimal) or full game concept (standard/full) |
| `studio-map-systems`, `studio-design-system`, `studio-design-review` | Systems index, one GDD per system (sections per tier), GDD review |
| `studio-create-architecture`, `studio-architecture-decision`, `studio-create-control-manifest`, `studio-architecture-review` | Architecture doc mapped to asmdefs/services/ScriptableObjects, ADRs, the per-layer rules sheet, GDD→ADR traceability |
| `studio-gate-check` | Phase transition check with the director panel; advances `stage` on PASS |
| `studio-create-epics` | Epics from GDDs or the concept (standard/full) |
| `studio-create-stories` | Implementable stories with type, acceptance criteria and evidence |
| `studio-story-readiness` | READY / NEEDS WORK / BLOCKED check before implementation |
| `studio-dev-story` | Implements one story through the harness |
| `studio-story-done` | Verifies criteria and evidence, reviews, closes the story, names the next one |
| `studio-code-review`, `studio-qa-plan` | Architectural review on top of `unity-reviewer` and the harness; sprint QA plan |
| `studio-sprint-plan`, `studio-sprint-status` | Sprint plan and a read-only burndown snapshot |
| `studio-help` | Reads the project state and names the next step |
| `unity-engine-reference` | Unity 6.x API changes, deprecations and best practices to check before using an unfamiliar API |

Agents: `creative-director`, `technical-director`, `producer`, `game-designer`, `art-director`, `lead-programmer`, `qa-lead`, `qa-tester`, `gameplay-programmer`, `ui-programmer`, `ai-programmer`, `engine-programmer`, `unity-specialist` and the `unity-ui`/`shader`/`addressables`/`dots` specialists. The 22 review gates (CD-PILLARS, TD-ARCHITECTURE, PR-EPIC, QL-STORY-READY, LP-CODE-REVIEW, the four phase gates, ...) live in the owning agent and run according to the review mode that rigor implies (`minimal` → none).

Settings live in the `studio` block of `.unity-harness/config.json`, written only through the CLI:

```bash
unity-harness studio config            # resolved settings, rigor expansion, document paths
unity-harness studio set rigor=standard automation=guided
unity-harness studio status            # brief, epics, stories by status, sprint, evidence
```

Documents go to `Docs/` (outside `Assets/`, change with `docsRoot`): `design/game-brief.md`, `design/gdd/`, `architecture/` (architecture doc, `adr-NNNN-*.md`, control manifest, TR registry), `production/epics/<epic>/story-NNN-*.md`, `production/sprints/`, `production/qa/evidence/`, `production/session-state/active.md`. The always-on rules (collaboration loop, automation modes, gates, evidence) are `lib/studio-protocol.md`: Claude Code gets them from the session-start hook in studio projects, Antigravity from the plugin's `rules/AGENTS.md`.

Not ported yet: prototype/vertical slice, art bible, UX, cross-GDD review, team orchestration, release, localization. The skills name a fallback where one of these would come next.

## Requirements

- Node.js 18+
- [Unity CLI](https://docs.unity.com) (`unity`) on `PATH`
- The Unity project open in the Editor, with the `com.unity.pipeline` package installed (`unity status --json --no-banner` lists it as `ready`)
- Git (the rule check and run logs read `git diff`)

## Install

### 1. The CLI (once per machine)

```bash
npm i -g github:Maris-LTD/unity-harness-loop
unity-harness --help
```

Update later with the same command.

### 2. Set up a Unity project (once per project)

```bash
cd <unity-project>
unity-harness init
```

This creates `.unity-harness/config.json` (commit it so the team shares it) and `.unity-harness/.gitignore` (ignores `state/` and `runs/`). `init` fills `smoke.scene` from the first enabled build scene and `testAssemblies` from EditMode test asmdefs. Review it, then set at least:

- `rules.includePaths`: folders whose `.cs` files the rules and the reviewer cover
- `smoke.waitForScene`: scene that must be loaded for smoke to pass
- `smoke.expectTypes`: component type names that must exist once it is loaded
- `smoke.ignoreErrorPatterns`: regexes for console errors that are expected in the Editor
- `smoke.runInBackground` (default `true`): turn on `PlayerSettings.runInBackground` during smoke so Play mode keeps running while the Editor is unfocused; restored after the run
- `smoke.keepFocus` (default `false`, Windows only): fallback that refocuses the Editor window every `smoke.focusIntervalMs` while smoke runs, for projects whose game code turns `runInBackground` off again

`unity-harness config` prints the effective config. The stop gate only runs in projects that have this file.

### 3a. Claude Code plugin

```
/plugin marketplace add Maris-LTD/unity-harness-loop
/plugin install unity-harness@unity-harness-loop
```

Or from a shell: `claude plugin marketplace add Maris-LTD/unity-harness-loop` and `claude plugin install unity-harness@unity-harness-loop`.

To offer it to everyone who opens a project, add to the project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "unity-harness-loop": { "source": { "source": "github", "repo": "Maris-LTD/unity-harness-loop" } }
  },
  "enabledPlugins": { "unity-harness@unity-harness-loop": true }
}
```

Run the workflow with the Workflow tool: `unity-harness:unity-feature` with `{ "task": "..." }` (options: `planOnly`, `planFile`, `smoke`, `assemblies`, `maxFixRounds`, `maxLogFixes`, `models`).

### 3b. Antigravity plugin

Antigravity installs plugins from a local folder:

```bash
git clone https://github.com/Maris-LTD/unity-harness-loop.git
agy plugin install unity-harness-loop/plugins/antigravity
```

Update with `git pull` and the same install command.

Run the feature loop via the `unity-feature` skill or dynamic Python runner:
```bash
python workflows/unity_feature.py --task "Implement ..." --smoke
```

## Usage

```bash
unity-harness all          # rules + compile + tests
unity-harness smoke        # Play mode smoke (the Editor can stay in the background)
unity-harness full --json  # everything, machine-readable
```

Exit codes: `0` pass, `1` blocking failures, `2` Editor not ready, `64` bad usage.

The project root is found from `--project <dir>`, then `UNITY_HARNESS_PROJECT`, then `CLAUDE_PROJECT_DIR`, then the nearest folder above the current directory that has `ProjectSettings/ProjectVersion.txt`.

## Repository layout

```
bin/, lib/                 the CLI (published by npm)
shared/                    single source for skills, agents and workflows
lib/studio-protocol.md     always-on studio rules (session-start hook, Antigravity rules/AGENTS.md)
plugins/claude-code/       generated Claude Code plugin
plugins/antigravity/       generated Antigravity plugin
.claude-plugin/            Claude Code marketplace manifest (generated)
scripts/build-plugins.js   regenerates plugins/ and the marketplace from shared/
```

Edit `shared/`, then run `npm run build:plugins` and commit the generated files. Bump `version` in `package.json` for every release so Claude Code sees the update.

## License

MIT, see `LICENSE`. The studio material adapted from Claude Code Game Studios stays under its own MIT notice in `THIRD_PARTY_NOTICES.md`.
