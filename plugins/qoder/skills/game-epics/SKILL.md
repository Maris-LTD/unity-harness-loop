---
name: game-epics
description: Turn the GDDs or game concept of a Unity game into epics, one per system, in dependency order. Use for "create epics", "break the game into epics", "tạo epic", "chia epic".
---

# game-epics

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

An epic is a named, bounded body of work, one per system. It says what must be built and what governs it; how to
build it is the job of stories. Run it once per layer as development approaches that layer: Feature-layer epics
written while Core is unfinished go stale.

Output: `<paths.epicsDir>/<epic-slug>/EPIC.md` and `paths.epicsIndex`. Next, per epic: `game-tasks <epic-slug>`.

References in this skill:
- `references/epic-templates.md`: the EPIC.md and index templates, and the update-in-place rules.

## 1. Setup and arguments
- Run `unity-harness studio config` (`workflow`, `reviewMode`, `automation`, `docsDensity`, `storyGranularity`,
  `unityVersion`, `language`, `paths`) and `unity-harness studio status`.
- `workflow: minimal`: this skill is not on the path. Say: "At minimal the epic is implicit:
  `game-tasks` reads the brief and writes the epic with its stories." If the user still wants it, read
  `paths.brief` (missing → "No brief yet, run `game-concept` first" and stop), decompose from its MVP list and
  build order, with no GDD or ADR prerequisite, then continue at section 4.
- Arguments: `all` (every system in layer order), `layer: foundation|core|feature|presentation`, `<system-name>`,
  or nothing (ask which layer or system with `AskUserQuestion`).
- `storyGranularity` sizes each epic's expected breakdown: 3-5 stories at `coarse`, 5-10 at `balanced`, 10-20 at
  `fine`.
- `docsDensity` sets the epic prose depth: `terse` = scope bullets and a one-line rationale; `balanced` = a scope
  paragraph with light rationale; `thorough` = full scope prose, ADR rationale and risks. The tables stay whole at
  every density.

## 2. Load inputs (standard / full)
1. System GDDs: list `paths.gddDir/*.md` except non-system docs (`game-concept.md`, `game-pillars.md`,
   `systems-index.md`, `art-bible.md`, any cross-review file). Call the count N.
   - N > 0: read only the in-scope GDDs. For `layer:` / `<system>` modes, read each GDD's Overview and
     Dependencies to place it in a layer and decide scope; never drop a system from scope because a section is
     missing. In `all` mode every system is in scope.
   - N = 0: offer two ways on, with `AskUserQuestion`: write the GDDs first (`game-systems` for the systems index,
     then `game-design <system>` per system and `game-design-review` on each), or decompose from
     `paths.concept`'s Core Mechanics and MVP Definition, one epic per core mechanic, with "GDD: none yet". No
     concept either → "Run `game-concept` first" and stop.
2. Read when they exist (missing → the field reads "none yet"):
   - `paths.systemsIndex`: system list, layers, priority, and the Status column, which is authoritative for each
     GDD's design status (the GDD header `> **Status**:` is the fallback when the index has no row);
   - `paths.architectureDoc`: module ownership;
   - ADRs in `paths.architectureDir` covering in-scope systems: the `> **Status**:` line plus the Decision, GDD
     Requirements Addressed and Engine Compatibility sections. Only `Accepted` ADRs count as coverage; a
     `Proposed` ADR counts as pending coverage and its requirements are flagged "pending ADR-NNNN acceptance";
     `Deprecated` / `Superseded` ADRs count as none;
   - `paths.trRegistry`: the TR-IDs (`TR-<system>-NNN`, `status: active` only) used in each epic's requirements
     table.
3. Report: "Loaded N GDDs, M ADRs, engine Unity <unityVersion or 'version not set — run game-setup'>."

Tier expectations:
- `full`: every in-scope GDD has all 8 sections and is Approved (systems-index Status column); requirements without a governing ADR are flagged
  before each epic is created.
- `standard`: GDDs carry the 5 required sections (+ Formulas when the system has numeric rules); only
  Foundation-layer ADRs are expected, the rest is informational.
- A missing section is reported per GDD; it does not stop epic creation, but the epic's Definition of Done names
  the gap.

## 3. Processing order
Foundation (no dependencies) → Core → Feature → Presentation. Within a layer, follow `systems-index.md` when it
exists, otherwise each GDD's Dependencies section (a system before the systems that depend on it). At minimal or
without GDDs, derive the order from the brief's build order or the concept's MVP list. Never send the user away to
produce an ordering document.

## 4. Define each epic
Present each epic before writing anything:

```
## Epic: <System Name>
Layer: <Foundation / Core / Feature / Presentation>
GDD: <paths.gddDir>/<file>.md | none yet
Code area: Assets/<Game>/<System>/ (asmdef <Game>.Runtime unless the project splits further)
Governing ADRs: <ADR list> | none yet
Engine risk: <LOW / MEDIUM / HIGH from ADR or unity-reference; NOT ASSESSED when unknown>
Requirements covered by ADRs: <N / total> | n/a (no ADRs)
Untraced requirements: <list> | none
```

- At `full` with untraced requirements, warn: "<N> requirements in <system> have no ADR. Their stories will be
  written with `ADR: N/A` and `Status: Ready`, so they would be implemented without architectural guidance.
  Record a decision first with game-adr, or proceed and accept the gap."
- At `standard` list untraced non-Foundation requirements as information only. With no ADRs at all, skip the check
  and state "Governing ADRs: none yet".
- Ask with `AskUserQuestion`: "Create Epic: <name>?" — Yes, create it / Skip this epic / Pause, I need to decide something
  first. One epic at a time in `collaborative`; per the studio protocol otherwise.
- No invention: scope comes from the GDDs, concept, brief and ADRs that exist.

## 5. Producer gate PR-EPIC
Not a phase gate: runs only at reviewMode `full` (note "PR-EPIC skipped (solo|lean)" otherwise). After all epics
for the layer are defined and before writing any file, spawn the producer with the `Agent` tool with `subagent_type: "producer"`, gate PR-EPIC.
Context: the epic structure inline (every epic's scope summary and governing-ADR count; no files exist yet),
milestone timeline and target dates, team capacity, the layer being processed.
- REALISTIC: write.
- UNREALISTIC: revise boundaries (split overscoped, merge underscoped), present again, re-run the gate before writing.
- CONCERNS: ask with `AskUserQuestion` — Proceed as planned, accepting the concerns / Revise epic boundaries / Stop and
  reconsider scope. Revise → back to section 4 and re-run the gate. Stop → verdict BLOCKED.
- NOT ASSESSED (no timeline or capacity): supply it and re-run, or proceed if the user chooses and state
  `PR-EPIC: NOT ASSESSED — <input>` in the output and the verdict.

## 6. Write epic files
- Never overwrite an existing `EPIC.md`. Ask: "An EPIC.md already exists for <name>. Update it in place, or skip
  it?" Updating rewrites only what this skill owns and keeps the stories (see `references/epic-templates.md`).
- New epic: "May I write `<paths.epicsDir>/<slug>/EPIC.md` and add its row to `<paths.epicsIndex>` (creating it if
  absent)?" Then write from `references/epic-templates.md`, in `language`.
- Update the index: an epic that already has a row keeps it, updated in place with its Stories value; never a
  second row, never reset Stories to "Not yet created".

## 7. After writing
- Epics define scope, stories define steps: run `game-tasks <epic-slug>` for each epic before anyone
  can pick up work.
- Epics are pre-production work (the stage after `game-gate pre-production`). Once the Foundation and Core
  epics have stories and a first sprint is planned, the next transition is `game-gate production`.
- Never create stories in this skill.

Verdict: **COMPLETE** (N epics written; run `game-tasks <slug>` per epic), or **BLOCKED** (all epics
declined, no eligible systems, or the user stopped at PR-EPIC).
