# Phases 7-8: Write, sign off, hand off

## Phase 7: Write the document
Show a one-paragraph summary (layers, modules, data flows, ADR gaps), then ask with `AskUserQuestion`: write now / show the full
draft first / not yet. In an update, the ask names the sections being replaced and the version change, and only
those sections are edited in place.

```markdown
# <Game> - Master Architecture

## Document Status
- Version: <N>
- Last Updated: <date>
- Unity: <unityVersion> (<renderPipeline>, input: <inputSystem>)
- Platforms: <targetPlatforms> | Budgets: <targetFps> fps, <drawCallBudget> draw calls, <memoryBudgetMb> MB
- GDDs Covered: <list>
- ADRs Referenced: <list>

## Unity Knowledge Gap Summary
<HIGH/MEDIUM domains from phase 0d and what they mean for this project>

## Layer Map
<phase 1>

## Module Ownership
<phase 2: asmdef tables + dependency diagram>

## Data Flow and Initialisation
<phase 3>

## API Boundaries
<phase 4, full only>

## ADR Audit
<phase 5>

## Required ADRs
<phase 6>

## Architecture Principles
<3-5 principles from the concept, pillars, budgets and house rules, e.g. "logic in plain C#, MonoBehaviours thin",
"tuning values in ScriptableObjects", "dependencies point down a layer only">

## Open Questions
<deferred decisions, each with the layer it blocks>

## Technical Requirements Baseline
<count per system; the IDs live in paths.trRegistry. game-architecture-review maps them to ADRs in
paths.traceability>
```

### Phase 7a: TR registry
After the document is written, ask with `AskUserQuestion`: "Write <X> baseline requirements to `<paths.trRegistry>`?" (new
file, or append to the existing one). Options: write them / not now. On yes, use the registry format below: append
new entries only, never renumber or rewrite an existing `id`, and set `last_updated` to today. One entry per baseline
row, `status: active`, `layer` from the phase 1 layer map (Foundation, Core, Feature or Presentation).

```yaml
version: 1
last_updated: <YYYY-MM-DD>
requirements:
  - id: TR-combat-001
    system: combat
    gdd: combat.md
    requirement: Hit detection resolves within one physics step
    domain: Physics
    layer: Core
    status: active
```

On "not now", tell the user that ADRs should not cite TR-IDs until the registry exists (game-architecture-review
will create it).

## Phase 7b: Sign-off
Per the studio protocol, these gates run only at `reviewMode: full` (none is a phase gate). In solo or lean, note
`TD-ARCHITECTURE and LP-FEASIBILITY skipped (<mode>)` and record them as skipped in step 3.

1. Spawn both in parallel, issuing both before waiting:
   - technical-director, gate TD-ARCHITECTURE, with the `Agent` tool with `subagent_type: "technical-director"`. Context: the document path, the
     baseline (TR-IDs and count), the ADR list with statuses, the knowledge-gap inventory.
   - lead-programmer, gate LP-FEASIBILITY, with the `Agent` tool with `subagent_type: "lead-programmer"`. Context: the document path, a baseline
     summary, the ADR list with statuses.
   - Also, when phase 2 flagged HIGH-risk post-cutoff APIs in Foundation or Core: technical-director, gate
     TD-ENGINE-RISK, with the API list, `unityVersion`, and the matching excerpts from unity-reference.
2. Show the verdicts side by side (TD-ARCHITECTURE: APPROVE / CONCERNS / REJECT; LP-FEASIBILITY: FEASIBLE /
   CONCERNS / INFEASIBLE). Ask with `AskUserQuestion`: accept and hand off / revise flagged items / discuss. With REJECT or
   INFEASIBLE, do not offer accept. A revision re-drafts the flagged sections for approval as in phases 1-4, then
   writes the document once more through the phase 7 ask. NOT ASSESSED is recorded with the missing input, never as
   approval.
3. Show the Document Status lines and ask before editing them in:

```
- TD-ARCHITECTURE: <date> - APPROVE | CONCERNS (accepted) | REVISED after CONCERNS | REVISED after REJECT | NOT ASSESSED - <input> | skipped - <mode>
- LP-FEASIBILITY: <date> - FEASIBLE | CONCERNS (accepted) | REVISED after CONCERNS | REVISED after INFEASIBLE | NOT ASSESSED - <input> | skipped - <mode>
```

## Phase 8: Handoff
1. Update `paths.sessionState`: document written and version, sign-off verdicts, blockers, ADRs still required,
   next step.
2. Print exactly this, nothing after it:

```
## Architecture complete
<paths.architectureDoc> v<N> - TD-ARCHITECTURE: <verdict>. <One sentence on what it covers.>

## Write these ADRs next
1. game-adr "<title>" -> ADR-<NNNN>: <what it defines and unblocks>
2. ...
3. ...
Then: accept them (game-adr accept), game-manifest, and game-architecture-review in a fresh session.

## Before game-gate pre-production
- [ ] Accept ADRs: <Proposed IDs that must be Accepted>
- [ ] Write ADRs: <still to write>
- [ ] Write the control manifest (game-manifest)
- [ ] Run game-architecture-review (writes the traceability index the gate reads, and appends to the TR registry)
- [ ] EditMode test asmdef exists and is in testAssemblies (game-setup checks it)
- [ ] UX specs: not in this plugin yet; note UI flows in the GDDs or skip if the game has no complex UI

## Open questions to watch
| ID | Summary | Priority | Resolved by |
```

List at most the top three ADRs from phase 6 in priority order. With nothing blocking, replace the checklist with
"No blockers - run game-gate pre-production." Omit the open-questions table when there are none.
