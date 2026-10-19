# Systems index template

Write in `language`. Keep the Systems Enumeration columns exactly as below: game-design and
game-epics read them by name. `Status` values: Not Started, In Design, Designed (written, not reviewed), In Review (revisions applied, awaiting
re-review), Needs Revision, Approved, Implemented.

```markdown
# Systems Index: <Game Title>

> **Status**: Draft | Under Review | Approved
> **Created**: <date>
> **Last Updated**: <date>
> **Source Concept**: <paths.concept or paths.brief>

## Overview
<The game's mechanical scope: what kinds of systems it needs, tied to the core loop and pillars. At balanced, one
short paragraph per system; at thorough, add how they relate.>

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | Player Controller | Core | MVP | Not Started | — | Input |
| 2 | Save System (inferred) | Persistence | MVP | Not Started | — | — |

## Categories

| Category | Typical systems |
|---|---|
| Core | player controller, input, physics, camera, scene flow, state machine |
| Gameplay | combat, AI, movement abilities, interaction, puzzles |
| Progression | XP/levels, unlocks, achievements |
| Economy | currency, loot, crafting, shops, item database |
| Persistence | save/load, settings, cloud sync |
| UI | HUD, menus, inventory screen, popups, notifications |
| Audio | music, SFX, ambience |
| Narrative | dialogue, quests, cutscenes |
| Meta | analytics, tutorial, accessibility, ads/IAP |

## Priority Tiers

| Tier | Definition | Target milestone | Design urgency |
|---|---|---|---|
| MVP | Needed for the core loop; without it "is this fun?" cannot be tested | First playable | First |
| Vertical Slice | One complete, polished area | Demo | Second |
| Alpha | All features present in rough form | Alpha | Third |
| Full Vision | Polish, edge cases, nice-to-haves | Beta / release | As needed |

<Creative Director notes from CD-SYSTEMS go here, one per tier.>

## Dependency Map

### Foundation Layer (no dependencies)
1. <System> — <why it is foundational>

### Core Layer
1. <System> — depends on: <list>

### Feature Layer
1. <System> — depends on: <list>

### Presentation Layer
1. <System> — depends on: <list>

## Recommended Design Order

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|---|---|---|---|---|---|
| 1 | <system> | MVP | Foundation | game-designer | S/M/L |

Effort: S = one session, M = 2-3 sessions, L = 4+ sessions (a session produces one complete GDD).

## Circular Dependencies
- None found, or `<A> <-> <B>`: the relationship and the proposed resolution.

## High-Risk Systems

| System | Risk type (Technical / Design / Scope) | What could go wrong | Mitigation |
|---|---|---|---|

## Progress Tracker

| Metric | Count |
|---|---|
| Total systems | N |
| GDDs started | N |
| GDDs reviewed | N |
| GDDs approved | N |
| MVP systems designed | N / total MVP |
| Vertical Slice systems designed | N / total VS |

## Next Steps
- [ ] Approve this enumeration
- [ ] Design MVP systems first with game-design
- [ ] Review each GDD with game-design-review
- [ ] Run game-gate technical-setup when the MVP systems are designed
```
