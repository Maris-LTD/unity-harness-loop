---
name: studio-design-review
description: Review one GDD or the game concept for completeness, consistency and implementability, with an APPROVED / NEEDS REVISION verdict. Use for "review this GDD", "design review", "duyệt GDD", "kiểm tra GDD".
---

# studio-design-review

{{#claude}}
If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.
{{/claude}}

Run it in a different session from the one that authored the document: the reviewer must not inherit the design
history.

References in this skill:
- `references/review-report.md`: the report format, the scope signal, and the closing options (phases 4-5).

## 0. Settings and depth
- Run `unity-harness studio config` (`reviewMode`, `automation`, `workflow`, `paths`, `unityVersion`, `language`).
- Argument: the document path, or `concept`; none → ask with {{ask}}, listing GDDs in `paths.gddDir` whose
  systems-index status is Designed, In Review or Needs Revision, plus `paths.concept` when it exists.
- **Concept mode**: the argument is `concept` or `paths.concept`. Completeness uses the concept rubric (section 2),
  the report is `<paths.gddReviewsDir>/game-concept-review-<YYYY-MM-DD>.md`, and there is no systems-index write.
  studio-gate-check systems-design requires this report.
- `reviewMode` sets depth: `full` = all phases plus specialist reviewers (phase 3b); `lean` = all phases, no
  specialists; `solo` = no specialists and no closing question, but phase 5's tracking writes (review report and
  systems-index status) still happen, because the phase gates read them. Also the depth when another skill calls
  this one.
- `workflow` sets what is required:
  - `full`: all 8 sections; any missing one blocks approval.
  - `standard`: Overview, Detailed Rules, Edge Cases, Dependencies, Acceptance Criteria block when missing;
    Formulas blocks when the system defines numeric rules (rates, curves, thresholds, costs; the category is a hint,
    not the test); Player Fantasy and Tuning Knobs are advisory.
  - `minimal`: no GDD expected; if one exists, check the 5 standard sections advisorily.

## 1. Load
1. Freshness: the latest `<paths.gddReviewsDir>/<system>-review-*.md` (`game-concept-review-*.md` in concept mode),
   if any, records the document's
   `git hash-object` and the registry's. Compute both now.
   - Both unchanged and the last verdict was APPROVED → say "unchanged since its review on <date> (APPROVED)" and ask
     with {{ask}}: use the prior verdict (recommended) / re-review anyway. Guided takes the prior verdict and says so;
     autonomous logs it.
   - Document unchanged and the last verdict was a revision verdict → say the prior findings stand and revising is
     the next step, not re-reviewing; offer to show them. Stop.
   - Only the registry changed → re-check this GDD's registry-sourced values; re-issue the prior verdict unless a
     conflict appears, then do a full review.
   - Document changed, new, or no prior review → full review. Never a partial review of "changed sections only".
2. Read the document in full, and the project's CLAUDE.md / AGENTS.md for its standards.
3. Cross-document facts: if `paths.entityRegistry` lists entries this system owns or references, use them as the
   facts this GDD must not contradict. Otherwise read only the GDDs named in its Dependencies section; never read
   all of `paths.gddDir`.
4. Dependency graph: for every system in Dependencies, check `<paths.gddDir>/<system>.md` exists; list missing ones as
   broken references.
5. Tone and pillars: read `paths.concept` (at minimal `paths.brief`) and `paths.pillars` if present; note mechanics
   that contradict pillars, tone or world rules.
6. Prior review: read the latest review report if one exists; this is a re-review, so track whether its blocking items
   were addressed.

## 2. Completeness
- List the document's `## ` headings. `## Detailed Design` satisfies Detailed Rules; `## Summary` should exist (later
  skills read it).
- Mark each of the 8 sections REQUIRED or ADVISORY for the tier (section 0). A missing REQUIRED section blocks; a
  missing ADVISORY one is a recommendation.
- Concept mode uses the headings of the concept template (studio-brainstorm `references/game-concept-template.md`)
  instead of the 8 GDD sections:
  - REQUIRED at standard: Elevator Pitch, Core Identity, Core Fantasy, Core Loop, Game Pillars (with Anti-Pillars),
    MVP Definition, Technical Considerations, Risks and Open Questions.
  - REQUIRED at full: all of those plus Unique Hook, Player Experience Analysis (MDA), Player Motivation Profile,
    Visual Identity Anchor, Target Player Profile.
  - Everything else is ADVISORY. Section 3's implementability checks apply to the Core Loop and MVP Definition;
    dependency checks (section 1.4) do not apply.
- A present heading can still be empty: read any section the verdict depends on.

## 3. Consistency and implementability
- Internal: formulas produce the described behaviour; edge cases do not contradict the rules; dependencies are
  bidirectional (the other GDD lists this system).
- Implementable: precise enough to code without guessing; no hand-waved parts; performance considered against
  `targetFps` and the budgets in `studio config`; tuning values live in ScriptableObject/config fields, not literals.
- Acceptance criteria: each independently testable (EditMode test, screenshot, Play mode check or perf measure).
  Quote every one that is not ("feels balanced", "works correctly") with a measurable rewrite. Outside full mode this
  is the only check of them.
- Cross-system: conflicts with existing mechanics, unintended interactions, fit with the pillars.
- Unity: APIs or features the design relies on that `unity-engine-reference` marks as changed or deprecated for
  `unityVersion`.

## 3b. Specialist review (full only, mandatory there)
Say first: "Full review: spawning specialist reviewers in parallel; this takes several minutes."
1. From the document already loaded, list every domain it touches:

| The GDD contains | Spawn |
|---|---|
| Any gameplay rules | {{agent game-designer}} (always) |
| Formulas, system interaction rules, data schema | {{agent game-designer}} (boundary-value pass, see below) |
| Costs, drops, rewards, progression, XP | {{agent game-designer}} (economy lens) |
| AI, pathfinding, targeting | {{agent ai-programmer}} |
| UI, HUD, menus | {{agent ui-programmer}}, {{agent unity-ui-specialist}} |
| Animation, feel, timing, juice, multiplayer sync | {{agent gameplay-programmer}} |
| Performance, draw calls, memory | {{agent engine-programmer}} |
| Unity-specific patterns or APIs | {{agent unity-specialist}} |
| Acceptance criteria, test coverage | {{agent qa-lead}} |
| Dialogue, story, lore, audio | no specialist agent yet: note it |

2. Spawn all of them at once, each the same way as {{spawn game-designer}} with the agent id from the table; never
   simulate their views yourself.
   Prompt each adversarially: "Here is the GDD for <system> and the main review's findings so far. Your job is to find
   problems, not to validate. What is wrong, underspecified, likely to break, or missing? Disagreeing with the main
   review is welcome."
   - game-designer: anchor to the GDD's Player Fantasy (or the pillars): does the design deliver that feeling? For
     formulas, plug in minimum and maximum plausible inputs and report degenerate outputs (negative, division by zero,
     infinity, nonsense).
   - qa-lead: flag every criterion that is not independently testable, with a rewrite.
3. Senior review: {{spawn creative-director}} with the GDD, all specialist findings and their disagreements. Ask for a
   synthesis, which issues matter most, whether it agrees, and an overall verdict in this skill's words (APPROVED /
   NEEDS REVISION / MAJOR REVISION NEEDED), never a gate word such as READY or REJECT. Its synthesis is the final
   verdict.
4. Never silently resolve disagreements: show both sides for the user to decide. Tag every finding with its source,
   e.g. `[game-designer]`.

## 4. Report
Read `references/review-report.md` and print the report. Nothing is written in this phase. Use NOT ASSESSED when the
document is missing, unreadable or empty of the reviewed sections, or a document it depends on is missing; name what
was unavailable and which skill produces it (`studio-design-system`, `studio-brainstorm`). Never default to APPROVED.

## 5. Tracking writes and next steps
Follow `references/review-report.md` section "Closing": revise now or later, then the tracking writes (the review
report file; the systems index status and the GDD header `> **Status**:` line, both set to the same word; neither in
concept mode), each asked per the automation mode, then one closing question naming the real next step. In `solo`,
skip the revise-now offer and the closing question, but still ask for and do the tracking writes.
