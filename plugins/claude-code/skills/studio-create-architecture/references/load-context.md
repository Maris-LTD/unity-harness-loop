# Phase 0: Load context

Load everything silently first; present only the baseline and the inventory.

## 0a. Unity context (critical)
- `unityVersion`, `renderPipeline`, `inputSystem` from `studio config`. `unityVersion` empty → stop: "No Unity version
  recorded. Run studio-setup first; an architecture cannot be checked against an unknown engine version."
- `Packages/manifest.json`: the packages in use (Addressables, Input System, Cinemachine, Entities, UI Toolkit,
  Netcode, a DI container such as VContainer or Zenject). They constrain the choices below.
- unity-engine-reference, read in full (they are small): `references/VERSION.md` (pin, cutoff, risk per version),
  `references/breaking-changes.md` (HIGH and MEDIUM items), `references/deprecated-apis.md`,
  `references/current-best-practices.md`.
- Then only the module files whose domain the game uses: match the domains in the systems index (Physics,
  Rendering, UI, Audio, Navigation, Animation, Networking, Input, Core) against `references/modules/` and the
  package files under `references/plugins/` (addressables, cinemachine, dots-entities). Ambiguous → read it; a
  missed engine constraint costs more here than a redundant read.

## 0b. Design inputs and the Technical Requirements Baseline
Check presence before reading. Present-but-empty or still template placeholders counts as absent.
- `paths.systemsIndex`: absent at standard/full → stop: "No systems index. Run studio-map-systems first; an
  architecture written without it invents layers for systems nobody mapped." At minimal, say it is not required and
  work from `paths.brief`.
- `paths.concept`: absent at standard/full → stop and point at studio-brainstorm. At minimal read `paths.brief`;
  both absent → stop, there is no design record.
- `paths.pillars` if present (principles), budgets from `studio config` (`targetFps`, `drawCallBudget`,
  `memoryBudgetMb`, `targetPlatforms`), the harness `rules` (house code rules), the project's CLAUDE.md / AGENTS.md
  (conventions).
- Every GDD in `paths.gddDir` (skip game-concept, game-pillars, systems-index). Count them first (N). Search each
  for the sections that carry requirements, not whole files: `## Detailed Rules` or `## Detailed Design` (same
  section), `## Formulas`, `## Dependencies`, `## Tuning Knobs`, `## Acceptance Criteria`, about 40 lines after each
  heading. Read a GDD in full when it matched none of them (unstructured, never "no requirements") or when a section
  points outside itself.

From each GDD extract: data structures the rules imply; performance constraints; Unity features required;
cross-system communication (who talks to whom, how); state that must persist; timing or threading needs (fixed
step, jobs, async loading).

Build the baseline, numbered `TR-<system>-NNN` (the TR registry format; `<system>` is the GDD file stem):

```
## Technical Requirements Baseline
Extracted from <N> GDDs | <X> requirements

| Req ID | GDD | System | Requirement | Domain |
|---|---|---|---|---|
| TR-combat-001 | combat.md | Combat | Hit detection every physics step | Physics |
| TR-combat-002 | combat.md | Combat | Combo state machine | Core |
| TR-inventory-001 | inventory.md | Inventory | Item persistence across sessions | Save/Load |
```

If `paths.trRegistry` exists, reuse its IDs for requirements already registered; never renumber them. New
requirements take the next free number for their system. Phase 7 writes the baseline into `paths.trRegistry` (after
an ask), so ADRs can cite these IDs and studio-architecture-review reuses them.

## 0c. Existing decisions
Search the ADR headers in `paths.architectureDir` (`adr-*.md`): the `> **Status**:` line, the `## Summary`
section and the `Domain` row of Engine Compatibility. List number, title, status and domain from that scan. Read an
ADR in full only when a decision this session would collide with it. Read `paths.architectureRegistry` if present:
its stances (state ownership, interfaces, forbidden patterns) are locked constraints for this session.

## 0d. Knowledge-gap inventory
Show:

```
## Unity Knowledge Gap Inventory
Unity: <unityVersion> (<renderPipeline>) | Reference pin: <version from VERSION.md>
Model training covers about: <from VERSION.md>

HIGH risk domains (verify against unity-engine-reference before deciding)
- <Domain>: <key changes>
MEDIUM risk domains
- <Domain>: <key changes>
LOW risk domains
- <Domain>

Systems touching HIGH/MEDIUM domains
- <system> -> <domain> -> <risk>
```

If the installed version differs from the reference pin, say which way and that claims from the reference may not
apply. With any HIGH domain, ask with `AskUserQuestion`: proceed and flag HIGH domains throughout / pause to check the
reference first / show which domains are HIGH and why.

## 0e. Existing architecture document
If `paths.architectureDoc` exists, this run updates it. Read its `## Document Status` block and its `##` headings,
then ask with `AskUserQuestion`: update chosen sections in place / rewrite the whole document (replaces the file) / stop.
- Update: ask which sections; phases 1-6 author only those and say which they skipped; phase 7 replaces only those
  and raises `Version` to N+1.
- A focus-area argument is an update of that one section.
- Rewrite: full walkthrough; the phase 7 ask says it replaces the existing file.
