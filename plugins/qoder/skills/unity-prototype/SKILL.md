---
name: unity-prototype
description: Turn a References folder (images, HTML demo, brief) into a Vietnamese gameplay GDD and a playable Unity prototype built by unity-dev. Use for "làm game từ ref", "port demo HTML sang Unity", "viết GDD rồi làm game".
---

# References → GDD → playable prototype

This is the pipeline that produced Snap Jam 3D in one session. It went from a folder holding one image and one HTML
demo to a 30-level prototype with 277 passing EditMode tests. Its steps chain other skills:
- `unity-init` creates the project;
- the `unity-dev` skill (or engineering loop) builds it;
- `unity-capture` checks the result on screen;
- `game-memory` records context;
- `unity-tweak` handles the play-test rounds after it.

References in this skill:
- `references/gdd-brief.md`: the GDD prompt template and the GDD structure that worked.
- `references/workflow-brief.md`: the `task` template for `unity-dev`, plus the facts the real brief extracted.
- `references/test-patterns.md`: the tuning class, the GDD↔code test, the level invariants and the solver proof.

## 1. Intake (read everything, extract facts)
- Open every reference image with the Read tool. Note the camera angle, props, materials, palette, and HUD/tray layout.
- Read HTML/JS demos in full. Extract into a scratch notes file:
  - every rule, written as an exact predicate (when something is interactable, blocked, or cleared);
  - every constant (thresholds, radii, damping formulas such as `exp(-4t)*cos(16t)`, audio frequencies);
  - every feedback trigger and its threshold;
  - win and lose conditions.
- Note what the brief wants that the demo lacks: 3D, a level count, new mechanics, haptics.
- If the user pasted a GDD prompt, keep its sections and wording. Otherwise offer the template.
- Ask only real choices: the Editor version, the game/namespace name, or a missing level count. Do not ask about
  things the brief already settles.

## 2. Project
- If the folder has no Unity project, use `unity-init`. It also works when `References/` already
  sits in the folder.
- Fix the names before the workflow, and use them identically in `.unity-harness/config.json` and in the brief:
  - folder `Assets/<Game>/`
  - asmdefs `<Game>.Runtime`, `<Game>.Editor`, `<Game>.Tests.EditMode`
  - scene `Assets/<Game>/Scenes/Game.unity`
  - bootstrap `<Game>Game`
- The working tree must be clean, with a baseline commit, before the run starts.

## 3. Build with unity-dev
- Write the `task` from `references/workflow-brief.md`. It must hold:
  - the extracted demo facts;
  - both deliverables: the GDD in Vietnamese with the user's sections, and the Unity implementation;
  - the architecture rules from `references/test-patterns.md`;
  - the user's coding rules, copied from CLAUDE.md / AGENTS.md;
  - the done criteria: Play from `Game.unity` shows level 1 with no console errors.
- Drive the loop yourself following `unity-dev`: spawn the `Agent` tool with `subagent_type: "gameplay-programmer"` to implement the code and tests,
  verify with `unity-harness all` and `unity-harness smoke`, then spawn the `Agent` tool with `subagent_type: "unity-verifier"` and the `Agent` tool with `subagent_type: "unity-reviewer"` for independent inspection.
- While it runs, do not write into the project, because the tree guard voids verification. Use the time to draft
  memory files in the scratchpad (see `game-memory`) or to answer the user.

## 4. Close out the run
- Read the run result (`remainingIssues`, verdict) and `.unity-harness/runs/<run>/report.md`.
- Fix small reviewer findings by hand. Past examples: progress saved only on Next, an SFX pool cutting off an
  arpeggio, a tension tone stopping while the finger is held still, a public setter. Add a test for each logic fix.
- Run `unity-harness all`, then `unity-harness smoke`, and open `Temp/harness/smoke.png`. If the frame shows
  something unexpected (wrong level, objects moving with no input), find out why before reporting. A saved progress
  key once explained a "Level 2" start.
- Look at the key states with `unity-capture` at the target resolution: the peak of the core interaction,
  the win panel and the lose panel. Compare them with the target image.
- Check `git status`. ProjectSettings changes for the build scene and orientation are intended; revert other noise.

## 5. Hand over
- Write `architecture` and `current-work` memory from the real code, then link and commit the memory
  (`game-memory`).
- Report to the user:
  - what was built: rules, levels, GDD path;
  - the harness numbers: rules, compile, tests passed/total, smoke;
  - the run verdict, and what you fixed by hand;
  - the known gaps: no art textures, landscape-only smoke frame, iOS haptics, not tested on a device.
- Commit only when the user asks, following their commit-message rules. Then let them play. Handle the feedback
  rounds with `unity-tweak`.

## Pitfalls seen
- A template id that does not exist for the Editor version (`universal-3d` on 6000.3). List the templates first.
- A copied `.gitignore` that hides `.claude/` or `Docs/`.
- The first project open outlasting a 2-minute tool timeout. Run it in the background and poll `unity status`.
- `unity-harness tests` reporting `0/0` right after a compile, because the domain was still reloading. Rerun it;
  0/0 is not a pass.
- The agent session started outside the project folder. Its transcript and memory then land under another slug, and
  `/resume` in the project cannot find it. Start sessions in the project root.
