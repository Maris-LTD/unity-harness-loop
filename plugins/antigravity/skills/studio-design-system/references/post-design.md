# Phase 5: after the design

## 5.1 Summary
Write `## Summary` now that the design exists, at every tier: 2-3 sentences (what the system is, what it does for
the player, why this game has it), no jargon. Quick reference: Layer and Priority from `paths.systemsIndex` (or the
inferred values at minimal), Key deps from the Dependencies section. Approve and write it like any section. Later
skills read Summaries to decide which GDDs to open in full.

## 5.2 Self-check
Read the GDD back from the file, not from memory. Confirm: Summary and Quick reference filled; every section the tier
requires has real content (count against the tier, never against 8); formulas use defined variables; edge cases have
resolutions; dependencies have interfaces; acceptance criteria are testable and tagged. Fix gaps before the gate.

## 5.3 Gate CD-GDD-ALIGN
`reviewMode` full only (solo/lean → note "CD-GDD-ALIGN skipped (<mode>)"). `invoke_subagent` with the `creative-director` subagent with: the
GDD path; the pillars from `paths.pillars` or `paths.concept` (at minimal, the brief's pitch and "what they feel"
line, which has no pillars); the MDA aesthetics target; the Player Fantasy section, or "not authored at this tier".
Verdicts APPROVE / CONCERNS / REJECT / NOT ASSESSED, handled per the studio protocol. Revising a flagged section, or
resolving a REJECT, reruns that section's cycle (with its specialist per review mode) and its approval before the
write; then record `REVISED <date>`. Record the outcome in the GDD header:
`> **Creative Director review (CD-GDD-ALIGN)**: APPROVED|CONCERNS accepted|REVISED|NOT ASSESSED <date>`.

## 5.4 Entity registry (`paths.entityRegistry`)
Candidates: named entities with stats or drops, items with values, named formulas with variables and output ranges,
constants referenced in more than one place.
- File absent → say so and ask "May I create `<paths.entityRegistry>` with these N entries?" Declined → say the
  registry was not written (not a clean pass).
- Present but empty (lists are `[]`, only commented examples match) → say "registry exists and is empty; all N
  entries are new". Commented examples are never facts.
- Present → check each candidate (`  - name: <candidate>`) and show NEW vs ALREADY REGISTERED (referenced_by gets
  this GDD). Ask "May I update `<paths.entityRegistry>` with N new entries and update referenced_by?"
- Never change an existing value without raising it as a conflict.

Entry shape (paths shown with the default `Docs` docsRoot):
```yaml
entities:
  - name: slime
    source: Docs/design/gdd/combat-system.md
    attributes: { hp: 20, damage: 3 }
    referenced_by:
      - Docs/design/gdd/loot-system.md
formulas:
  - name: damage_after_armor
    source: Docs/design/gdd/combat-system.md
    variables: [base_damage, armor]
    output: "1-200"
    referenced_by: []
constants:
  - name: max_inventory_slots
    value: 20
    source: Docs/design/gdd/inventory.md
    referenced_by: []
```

## 5.5 Completion summary and review hand-off
Show: GDD complete, sections written (by name), provisional assumptions, cross-system conflicts found (or none).
Then: "To validate it, run `studio-design-review <paths.gddDir>/<system>.md` in a fresh session." Never offer to run
the review in this session: the reviewer must not inherit the authoring history.

## 5.6 Design status (GDD header and `paths.systemsIndex`)
The status lives in two places that always carry the same word: the GDD's header line `> **Status**: <word>` and
the system's row in the systems index (authoritative for later skills; the header is the fallback).
- GDD header: set `> **Status**: Designed` (pending review), or the review's outcome if one already ran:
  `Approved`, or `Needs Revision`. This is part of the GDD write, no separate ask.
- Systems index absent (minimal) → say "no systems index at this tier; only the GDD header was updated" and skip.
  Never create one here.
- Present → update this system's row to the same Status, `Design Doc` = the GDD path; update the Progress Tracker.
  Ask "May I update `<paths.systemsIndex>`?" per the automation mode.

## 5.7 Session state
Update `paths.sessionState`: task <system> GDD, status Complete, file, the sections actually authored
by name (never "all 8"), next: the next system in design order.

## 5.8 Next steps
Ask with `ask_question`:
- review this GDD in a fresh session with `studio-design-review` (recommended before the next system);
- design the next system (<next in order>), via `studio-design-system <name>` or `studio-map-systems next`;
- fix flagged issues, if any;
- `studio-gate-check technical-setup` when the MVP systems are designed and reviewed;
- stop here.
