# Gotchas (read when a script fails or behaves oddly)

- `unity command eval` needs statements plus `return`. Use full type names, because namespaces are not imported. A
  wrong name shows up as an empty or failed result.
- `LoadPrefabContents` roots cannot be reparented. To measure one in a temporary canvas, use
  `PrefabUtility.InstantiatePrefab`.
- `capture_game_view --save_path` always writes under `Assets/` (it creates `Assets/Temp` + `.meta`), and it rejects
  paths outside the project. `capture_game_view.sh` decodes the inline base64 instead.
- `gameview_size.cs` uses the internal `GameViewSizes` through reflection. If a Unity upgrade breaks it, set the size
  in the Game view toolbar.
- Navigation in Play mode may be blocked by gates such as entry sequences or swipe locks. Use the API's force flag, or
  wait, then check that the screen actually changed before capturing.
- Python here has no PIL, so image crop/stack runs inside Unity (`image_tool.cs`).
- Placeholders in the scripts are written as `__NAME__`. Plain words like `CH` also match inside other identifiers
  (`STRETCH`).
- Eval timeouts (5000ms on the main thread) mean the Editor did not answer in time (busy, or throttled in the
  background). On a timeout the scripts call `editor_focus` once and retry; if it still times out, run it again.
- Play mode frozen while the Editor is unfocused means `PlayerSettings.runInBackground` is off. Turn it on before
  `editor_play` and restore it after (see the Verify step).
