---
name: unity-ui-reskin
description: Reskin or rebuild Unity uGUI prefabs to match a mockup/demo image with a given sprite folder, sync UI between sibling prefabs (e.g. Shop page vs MiniShop popup), and verify the result in the real Game view before reporting. Use when asked to "thay art / reskin / làm giống demo / cập nhật UI prefab theo ảnh", or to check a UI prefab for misalignment, cropping, stretching or text overflow.
---

# Unity UI reskin and verification

The hard part of this work is the verification, not the editing. A past run was reported as "matches the demo" from
offscreen prefab renders. In game, the user found misalignment, cropping, stretched art and text overflow. Rendering
the user's fixed prefab with the same tool gave almost the same image, so that tool is blind to these bugs. The work
is done only when the numeric audit and the real Game view captures both pass.

Run the scripts in this skill's `scripts/` folder from **Bash** at the project root, as
`bash <skill dir>/scripts/<name>.sh ...`, with the Editor in state `ready`. They need `unity` and `python` on `PATH`.
Read `references/gotchas.md` when a script fails.

| Script | Purpose |
|---|---|
| `dump_prefab.sh <prefab>...` | Hierarchy: size, anchors, sprite + type, TMP text. Nested prefabs collapsed. Env `SUB=<path>` dumps one subtree; `DEEP=1` expands nested prefabs |
| `edit_prefab.sh <prefab> <body.cs> [sprite_dir]` | Load prefab, run body, save |
| `ui_audit.sh <folder> <out.txt> [w h] [baseline.txt]` | Numeric lint, de-duplicated by source prefab. Passing a baseline prints only new issues |
| `gameview_size.sh <w> <h>` | Set the Game view to a fixed resolution |
| `capture_game_view.sh <out.png> <w> <h>` | Capture what the Game window shows (output stays outside `Assets/`) |
| `crop_image.sh <in> <out> x y w h [maxSide]` | Crop with top-left origin, optionally downscale |
| `stack_images.sh <out> <img>...` | Put images side by side at height `H` (default 1000), e.g. demo next to capture |
| `render_prefab.sh <prefab> <out> [w h] [setup_cs]` | Offscreen preview for quick iteration. **Never proof** |

Body helpers for `edit_prefab.sh`:
- `root`: the loaded prefab.
- `F(path)`: Find; throws if the path is missing.
- `S(name)`: sprite from `sprite_dir`, or a full path.
- `I(t, sprite, sliced)`: set sprite and type. Simple images keep their aspect.
- `P(t, x, y, w, h)`: set position and size, keeping the existing anchors.
- `R(...)`: like `P`, but forces center anchors. Use only for nodes you created.
- `Fill(t)`: stretch to the parent.

## Token budget
- **Text:**
  - Always save audit results to a file and read only the summary. Run the audit once before editing to get a
    baseline, then pass that baseline on later runs.
  - Dump with `SUB=` on the part you are editing. Use `DEEP=1` only for the nested prefab you are actually changing.
- **Images:** these are the largest cost, roughly 1.5k tokens each.
  - Save captures to files and look only at what you need.
  - For an overview, `stack_images.sh` the demo next to the capture at `H=1000`, so one image covers one comparison.
  - For details, `crop_image.sh` one card or strip.
  - Do not reread a capture that is unchanged since the last edit.
  - Capture every resolution (see §3), but only open the 16:9 and tablet shots in full when the tall-phone shot or
    the audit points to something; otherwise crop just the top bar, the list end and the tightest card.

## Workflow
### 1. Survey
- Look at the demo and the sprites you will use. Note each sprite's native size, and whether it is a frame (needs
  9-slice) or an icon (Simple, keep aspect).
- Dump every prefab in scope, including variants with their base, and the hosts that nest them.
- Map out:
  - which nodes are driven by a Layout Group or ContentSizeFitter;
  - which values are instance overrides;
  - which text is filled at runtime (prices, amounts, localized strings).
- Ask about real choices (layout, scope) before starting.
- Run `ui_audit.sh` to save the baseline.

### 2. Edit
- **Anchors:** keep the existing ones (`P()`). Do not re-anchor nodes to center with numbers measured from the demo.
- **9-slice borders:** take them from the art. The border sum divided by the pixels-per-unit factor must fit the
  smallest size the sprite is used at; check shared sprites such as buttons too.
- **Icons:** Simple with `preserveAspect`, or a size matching the sprite's aspect.
- **Text:** leave room for the longest realistic runtime value, not the prefab placeholder. Use auto-size with a sane
  min/max where the length varies.
- **Variants:** edit the base where possible, and revert stale overrides on variants and instances.
- **Repeated mistakes:** when one problem class shows up, fix every place you edited the same way before moving on.

### 3. Verify (required before reporting)
1. Run `ui_audit.sh … baseline.txt`. Every new issue must be fixed, or explained as intentional.
2. Check the Game view in context, with real data:
   1. Turn on `UnityEditor.PlayerSettings.runInBackground` by eval (note the old value) so Play mode keeps running
      while the Editor is unfocused, then `unity command editor_play` and wait until the screen's manager exists.
      After `editor_stop`, set it back if it was `false`.
   2. Navigate as a player would, and confirm the screen actually changed.
   3. For each resolution — tall phone 1080x2340, 16:9 phone 1080x1920, tablet 1536x2048 — run `gameview_size.sh`
      then `capture_game_view.sh`. Capture the top, middle and end of every scroll list, and every variant of the
      screen (page, popup, slot).
   4. Compare against the demo for:
      - alignment;
      - cropping;
      - stretching;
      - text overflow;
      - overlapping elements;
      - content that cannot be scrolled to.
   5. `unity command editor_stop`.
3. Check git:
   - Run `git status` and `git diff --stat`.
   - Revert serialization noise, such as TMP dynamic atlases and layout-driven RectTransform values.
   - Look at large diffs in host scenes/prefabs before dismissing them.

### 4. Report
- State what was verified: resolutions, screens, scroll positions, and the audit's new/fixed counts.
- List gaps plainly.
- Do not write "giống demo" without captures that support it.
