---
name: unity-harness-project-setup
description: Create or prepare a Unity project for the unity-harness loop - packages, git, harness config, Editor ready, clean baseline commit. Use for "tạo project Unity mới", "setup project cho harness", "init unity-harness".
---

# Unity project setup for the harness loop

The goal is a project that the `unity-feature` workflow can start on: Editor `ready`, `unity-harness compile` PASS,
and a clean git tree with a baseline commit. The workflow diffs against that baseline, and its tree guard needs a
clean start.

Run the scripts in this skill's `scripts/` folder from **Bash**, as `bash <skill dir>/scripts/<name>.sh` or
`node <skill dir>/scripts/<name>.js`. They need `unity`, `node` and `python` on `PATH`.

| Script | Purpose |
|---|---|
| `create_project.sh <target> <editor> [template]` | Create a project in `<target>`, even when it already has files such as `References/`. It builds in `<parent>/_create_<name>` and then moves the project in. Default template: `com.unity.template.urp-blank` |
| `edit_manifest.js [--project d] --add id@ver --remove id` | Add, change or remove packages in `Packages/manifest.json` |
| `configure_harness.js --tests A --include p1,p2 --scene S --expect T` | Fill `.unity-harness/config.json` after `unity-harness init` |
| `wait_editor_ready.sh <project> [timeoutSec]` | Poll `unity status` until this project's Editor is `ready` (default 900 s) |

## 1. Survey and decide
- `ls -a <target>`. If `ProjectSettings/ProjectVersion.txt` already exists, skip step 2.
- `unity editors --json --no-banner` lists the installed Editors and their modules. Recommend the version that has
  both the iOS and Android modules and matches the user's sibling projects. Ask the user when there is more than one.
- Check `which unity-harness`. If it is missing: `npm i -g github:Maris-LTD/unity-harness-loop`.
- Fix the names now, because the config, the feature brief and the code must all use the same ones:
  - code folder `Assets/<Game>/`
  - asmdefs `<Game>.Runtime`, `<Game>.Editor`, and `<Game>.Tests.EditMode`
  - scene `Assets/<Game>/Scenes/Game.unity`
  - a bootstrap MonoBehaviour `<Game>Game`, which smoke checks for

## 2. Create
```bash
bash <skill>/scripts/create_project.sh "C:/Users/me/Works/MyGame" 6000.3.16f1
```
- Template ids depend on the Editor version. On 6000.3, `com.unity.template.universal-3d` does not exist; use
  `com.unity.template.urp-blank` for 3D URP. To list them: `unity templates list --editor <ver> --json --no-banner`.
- If the script fails, it removes the staging folder. A name conflict leaves the new project in staging, and the
  script says so.

## 3. Packages
```bash
unity pipeline install --project-path "$(cygpath -w "$PWD")" --package-version 0.8.0-exp.1 --json --no-banner
node <skill>/scripts/edit_manifest.js --add com.unity.ai.assistant@2.20.0-pre.1 \
  --remove com.unity.visualscripting --remove com.unity.collab-proxy --remove com.unity.multiplayer.center
```
- Take the versions from a sibling project the user already runs on the same Editor; the values above worked on
  6000.3.16f1. `unity pipeline list-versions` shows the pipeline versions.
- Removing the template extras is a default, not a rule. Keep any of them the user wants.

## 4. Git
- Copy `.gitignore` from a sibling project, or use the standard Unity one.
- Then check that it does not hide files this project must version. A real case: the foodhunt `.gitignore` ignored
  `.claude`, `docs` and `memory`, which blocked the in-repo memory. Test with:
  `git check-ignore -v Docs/x.md .claude/memory/MEMORY.md || echo "not ignored"`.
  Fixes are in the `project-memory-in-repo` skill.
- `git init -b main`.

## 5. Harness config
```bash
unity-harness init
node <skill>/scripts/configure_harness.js --tests MyGame.Tests.EditMode \
  --include Assets/MyGame/Scripts/,Assets/MyGame/Tests/ \
  --scene Assets/MyGame/Scenes/Game.unity --expect MyGameGame
```
- On a fresh project, `init` picks `SampleScene` and finds no tests. Point the config at the names from step 1, even
  though the files do not exist yet. The feature brief must name them the same way.
- `unity-harness init` creates `.unity-harness/.gitignore`, which ignores `state/` and `runs/`. Commit `config.json`.
- Commit now: `git add -A && git commit -m "Init <engine> project <Game>"`. This keeps the Editor's first-import
  changes in a separate commit.

## 6. Open the Editor and wait
- `unity projects open "<win path>" --json --no-banner` can outlast a 2-minute tool timeout while the first import
  runs. Start it in the background, then run
  `bash <skill>/scripts/wait_editor_ready.sh <project> 900`.
- On a timeout, the script prints `unity pipeline list`. `hasPipelinePackage: false` means step 3 did not apply.
  `safeMode` means compile errors; read `Logs/` or the Editor console.
- With several Editors open, `unity command` and `unity-harness` find the target from the current directory. Run
  them from the project root, or set `UNITY_PROJECT_PATH`.

## 7. Baseline
- `unity-harness compile` must PASS.
- The Editor rewrites `Packages/packages-lock.json`, URP assets, and adds `ProjectSettings/Packages/`. Commit them as
  the second baseline, e.g. "Add pipeline and AI assistant packages". `git status --short` must be empty before the
  feature run starts.
- Offer the project memory store (`project-memory-in-repo` skill) if the project has none.

## Report
State the Editor version, template, packages added and removed, the config values (tests, include paths, scene,
expectTypes), and the baseline commit hashes.

## Gotchas
- The Unity CLI takes Windows paths (`C:\...`). In Git Bash, convert with `cygpath -w`.
- Git's `LF will be replaced by CRLF` warnings on Unity files are harmless.
- Only open the project with the Editor version that created it. A different version triggers an upgrade.
- If the user asks to push, `git push` can be blocked by the agent's permission rules. Give the user the command to
  run themselves (`! git -C <root> push -u origin main`), and do not try to work around the block.
