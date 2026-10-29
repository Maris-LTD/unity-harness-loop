# game-done - Phases 2-3: read the story, verify criteria

Contents: read the story · run the harness · automatic checks · manual checks · deferred · traceability ·
evidence gates by type.

## Phase 2: Read the story
Hold: name and ID, Type, acceptance criteria (every checkbox), files to create / modify, Test Evidence path, GDD
path + requirement (or brief MVP feature), TR-ID, ADR references, Manifest Version, Engine notes, estimate, Out of
Scope, `## QA Test Cases`, Dependencies.

Also read, bounded:
- the `paths.trRegistry` entry for each TR-ID, if the registry exists (current `requirement` text wins over text quoted in the
  story);
- the referenced GDD section: its acceptance criteria and key rules only (at minimal: the brief's MVP feature and
  Player goal & fail state);
- each referenced ADR: only `## Decision` and `## Consequences` (find headings first, then read those spans); hold
  them for phase 4;
- the `Manifest Version:` line of `paths.controlManifest`, if it exists;
- the `Run result:` line of `paths.sessionState`, only when its `Current story:` is this story.

## Run the harness (always)
This port runs the tests instead of only checking that test files exist.
- Reuse first: when `Current story:` in `paths.sessionState` is this story and `unity-harness fingerprint compare
  verified-<story-slug>` exits 0 (tree unchanged since game-dev's passing verification), take that result from the
  checkpoint / story and say "Harness reused from game-dev (tree unchanged)". Exit 1, no fingerprint, or no
  recorded result → run it.
- `unity-harness all` → rules, compile, EditMode tests. Record passed/total per assembly. Exit 2 → the verdict is at
  best NOT ASSESSED for every criterion that needs it ("Editor not ready"); ask the user to open the Editor.
- `0/0` tests right after a compile = domain still reloading: rerun once; 0/0 is not a pass.
- A failing test or compile error tied to this story's files → that criterion FAILS.

## Automatic checks (no asking)
- Files the story said it would create exist.
- The Test Evidence file exists and its tests ran and passed in `unity-harness all` (name class and methods).
- No hardcoded tuning: search the story's changed files for numeric literals in gameplay logic that belong in a
  ScriptableObject / config asset.
- No hardcoded player-facing strings in `Assets/<Game>/` code when the project localizes (skip if it does not; say
  so).
- A criterion that says "depends on X": X exists.

## Manual checks (ask, batched)
Ask with `ask_question`, up to 4 criteria per call: "Does <criterion>?" with options `Yes - passes` / `No - fails` /
`Not tested yet`. Use this for:
- gameplay behaviour ("the player takes damage when...") - the code says what should happen, not what the build
  does, so never mark these verified from reading code;
- subjective qualities;
- performance criteria (profiled, or accepted as assumed - say which).
Mapping: Yes → confirmed; No → FAILS; Not tested yet → UNTESTED, and the verdict is at best NOT ASSESSED until
someone checks it.

## Deferred
Criteria that need a real playtest session (end-to-end runs, the feel half of Visual/Feel): `DEFERRED - requires
playtest session`. Deferred does not block.

## Test-criterion traceability
For each criterion find what verifies it:
- an EditMode / PlayMode test (search the test assemblies for a class or method matching the criterion's subject);
- a manual `Yes - passes`;
- a retained screenshot under `paths.evidenceDir` that you opened and that shows it (put its path in the Test column;
  a visual criterion verified by looking is covered).
```
| Criterion | Test | Status |
|---|---|---|
| AC-1: <text> | <TestClass.Method> (passed) | COVERED |
| AC-2: <text> | Manual confirmation | COVERED |
| AC-3: <text> | <paths.evidenceDir>/<slug>/01-shop-open.png | COVERED |
| AC-4: <text> | - | UNTESTED |
```
Escalation (skip at qaLevel minimal):
- more than 50% UNTESTED → BLOCKING; the verdict cannot be COMPLETE;
- some (≤ 50%) UNTESTED → advisory; list them in the Completion Notes as "Untested criteria: <AC list>. Recommend
  tests in a follow-up story.";
- all COVERED → just include the table.

## Evidence gates by Type
Apply qaLevel first (see SKILL.md). Blocking levels follow the studio protocol evidence table: Logic / Integration
blocking at qaLevel standard/full, Visual/Feel and UI blocking at every level, Config/Data advisory.
- **Logic**: the exact Test Evidence path; if absent, search the test assemblies. None → "Logic story has no EditMode
  test. Expected at <path>. Create it and run `unity-harness tests` before closing." Present but failing → FAILS.
- **Integration**: the Test Evidence path, then the test assemblies, then a playtest note under `paths.evidenceDir`
  naming this story. None → flagged as for Logic.
- **UI**: a retained screenshot (`.png .jpg .gif`) of each screen touched under `<paths.evidenceDir>/<story-slug>/`. No sign-off
  needed. None → run `unity-harness smoke` now (or unity-capture for the exact state), copy the capture to
  `<paths.evidenceDir>/<story-slug>/NN-<what>.png`, open it and compare with the criteria. If that cannot run, flag
  "No visual evidence retained" at the blocking level.
- **Visual/Feel**: the screenshots as for UI, then show them to the user and ask with `ask_question` for visual sign-off:
  `Approve` / `Concerns`. Record the answer in `## Completion Notes` as `Visual sign-off: approved <date>` or
  `Visual sign-off: concerns - <list>`. Flags: no screenshot (a described check is an assertion, not evidence);
  concerns raised (blocking until fixed or the user accepts them).
- **Config/Data**: `unity-harness smoke` passes now. Fails → flagged, advisory at every qaLevel.
- **Other visible stories** (Logic / Integration with a surface): read the `Run result:` line (checkpoint for this
  story, or the story's Completion Notes). OBSERVED with a retained path → note it. `N/A - <reason>` → accept only if
  the reason says why nothing is observable. `NOT VERIFIED` while the criteria name something on screen → flag at
  the type's level. No line at all → advisory "no run result; confirm the build was launched and looked at". The
  criteria name something on screen and no image for this story is retained → a `Yes - passes` is an assertion, not
  an observation: capture it now or flag it.
- **No Type declared**: advisory "Add `> **Type**: ...` to the header so evidence can be enforced."

Any blocking evidence gap prevents COMPLETE.
