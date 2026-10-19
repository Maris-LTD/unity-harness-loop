# Epic templates

Write in `language`, replacing every bracketed hint. Paths in the files are project-relative as `studio config`
prints them.

## `<paths.epicsDir>/<epic-slug>/EPIC.md`

```markdown
# Epic: [System Name]

> **Layer**: [Foundation / Core / Feature / Presentation]
> **GDD**: [paths.gddDir]/[file].md | none yet
> **Code area**: Assets/[Game]/[System]/
> **Status**: Ready
> **Stories**: Not yet created — run `game-tasks [epic-slug]`

## Overview

[Per docsDensity: what this epic implements, from the GDD Overview (or the concept / brief) and the system's
responsibilities.]

## Governing ADRs

| ADR | Decision summary | Engine risk |
|-----|------------------|-------------|
| [ADR-NNNN: title, or "none yet"] | [1-line summary] | [LOW/MEDIUM/HIGH] |

## Requirements

| ID | Requirement | ADR coverage |
|----|-------------|--------------|
| [TR-[system]-001, or AC-1 from the GDD when there is no registry] | [requirement text] | [ADR-NNNN ✅ / ⏳ ADR-NNNN pending acceptance / ❌ No ADR / n/a] |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed and closed with `game-done`.
- All acceptance criteria from [the GDD / concept / brief] are verified.
- Logic and Integration stories have passing EditMode tests in the asmdef listed in `testAssemblies`
  (`unity-harness config`), conventionally `Assets/[Game]/Tests/EditMode/`. At qaLevel minimal tests are advisory.
- Visual/Feel and UI stories have screenshots kept in [paths.evidenceDir] (each screen touched for UI; Visual/Feel
  also needs the user's sign-off, given in game-done).
- `unity-harness all` passes.
- [Any GDD sections still missing for the tier, if any.]

## Next Step

Run `game-tasks [epic-slug]` to break this epic into implementable stories.
```

## `paths.epicsIndex`

```markdown
# Epics Index

Last Updated: [date]
Engine: Unity [unityVersion]

| Epic | Layer | System | GDD | Stories | Status |
|------|-------|--------|-----|---------|--------|
| [name] | Foundation | [system] | [file or none yet] | Not yet created | Ready |
```

## Update-in-place rules
- This skill owns, in an existing `EPIC.md`: the header fields other than `Stories`, `## Overview`,
  `## Governing ADRs`, `## Requirements` and `## Definition of Done`.
- It never touches the `**Stories**` header line or a `## Stories` table: `game-tasks` wrote them, and
  resetting them to "Not yet created" orphans every story already in the folder.
- In the index, update the epic's row in place and keep its `Stories` value.
