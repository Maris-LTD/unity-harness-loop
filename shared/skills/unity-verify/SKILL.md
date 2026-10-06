---
name: unity-verify
description: Verify Unity changes end to end with the unity-harness CLI — coding-rule check on changed .cs files, recompile, EditMode tests, and a Play mode smoke run with a Game view capture and console error scan. Use after implementing or fixing anything in C#/scenes/prefabs, before saying work is done, or when the user asks to "verify", "kiểm tra", "chạy test", "smoke test", "chạy thử game", "check compile và test".
---

# unity-verify

Single entry point: `unity-harness <mode>`, run from a shell at the Unity project root (or pass `--project <dir>`).

If the command is missing, tell the user to install it once with `npm i -g github:Maris-LTD/unity-harness-loop`. If the project has no `.unity-harness/config.json`, run `unity-harness init`, show the user what it detected, and ask them to confirm `smoke.waitForScene` and `smoke.expectTypes` before relying on smoke.

| Mode | Steps | When |
|---|---|---|
| `rules` | static rule check on changed `.cs` | quick lint, no Editor needed |
| `compile` | recompile + wait for result | after any C# edit |
| `tests` | compile + EditMode tests | logic changes |
| `all` | rules + compile + tests | default before reporting done |
| `smoke` | compile + Play mode until `waitForScene` loads, assert `expectTypes` exist, missing-script scan, console errors, capture | scene/prefab/UI/runtime flow changes |
| `full` | all + smoke | end of a feature |

Options: `--assemblies A,B` (limit tests), `--files f1,f2` (limit rules), `--json` (machine-readable).
Exit codes: `0` pass, `1` blocking failures, `2` Editor not ready (checks skipped), `64` bad usage.

Config lives in `.unity-harness/config.json` of the Unity project; `unity-harness config` prints the effective values (test assemblies, rule switches and include paths, smoke scene and expectations, stop-gate switches).

Requirements: Node 18+, the Unity CLI (`unity`) on PATH, and an open Editor whose project has the `com.unity.pipeline` package (`unity status --json --no-banner` must list it as `ready`).

Smoke keeps the Editor in the foreground by itself on Windows: it refocuses the Editor window every `smoke.focusIntervalMs` and stops when smoke ends, because an unfocused Editor stalls Play mode (typically on a loading screen). Do not add a separate focus loop. Warn the user that smoke steals window focus while it runs.

## Procedure

1. Pick the narrowest mode that covers the change; use `all` when unsure, `full` for features touching runtime flow.
2. Run it. If exit `2`, ask the user to open the Editor for this project, do not loop.
3. For each `x` line: fix the cause in code, rerun the same mode. Max 3 fix rounds, then report what is left.
4. Smoke writes a capture (`smoke.capturePath`, default `Temp/harness/smoke.png`): open it and describe what is on screen; flag anything visibly broken.
5. `!` lines are warnings: mention them, do not block on them.
6. After smoke or any scene/asset change, run `git status --porcelain` and restore noise Unity serialized on its own.

## Report format

```
Verify: <mode>
- rules:   PASS/FAIL (n files)
- compile: PASS/FAIL
- tests:   <Assembly> passed/total, ...
- smoke:   PASS/FAIL (+ one line about the capture)
Remaining issues: <none | list>
```

## Notes

- This skill only reports. Never "fix" a failing rule by deleting existing comments or Debug logs; if the rule check flags moved/old content, treat it as a harness bug and report it.
- The rule check is rename-aware (`git diff -M` + untracked↔deleted pairing by file name): content that only moved is not "new".
- Rules enforced statically, each switchable in `rules`: no new comments (`noComments`), no new `Debug.Log*` (`noDebugLog`), `CompareTag` instead of `.tag ==` (`compareTag`), file length ≤ `maxLines` (warning only if the file was already over). SRP, GC alloc in `Update`, `GetComponent` caching are judged by the `unity-reviewer` agent, not this script.
- The agent's stop hook already runs rules + compile on `.cs` files changed in the session; this skill is the deeper, on-demand pass.
- Do not run two harness commands at once: there is a single Editor.
