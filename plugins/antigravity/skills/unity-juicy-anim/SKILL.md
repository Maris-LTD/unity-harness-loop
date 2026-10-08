---
name: unity-juicy-anim
description: Recipes and reference code for juicy, jelly-style DOTween animations in Unity casual or puzzle games. Covers squash and stretch lift/lower, a punch on receive, a hop that swaps content at its peak, a row of slots sliding over in a wave as a new one slides in, merging items that fly into one and count up, and a shuffle that gathers items into a container (bucket, pot, hat), churns them and pours them back. Also covers a procedural container mesh made in the Editor, how to keep the game paused or state-correct while these play, and how to verify them in Play mode from the CLI. Use this whenever the user wants booster animations, "jelly", "bouncy", "juicy", "game feel" or "tween" polish on boxes, tiles, slots, blocks or cards, or asks for an add-slot, merge, shuffle, swap, pour, gather or "into a bucket" animation, even if they do not mention DOTween.
---

# Unity juicy animations

Animations built and tuned for Food Hunt's boosters (Add Slot, Merge, Shuffle), written down so the next game does not
start from zero. The look is "jelly": every move starts with a squash, travels stretched, and settles with an
overshooting wobble.

Read [references/recipes.md](references/recipes.md) for the beat-by-beat breakdown and tuned numbers of each animation.
The code in `references/code/` is self-contained C# (DOTween only, no game types). Copy it into the new project and
change the namespace. Wire it to the game's own data. Do not copy Food Hunt's gameplay classes.

## Before writing anything

Find out these four things in the target project. Each one changes how the animation has to be wired:

1. **How does the game pause during a booster?** If pause is only a status flag (game logic stops, `Time.timeScale`
   stays 1), the tweens keep running. The booster must then hand its "done" callback to the end of the animation, not
   call it right away, or the game resumes mid-animation. If pause sets `timeScale = 0`, the tweens need
   `SetUpdate(true)`.
2. **Is input locked while it plays?** Usually it is not. Assume the player can tap an item mid-animation, and that
   whatever handles the tap calls `DOKill()` on that item's transform. Each item's tween must survive that (see
   *Kill-safe tweens*).
3. **Does the logic move items, or only their content?** A shuffle that swaps colour and count between fixed items
   changes the visible face at once. The animation has to hide that change (see *Face swap*).
4. **What does the parent hierarchy look like?** Items parented to their slot or cell move with it for free. Tween
   `localPosition` in the parent's space, and convert world points with `parent.InverseTransformPoint`.

## Core techniques

- **Jelly beat** (`JellyTween`): squash (`1.2, 0.75, 1.2`) → move while blending into stretch (`0.85, 1.25, 0.85`) →
  return to `Vector3.one` on `CurvePresets.Wobble()`. Wobble goes past 1 and rings down, and that is the jelly. Landing
  mirrors it: flatten (`1.25, 0.7, 1.25`) for 0.06s, then wobble back over 0.35s.
- **Drive by a 0..1 float, shape with curves.** Use `DOVirtual.Float(0, 1, d, t => ...)` with `Ease.Linear`, and do
  the shaping inside with `AnimationCurve`s exposed in config. Designers can then tune feel without touching code. A
  plain `DOMove` with an `Ease` cannot be retuned that way.
- **Additive offset** (`AdditiveOffset`): add the difference since the last frame, `localPosition += offset - last`.
  Do not overwrite the position. If another tween (a queue shift, say) moves the same transform at the same time, both
  moves stay visible and neither snaps the other.
- **Wave stagger**: give each item `delay = row * rowStagger + column * columnStagger`, front to back. Cheap, and it
  reads as motion through the group rather than everything at once.
- **Face swap**: capture each item's visual state (material + label text) before the logic runs and again after it.
  Re-apply the "before" face, and apply the "after" face from a callback at the moment the item is hidden or turned
  away: the top of a hop, inside a container, mid spin.
- **Kill-safe tweens**: give each item its own `Sequence` with `SetTarget(item.transform).SetLink(item.gameObject)`.
  Put the cleanup in `OnKill`, which runs on completion and on kill alike: apply the final face, restore rest
  scale/rotation/offset, count down, and call the booster's done callback when the last one ends. A single sequence
  for many items cannot be killed per item.
- **Board-wide sequence**: when the animation is one choreography (merge), build one `Sequence` with
  `SetTarget(gridTransform)`. Make the grid's cleanup call `transform.DOKill()` first, so a level restart mid-animation
  does not fire stale callbacks into the new level.
- **Data changes at the visual beat**: in merge, the count goes up when each item lands in the receiver, not before.
  The player sees the number change when the cause hits.

## Recipes (details in references/recipes.md)

| Recipe | Files | One-line shape |
|---|---|---|
| Add slot row shift | `RowShift.cs` | existing slots slide over in a left-to-right wave, the new slot slides in fast from the right |
| Merge | `JellyTween.cs` | all lift (jelly) → givers fly into the receiver → receiver punches and counts up each arrival → receiver lowers |
| Shuffle: hop | `JellyTween.Hop` | each item squashes, hops in an arc while spinning, swaps face at the peak, lands and wobbles |
| Shuffle: gather and pour | `GatherPour.cs` | container pops in → items fly into it and sit inside, small → it shakes while faces swap → it tips over → items fly back to their cells |
| Ready/waiting state | (pattern) | drop items to "waiting" for the whole effect, then re-raise the front ones near the end while the tween is still alive, so the game's own "become ready" animation plays |

## Placeholder art

When the recipe needs a prop (bucket, pot) that the project does not have, build a procedural mesh in the Editor
instead of waiting for art. A lathe profile handles any round container. See
[references/procedural-mesh.md](references/procedural-mesh.md). Copy an existing game material so the prop matches the
shader. Put the prop's prefab in config so art can replace it later without a code change. Do not call paid
generation tools (Unity AI Asset Generation) unless the user asks.

## Config

Put every number in a `[Serializable]` settings class inside the project's central config ScriptableObject (one
nested group per animation), with tooltips that say what 0 and 1 mean on each curve. Ship the tuned defaults from
`recipes.md`. When a field gets renamed or split, add `[FormerlySerializedAs]` so values the designer already tuned
carry over.

## Verify in Play mode

The animation is not done until it has run in Play mode. Read
[references/verification.md](references/verification.md). It covers faking a key press for the booster, scheduling
timed probes and screenshots inside one eval (each CLI round trip takes about 2s, too slow to sample by hand), and
checking that the data total is unchanged, every item ended at rest, the face matches the data, and the game resumed.
