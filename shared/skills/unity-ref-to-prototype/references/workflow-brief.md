# unity-feature brief template

The `task` passed to `unity-harness:unity-feature` is the only thing the planner and implementer see. Put everything
in it: the facts extracted from the references, the exact names configured in `.unity-harness/config.json`, the
deliverables, the coding rules, and the done criteria. Write it in English, and name the GDD language explicitly.

```
Project: <abs path> (<fresh|existing> Unity <version> <pipeline> project; <packages>; git baseline committed).
Implement the playable prototype of "<Game>" (<alt name>), a <genre> for <platform/orientation>, <camera>.

References:
- <image path> (target look: <board, props, materials, palette, layout of tray/HUD>)
- <demo path> (working <2D canvas/JS> prototype: <rule 1 as a predicate>; <input radius>; <drag model>;
  <THRESHOLD names and values>; <feedback triggers with thresholds>; <release behaviour with formula>;
  <post-action flow>; <match rule>; win = <...>, lose = <...>; <audio approach>).
Port and extend that prototype to Unity 3D.

Deliverables:
1) Docs/<Game>_GDD.md in Vietnamese: a gameplay-only GDD (no story/monetization/marketing) with tables and bullets:
   (1) <core loop + session length + pacing>; (2) <mechanics with exact rules>; (3) <input & UX, hitbox in world and
   screen units, same-frame response>; (4) <level 1-N rollout table with precise rules per mechanic>;
   (5) <juice table Action | VFX | SFX (frequencies) | Haptic for listed actions>.
   Every number in the GDD must match the tuning values used in code.

2) Unity implementation under Assets/<Game>/:
- Scripts/ with asmdef <Game>.Runtime (references Unity.InputSystem); Editor scripts in Scripts/Editor with asmdef
  <Game>.Editor; EditMode tests in Assets/<Game>/Tests/EditMode with asmdef named exactly <Game>.Tests.EditMode
  (configured in .unity-harness/config.json testAssemblies); scene Assets/<Game>/Scenes/Game.unity as the first scene
  in Build Settings, containing a MonoBehaviour named exactly <Game>Game (smoke expectTypes) that bootstraps the game.
  Set the PlayerSettings default orientation to <Portrait>.
- Architecture: pure C# testable logic separated from views: <list each rule model>; a <Game>Tuning static class
  holding every constant; level data for levels 1-N (code-defined via LevelBuilder + LevelLibrary) with <invariants,
  e.g. every color count a multiple of 3>; a solver used by an EditMode test that asserts every level is clearable
  within <constraint>. Views as small components: <list>. UI: <uGUI legacy Text | TMP>.
- Assets: <only primitive/procedural meshes and URP Lit materials, no external assets | use <folder>>. Procedural SFX
  synthesized at runtime (<each sound with frequencies>). Haptics behind an interface (<platform impls>, no-op in
  Editor). Input via the new Input System; <picking rule; blocked feedback>. Progress in PlayerPrefs; <wrap rule>.
- Coding rules (mandatory): <copy the project's CLAUDE.md rules: no comments, no Debug.Log, files <= 250 lines, SRP
  small components, private + [SerializeField], properties with private set, no LINQ / string concat /
  GetComponent in Update, CompareTag, cache components, no per-frame GC alloc>.
- Play mode must start from Game.unity and show level 1 playable with no console errors. After changes, check git
  diff for Unity serialization noise.
```

Run it with `{ "task": "<brief>", "smoke": true }`.

## Snap Jam 3D (the real run, for reference)
The real brief named the extracted demo facts like this:
- `isBandTop`: no higher-layer band on the board shares a peg with it or segment-intersects it
- touch radius 28 px around a segment
- drag pulls the band midpoint as a quadratic curve control point
- `BREAK_THRESHOLD`
- tension > 0.75 gives micro-shake, a red glow outline and a rising tension tone
- release below the threshold gives a damped bounce `exp(-4t)*cos(16t)`
- snap gives particles, and the band flies to a tray slot
- three of the same color auto-clear
- win = board and tray empty, lose = 7 slots full
- SFX: stretch 140-460 Hz rising, snap triangle sweep 520→50 Hz, blocked 110 Hz saw, match arpeggio
  440/587/659/880

That run (229 files, +7664 lines, 277 EditMode tests) took about 65 minutes and ended `needs-attention`, with 4 minor
reviewer findings that were then fixed by hand.
