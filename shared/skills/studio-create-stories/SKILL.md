---
name: studio-create-stories
description: Break one epic (or the brief's MVP list) into implementable Unity stories with type, acceptance criteria and required evidence. Use for "create stories", "break the epic into stories", "tạo story", "chia story".
---

# studio-create-stories

{{#claude}}
If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.
{{/claude}}

A story is one implementable behaviour, sized by `storyGranularity`, self-contained and traceable to the design
(brief MVP item, GDD acceptance criterion, ADR when one exists). Run it per epic, in dependency order (Foundation
epics first).

Output: `<paths.epicsDir>/<epic-slug>/story-NNN-<slug>.md`. Next: `studio-dev-story <story>` at minimal, otherwise
`studio-story-readiness <story>` then `studio-dev-story`.

References in this skill:
- `references/story-template.md`: the story file, the minimal-tier field mapping, the EPIC.md stories table and the
  index update. Read it before section 6.

## 1. Setup and arguments
- Run `unity-harness studio config` (`workflow`, `reviewMode`, `automation`, `docsDensity`, `storyGranularity`,
  `qaLevel`, `unityVersion`, `language`, `paths`) and `unity-harness studio status`.
- Argument: an epic slug (`combat`) or an EPIC.md path.
  - The named epic does not exist: at `standard`/`full` stop: "No epic at `<paths.epicsDir>/<slug>/EPIC.md`. Run
    `studio-create-epics`, or check the slug." Never decompose from a guess. At `minimal` say epics are implicit
    and take the minimal branch of section 2.
  - No argument: at `minimal` go to the minimal branch. At `standard`/`full` list the epics from `studio status`
    and ask which one with {{ask}}. No epics at all → "Run `studio-create-epics` first; an epic is what this skill
    decomposes" and stop (never ask a question with no options).
- `storyGranularity` sets the acceptance-criteria load per story: `coarse` 5-10 ACs covering a whole feature
  (multi-day); `balanced` 2-4 ACs covering one task (one focused session); `fine` 1 AC (the story name restates
  it). Group or split criteria to hit the target.
- Fill `Estimate` on every story from its scope: `coarse` 2-5 days, `balanced` 1-2 days, `fine` under a day.
  studio-story-readiness checks it is present.
- `docsDensity` sets story prose depth (context, implementation notes, ADR summary), never the AC count or text:
  `terse` = bullet notes; `balanced` = a short context paragraph plus notes; `thorough` = full context and
  rationale. Requirement IDs, ADR stamps and ACs are never trimmed.

## 2. Load the epic
**Minimal branch (implicit epic):**
0. No `paths.brief` → "There is no brief to build stories from yet; run `studio-brainstorm` first" and stop.
   An `EPIC.md` already in the epic folder (named slug, or the brief-title slug) is the epic: use it, never rewrite
   it; section 6 only appends to its Stories table.
   Stories already in the folder: a return visit. Never rewrite an existing story or the EPIC.md; add stories only
   for brief items not yet covered (or new ones the user names), numbering on from the highest `story-NNN`.
1. Read the brief in full.
2. First run only: draft an implicit epic at `<paths.epicsDir>/<slug>/EPIC.md`, slug = slugified working title
   (`mvp` if untitled): goal = pitch, scope = MVP list, order = build order. Terse. It is written in section 6
   with the stories, after the section 5 approval names it.
3. One coarse story per MVP feature, in build-order sequence, each traced to its brief item. No ADR blocking.

**Standard / full:** read in full:
- `EPIC.md` (overview, governing ADRs, requirements table);
- the epic's GDD if it has one: all 8 sections at `full`; at `standard` the 5 required ones plus Formulas. Always
  prioritise Acceptance Criteria, Formulas and Edge Cases. No GDD ("none yet"): work from the epic overview and the
  concept's MVP definition;
- governing ADRs, if any (`paths.architectureDir/adr-NNNN-*.md`): only Summary/Decision (with Implementation
  Guidelines), Engine Compatibility, Status (`> **Status**:` line) and Last Verified (or Date). The Status decides Ready vs Blocked; the date becomes the story's ADR Version stamp.
- `paths.trRegistry`, if it exists: the `active` entries for this epic's system, which give each story its
  `TR-<system>-NNN` requirement ID;
- `paths.controlManifest`, if it exists: only the header date (the stories' Manifest Version) and the
  `## <Layer> Layer Rules` section for this epic's layer (the stories' Control Manifest Rules).

ADR existence (only for ADRs the epic names):
- `full`: any named ADR file missing → stop before decomposing: "Epic references <ADR> but its file was not found.
  Fix the epic's Governing ADRs list or write the ADR. Cannot create stories until it exists."
- `standard`: stop only for a missing Foundation-layer ADR; otherwise warn, embed the reference and set that story
  `Status: Blocked` until the ADR exists.
- An epic with "Governing ADRs: none yet" has nothing to validate.

Report the real situation: "Loaded epic <name>, GDD <file|none>, N ADRs (<present / missing>), manifest <date|none>."

## 3. Classify by type
| Type | When the criteria reference |
|---|---|
| Logic | formulas, thresholds, state transitions, AI decisions, calculations |
| Integration | two or more systems interacting, events crossing boundaries, save/load round-trips |
| Visual/Feel | animation, VFX, tweens, "feels responsive", timing, screen shake, audio sync |
| UI | menus, HUD, buttons, screens, dialogs, tooltips |
| Config/Data | tuning values in ScriptableObjects or data assets only, no new logic |

Mixed: pick the type with the highest implementation risk. The type sets the evidence `studio-story-done` demands
(evidence table in the studio protocol).

## 4. Decompose
For each acceptance criterion (GDD ACs, or the brief's player goal & fail state applied to the MVP item):
1. group criteria that need the same core implementation; each group is one story;
2. order: foundational behaviour first, edge cases later, UI last;
3. for each story fix: the requirement it covers (TR-ID from `paths.trRegistry` if it has one for this requirement, else `AC-n` of the GDD, else
   `Brief MVP feature N`); governing ADR (Accepted → embed; Proposed → `Status: Blocked`, "BLOCKED: ADR-NNNN is
   Proposed — accept it once decided"; Deprecated/Superseded → Blocked, "point the story at the successor";
   several → list all, primary first; none → `ADR: N/A — <reason>`, never blank); type; engine risk (from the ADR,
   else the Unity version's rating in `unity-engine-reference`, else `NOT ASSESSED`, which `studio-dev-story`
   treats as HIGH);
4. Unity hints: code area `Assets/<Game>/<System>/`, test file
   `Assets/<Game>/Tests/EditMode/<System>/<StoryName>Tests.cs` inside the asmdef listed in `testAssemblies`
   (`unity-harness config`), data as ScriptableObject assets, the scene or prefab a Visual/UI story touches.
   Acceptance criteria must be checkable by an EditMode test or by a named screenshot state.

## 5. QA lead gate QL-STORY-READY, then present
Not a phase gate: runs only at reviewMode `full` (note "QL-STORY-READY skipped (solo|lean)" otherwise). After
decomposing, before asking to write, spawn the QA lead once with {{spawn qa-lead}}, gate QL-STORY-READY. Context:
the full story list inline (no files exist yet) with each story's ACs, type and requirement text, plus the epic's
source ACs. Require in one return: the verdict per story (ADEQUATE / GAPS / INADEQUATE / NOT ASSESSED) and, for each
ADEQUATE story, its test-case block (Given/When/Then per AC for Logic and Integration; Setup/Verify/Pass condition
for Visual/Feel and UI). Do not spawn the QA lead a second time for specs.
- ADEQUATE: keep the specs.
- GAPS: ask with {{ask}} — Revise flagged criteria / Accept and proceed / Discuss further. Revise: draft, show,
  then re-request specs for just those stories in one call. Accept: no qa-lead specs; the story's QA Test Cases
  says "Test cases not yet defined".
- INADEQUATE: blocking; revise the criteria with the user and re-request specs, or drop the story from this run and
  name it as dropped.
- NOT ASSESSED: supply the input and re-request, or write the story without specs and mark it
  `QL-STORY-READY: NOT ASSESSED — <input>` in the list below.

Present the whole set before writing:

```
## Stories for Epic: <name>
Story 001: <title> — Logic — <ADR or N/A>
  Covers: <requirement id> (<one-line summary>)
  Test required: Assets/<Game>/Tests/EditMode/<System>/<Name>Tests.cs
Story 002: <title> — UI — <ADR or N/A>
  Covers: <requirement id>
  Evidence required: screenshot kept in <paths.evidenceDir>/
<N stories: N Logic, N Integration, N Visual/Feel, N UI, N Config/Data>
```

Ask with {{ask}}: "May I write these N stories to `<paths.epicsDir>/<slug>/`, and update `EPIC.md` and
`<paths.epicsIndex>`?" Name every file section 6 touches: at minimal say *create* `EPIC.md` only when none exists,
and leave the index out when it does not exist. Options: write all N / not yet, I want to adjust. Warn about any
Blocked story before asking.

## 6. Write
Read `references/story-template.md`. Write each story (status line exactly `> **Status**: Ready`, or `Blocked`),
then the EPIC.md stories table, then the index row. Write in `language`.

## 7. After writing
Ask with {{ask}} for the next step, including only the options that apply:
- start implementing: `studio-dev-story <first story>` at minimal, `studio-story-readiness <first story>` otherwise
  (Recommended);
- `studio-create-stories <next epic>` when other epics have no stories yet;
- `studio-sprint-plan` when every epic has stories (never at minimal: the build order is the plan);
- stop here.
Note: "Work through stories in order; each story's Depends on field says what must be Complete first."

Rules: load everything before presenting; present all stories at once; never invent criteria (ACs from the design,
notes from ADRs); never start implementation in this skill.

Verdict: **COMPLETE** (N stories written to `<paths.epicsDir>/<slug>/`), or **BLOCKED** (declined, nothing written).
