---
name: game-design
description: Write or retrofit one system's GDD for a Unity game, section by section, with tuning knobs and testable acceptance criteria. Use for "design system X", "write the GDD for", "thiết kế hệ thống", "viết GDD cho".
---

# game-design

{{#claude}}
If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.
{{/claude}}

Writes `<paths.gddDir>/<system>.md` incrementally: every approved section is on disk before the next one starts, so
any interruption loses nothing. Owns individual GDDs; the systems index belongs to `game-systems`.

References, read when the phase starts and again after a compaction:
- `references/gdd-template.md`: the GDD skeleton and per-section formats (phase 3).
- `references/sections.md`: the section cycle and guidance for each section, with specialist routing (phase 4).
- `references/post-design.md`: summary, self-check, CD-GDD-ALIGN, registry, systems index, session state (phase 5).

## 1. Arguments and tier
- Run `unity-harness studio config` (`reviewMode`, `automation`, `workflow`, `docsDensity`, `unityVersion`,
  `renderPipeline`, `inputSystem`, `targetPlatforms`, budgets, `language`, `paths`) and `unity-harness studio status`.
- No system name: read `paths.systemsIndex`; take the first `Not Started` system in Recommended Design Order and ask
  with {{ask}}: design <system> (<priority> | <layer>) / pick a different system / stop. No index → "Usage:
  `game-design <system-name>`, or `game-design retrofit <paths.gddDir>/<system>.md`. No systems
  index yet: run `game-systems` first." and stop.
- Normalize the name to kebab-case for the file name (`combat system` → `combat-system.md`).
- Required sections by `workflow` (always plus `## Summary`, which every tier needs):
  - `full`: all 8 (Overview, Player Fantasy, Detailed Design, Formulas, Edge Cases, Dependencies, Tuning Knobs,
    Acceptance Criteria).
  - `standard`: Overview, Detailed Design, Edge Cases, Dependencies, Acceptance Criteria, plus Formulas whenever the
    system defines a numeric rule (rate, curve, threshold, cost, damage, drop weight, any value a balance pass would
    tune). The `Category` is a hint, not the test: if Detailed Design states a quantity that is not an engine
    constant, Formulas is required. Player Fantasy and Tuning Knobs are skipped.
  - `minimal`: no GDD required. If the user wants one anyway, author exactly the 5 standard sections (the
    conditional Formulas rule does not apply) and say the GDD is optional at this tier.
- `docsDensity`: `terse` = bullets, 2-5 lines per section; `balanced` = paragraphs with light rationale;
  `thorough` = full prose with rationale, examples and alternatives. Mandated structures (the Formulas variable
  table, Given/When/Then criteria) stay complete at every density.

### Retrofit mode
Argument starts with `retrofit`, or is a path to an existing GDD in `paths.gddDir`:
1. Read the GDD. Find which of the 8 sections exist (accept `## Detailed Design` or `## Detailed Rules`) and which
   hold only placeholders (`[To be designed]`, blank, one line, obviously unfinished).
2. Report an absent section as a gap only when the tier requires it; list the others as available to add.
3. Show "Already written (not touched): ✓ ..." and "Missing or incomplete (will be authored): ✗ ...", then ask:
   "Shall I fill the N missing sections? I will not modify existing content."
4. Yes → phase 2 as normal, skip phase 3 (the file exists), and in phase 4 run the cycle only for missing or
   placeholder sections. Never overwrite written content: replace only placeholder bodies.

## 2. Gather context (before asking anything)
- At `minimal`: read `paths.brief` instead of the concept, skip the systems index, and derive `Category` (one of
  Core, Gameplay, Progression, Economy, Persistence, UI, Audio, Narrative, Meta), `Layer` (Foundation if others
  depend on it, else Feature) and `Priority` (MVP if the brief's build order lists it, else Post-MVP). Mark them
  "inferred from the brief" in the Quick reference; never write a systems index here.
- Otherwise required: `paths.concept` (missing → "Run `game-concept` first" and stop) and `paths.systemsIndex`
  (missing → "Run `game-systems` first" and stop). System not in the index → ask: add it to the index, or
  design it as an off-index system.
- Entity registry `paths.entityRegistry`, if it exists: search for entries whose `source:` is this GDD and entries
  whose `referenced_by` lists it (block lists: match the path with several lines of context before it). Match only
  live entries under `entities:` / `items:` / `formulas:` / `constants:`, never commented examples. These values are
  locked facts this GDD must not contradict.
- Dependencies from the index: upstream (decisions to respect) and downstream (expectations to satisfy). For each
  dependency GDD that exists, read only its Dependencies, Formulas, Edge Cases and Tuning Knobs sections; use the
  registry first.
- Optional: `paths.pillars`; the existing GDD (resume, do not restart). Do not read every GDD hunting for related
  ones.
- Show the context summary: priority and layer; depends on / depended on by (with or without GDDs); decisions to
  respect; the pillar it serves; known registry facts ("locked: a different value needs the conflict raised
  first"). Undesigned upstream dependency → warn, and offer to design it first or define a provisional contract.

### Unity feasibility brief
- Map `Category` to an engine domain: Gameplay → physics (combat, collision, movement), navigation (AI,
  pathfinding) or scripting (pure rules); Core → scene flow and loading, or input; UI → ui; Audio → audio;
  Narrative, Progression, Economy → scripting; Persistence, Meta → core.
- Read from `unity-reference`: VERSION (compare with `unityVersion`), `modules/<domain>.md`, and the
  domain's entries in breaking-changes and deprecated-apis. There is no `scripting.md` or `core.md`: say "no engine
  reference for <domain>; feasibility not checked against Unity <version>" instead of skipping silently.
- ADRs: search `paths.architectureDir/adr-*.md` for the `Domain` field; read only the matching ADRs' Decision and
  Engine Compatibility sections.
- Present: engine and version, domain, verified capabilities, constraints that shape the design (pipeline, input
  system, platforms, budgets), knowledge gaps with HIGH/MEDIUM risk, constraining ADRs (or "none yet"). Ask with
  {{ask}}: proceed with these noted / add a constraint / pause to check the docs. Then ask: start designing / more
  context / design a dependency first.

## 3. Skeleton
- Read `references/gdd-template.md`. Scaffold only the sections required at the tier, plus the five non-tier
  sections (Visual/Audio Requirements, Game Feel, UI Requirements, Cross-References, Open Questions) with
  placeholders. Skip only the tier omissions.
- Ask "May I create the skeleton at `<paths.gddDir>/<system>.md`?" Declined → **BLOCKED**: "skeleton creation
  declined; re-run `game-design <system>` when ready." and stop.
- Update `paths.sessionState`: task Designing <system> GDD, current section: skeleton created, file path.

## 4. Sections
Read `references/sections.md` and walk each required section in order through the section cycle, then the
non-tier sections. Every approved section is written immediately and `paths.sessionState` records it.

## 5. After the design
Read `references/post-design.md`: Summary, self-check against the file, CD-GDD-ALIGN, entity registry, completion
summary, systems index update, session state, next steps.

## Recovery
After an interruption: read `paths.sessionState` (current system, sections done), then the GDD: sections with real
content are done, placeholders remain. Resume at the next incomplete section without re-discussing finished ones.
If the context window is nearly full, say all approved sections are saved and a fresh session can continue with
`game-design <system>`.

## Rules
- Never generate the whole GDD at once and present it as finished; never write a section without its approval
  (per the automation mode).
- Never contradict an approved GDD or a registry value without raising the conflict.
- Show where each decision came from (dependency GDD, pillar, user choice).
- The GDD describes behaviour, not implementation. Implementation questions (singleton vs events, which Unity API)
  are noted "→ becomes an ADR" for `game-adr`.
- Agents return proposals; this skill asks the user and writes the file.
