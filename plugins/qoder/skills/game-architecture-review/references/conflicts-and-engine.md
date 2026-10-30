# Phases 4-6: conflicts, Unity compatibility, architecture document

## Phase 4: Cross-ADR conflicts
Compare every ADR with every other. A conflict is:
- **Data ownership**: two ADRs claim exclusive ownership of the same data.
- **Integration contract**: ADR-A assumes system X exposes interface Y, ADR-B defines X differently.
- **Performance budget**: allocations that together exceed the frame budget (`targetFps` → ms per frame) or the
  draw-call / memory budget.
- **Dependency cycle**: initialisation or assembly order that contradicts itself (also asmdef references: a cycle
  between module asmdefs does not compile).
- **Pattern**: event-driven communication in one ADR, direct calls to the same subsystem in another.
- **State authority**: two ADRs own the same game state (both Combat and Character own health).

Per conflict:

```
## Conflict: ADR-NNNN vs ADR-MMMM
Type: <Data ownership / Integration / Performance / Dependency / Pattern / State>
ADR-NNNN claims: ...
ADR-MMMM claims: ...
Impact: <what breaks if both are implemented as written>
Resolution options:
  1. ...
  2. ...
```

### Dependency order
Build the graph explicitly before judging it, so no edge is missed:
1. List every ADR with its `## ADR Dependencies` entries ("Depends On"). An ADR without that section goes in a
   separate `No dependency section:` list: report it as a structural gap, never as "no dependencies".
2. Write the edge list `ADR-A -> ADR-B` (A depends on B).
3. Topological sort (repeatedly take ADRs whose dependencies are all placed). ADRs left over when nothing more can be
   placed are in a cycle: name each cycle.
4. Cross the edges with the status lines: an ADR that depends on a Proposed or missing ADR is flagged
   `⚠️ ADR-0005 depends on ADR-0002, still Proposed: not safe to implement until it is Accepted`.
5. Output the recommended implementation order: Foundation (no dependencies), then each layer that depends on the
   previous one. Cycles: `🔴 DEPENDENCY CYCLE: ADR-0003 → ADR-0006 → ADR-0003`, must be broken first.

## Phase 5: Unity compatibility
Against `unityVersion` and the unity-reference files loaded in phase 1:
- **Version consistency**: do ADRs that name a Unity version agree with `unityVersion`? An ADR written for an older
  version is potentially stale.
- **Post-cutoff APIs**: check each API an ADR lists against the module reference; flag two ADRs with incompatible
  assumptions about the same API.
- **Deprecated APIs**: search the ADRs for names in `deprecated-apis.md` (e.g. legacy Input Manager calls when
  `inputSystem` is the new Input System, `FindObjectOfType` family, UNet).
- **Render pipeline and packages**: decisions that assume Built-in when `renderPipeline` is URP/HDRP, or a package
  the project does not have (check `Packages/manifest.json`).
- **Missing Engine Compatibility sections**: list them; their assumptions are unknown.

```
### Unity audit
Unity: <unityVersion> (<renderPipeline>, <inputSystem>)
ADRs with an Engine Compatibility section: X / Y
Deprecated API references: ADR-0002 uses <API>, deprecated since <version>
Stale version references: ADR-0001 written for <version>
Post-cutoff API conflicts: ADR-0004 and ADR-0007 disagree on <API>
```

`unityVersion` empty → `Unity validation: NOT ASSESSED — unityVersion not recorded (run game-setup)`.

### Specialist second opinion
Spawn the unity-specialist with the `Agent` tool with `subagent_type: "unity-specialist"`, passing the ADRs with engine-specific decisions or
post-cutoff APIs, the unity-reference files read, `unityVersion` / `renderPipeline` / `inputSystem`, and the
audit findings. Ask it to confirm or challenge each finding, name Unity anti-patterns the audit missed (component
coupling, Update-heavy designs, singletons where services fit, wrong use of ScriptableObjects as runtime state), and
flag assumptions that differ from the project's version. If it recommends a sub-specialist (DOTS, shaders,
Addressables, UI), spawn that one too with the same context. Add the results under `### Unity specialist findings`;
they weigh the same as audit findings. Verify each claim against the ADR text before reporting it; an unverified
claim is reported as such.

## Phase 5b: GDD revision flags
For each high-risk Unity finding, check whether a GDD designs around the assumed (wrong) behaviour: a post-cutoff
API that behaves differently, a known engine limitation an ADR records, or a deprecated API a mechanic relies on.

```
### GDD revision flags
| GDD | Assumption | Reality (ADR / unity-reference) | Action |
|---|---|---|---|
| combat.md | Ragdolls on 100 enemies at once | ADR-0003 caps active ragdolls at 8 for the mobile budget | Revise GDD |
```

None → "No GDD revision flags: every GDD assumption matches verified Unity behaviour."
With flags: show the current `paths.systemsIndex` row of each flagged GDD next to the proposed row (Status
`Needs Revision`, exactly, no parenthetical: other skills match that string), then ask with `AskUserQuestion`:
`Apply all <N> updates` / `Show the full diff first` / `Leave the systems index unchanged`.

## Phase 6: Architecture document coverage
No `paths.architectureDoc` → report `Architecture document coverage: NOT ASSESSED — no architecture document` (it
keeps a full-mode verdict from PASS; suggest game-architecture). Otherwise check:
- every system in `paths.systemsIndex` appears in the architecture layers and has a module / asmdef;
- the data-flow section covers the cross-system communication the GDDs define;
- the module boundaries support every integration requirement;
- systems in the architecture document with no GDD (orphaned architecture).
