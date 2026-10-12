# Story template

Contents: story file · minimal-tier field mapping · QA Test Cases rules · EPIC.md stories table · index update.

File: `<paths.epicsDir>/<epic-slug>/story-NNN-<slug>.md` (three-digit number, kebab-case slug). Write in
`language`, replacing every bracketed hint.

`unity-harness studio status` reads the status from the line `> **Status**: <word>`. Keep it on one line with one of
the words `Ready`, `In Progress`, `Blocked`, `Complete`. `studio-create-stories` writes `Ready` or `Blocked`;
`studio-dev-story` and `studio-story-done` move it on.

## Story file

```markdown
# Story [NNN]: [title]

> **Epic**: [epic name]
> **Status**: Ready
> **Layer**: [Foundation / Core / Feature / Presentation]
> **Type**: [Logic | Integration | Visual/Feel | UI | Config/Data]
> **Estimate**: [filled by studio-create-stories from scope: coarse 2-5 days, balanced 1-2 days, fine < 1 day]
> **Last Updated**: [set by studio-dev-story when implementation begins]

## Context

**Design source**: `[paths.gddDir]/[file].md` | `[paths.brief]` | `[paths.concept]`
**Requirement**: `[TR-[system]-NNN | AC-n | Brief MVP feature N]`

**ADR Governing Implementation**: [ADR-NNNN: title | N/A — reason]
**ADR Decision Summary**: [1-2 sentences | N/A]
**ADR Version**: [the ADR's Last Verified date, else its Date, else `unversioned` | N/A]

**Engine**: Unity [unityVersion] | **Risk**: [LOW / MEDIUM / HIGH / NOT ASSESSED]
**Engine Notes**: [post-cutoff Unity APIs to verify against unity-engine-reference, or "none"]

**Unity hints**:
- Code: `Assets/[Game]/[System]/` ([Game].Runtime)
- Test: `Assets/[Game]/Tests/EditMode/[System]/[StoryName]Tests.cs` (asmdef in `testAssemblies`)
- Data: [ScriptableObject / config asset holding the tuning values, if any]
- Scene / prefab: [what a Visual or UI story touches, if any]

## Acceptance Criteria

*From [design source], scoped to this story:*

- [ ] [criterion 1, checkable by an EditMode test or a named screenshot state]
- [ ] [criterion 2]
- [ ] [performance criterion if applicable, against targetFps / drawCallBudget]

## Implementation Notes

[From the ADR's Implementation Guidelines when there is one, without changing its meaning; otherwise the design
rules this story must follow. Depth per docsDensity. This is what the programmer reads instead of the ADR.]

## Out of Scope

*Handled by neighbouring stories, do not implement here:*

- [Story NNN+1]: [what it handles]

## QA Test Cases

[See "QA Test Cases rules" below.]

- **AC-1**: [criterion]
  - Given: [precondition]
  - When: [action]
  - Then: [assertion]
  - Edge cases: [boundary values / failure states]

- **AC-2** (Visual/Feel or UI): [criterion]
  - Setup: [how to reach the state in Play mode]
  - Verify: [what to look for]
  - Pass condition: [unambiguous pass]

## Test Evidence

**Story Type**: [type]
**Required evidence** (per the studio protocol; at qaLevel minimal tests are advisory, screenshots are not):
- Logic: `Assets/[Game]/Tests/EditMode/[System]/[StoryName]Tests.cs`, passing in `unity-harness tests`
- Integration: an EditMode/PlayMode test, or a playtest note `[paths.evidenceDir]/[story-slug]/playtest.md`
- Visual/Feel: screenshots `[paths.evidenceDir]/[story-slug]/NN-[what].png` + the user's visual sign-off, recorded by studio-story-done in Completion Notes
- UI: a screenshot of each screen touched, `[paths.evidenceDir]/[story-slug]/NN-[screen].png`
- Config/Data: `unity-harness smoke` passes

**Evidence**: [ ] Not yet created

## Dependencies

- Depends on: [Story NNN-1 must be Complete, or "None"]
- Unlocks: [Story NNN+1, or "None"]
```

Keep only the line of Required evidence that matches the story type, and only the QA case style that matches it.

## Minimal-tier field mapping
No GDD, ADR or registry exists at `minimal`. Fill the template exactly like this, so every run is deterministic:
- Design source → `[paths.brief]`.
- Requirement → `Brief MVP feature N` (never a TR-ID).
- ADR Governing Implementation / Decision Summary / Version → `N/A (minimal — no ADRs)`.
- Engine → `Unity <unityVersion>` from studio config (`not set — run studio-setup` when empty).
- Risk → the rating `unity-engine-reference` gives that Unity version. If it gives none, or the version is not set,
  write `NOT ASSESSED (no version risk rating)`; never guess. `studio-dev-story` treats NOT ASSESSED as HIGH when it
  decides whether to bring in the Unity specialist.
- Engine Notes → `none (no ADR engine analysis at minimal)`.
- Acceptance Criteria source line → "From `<paths.brief>` (the Player goal & fail state field + the MVP feature this
  story implements), scoped to this story". Derive concrete, testable criteria from what the user wrote there.

## QA Test Cases rules
- QL-STORY-READY ran and returned ADEQUATE: paste the qa-lead's specs. The programmer implements against them and
  does not invent new cases.
- The gate was skipped (`solo` or `lean`, which includes every `minimal` project by default): write "*N/A — no
  qa-lead specs at this review mode; implement against the Acceptance Criteria above*". Do not improvise test cases.
- GAPS accepted, or NOT ASSESSED: write "*Test cases not yet defined.*"

## EPIC.md stories table
At minimal with no EPIC.md yet, write the implicit epic now (header: Epic name, Layer, Design source = the brief,
Status Ready; Overview = pitch; Scope = MVP list; Order = build order) with this table. Otherwise replace the
"Stories: Not yet created" header line with "Stories: N — see table" and add the table, or, on a return visit,
append one row per new story and leave existing rows untouched.

```markdown
## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | [title] | Logic | Ready | [ADR-NNNN / N/A] |
```

## Index update
In `paths.epicsIndex`, set this epic's `Stories` column to `N stories`, N being the epic's total after this run
(existing plus new). If the index does not exist, say so in one line — "Epics index not updated: <path> absent" —
and continue; never skip silently.
