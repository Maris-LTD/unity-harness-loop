---
name: unity-tweak
description: Apply a round of play-test feedback (feel, colors, VFX, thresholds, small rules) to a Unity prototype without rerunning unity-dev, keeping tests and GDD in sync. Use for "sửa thành...", "đổi tông màu", "chỉnh lại cho đẹp hơn".
---

# Play-test feedback round

Small changes are faster done by hand than through the workflow. The cost is that nothing reminds you to update the
tests, the GDD and the memory. This procedure does.

## 1. Split and restate
- Number each change in the message. Restate it as a rule you can test. Example: "Snap the moment stretch reaches
  `BreakDistance` while dragging; Pointer Up below it only bounces back."
- Ambiguous words: pick the most likely reading, say it in your reply, and make the result easy to adjust (one
  palette, one constant). In Snap Jam 3D, "the gameplay tone is red-pink" turned out to mean the environment. The
  band colors stayed; only the board, tray, background, light and UI changed.
- Size check: a change that touches up to about five files and adds no new system gets done here.
{{#claude}}
{{#qoder}}
  A new mechanic or screen goes to the `unity-dev` skill with a brief.
{{/qoder}}
{{^qoder}}
  A new mechanic or screen goes to `unity-harness:unity-dev` with a brief.
{{/qoder}}
{{/claude}}
{{#antigravity}}
  A new mechanic or screen goes to the `unity-dev` skill with a brief.
{{/antigravity}}
- Do not enter Play mode or run smoke while the user may be playing in the Editor; ask first. Never clear saved
  progress without asking.

## 2. Locate
Grep for each of these:
- the tuning class;
- palette and material code;
- the rule model in `Core/`;
- the view that draws it;
- every GDD line that describes it. Grep the Vietnamese words too, e.g. `thả tay`, `viền đỏ`, `gỗ`.

## 3. Change, in this order
1. **Rule model + EditMode test.** Example: `TensionModel.ReachedBreak` plus a test for the exact threshold edge,
   then the input controller ends the drag when it fires.
2. **View.** Example: the red glow becomes an outline only, as an inverted-hull tube with `Cull Front` and a little
   wider than the band, so the body keeps its color.
3. **Tuning constants and palette.** New colors go in the palette class, not inline.
4. **Serialized values** that live in scenes or assets, such as the camera background color. Use the project's setup
   menu if it rebuilds them; otherwise edit and check `git diff`.
5. **Renames when a name stops being true** (e.g. `WoodPalette` → `ThemePalette` once the theme is not wood). Rename
   the file together with its `.meta`, then every reference, then the GDD. Grep afterwards for the old name.

For several exact replacements in one file, a short Python script that asserts each old string occurs exactly once
is safer than chained `sed`.

## 4. Verify
- Run `unity-harness all`. If the tests read `0/0`, the Editor was still reloading; run `unity-harness tests` again.
  Never report 0/0 as a pass.
- Run `unity-harness smoke` and open the capture.
- For anything the smoke frame does not show (peak tension, panels, the effect of a held finger), use
  `unity-capture` with a forced state at the target resolution.
- If the change is not visible, inspect it with an eval before changing more code. Example: a gradient `Graphic`
  added from code was missing its `CanvasRenderer`.

## 5. Sync the documents
- **GDD:** the prose, the tables, and the appendix values for tuning, layout and palette hex. The consistency test
  catches tuning drift, but not prose or colors, so grep for the old wording.
- **Memory `current-work`:** add a "User-requested changes `<date>`" list saying what changed and where. Record the
  user's taste, e.g. "dislikes red-pink tones; keep environment and UI blue/turquoise", and any verification trick
  you learned.

## 6. Report
- For each change, say what happens now, how it was checked (test name, capture state), and any side note the user
  should decide on. Example: "the coral band is still pink; change it too?"
- Give the harness line: rules, compile, tests passed/total, smoke, console errors.
- Ask before committing, unless the user already said to. Follow their commit-message rules; e.g. no AI attribution
  lines.
- If `git push` is blocked by the agent's permissions, give the user `! git -C <root> push`. Do not route around
  the block.
