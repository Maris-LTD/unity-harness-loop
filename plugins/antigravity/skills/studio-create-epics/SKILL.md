---
name: studio-create-epics
description: Turn the game's design (per-system GDDs, else the game concept) into epics for a Unity project, port of CCGS /create-epics. One epic per system, processed in dependency layer order (Foundation, Core, Feature, Presentation), with a producer feasibility gate, written to EPIC.md files plus an epics index; never overwrites an existing epic. Used at rigor standard/full; at minimal the epic is implicit and studio-create-stories builds it from the brief. Use when the user says "create epics", "break the game into epics", "tạo epic", "chia epic", "lên danh sách epic".
---

# studio-create-epics


An epic is a named, bounded body of work, one per system. It says what must be built and what governs it; how to
build it is the job of stories. Run it once per layer as development approaches that layer: Feature-layer epics
written while Core is unfinished go stale.

Output: `<paths.epicsDir>/<epic-slug>/EPIC.md` and `paths.epicsIndex`. Next, per epic: `studio-create-stories <epic-slug>`.

References in this skill:
- `references/epic-templates.md`: the EPIC.md and index templates, and the update-in-place rules.

## 1. Setup and arguments
- Run `unity-harness studio config` (`workflow`, `reviewMode`, `automation`, `docsDensity`, `storyGranularity`,
  `unityVersion`, `language`, `paths`) and `unity-harness studio status`.
- `workflow: minimal`: this skill is not on the path. Say: "At minimal the epic is implicit:
  `studio-create-stories` reads the brief and writes the epic with its stories." If the user still wants it, read
  `paths.brief` (missing → "No brief yet, run `studio-brainstorm` first" and stop), decompose from its MVP list and
  build order, with no GDD or ADR prerequisite, then continue at section 4.
- Arguments: `all` (every system in layer order), `layer: foundation|core|feature|presentation`, `<system-name>`,
  or nothing (ask which layer or system with `ask_question`).
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
   - N = 0: the per-system GDD skills are not in this plugin yet. Offer two ways on, with `ask_question`: write the GDDs
     first (by hand or with `invoke_subagent` with the `game-designer` subagent drafting each, sections per `workflow` as in
     `studio-brainstorm` section 4), or decompose from `paths.concept`'s Core Mechanics and MVP Definition, one
     epic per core mechanic, with "GDD: none yet". No concept either → "Run `studio-brainstorm` first" and stop.
2. Optional, read only when they exist: `<paths.gddDir>/systems-index.md` (system list, layers, priority),
   `<docsRoot>/architecture/architecture.md` (module ownership), ADRs in `<docsRoot>/architecture/` (only the
   Decision, GDD Requirements Addressed and Engine Compatibility sections of ADRs covering in-scope systems),
   a requirements registry. None of these exist by default in this plugin: their fields read "none yet".
3. Report: "Loaded N GDDs, M ADRs, engine Unity <unityVersion or 'version not set — run studio-setup'>."

Tier expectations:
- `full`: every in-scope GDD has all 8 sections and is Approved; requirements without a governing ADR are flagged
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
Engine risk: <LOW / MEDIUM / HIGH from ADR or unity-engine-reference; NOT ASSESSED when unknown>
Requirements covered by ADRs: <N / total> | n/a (no ADRs)
Untraced requirements: <list> | none
```

- At `full` with untraced requirements, warn: "<N> requirements in <system> have no ADR. Their stories will be
  written with `ADR: N/A` and `Status: Ready`, so they would be implemented without architectural guidance.
  Record a decision first (ADR authoring is not in this plugin yet; write `<docsRoot>/architecture/adr-NNNN-<slug>.md`
  by hand), or proceed and accept the gap."
- At `standard` list untraced non-Foundation requirements as information only. With no ADRs at all, skip the check
  and state "Governing ADRs: none yet".
- Ask with `ask_question`: "Create Epic: <name>?" — Yes, create it / Skip this epic / Pause, I need to decide something
  first. One epic at a time in `collaborative`; per the studio protocol otherwise.
- No invention: scope comes from the GDDs, concept, brief and ADRs that exist.

## 5. Producer gate PR-EPIC
Not a phase gate: runs only at reviewMode `full` (note "PR-EPIC skipped (solo|lean)" otherwise). After all epics
for the layer are defined and before writing any file, spawn the producer with `invoke_subagent` with the `producer` subagent, gate PR-EPIC.
Context: the epic structure inline (every epic's scope summary and governing-ADR count; no files exist yet),
milestone timeline and target dates, team capacity, the layer being processed.
- REALISTIC: write.
- UNREALISTIC: revise boundaries (split overscoped, merge underscoped), present again, re-run the gate before writing.
- CONCERNS: ask with `ask_question` — Proceed as planned, accepting the concerns / Revise epic boundaries / Stop and
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
- Epics define scope, stories define steps: run `studio-create-stories <epic-slug>` for each epic before anyone
  can pick up work.
- When Foundation and Core epics exist, the project is ready to move toward production; the phase gate skill is
  not in this plugin yet, so say what exists and let the user decide whether to `unity-harness studio set
  stage=pre-production` (a settings change: ask first).
- Never create stories in this skill.

Verdict: **COMPLETE** (N epics written; run `studio-create-stories <slug>` per epic), or **BLOCKED** (all epics
declined, no eligible systems, or the user stopped at PR-EPIC).
