# Recipes

The numbers below are the values tuned by hand in Food Hunt (top-down orthographic camera, boxes about 1 world unit,
slots about 1.2 apart). Use them as starting defaults. Scale the heights and offsets if the new game's items are a
different size.

Curves come from `CurvePresets` (`code/CurvePresets.cs`):
- `OutQuad`: ease-out.
- `InQuad`: ease-in.
- `OutBack`: overshoot to 1.08, then settle.
- `Arc`: 0 → 1 → 0, peak at 0.5.
- `RiseAndFall`: fast up, slow down.
- `Wobble`: 0 → 1.22 → 0.9 → 1.05 → 0.98 → 1.

## Contents

1. Add slot: row shift
2. Merge
3. Shuffle: hop
4. Shuffle: gather into a container and pour
5. Waiting/ready state during an effect
6. Wiring checklist

---

## 1. Add slot: row shift

The row is centred, so opening a slot moves every existing slot. Position of slot `i` in a row of `n`:
`x = (i - (n - 1) / 2) * cellSize`.

Beats:
1. Every existing slot tweens to its new x. Slot `i` waits `i * stagger`, which makes a left-to-right wave.
2. Each new slot starts `enterOffset` cells to the right of its target and slides in faster, on an overshoot curve.
   It has the largest index, so it arrives last.
3. Items sitting on a slot are its children, so they ride along.

| Setting | Value |
|---|---|
| shiftDuration | 0.3 (OutQuad) |
| stagger | 0.04 per slot |
| enterOffset | 3 cells |
| enterDuration | 0.2 (OutBack) |

At level build, snap the slots into place with no animation. Open all requested slots first, then lay out once.
Opening "+2" calls the animation once, not twice.

Code: `RowShift.Play / Snap / Position`.

## 2. Merge

Each colour collapses into its leftmost item (the receiver). Everything else of that colour (the givers) disappears
into the receiver, and the receiver's count becomes the sum.

Beats, all in one board-wide `Sequence`:
1. **Lift** every item taking part, receiver and givers, at t = 0: squash → rise to `height` while stretching →
   settle back to scale 1 on Wobble. Total lift time = squash + rise + settle.
2. **Fly in**: each giver moves in a straight line from its lifted spot to the receiver's lifted spot. It does not
   shrink (the user preferred full size). Giver `k` of a receiver waits `k * absorbStagger`.
3. **Take in**, as a callback when each giver arrives: add its count to the receiver, return the giver to the pool,
   free its slot. Then **punch** the receiver: from the bulge scale back to 1 on Wobble.
4. **Lower** the receiver after its last punch: fall back to the slot while stretching → land flat → wobble back.
5. After the whole sequence: compact the row (slide remaining items left), tell the queue a slot freed up, then call
   the booster's done callback.

| Setting | Value |
|---|---|
| squash | (1.2, 0.75, 1.2), 0.08s |
| height | 1.2 |
| riseDuration | 0.2 |
| stretch | (0.85, 1.25, 0.85) |
| settleDuration | 0.3 (Wobble) |
| absorbDuration | 0.25 (InQuad) |
| absorbStagger | 0.08 |
| punch | (1.3, 0.8, 1.3), 0.3s (Wobble) |
| fallDuration | 0.15 (InQuad) |
| land | (1.25, 0.7, 1.25), 0.06s |
| recoverDuration | 0.35 (Wobble) |

Notes:
- An item still mid-jump into its slot gets settled first: kill its tween, clear its "moving" flag, put it at the slot
  origin. Only then does it lift.
- Release any group rules (links, chains) on both items before the merge. A rule holding an item that is about to be
  destroyed can never be satisfied.
- Reset the receiver's spawn or timer rhythm, as if it had just landed.

Code: `JellyTween.Lift / Punch / Lower` plus a straight `DOVirtual.Float` for the fly-in.

## 3. Shuffle: hop

The logic swaps content (colour, count) between items that stay where they are. The animation hides the swap.

Beats, per item, with a wave delay of `row * rowStagger + column * columnStagger`:
1. Squash.
2. Hop: height follows `Arc * height`, Y spin goes `0 → spin` over the whole hop, and scale blends from squash into a
   stretch shaped by `RiseAndFall`.
3. At `swapAt` of the hop (0.5 is the peak), apply the "after" face.
4. Land flat, then wobble back.
5. Near the end, while the tween is still alive, re-raise the item to "ready" if it is at the front (section 5).

| Setting | Food Hunt default | User-tuned |
|---|---|---|
| rowStagger / columnStagger | 0.06 / 0.02 | 0.1 / 0.1 |
| squash | (1.2, 0.75, 1.2), 0.08s | (1.35, 0.75, 1.35) |
| height | 1 | 2 |
| airDuration | 0.4 | |
| swapAt | 0.5 | |
| spin | 360 (Linear) | |
| stretch | (0.85, 1.25, 0.85) (RiseAndFall) | (1.25, 1.25, 1.25) |
| land | (1.25, 0.7, 1.25), 0.06s | (1.4, 0.7, 1.4) |
| recoverDuration | 0.35 (Wobble) | |

The height goes through `AdditiveOffset`, so a queue shift on the same item still shows.

Code: `JellyTween.Hop`.

## 4. Shuffle: gather into a container and pour

What the user asked for, in order:
1. The items are gathered **inside** a container, small and visible, not shrunk to nothing.
2. When mixing is done, the container **tips over and pours**, and only then do the items fly back.
3. During the whole thing every item is in the waiting state. Front items return to ready, with the game's own
   animation, as they land.

Timeline. `latest` is the largest wave delay. `mixStart = latest + squash + flyIn`.
1. The container rents from the pool at `center of the shuffled items + up * pileHeight` and pops in from scale 0 on
   Wobble. It starts at `max(0, earliestDelay + squash - pop/2)`, so it is there when the first item arrives.
2. Each item, after its wave delay: squash, then **fly in** along an arc (`flyInArcHeight`) to its spot inside the
   container while scaling to `insideScale`. Each spot is random within `insideRadius` and `insideHeight`, in the
   container's local space.
3. Items that arrive early **ride**: each frame their offset is recomputed from `container.TransformPoint(spot)`, so
   they follow the container's pop and shake.
4. **Mix** from mixStart for `mixDuration`. The container shakes (Z rotation) and punches its scale. Items wander
   around their spot, `sin/cos` with a per-item random phase, enveloped by `sin(pi t)`, and spin `mixSpin` degrees.
   Faces swap at the middle of the mix.
5. **Pour** at `mixStart + mixDuration`: the container tilts to `pourTilt` degrees on X with an overshoot curve. Items
   keep riding, so they tip with it.
6. Each item **flies out** at `pour + pourLead + its wave delay`. It starts from its current point, follows an arc of
   `flyOutArcHeight`, slerps its rotation back to rest, and scales from `insideScale` to 1. Then it lands and wobbles.
7. The container rotates upright and scales to 0 (InBack) at `pour + pourLead + latest + flyOut * 0.5`, then goes back
   to the pool in its `OnKill`.

| Setting | Default | User-tuned |
|---|---|---|
| bucketScale | 1.6 | 1.4 |
| bucketPopDuration | 0.3 (Wobble) | |
| bucketShake | 15 | |
| bucketHideDuration | 0.2 | |
| insideScale | 0.45 | 0.35 |
| insideRadius | 0.22 (container units) | 0.2 |
| insideHeight | (0.2, 0.6) (container units) | |
| pourTilt | 115 | 120 |
| tiltDuration | 0.3 (OutBack) | |
| pourLead | 0.2 | |
| pileHeight | 1.5 | |
| flyInDuration / flyOutDuration | 0.3 / 0.35 (OutQuad) | |
| flyInArcHeight / flyOutArcHeight | 0.8 / 0.8 | 2 / 0.4 |
| mixDuration | 0.5 | |
| mixSpin | 720 | |
| mixJitter | 0.2 | |
| mixFrequency | 6 | |

Fallback when no container prefab is set: pile the items in mid-air at the same point, `pileScale` 0.8, spread
`pileRadius` 0.35. The user found this ugly ("the pile looks bad, the fly in/out is fine"), which is why the container
exists.

On a top-down camera the container reads as a ring with a handle. Tilting it toward the camera would read better if
the user asks.

Code: `GatherPour.cs` (`Container.Play` and `GatherMotion`).

## 5. Waiting/ready state during an effect

Queue items often have two looks. The front one is "ready" (bigger, floating, label shown), and the rest are
"waiting". During a shuffle:
- At the start, call the game's "unhighlight / go to waiting" on every item involved.
- Insert a callback at `sequence.Duration() - recoverDuration`. If the item is now at the front of its column, call
  the game's "highlight". The item's tween is still running at that moment, so a queue-feel component that checks
  `DOTween.IsTweening(transform)` goes into its "arriving" state. When the tween ends, it plays its own grow-to-ready
  animation. Calling highlight after the tween ends makes it snap instead.
- In `OnKill`, if that callback never ran (the item was tapped or the level restarted), highlight without animation.

## 6. Wiring checklist

- The booster's `Apply` returns success at once, but calls `onComplete` only when the animation finishes.
- Every tween has `SetTarget` and `SetLink`. Pooled objects are deactivated, not destroyed, and `SetLink` does not
  kill on deactivate, so the owner's cleanup must `DOKill` them.
- Retrying mid-animation: the retry path cancels any pending booster first, then the board cleanup kills the
  sequences.
- No `Debug.Log` left in, and no comments if the project forbids them. Explain in chat instead.
- Run the project's rules, compile and tests, then the Play mode check in `verification.md`.
