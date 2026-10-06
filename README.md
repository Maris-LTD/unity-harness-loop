# unity-harness-loop

A verification loop for Unity projects worked on by AI coding agents. One CLI (`unity-harness`) does the checks; thin plugins make **Claude Code** and **Google Antigravity** use it.

| Check | What it does |
|---|---|
| `rules` | Static check of the `.cs` lines you added (rename-aware): no new comments, no new `Debug.Log*`, `CompareTag`, max file length. Each rule can be switched off. |
| `compile` | Asks the open Editor to recompile and waits for the result. |
| `tests` | Runs EditMode test assemblies. |
| `smoke` | Enters Play mode, waits for a scene, checks that components exist, scans for missing scripts and console errors, saves a Game view capture. Keeps the Editor window in the foreground for the whole run (Windows), because an unfocused Editor stalls Play mode. |
| `all` / `full` | `rules + compile + tests` / `all + smoke`. |

On top of that:
- **Stop gate** (Claude Code and Antigravity): when the agent tries to finish a turn after editing `.cs` files, it runs `rules + compile` and sends the agent back to fix failures (up to `stopGate.maxBlocks` times).
- **Agents**: `unity-verifier` (read-only pass/fail verdict) and `unity-reviewer` (diff review against Unity rules) for both agents.
- **Workflow** (Claude Code only): `unity-harness:unity-feature` plans → implements → verifies and reviews → fixes → writes an audited run report under `.unity-harness/runs/`.

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

## Usage

```bash
unity-harness all          # rules + compile + tests
unity-harness smoke        # Play mode smoke (steals window focus while it runs)
unity-harness full --json  # everything, machine-readable
```

Exit codes: `0` pass, `1` blocking failures, `2` Editor not ready, `64` bad usage.

The project root is found from `--project <dir>`, then `UNITY_HARNESS_PROJECT`, then `CLAUDE_PROJECT_DIR`, then the nearest folder above the current directory that has `ProjectSettings/ProjectVersion.txt`.

## Repository layout

```
bin/, lib/                 the CLI (published by npm)
shared/                    single source for skills, agents and workflows
plugins/claude-code/       generated Claude Code plugin
plugins/antigravity/       generated Antigravity plugin
.claude-plugin/            Claude Code marketplace manifest (generated)
scripts/build-plugins.js   regenerates plugins/ and the marketplace from shared/
```

Edit `shared/`, then run `npm run build:plugins` and commit the generated files. Bump `version` in `package.json` for every release so Claude Code sees the update.
