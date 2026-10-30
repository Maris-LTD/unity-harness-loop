---
name: game-setup
description: Record the Unity version, render pipeline, input system, platforms and budgets for the studio workflow, and handle Unity upgrades. Use for "setup engine", "setup unity", "cấu hình dự án", "nâng cấp Unity", "performance budget".
---

# Studio setup (Unity)

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

Unity is the engine; this skill never asks which engine. It records facts about the project, it does not create
one: `unity-init` creates projects.

Modes: no argument → setup or re-check. `upgrade` (or the installed version differs from the recorded
`unityVersion`) → read `references/upgrade.md` and follow it.

Helper scripts live in the sibling skill `unity-init/scripts/`: `configure_harness.js` (fills
`.unity-harness/config.json` after init) and `edit_manifest.js` (adds or removes packages).

## 1. Load
- `unity-harness where`, `unity-harness studio config` (workflow, paths, already recorded values),
  `unity-harness config` (testAssemblies, rules, smoke).
- No `ProjectSettings/ProjectVersion.txt` → there is no Unity project. Recommend `unity-init`
  (it also works in a folder that already holds `References/`) and stop.
- A missing brief is normal here: at minimal this skill runs before `game-concept`.

## 2. Harness config
- No `.unity-harness/config.json`: ask "May I run `unity-harness init`?" (config change, always asked). Show what it
  detected (`smoke.scene`, `testAssemblies`).
- Review with the user, as `unity-verify` requires before smoke is trusted: `rules.includePaths` (the game's code
  folders, e.g. `Assets/<Game>/`), `smoke.waitForScene`, `smoke.expectTypes`. Apply the approved values with
  `node <skills>/unity-init/scripts/configure_harness.js --include … --scene … --wait-scene <SceneName> --expect …`. Leave
  unknown values for later (no scene yet is fine) and say so.

## 3. Detect (read files, no questions yet)
| Fact | Where |
|---|---|
| Unity version | `m_EditorVersion` in `ProjectSettings/ProjectVersion.txt` (e.g. `6000.3.1f1`) |
| Render pipeline | `Packages/manifest.json`: `com.unity.render-pipelines.universal` → URP, `.high-definition` → HDRP, neither → Built-in; confirm a pipeline asset is assigned in `ProjectSettings/GraphicsSettings.asset` (`m_CustomRenderPipeline`) or quality levels |
| Input system | `com.unity.inputsystem` in the manifest, and `activeInputHandler` in `ProjectSettings/ProjectSettings.asset` (0 old, 1 new, 2 both) |
| Test framework | `com.unity.test-framework` in the manifest |
| Pipeline package | `com.unity.pipeline` (needed by the harness CLI; `unity status --json --no-banner` shows `ready`) |
| EditMode test asmdef | an `.asmdef` with `includePlatforms: ["Editor"]` referencing `UnityEngine.TestRunner` / `UnityEditor.TestRunner` and `nunit.framework.dll`; compare with `testAssemblies` |
| Game folder | the folder under `Assets/` holding the game's own code (`Assets/<Game>/`) |

If the Unity CLI is available, `unity status --json --no-banner` confirms the open Editor matches the project
version. A probe that fails means "not determined", never "not installed".

## 4. Version gap
- Pin: `unity-reference` → `references/VERSION.md` (Unity 6.3 LTS). Model knowledge: about 2022 LTS.
- Installed equal to the pin → say so in one line.
- Installed older than the pin (6000.0, 6000.1, 6000.2): APIs marked newer in the reference may not exist; agents
  must rely on `unity-harness compile`, and on the reference only for what predates the installed version.
- Installed newer than the pin: the reference may be stale; prefer the official docs for anything version-specific.
- Risk to the user: any Unity 6 version is HIGH knowledge risk for the model (training data ends around 2022 LTS),
  so agents check `unity-reference` before using an API they are unsure of.

## 5. Ask what cannot be detected
Ask with `AskUserQuestion`, one question at a time, only for values not already recorded:
- **Target platforms** (multi-select): Android, iOS, PC (Windows/Mac/Linux), WebGL, Console. Derive input
  defaults: mobile → touch primary, no gamepad; PC → keyboard/mouse, partial gamepad; console → full gamepad; web →
  partial both. Primary input depends on genre: if no brief or concept exists yet, ask instead of guessing, with
  "Leave unset" as a valid answer.
- **Performance budgets**: `Set defaults now` (60 fps; draw calls 100 mobile / 2000 PC; memory 1024 MB mobile /
  4096 MB PC) or `Leave for later` (0 = unset) when the target hardware is unknown. Show the numbers before saving.
- **Render pipeline / input system** only when detection was ambiguous (e.g. URP package present but no asset
  assigned, `activeInputHandler: 2`).

## 6. Test assembly
- `testAssemblies` empty, or no EditMode asmdef exists: offer to create `Assets/<Game>/Tests/EditMode/` with
  `<Game>.Tests.EditMode.asmdef` (references `<Game>.Runtime`, `UnityEngine.TestRunner`, `UnityEditor.TestRunner`;
  `includePlatforms: ["Editor"]`; `overrideReferences: true`, `precompiledReferences: ["nunit.framework.dll"]`;
  `defineConstraints: ["UNITY_INCLUDE_TESTS"]`). If `<Game>.Runtime` does not exist yet, say tests need the
  runtime code in its own asmdef first, and offer to create `Assets/<Game>/Scripts/<Game>.Runtime.asmdef` too.
- `com.unity.test-framework` missing: offer `edit_manifest.js --add com.unity.test-framework@<version>` (check the
  version the Editor ships with; do not guess one).
- After creating, update `testAssemblies` with `configure_harness.js --tests <Game>.Tests.EditMode` and run
  `unity-harness compile`. Tests outside an asmdef listed there never run ("0/0" is not a pass).

## 7. Save (one approval)
Show every value, then ask "May I save these studio settings?" and run:
`unity-harness studio set unityVersion=<v> renderPipeline=<URP|HDRP|Built-in> inputSystem=<new|old|both>
targetPlatforms=<a,b> targetFps=<n> drawCallBudget=<n> memoryBudgetMb=<n>`
(omit keys the user left unset). If `rigor` is not in `explicit` (from `studio config`), `game-start` has not run yet. Saving these keys does not
set rigor or automation; say that `game-start` will still ask them.

## 8. Repository hygiene
- Offer to add the folders of `paths.sessionState` and `paths.decisionLog` (default `Docs/production/session-state/`
  and `Docs/production/session-logs/`) to `.gitignore`: they are per-session scratch. Ask first.
- Check that `.gitignore` does not hide the docs root (`Docs/`), `.unity-harness/config.json` or `.claude/`; a copied
  Unity `.gitignore` sometimes does. Propose the fix, apply after approval.

## 9. Summary
```
Studio setup
- Unity:          <version> (pin 6.3 LTS: equal | older | newer)
- Knowledge risk: HIGH (Unity 6), check unity-reference
- Pipeline/input: <URP> / <new Input System>
- Platforms:      <list>, primary input <x>
- Budgets:        <fps> fps, <n> draw calls, <n> MB (or unset)
- Harness:        config <ok>, testAssemblies <list>, pipeline package <ok|missing>
- Saved:          <keys written> | not saved
```
Then the next step by `workflow`:
- minimal: `game-concept` (one-page brief) → `game-tasks` → `game-dev`.
- standard/full: `game-concept` (concept) if no concept yet; otherwise the systems design steps (not in this
  plugin yet, see `game-help`) → `game-epics`.

Verdict: **COMPLETE**, setup recorded (or **BLOCKED**: no Unity project).

## Guardrails
- Never guess a Unity version or a package version: read the project, or ask.
- Never overwrite recorded settings without showing old → new and getting approval.
- Do not generate engine reference docs from web searches. If the user asks for a refresh, research, report the
  findings with sources, and leave `unity-reference` unchanged unless they ask to edit it.
- Do not edit agent definitions; version awareness already lives in the protocol and the agents.
