# game-dev - Phases 5-6: verify, collect, checkpoint

Contents: did it finish · verify · run and look · evidence by type · summary · session checkpoint.

## Did the implementation finish?
Do not assume it did. An agent can stop at its turn limit mid-edit and leave code that does not compile, while its
report reads like progress.
- The agent or workflow reported stopping early, hitting a limit, or its report ends mid-task → INCOMPLETE.
- Files it named do not exist → INCOMPLETE.
INCOMPLETE: make it the headline, list what exists, name the breakage, offer to resume. No "Implementation
Complete", no status change, checkpoint `Next step: game-dev <path> - resume: <breakage>`.

## Verify
Run `unity-harness all` (rules + compile + EditMode tests) yourself even if the workflow or verifier already did, and
report the command, exit code and every `x` line. Exit 2 → `Verification: NOT VERIFIED - Editor not ready`; ask the
user to open the Editor, do not loop, do not infer the code is fine because it reads correctly.
A test count of `0/0` right after a compile means the domain was still reloading: rerun; 0/0 is not a pass.

## Run and look
A compile is not a run. For every story that changes something a player can see (every Visual/Feel and UI story, and
any Logic / Integration / Config/Data story with a visible surface):
1. `unity-harness smoke` (warn the user it takes over Play mode). It enters Play mode on `smoke.scene`, checks
   `expectTypes`, missing scripts and console errors, and saves `smoke.capturePath` (default
   `Temp/harness/smoke.png`).
2. If the smoke frame does not show the state the story changed (a panel, a level, a peak moment), use
   unity-capture to reach that state and capture it at the target resolution.
3. Copy each image to `<paths.evidenceDir>/<story-slug>/NN-<what>.png` (`Temp/` is not kept).
4. Open every image and compare it with the acceptance criteria: clipped text, overflowing panels, missing elements
   and wrong colours are defects. Never describe an image you have not opened.
5. Report exactly one line:
   - `Run result: OBSERVED - <what was on screen> (<retained path>)`;
   - `Run result: NOT VERIFIED - <reason>` (blocks closing a Visual/Feel or UI story);
   - `Run result: N/A - <reason>` only when nothing in the story is observable ("it is a Logic story" is not a
     reason if it has a surface).
This step is not waived at qaLevel minimal: tests are, the look is not.
After smoke or captures, `git status --porcelain` and restore noise Unity serialized on its own.

## Evidence by type (feeds game-done)
| Type | Evidence | Blocking |
|---|---|---|
| Logic | EditMode test at the Test Evidence path, passing in `unity-harness tests` | qaLevel standard/full |
| Integration | EditMode / PlayMode test, or a written playtest note under `paths.evidenceDir` | qaLevel standard/full |
| Visual/Feel | retained screenshots in `<paths.evidenceDir>/<story-slug>/`; the user's sign-off is asked in game-done | every level |
| UI | retained screenshot of each screen touched | every level |
| Config/Data | `unity-harness smoke` passes | advisory |
At qaLevel minimal, for a Logic / Integration story print: `Test evidence: waived at qaLevel minimal - no test was
required or written for this story.` A summary without a tests row reads like a forgotten test.
At a blocking level, a missing test is reported as "story unverifiable - test required before game-done".

## Summary
```
## Implementation Complete: <story title>

Files changed:
- Assets/<Game>/<path> - created | modified (<what>)
- Assets/<Game>/Tests/EditMode/<path> - test file (<N> tests)   [or the qaLevel minimal waiver line]

Verification: unity-harness all - <rules / compile / tests passed/total>   [or NOT VERIFIED - <reason>]
Run result: <OBSERVED ... | NOT VERIFIED ... | N/A ...>
{{#claude}}
Workflow / review: <unity-dev verdict + report path | reviewer findings fixed / open>
{{/claude}}
{{#antigravity}}
Review: <unity-reviewer findings fixed / open; unity-verifier verdict>
{{/antigravity}}

Acceptance criteria covered:
- [x] <criterion> - implemented in <file:member>
- [x] <criterion> - covered by <TestClass.Method>
- [x] <criterion> - OBSERVED in <paths.evidenceDir>/<slug>/01-<what>.png
- [ ] <criterion> - DEFERRED: needs playtest (feel)

Deviations from scope: none | <files outside the story's boundary>
Engine risks flagged: none | <specialist finding>
Blockers: none | <what>
```
End with the next step by `workflow`: standard / full → `Next: game-code-review <story-path>, then game-done
<story-path>`; minimal → `Next: game-done <story-path>`.

## Session checkpoint
Overwrite (never append) the block between `<!-- CHECKPOINT -->` and `<!-- /CHECKPOINT -->` in `paths.sessionState`.
Create the file with just this block if it does not exist; if it exists without markers, insert the block at the
top and leave the rest. Plain `Key: value` lines (`unity-harness studio status` reads `Current story:`):
```
<!-- CHECKPOINT -->
Updated: <YYYY-MM-DD>
Branch: <current git branch>
Current story: <story path>
Current task: game-dev - <story title>
Next step: <game-code-review <story path> (standard/full) | game-done <story path> (minimal)>
Blocked on: nothing
Files in progress: <changed files, test file included>
Run result: <the Run result line, verbatim>
Open questions: none
<!-- /CHECKPOINT -->
```
- INCOMPLETE → `Next step: game-dev <path> - resume: <breakage>`.
- BLOCKED (phase 2) → `Next step: <the unblocking action>` and fill `Blocked on`.
Write it only when no workflow is running. Confirm "Session state updated."
