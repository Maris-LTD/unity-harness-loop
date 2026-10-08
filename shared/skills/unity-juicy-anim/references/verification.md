# Verifying an animation in Play mode

Compiling proves nothing about an animation. Run it, sample it while it plays, and check what is left when it ends.
This uses the Unity CLI (`unity command ...`) against the open Editor. The `unity-harness` verify skill covers rules,
compile, tests and smoke. This file covers the animation itself.

## Ground rules

- **Keep the Editor focused.** Without focus, Play mode can stall on loading. Run the harness focus keeper
  (`lib/focus-unity.ps1 -UnityPid <pid> -Seconds N`, pid from `unity status --json`) in the background for the length
  of the test.
- **One eval round trip takes about 2 seconds.** That is too slow to sample a 1–3 second animation by calling eval
  repeatedly. Schedule everything inside the eval that starts the animation, and read the results back afterwards.
- **Wait until the board is idle** before triggering: no item `DOTween.IsTweening`, level intro finished. Otherwise
  the samples mix two timelines.
- **Make sure the Editor runs the new code.** The console can hold stale compile errors from a half-written edit. After
  `recompile`, confirm with an eval that inspects the new types, for example a constructor's parameter count.

## Trigger with a fake key press

```csharp
UnityEngine.InputSystem.InputSystem.QueueStateEvent(UnityEngine.InputSystem.Keyboard.current,
    new UnityEngine.InputSystem.LowLevel.KeyboardState(UnityEngine.InputSystem.Key.Digit2));
DG.Tweening.DOVirtual.DelayedCall(0.05f, () => UnityEngine.InputSystem.InputSystem.QueueStateEvent(
    UnityEngine.InputSystem.Keyboard.current, new UnityEngine.InputSystem.LowLevel.KeyboardState()));
```

Do not call `InputSystem.Update()` yourself. `wasPressedThisFrame` would then land on a frame the game never sees.
The game needs a keyboard shortcut for the booster. Add a debug one if it has none.

## Timed probes and screenshots

In the same eval, before the key press:

```csharp
string dir = System.IO.Path.GetFullPath("Temp/anim");
System.IO.Directory.CreateDirectory(dir);
foreach (var t in new[] { 0.5f, 1.0f, 1.4f, 2.0f, 4.0f })
{
    float at = t;
    DG.Tweening.DOVirtual.DelayedCall(at, () =>
    {
        UnityEngine.ScreenCapture.CaptureScreenshot(System.IO.Path.Combine(dir, "t" + at.ToString("0.00") + ".png"));
        UnityEngine.PlayerPrefs.SetString("probe" + at.ToString("0.00"), Snapshot());
    });
}
```

`Snapshot()` is a local lambda that returns a short string of what matters. Wait out the animation, read the
`PlayerPrefs` keys with a second eval and delete them, then open the PNGs with the Read tool and look at them.

## What to check

- **Conservation:** the game total is unchanged after the logic. In merge, the receiver's count equals the sum of the
  group.
- **Hidden swap:** mid-animation, items not yet past their swap point still show the old face, and nothing shows a
  face that disagrees with the data at the end.
- **At rest:** at the end every item has scale 1, rest rotation, and its cell position, and no tween is left running.
- **State restored:** the game status is back to playing (pause released). Items at the front are back to ready.
- **Single shot:** the booster applied once (count the "applied" log lines).
- Then look at the screenshots. Most problems seen in practice (a prop that never showed, a pile that looked bad) only
  show up there.

## Side effects to undo

- Changing a ScriptableObject config through reflection in Play mode stays in memory after Play stops, and any later
  `AssetDatabase.SaveAssets` writes it to disk. Set it back, then `git diff` the config asset.
- `SaveAssets` can also re-serialize TMP font atlases. Restore that noise and do not commit it.
- Stop Play mode with `EditorApplication.isPlaying = false`. `editor_play` only enters Play mode.
