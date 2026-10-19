# Phase 4: section by section

Walk only the sections the tier requires (SKILL.md section 1): `standard` = A, C, E, F, H (+ D when the system has
numeric rules); `full` = A-H; voluntary `minimal` = the standard five. Then the non-tier sections at the end.

## The section cycle
Context → Questions → Options → Decision → Draft → Approval → Write.
1. Context: what the section must hold, and what dependency GDDs and registry facts constrain it.
2. Questions: constrained ones with `AskUserQuestion`, open ones in plain text.
3. Options: for real design choices, 2-4 approaches with trade-offs and a recommendation.
4. Decision: the user picks or gives direction.
5. Draft: the section text in the conversation; flag provisional assumptions about undesigned dependencies.
6. Approval, per automation:
   - collaborative: in the same reply as the draft, ask with `AskUserQuestion` "Approve the <Section> section?": approve and
     write / make changes / start over. Never leave a draft without the question.
   - guided: write right after the draft with a one-line summary of what was decided.
   - autonomous: write and log `Approve <Section> section` to `paths.decisionLog`.
7. Write: replace that section's placeholder. Match the heading together with the placeholder, never the
   placeholder alone (every section has the same one).
8. Registry check (after C and D): compare entity names, items, formulas and constants just written against the
   registry. A different value → raise it before the next section: "<name> is registered in <source GDD> as <value>;
   this section wrote <new>. Which is correct?" New names → candidates for phase 5.
After each write, record the section in `paths.sessionState`.

## Specialists
Route by the system's `Category`, then by what it actually does. If two rows fit, use both and say why.

| System type | Primary | Supporting |
|---|---|---|
| Foundation / infrastructure (events, save/load, scene flow, services) | unity-harness:engine-programmer | unity-harness:gameplay-programmer (feasibility), unity-harness:game-designer (rules) |
| Combat, damage, health | unity-harness:game-designer | unity-harness:ai-programmer (enemy AI), unity-harness:art-director (hit feedback) |
| Economy, loot, crafting, progression | unity-harness:game-designer | (balance curves: unity-harness:game-designer covers systems and economy design) |
| Dialogue, quests, lore | unity-harness:game-designer | unity-harness:creative-director (tone); no narrative agent yet |
| UI systems (HUD, menus) | unity-harness:game-designer | unity-harness:ui-programmer, unity-harness:unity-ui-specialist (feasibility), unity-harness:art-director (style) |
| Audio systems | unity-harness:game-designer | no audio agent yet: note it |
| AI, pathfinding, behaviour | unity-harness:game-designer | unity-harness:ai-programmer |
| Level / world systems | unity-harness:game-designer | unity-harness:art-director (spatial look) |
| Camera, input, controls | unity-harness:game-designer | unity-harness:gameplay-programmer (feel and feasibility) |
| Animation, character movement | unity-harness:game-designer | unity-harness:art-director (style), unity-harness:gameplay-programmer (feel) |
| VFX, particles, shaders | unity-harness:game-designer | unity-harness:art-director (direction), unity-harness:unity-shader-specialist (budget, shader cost) |
| Character systems (stats, archetypes) | unity-harness:game-designer | unity-harness:art-director (visual archetype) |

Spawn with the `Agent` tool with `subagent_type: "unity-harness:game-designer"` and the same pattern for the others. Give each: system name, concept summary,
pillars, dependency excerpts, the section in progress, and the exact question. Agents return proposals; disagreements
go to the user with `AskUserQuestion`; the skill writes.

Review mode for specialist spawns (these are consultations, not gates):
- `solo`: do not spawn; draft alone and add "`<agent>` not consulted (solo). Review manually before production."
- `lean`: spawn only for D (Formulas) and H (Acceptance Criteria), the high-risk sections; note the others.
- `full`: spawn as each section says.
Every skipped consultation is announced with the mode that skipped it.

## A. Overview
Goal: one paragraph a stranger understands. Before drafting, ask with `AskUserQuestion` (pre-select a recommendation; in
guided/autonomous take it and state it in one line):
- Framing: data/infrastructure layer / player-facing effect / both. Gameplay, UI, Audio, Narrative → both; Core,
  Persistence, Meta → infrastructure; Economy, Progression → both. Category wins over layer.
- ADR reference: cite an ADR (recommended when an ADR's requirements name this system) / keep it pure design.
- Fantasy worth stating: yes for everything except Foundation-layer infrastructure.
Ask: what is it in one sentence, how does the player interact (active, passive, automatic), what would the game lose
without it. Check it matches the systems index description.

## B. Player Fantasy (full only)
Ask first: direct / indirect / both (same category mapping as Framing). Ask the emotion or power fantasy, reference
games and what creates the feeling there. Quote the pillar it serves. In full review, the `Agent` tool with `subagent_type: "unity-harness:creative-director"`
with the framing answer, pillars, reference games and concept summary, asking for 2-3 candidate framings with a
player moment to anchor to; present them with the draft.

## C. Detailed Design
Goal: a programmer can implement it without questions. Sub-sections: Core Rules (numbered for sequences, bullets for
properties), States and Transitions (table: every state, every valid transition), Interactions with Other Systems
(per dependency: data in, data out, interface owner). Ask: walk through a typical use step by step; the player's
decision points; what the player cannot do. In full review spawn the routing table's primary and supporting agents in
parallel before drafting. Check each interaction against the dependency GDD.

## D. Formulas
Every formula uses the block in `gdd-template.md`: expression, variable table (Type, Range, Source, Description),
output range, worked example. Never `[Formula TBD]` or prose without the table. Ask: the core calculations; linear,
logarithmic or stepped scaling; output ranges early, mid, late. Before proposing numbers, the `Agent` tool with `subagent_type: "unity-harness:game-designer"`
(formulas, curves, cost ratios) with the Core Rules, tuning goals and dependency balance context; do not invent
balance numbers without that input (in solo, say they are unreviewed). Reference upstream formulas instead of
reinventing them.

## E. Edge Cases
`**If <condition>**: <exact outcome>.` Ask about zero, maximum and out-of-range values, two rules firing at once,
unintended interactions and degenerate strategies. In full review the `Agent` tool with `subagent_type: "unity-harness:game-designer"` with C and D to find missed
cases; present them and let the user choose. Check floors, caps and resolution rules set by dependency GDDs.

## F. Dependencies
Pre-filled from the index. Ask what is missing, the data interface of each, hard vs soft. Must be bidirectional:
if this lists "depends on Combat", the Combat GDD must list this as a dependent; flag one-sided entries.

## G. Tuning Knobs (full only)
Each knob is a ScriptableObject or config-asset field (`Asset.field`), with safe range, what breaks too high and too
low, and which knobs interact. Derive them from D's `SO field` variables. Point to knobs owned by dependency GDDs
instead of duplicating them. In solo derive them yourself and note it; in lean consult game-designer only when knobs
interact.

## H. Acceptance Criteria
Given/When/Then, each tagged `[EditMode]`, `[Screenshot]`, `[Play mode]` or `[Perf]`. At least one per core rule
in C and one per formula in D; include cross-system interaction criteria; ask the performance budget (frame time,
memory) against `targetFps` and the budgets in `studio config`. Never "works as designed": a tester must verify each
without reading the GDD. No D at this tier → say the criteria come from C alone. At `standard`, if D was skipped but C
states a quantity, stop: Formulas is required, author it first. At `minimal`, state such values inline in Core Rules
instead. In full or lean review, the `Agent` tool with `subagent_type: "unity-harness:qa-lead"` with C, D, E to check every criterion is independently testable
and covers every rule and formula.

## Non-tier sections
- Visual/Audio is required for Gameplay, UI, Narrative and Audio systems: the `Agent` tool with `subagent_type: "unity-harness:art-director"` first (full; in lean
  only when the player reads this system's feedback to play) for VFX and feedback per event, animation or style
  constraints, art bible principles (`paths.artBible` if it exists). Never leave it as a placeholder for these.
- Game Feel is required for Gameplay and UI systems.
- Cross-References is required whenever Dependencies names another GDD; otherwise write "None — this system
  references no other GDD".
- At `minimal` none of these is forced.
- Then ask with `AskUserQuestion` which remaining sections to define, listing only the ones not already required: all of them
  (recommended when the system has any dependency, UI or player feedback) / just Cross-References and open questions
  / skip for now. Never state a fixed section count.
- UI Requirements with real content → print "UX flag: this system has UI. A UX spec per screen is recommended
  before epics; UX authoring is not in this plugin yet, so describe each screen in this section or a short spec next
  to the GDD." Note it in the systems index row.
- Open Questions: each with an owner and a target date.
