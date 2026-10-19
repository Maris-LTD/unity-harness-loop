---
name: game-systems
description: Split a Unity game concept into systems, map dependencies and priorities, and write the systems index; `next` picks the next system to design. Use for "map systems", "systems index", "chia hệ thống", "hệ thống nào thiết kế tiếp".
---

# game-systems

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

This skill owns the systems index (`paths.systemsIndex`). Individual system GDDs belong to `game-design`;
do not author them here.

References in this skill:
- `references/systems-index-template.md`: the index template (read in phase 5).
- `references/implicit-systems.md`: the hidden systems each explicit mechanic implies, plus Unity-side systems
  (read in phase 2).

## 0. Setup and arguments
- Run `unity-harness studio config` (`reviewMode`, `automation`, `workflow`, `docsDensity`, `stage`, `language`,
  `paths`) and `unity-harness studio status`.
- No argument: phases 1-5 (create or update the index). `next`: phase 6 only. `<system-name>`: phase 6 for that
  system.
- `workflow`: `standard` / `full` need the index before any GDD; `minimal` does not (the brief replaces it), but the
  user may run it voluntarily.
- `docsDensity` sets prose depth: `terse` = the tables plus a one-paragraph Overview; `balanced` = one short
  paragraph per system in `## Overview` plus layer notes in `## Dependency Map`; `thorough` = adds relationship
  analysis. Never add a column to the Systems Enumeration table: its columns are a contract that
  game-design and game-epics read by name (`Category`, `Status`, `Design Doc`, `Depends On`).

## 1. Read the concept
- Required: `paths.concept` (at minimal `paths.brief`). Neither → "No game concept found. Run `game-concept`
  first, then come back to decompose it into systems." and stop.
- Optional: `paths.pillars` (pillars constrain priority and scope), existing GDDs in `paths.gddDir`.
- `paths.systemsIndex` exists → resume, never recreate. Show "The index has N systems (M designed, K not
  started)" and ask with `AskUserQuestion`: update with new systems / design the next undesigned system (phase 6) / review
  and revise priorities (phase 4).

## 2. Enumerate systems
1. Explicit systems: scan the concept's Core Mechanics, Core Loop, Technical Considerations and MVP Definition.
2. Implicit systems: read `references/implicit-systems.md`; for each explicit system list the hidden systems it
   implies and say why in one line each.
3. Present by category: name, category, one-sentence description, explicit or `(inferred)`. Ask with `AskUserQuestion`:
   anything missing, anything to combine or split, anything this game does not need.
   - collaborative: iterate until the user approves the list.
   - guided: ask once, apply the answer, continue.
   - autonomous: do not ask; log the enumeration and the inferred systems to `paths.decisionLog`.

## 3. Dependencies
1. For each system list what it cannot work without: input/output (A produces data B needs), structural (A is the
   framework B plugs into), UI (every gameplay system has a UI that depends on it, designed after it).
2. Sort into four layers, the same four that epics, the control manifest and stories use: Foundation (no
   dependencies), Core (Foundation only), Feature (Core; also meta systems such as tutorials, progression and
   analytics hooks), Presentation (UI and feedback wrapping gameplay, accessibility options). There is no Polish
   layer: polish-type work is a priority tier (Full Vision), not a layer.
3. Detect cycles. For each, propose a resolution: an interface or event contract between the two, design both
   together, or move shared data to a Foundation system.
4. Show the layered list with cycles, bottlenecks (many dependents: high risk) and leaves (no dependents: low risk).
   Ask with `AskUserQuestion` whether the ordering is right.
5. Gate TD-SYSTEM-BOUNDARY (full review only; solo/lean → note it skipped): the `Agent` tool with `subagent_type: "unity-harness:technical-director"`. Pass the
   dependency graph (system → dependencies), layer assignments, bottlenecks, cycles with proposed resolutions, and
   the Unity version and render pipeline from `studio config`. REJECT → revise boundaries with the user and show the
   revised map before phase 4. CONCERNS → note them in the index draft and continue. NOT ASSESSED → name the input,
   supply it and re-run, or note `TD-SYSTEM-BOUNDARY: NOT ASSESSED - <input>` in the draft.

## 4. Priorities
1. Auto-assign: MVP = systems the concept's MVP section requires plus their Foundation dependencies; Vertical Slice
   = what one complete, polished area needs; Alpha = remaining gameplay systems; Full Vision = polish, meta,
   nice-to-haves.
2. Show a table per tier and explain each placement in conversation, mixing technical necessity with what the
   player feels and naming the pillar it serves. Fill the reasoning from this project's own pillars and systems;
   never reuse example wording from another game. The rationale lives in conversation and in `## Overview`, not in
   a new column. Ask with `AskUserQuestion` whether the tiers match the user's vision.
3. Gate PR-SCOPE (full review only): the `Agent` tool with `subagent_type: "unity-harness:producer"`. Pass the full vision scope (every system), the MVP tier's
   systems, the system count per tier with estimated volume (count × average complexity), the stated timeline and
   team size. REALISTIC → continue. OPTIMISTIC → show the producer's adjustments, ask whether to apply them, note
   them if declined. UNREALISTIC → offer to revise tiers before writing. NOT ASSESSED (often timeline or team size)
   → name it, supply and re-run, or note `PR-SCOPE: NOT ASSESSED - <input>`.
4. Design order: MVP Foundation, MVP Core, MVP Feature, MVP Presentation, then Vertical Slice by layer, and so on.
   This is the order GDDs get written in.

## 5. Write the index
1. Read `references/systems-index-template.md` and fill it from phases 2-4: enumeration, dependency map, design
   order, cycles, high-risk systems, progress tracker (all `Not Started` unless a GDD already exists, then `In
   Design` or its real status and its path in `Design Doc`).
2. Summarize: systems per category, MVP count, the first 3 in design order, high-risk items.
3. Write per the studio protocol: a new index asks "May I write `<paths.systemsIndex>`?" in collaborative and
   guided; an existing index in guided is updated after the summary; autonomous writes and logs.
4. Gate CD-SYSTEMS (full review only), after the write: the `Agent` tool with `subagent_type: "unity-harness:creative-director"`. Pass the index path, the
   pillars and core fantasy from `paths.concept` (at minimal the brief's pitch and "what they feel" line), the tier
   assignments for every tier, and the high-risk and bottleneck systems.
   - REJECT → revise the system set with the user before any GDD is authored.
   - CONCERNS → ask with `AskUserQuestion`: revise the system set / accept and record them / discuss. On accept, add
     `> **Creative Director Note** (<tier>): <concern>` directly under the `## Priority Tiers` table.
   - NOT ASSESSED → name the input; re-run, or record `> **Creative Director Note**: CD-SYSTEMS NOT ASSESSED -
     <input>` in the same place after asking.
5. Update `paths.sessionState`: task Systems decomposition, status Systems index created, file
   `paths.systemsIndex`, next: design individual system GDDs.
6. Verdict: **COMPLETE** (index written), or **BLOCKED** if the user declined the write.

## 6. Hand off to game-design
- Pick the system: the named one; for `next` the first `Not Started` system in Recommended Design Order; right after
  phase 5, ask with `AskUserQuestion`: start designing <first system> now / pick a different system / stop here.
- Run `game-design <system-name>`. It gathers context, writes the GDD section by section, offers
  `game-design-review`, and updates the index status. Do not duplicate it here.
- After it finishes, ask: continue to <next system> / pick a different one / stop for this session.

## 7. Next steps
Offer with `AskUserQuestion`:
- `game-design <first system in order>` (or `game-systems next`);
- `game-gate systems-design` while `stage` is still `concept`;
- `game-gate technical-setup` once every MVP system has a reviewed GDD;
- stop here.
After each GDD: `game-design-review <paths.gddDir>/<system>.md`, ideally in a fresh session.

If the context window is nearly full, say the index is saved at `paths.systemsIndex` and that a fresh session can
continue with `game-systems next`.
