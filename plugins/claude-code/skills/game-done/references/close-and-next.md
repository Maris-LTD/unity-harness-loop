# game-done - Phases 7-8: close and hand off

Contents: approval · story edits · epic, sprint, tech debt · commit suggestion · session checkpoint · next story.

## Phase 7: Approval
Reached after COMPLETE / COMPLETE WITH NOTES, or after BLOCKED / NOT ASSESSED only when the user explicitly asks to
close anyway. Closing a BLOCKED or NOT ASSESSED story is a scope change: always ask, in every automation mode. For
COMPLETE / COMPLETE WITH NOTES, autonomous mode may pick the recommended option and log it in `paths.decisionLog`.

Ask with `AskUserQuestion`, naming every file the close will touch (story, EPIC.md, sprint file, tech-debt register when
chosen, session checkpoint):
- Close the story: mark Complete and write the notes (recommended)
- Close and log the advisory deviations as tech debt
- I want to fix issues first, do not close
- Accept the deviations as they are and close anyway
"Fix first" → stop, list what the user flagged, write nothing.

## Story edits
1. `> **Status**: Complete`.
2. `> **Last Updated**: <YYYY-MM-DD>` (add after Status if absent).
3. Append:
```
## Completion Notes
**Completed**: <date>
**Criteria**: X/Y passing (<deferred items>)
**Harness**: unity-harness all <result>; smoke <result>
**Run result**: <OBSERVED + retained paths | N/A - reason | NOT VERIFIED - reason>
**Deviations**: None | <advisory deviations; Manifest-Note if any>
**Test Evidence**: <test file + passed/total | screenshot paths | none required (Config/Data) | waived at qaLevel minimal>
**Visual sign-off**: <approved <date> | concerns - <list> | n/a (not Visual/Feel or UI)>
**Code Review**: <unity-reviewer: n findings, fixed / open> <LP-CODE-REVIEW verdict | skipped (reason)>
**Untested criteria**: <AC list, if any>
**Closed over**: <only when closed despite BLOCKED / NOT ASSESSED: what was failing or never evaluated, and the user's call>
```

## Epic, sprint, tech debt
- `paths.epicsDir/<epic>/EPIC.md`: if it has a stories table, set this story's row to Complete. If every story of the
  epic is now Complete, set the epic's Status to Complete. If `paths.epicsIndex` has a row for the epic, update its
  progress the same way. Missing files: say so in one line, do not create them.
- Sprint files carry no story status (the story's Status line is the only record), so do not edit them. If the
  current sprint (newest `sprint-*.md` in `paths.sprintsDir`) lists this story, say how many of its Must Have
  stories are now Complete.
- "Close and log tech debt": append each advisory deviation as one row to `tech-debt-register.md` in the parent folder
  of `paths.epicsDir` (e.g. `Docs/production/tech-debt-register.md`), creating it with this header if absent:
```
# Tech Debt Register
Last updated: <date> | Total items: <n>

| ID | Category | Description | Files | Effort | Impact | Priority | Status | Added | Target |
|---|---|---|---|---|---|---|---|---|---|
| TD-<next NNN> | <Architecture/Code Quality/Test/Documentation/Dependency/Performance> | <deviation> - from <story path> | <files> | <S/M/L/XL> | <Low/Med/High/Critical> | - | Open | <date> | Backlog |
```
  Update the `Last updated` / `Total items` line when the file exists.

## Commit suggestion
Do not commit. Print a ready-to-run suggestion covering the story's code, tests, evidence and doc changes, with a
Conventional Commits message referencing the story, following the project's commit rules (no AI attribution lines
when the project forbids them):
```
git add <changed files> <story path> <evidence files>
git commit -m "feat: <story title>" -m "Story: <story id or path>"
```

## Session checkpoint
Overwrite (never append) the block between `<!-- CHECKPOINT -->` and `<!-- /CHECKPOINT -->` in `paths.sessionState`
(create the file with just this block if absent; insert the block at the top of a file without markers). Fill
`Next step` from phase 8 so it names the same next story the user is shown:
```
<!-- CHECKPOINT -->
Updated: <YYYY-MM-DD>
Branch: <current git branch>
Current story: none
Current task: game-done - <story path> closed: <verdict>
Next step: <game-dev <next path> | "build order done: play the build" | the blocker to clear | the sprint's next step>
Blocked on: nothing | <what blocked this verdict>
Files in progress: none
Open questions: <tech debt logged: N items | none>
<!-- /CHECKPOINT -->
```
Confirm "Session state updated."

## Phase 8: Next story
Run `unity-harness studio status --json` after the story edit, so this story's new status is in it. Use its
`inProgress`, `nextReadyStory` and per-epic counts; do not re-rank story files by hand.

### No sprint plan (minimal path, or `paths.sprintsDir` empty)
- Next is the first other In Progress story (finish it), else `nextReadyStory`:
```
### Next Up
<Story NNN: title> - <one line>
Run game-dev <path>.
```
  At minimal recommend game-dev directly (game-readiness is not on the minimal path). At a higher tier
  with no sprint, add "game-readiness <path> first".
- Name every Blocked story with its blocker and pass over it.
- No unfinished story at all (every story Complete) → the build order is done. Offer: play the build and note what
  feels wrong (then unity-tweak); add stories from the brief with game-tasks; raise rigor if the
  game outgrew a one-page brief (`unity-harness studio set rigor=standard`, asked first).
- Only Blocked / unstatused stories left → there is no Next Up and the build order is NOT done; name each with
  its blocker (or no status) and suggest clearing it (at minimal: finish it and set Status Ready; higher:
  game-readiness).
Never print a sprint close-out sequence on this branch.

### With a sprint plan
- From the newest sprint file, list up to 3 Ready, unblocked Must / Should Have stories:
```
### Next Up
1. <Story> - <one line> - Est: <x>
Run game-readiness <path> before starting.
```
- No Must Have story left unfinished (all Complete or Blocked):
```
### Sprint close-out
1. unity-harness full - the whole build still passes rules, compile, tests and smoke
2. Play the build; feed issues to unity-tweak or new stories
3. game-sprint-plan - plan the next sprint with this sprint's velocity
```
  Surface unstarted Should Have stories next to it so the user can close the sprint or pull more in.
- Nothing ready but Must Have stories still In Progress: "No more stories ready - N Must Have stories still in
  progress. Finish those before close-out."
