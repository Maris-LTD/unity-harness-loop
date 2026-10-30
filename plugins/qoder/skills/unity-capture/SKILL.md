---
name: unity-capture
description: Enter Play mode, force a game state (win, lose, a level) and capture Game view PNGs to check a visual change. Use after visual changes or for "chụp màn hình game", "xem thử trong play mode", "check UI thắng/thua".
---

# Play mode capture

Compiling and passing tests do not show what the player sees. The `unity-harness smoke` capture only shows the first
frames of the start scene, at the size of whatever the Game view is set to. Use this skill to look at the exact state
you changed.

Run the scripts in this skill's `scripts/` folder from **Bash** at the Unity project root, as
`bash <skill dir>/scripts/<name>.sh`. They need `unity` and `python` on `PATH` and an Editor in state `ready`.
With several Editors open, `unity command` picks the target from the current directory; set `UNITY_PROJECT_PATH`
otherwise. Read `references/gotchas.md` when something looks wrong.

| Script | Purpose |
|---|---|
| `gameview_size.sh <w> <h>` | Set the Game view to a fixed resolution (added as a custom size if missing) |
| `play.sh <Full.Type> [timeoutSec]` | Turn on `PlayerSettings.runInBackground` (so Play mode runs while the Editor is unfocused), enter Play mode and wait until an object of that type exists, then settle `SETTLE` seconds (default 1.5) |
| `eval.sh <file.cs>` / `eval.sh -e '<code>'` | Run C# statements in the Editor (must end with `return`) and print the result |
| `capture.sh <out.png> [w h]` | Capture what the Game window shows (default 1080x1920) to a file outside `Assets/` |
| `stop.sh` | Leave Play mode, confirm it stopped, and restore `runInBackground` if `play.sh` turned it on |

## Before you start
- **Ask first if the user may be playing.** Entering Play mode takes over their session. Never clear saved progress
  (e.g. `PlayerPrefs`) without asking.
- **Wait for the compile.** Run `unity-harness compile`, or wait for a recompile to finish. An eval sent while the
  domain reloads fails, or runs against the old code.
- **Use a fixed size.** Run `gameview_size.sh 1080 1920` for a portrait phone (or the target aspect), and capture at
  the same size. A capture at another aspect is stretched and tells you nothing about layout.

## Procedure
1. `bash play.sh MyGame.MyGameGame`. Pass the bootstrap type, or whatever exists once the scene is ready.
2. Force the state with an eval file in the scratchpad. Use full type names, because no namespaces are imported.
   Prefer the game's public API (view methods, panel `Show...` calls) over faking input. Examples from Snap Jam 3D:
   ```csharp
   var v = UnityEngine.Object.FindObjectsByType<SnapJam.BandView>(UnityEngine.FindObjectsSortMode.None)[0];
   v.SetPull(0, new UnityEngine.Vector2(0.9f, 1.0f)); v.SetWidth(0.13f); v.Glow.SetIntensity(1f);
   return v.name;
   ```
   ```csharp
   var p = UnityEngine.Object.FindAnyObjectByType<SnapJam.EndPanelView>(UnityEngine.FindObjectsInactive.Include);
   p.ShowWin(2); return 1;
   ```
3. Wait 1-2 s for pop-in animations to settle, then `bash capture.sh <scratchpad>/cap_<state>.png`.
4. Repeat steps 2 and 3 for each state in the same Play session: HUD, peak interaction, win, lose.
5. `bash stop.sh`. Always run it, even after a failure.
6. Open the PNGs with the Read tool. Check that the change is visible and correct. If it is missing, inspect it with
   an eval (component present? active? rect size? canvas mode and camera?) instead of guessing. See the gotchas.
7. Run `git status --short` and restore any serialization noise from Play mode or evals.

## Token budget
Each image costs about 1.5k tokens. Capture every state you need, but open only the ones that answer the question.
If the `unity-ui-reskin` skill is installed, use its `stack_images.sh` to put the reference image next to a capture,
or several states side by side, in a single image.

## Report
For each change, say which state was captured, at what size, and what the image shows. A list of PASS lines with no
capture behind them is not a visual check.
