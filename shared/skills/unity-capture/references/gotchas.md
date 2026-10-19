# Gotchas (read when a capture looks wrong or a script fails)

- **Nothing but the background in Edit mode:** a game that builds its scene at runtime (a bootstrap MonoBehaviour plus
  factories) only shows the camera background outside Play mode. Capture in Play mode.
- **Default capture is 1280x720:** `capture_game_view` without `--width/--height` returns 1280x720. A portrait game
  looks stretched in it. Set the Game view with `gameview_size.sh`, then capture at the same size.
- **A uGUI Graphic added from code draws nothing:** a `Graphic` subclass added with `AddComponent` at runtime renders
  nothing unless the GameObject has a `CanvasRenderer`. Add `AddComponent<CanvasRenderer>()` before the Graphic. A
  real case was a vertical gradient background that never showed.
- **The panel does not show on the first try:** Play mode was entered right after a recompile, so the eval ran during
  the domain reload. Run `play.sh` again and send the eval after it reports the type found.
- **Eval timeouts (5000 ms on the main thread):** the Editor did not answer in time, usually because it is busy or
  throttled in the background. On a timeout the scripts call `editor_focus` once and retry; if it still times out,
  run it again.
- **Play mode frozen while the Editor is unfocused** (`Time.frameCount` does not advance): `PlayerSettings.runInBackground`
  is off. `play.sh` turns it on and `stop.sh` restores it, so always leave Play mode with `stop.sh`. If game code
  turns it off again, re-run `eval.sh -e 'UnityEditor.PlayerSettings.runInBackground = true; return 0;'`.
- **Line comments break evals:** `_eval.sh` joins lines with spaces, so a `//` comment swallows the rest of the
  code. Do not put comments in eval files.
- **The wrong level loads:** saved progress (e.g. `PlayerPrefs` level key) decides what Play mode starts on. A smoke
  capture once showed "Level 2" for this reason. Read the key with an eval before judging. Do not delete it without
  asking.
- **The state leaks:** changes to scene objects are discarded when Play mode stops, but ScriptableObject edits stay
  in memory. A later `AssetDatabase.SaveAssets` writes them to disk. Set them back, then `git diff` the asset.
- **`--save_path` writes into `Assets/`:** `capture_game_view --save_path` only accepts project-relative paths and
  creates `.meta` files. `capture.sh` decodes the inline base64 into any path instead.
- **`gameview_size.cs` uses internal API** (`GameViewSizes` through reflection). If a Unity upgrade breaks it, set the
  size in the Game view toolbar and tell the user.
- **Exit Play mode:** `editor_play` only enters it. Use `stop.sh`; it falls back to `EditorApplication.isPlaying = false`.
