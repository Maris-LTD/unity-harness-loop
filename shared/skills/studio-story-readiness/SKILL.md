---
name: studio-story-readiness
description: Check whether Unity stories are ready to implement (READY / NEEDS WORK / BLOCKED) without editing them. Use for "is this story ready", "story readiness", "kiểm tra story sẵn sàng chưa", "story này code được chưa".
---

# Story readiness

{{#claude}}
If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.
{{/claude}}

Validates that a story file holds everything a programmer needs: no mid-sprint design interruptions, no guessing,
no ambiguous acceptance criteria. **Read-only**: it never writes or edits a story. It reports and offers to draft
the missing sections in the conversation.

Reference: `references/checklist.md` holds the full checklist and the output formats. Read it at phase 3.

## Verdicts
- **BLOCKED**: a finding about the story that must clear first: a dependency story missing or without a Status line, a referenced
  ADR that is missing / Proposed / Deprecated / Superseded, or an UNRESOLVED design question with no owner.
- **NEEDS WORK**: one or more checklist items fail; fixable before assignment.
- **NOT ASSESSED**: the story could not be evaluated: unreadable or unparseable file, a referenced ADR with no
  readable Status line, a referenced design document that cannot be found. Never a synonym for BLOCKED.
- **READY**: every item passes, is N/A with a stated reason, or is advisory at this tier (advisory gaps are still
  listed).

Precedence, first match wins: BLOCKED → NEEDS WORK → NOT ASSESSED → READY. A story never evaluated is never READY.

## 1. Settings and scope
- Run `unity-harness studio config`. Keep `reviewMode`, `automation`, `workflow`, `qaLevel`, `paths`.
- Scope from the user's argument:
  - a story path → that file;
  - an epic slug → every `story-*.md` under `paths.epicsDir/<slug>/`;
  - `sprint` → the newest `sprint-*.md` in `paths.sprintsDir`, every story path it lists;
  - `all` → every `story-*.md` under `paths.epicsDir` (never `EPIC.md` or `index.md`).
- No argument: ask with {{ask}}: a specific story / the current sprint / all stories / one epic (minor decision).
- Say "Validating N story files."
- **Zero stories in scope**: stop with `NOT ASSESSED - no stories in scope`, naming the scope and the empty path, and
  route to studio-create-epics then studio-create-stories (at minimal: studio-create-stories). "No sprint plan found"
  and "the sprint plan lists no stories" are different reports; say which. Never print a 0/0/0 summary.

## 2. Load shared context once
- `paths.gddDir` listing and `paths.brief` (minimal: the brief stands in for a GDD).
- ADRs (`paths.architectureDir/adr-*.md`, studio-architecture-decision), the TR registry (`paths.trRegistry`,
  studio-architecture-review) and the control manifest (`paths.controlManifest`, studio-create-control-manifest)
  are optional. If the project has none, every check that depends on them auto-passes; say "no ADRs / TR registry /
  manifest in this project" once, not per story.
- If ADR files exist, take their statuses from `unity-harness studio status` (`architecture.adrsByStatus`) and, per
  referenced ADR, its `> **Status**:` line (or a `## Status` section in a hand-written ADR) with one search, not one
  read per ADR. Zero status lines with N files present means malformed ADRs, not "none Accepted": report it once.
- Sprint scope: hold the sprint's Must Have / Should Have tiers for escalation.

## 3. Evaluate each story
Read `references/checklist.md` now and run every group on every story: Design Completeness, Architecture
Completeness, Scope Clarity, Open Questions, Asset References, Definition of Done.

Tier (`workflow`) sets what blocks:
- `full`: every item blocks.
- `standard`: Design Completeness and Scope Clarity block. Architecture items are advisory (written as gaps with a
  `Fix:` line, never blocking), except that a referenced ADR that is missing / Proposed / Deprecated / Superseded
  blocks.
- `minimal`: acceptance-criteria check only (Design Completeness, Scope Clarity, Definition of Done). Architecture
  items are N/A, except the referenced-ADR rule above, which blocks at every tier because studio-dev-story stops
  on it.

`qaLevel` sets the test-evidence item: at `minimal` it auto-passes for Logic, Integration and Config/Data; UI and
Visual/Feel always need the retained screenshot location (the look is never waived).

## 4. Report
Use the single-story or aggregate format in `references/checklist.md`. Name all six groups under Passing Checks
every time ("none - see Gaps" when empty) so a skipped group is visible.

Sprint scope: if any Must Have story is not READY, put a warning block at the top listing them, and suggest
fixing them or replanning with studio-sprint-plan.

## 5. QL-STORY-READY gate
Runs only when `reviewMode` is `full`; otherwise note `QL-STORY-READY skipped (solo|lean)`.

Spawn the qa-lead with {{spawn qa-lead}}, gate QL-STORY-READY, passing per story:
- story path and Type (the gate branches on it);
- the acceptance criteria verbatim;
- the design requirement it covers (GDD section or brief MVP feature; TR-ID if any);
- dependency state (exists / no status / missing);
- this skill's verdict.

Verdicts:
- ADEQUATE → cleared.
- GAPS → show them; ask with {{ask}}: update the story with the gaps / accept and proceed / discuss.
- INADEQUATE → the story is at least NEEDS WORK (BLOCKED stays BLOCKED). If the user proceeds anyway, keep the
  verdict and print "proceeding despite QL-STORY-READY: INADEQUATE (user override)", never a silent READY.
- NOT ASSESSED → name the missing input; offer to supply it and re-run; otherwise a READY becomes NOT ASSESSED.

## 6. Offer help, then hand off
- Offer: "Want me to draft the missing sections for any of these stories?" Draft only in the conversation; writing
  is the user's call (or studio-create-stories for new stories).
- Redirects:
  - story file missing → studio-create-stories (studio-create-epics first at standard/full);
  - no design reference and the change is small → write a short spec section in the story by hand
    (CCGS /quick-design is not in this plugin yet);
  - scope grew past its estimate → split it, or raise it with the producer before implementation.
- Single-story scope: list up to 3 other Ready, unblocked Must/Should Have stories from the current sprint, or say
  `Next ready stories: no sprint file found` / `none ready in <sprint>`. Without a sprint, use the
  `nextReadyStory` line of `unity-harness studio status`.
- Next step for a READY story: studio-dev-story `<path>`.
