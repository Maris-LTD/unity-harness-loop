# GDD template

Write in `language`. Section set and order must match this file. Accept `## Detailed Rules` as the same section as
`## Detailed Design` when reading older GDDs.

```markdown
# <System Name>

> **Status**: In Design
> **Author**: <user + agents>
> **Last Updated**: <date>
> **Last Verified**: <date>
> **Implements Pillar**: <pillar>

## Summary

[To be designed]

> **Quick reference** — Layer: `<Foundation | Core | Feature | Presentation>` · Priority: `<MVP | Vertical Slice | Alpha | Full Vision>` · Key deps: `<systems or None>`

## Overview

[To be designed]

## Player Fantasy

[To be designed]

## Detailed Design

### Core Rules

[To be designed]

### States and Transitions

[To be designed]

### Interactions with Other Systems

[To be designed]

## Formulas

[To be designed]

## Edge Cases

[To be designed]

## Dependencies

[To be designed]

## Tuning Knobs

[To be designed]

## Visual/Audio Requirements

[To be designed]

## Game Feel

[To be designed]

## UI Requirements

[To be designed]

## Cross-References

[To be designed]

## Acceptance Criteria

[To be designed]

## Open Questions

[To be designed]
```

Omit Player Fantasy and Tuning Knobs at `standard`, and Formulas when the system defines no numeric rule. Keep all
other headings with their placeholder.

## Section formats

States and Transitions:

| State | Entry condition | Exit condition | Behavior |
|---|---|---|---|

Formulas, one block per formula:

```markdown
### <formula_name>

`<formula_name> = <expression>`

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| base_value | float | 1-100 | SO field `<Asset>.<field>` | value before modifiers |
| modifier_sum | float | -0.9 to 5.0 | calculated | sum of active modifiers |
| gravity | float | 9.81 | constant | engine constant, deliberate |

**Output range:** <min> to <max> in normal play; <behaviour at the extremes>
**Example:** <worked example with real numbers>
```

`Source` is what keeps values data-driven: `SO field` is a tuning knob living in a ScriptableObject (or config
asset), `calculated` is derived, `constant` is a deliberate exception.

Edge Cases: `- **If <condition>**: <exact outcome>. <rationale if not obvious>` (or a Scenario / Expected Behavior /
Rationale table). No "handle appropriately".

Dependencies:

| System | Direction | Hard or soft | Interface (data in / out, owner) |
|---|---|---|---|

Tuning Knobs (Unity: each knob is a serialized field on a ScriptableObject or config asset, never a literal in code):

| Knob | Asset.field | Type | Current | Safe range | Too high | Too low | Interacts with |
|---|---|---|---|---|---|---|---|

Visual/Audio Requirements:

| Event | Visual feedback | Audio feedback | Priority |
|---|---|---|---|

Game Feel (required for Gameplay and UI systems above minimal):
- Feel reference: a specific mechanic in a specific game, plus an anti-reference.
- Input responsiveness: | Action | Max input-to-response (ms) | Frames at target fps | Notes |
- Animation feel targets: | Animation | Startup | Active | Recovery frames | Feel goal |
- Impact moments: | Impact (hit-stop, screen shake, camera, haptics, time scale) | Duration (ms) | Effect | Tunable? |
- Weight and responsiveness profile, and feel acceptance criteria.

UI Requirements:

| Information | Display location | Update frequency | Condition |
|---|---|---|---|

Cross-References:

| This document references | Target GDD | Element referenced | Nature |
|---|---|---|---|

Acceptance Criteria, one per line, each tagged with how it is proven:
- `AC-1 [EditMode]` **GIVEN** <state>, **WHEN** <action or trigger>, **THEN** <measurable outcome>.
- `AC-2 [Screenshot]` **GIVEN** ..., **WHEN** ..., **THEN** <what is visible on screen>.
- `AC-3 [Play mode]` for flows that need a running scene; `[Perf]` for frame-time or memory budgets.

Open Questions: | Question | Owner | Target date |
