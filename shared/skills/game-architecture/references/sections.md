# Phases 1-6: Author the sections

Draft each section, show it, get approval, record the approved content in `paths.sessionState`, then move on. At
`workflow: standard` author phases 1, 2 (owners only), 3 (initialisation order and save/load only) and 6 (critical
list only).

## Phase 1: Layer map
Assign every system in the systems index to a layer:

```
PRESENTATION   uGUI / UI Toolkit, HUD, menus, VFX, audio, camera feel
FEATURE        secondary gameplay systems, AI, quests, meta progression
CORE           player control, core loop rules, physics interaction, input mapping
FOUNDATION     bootstrap + composition root, scene flow, save/load, event bus, pooling, config data loading
PLATFORM       Unity engine, packages, OS / store services
```

Per system: its layer, its module boundary, and what it owns exclusively (data, state, behaviour). Rules:
- Dependencies point down only. A Core module never references a Feature or Presentation module.
- Rules and state live in plain C# classes; MonoBehaviours are thin adapters (input, view, lifecycle) so EditMode
  tests can construct the logic.
- Tuning values live in ScriptableObject assets (or another config asset the project already uses), owned by the
  module that reads them.

Flag every Core and Foundation system that touches a HIGH or MEDIUM risk domain, with the relevant excerpt from
unity-reference inline.

## Phase 2: Module ownership
A module is an asmdef: `<Game>.<Module>` under `Assets/<Game>/<Module>/` unless the project already has another
convention (follow it). One table per layer:

| Module (asmdef) | Owns | Exposes | Consumes | Unity APIs / packages used |
|---|---|---|---|---|

- Owns: data and state only this module writes.
- Exposes: interfaces, events, read-only properties others may use.
- Consumes: what it reads from other modules (must be a lower layer or an interface).
- Unity APIs: the concrete classes and packages it calls, each with its risk level.

Then an ASCII dependency diagram of the asmdef references. Test asmdefs (`<Game>.Tests.EditMode`, listed in
`testAssemblies`) reference the runtime modules, never the reverse.

For every API listed, check the matching unity-reference file. Post-cutoff APIs get a flag:

```
! <Class.Member> - Unity <version>, post-cutoff, HIGH risk
  Checked against: unity-reference references/modules/<domain>.md
  Behaviour confirmed: yes / NEEDS VERIFICATION
```

## Phase 3: Data flow and initialisation
Cover at least:
1. Frame path: input (Input System actions or legacy) → Core rules → state → presentation; which work runs in
   `Update`, `FixedUpdate`, `LateUpdate`, jobs.
2. Event path: how modules talk without tight coupling (C# events, a typed event bus, ScriptableObject event
   channels, UnityEvent at view level only). Pick one primary pattern.
3. Save/load path: what state is serialised, which module owns serialisation, format and location.
4. Initialisation order: the bootstrap scene or composition root that constructs services and wires dependencies,
   then scene loading (SceneManager or Addressables). Prefer an explicit composition root over Script Execution
   Order and `RuntimeInitializeOnLoadMethod` chains; if the project uses a DI container, use its lifetime scopes.

Per flow: the data, producer, consumer, and whether it is a direct call, an event, or shared state. Flag anything
crossing threads (jobs, async loading, `Awaitable` continuations).

## Phase 4: API boundaries (full)
Per boundary between modules: the interface the module exposes (C# interface, events, properties), entry points,
invariants callers must respect, guarantees the module makes. Write it in C# signatures without comments or
logging (house rules), e.g.

```csharp
public interface IInventory
{
    event Action<ItemId, int> CountChanged;
    int CountOf(ItemId id);
    bool TryAdd(ItemId id, int amount);
}
```

Flag Unity types that cross a boundary (`MonoBehaviour`, `ScriptableObject`, `GameObject`, `Object` lifetime) and
check they behave as assumed in the project's version. Prefer plain data and interfaces across boundaries.

## Phase 5: ADR audit and traceability
For each ADR from phase 0c (full; at standard only the conflict column):

| ADR | Engine compat section | Unity version stamped | GDD linkage | Conflicts with this session | Still valid |
|---|---|---|---|---|---|

Then map every baseline requirement to ADR coverage (an ADR's `GDD Requirements Addressed` table or decision text):

| Req ID | Requirement | ADR coverage | Status |
|---|---|---|---|
| TR-combat-001 | Hit detection every physics step | ADR-0003 | covered |
| TR-combat-002 | Combo state machine | - | GAP |

Count covered vs gaps. Each gap becomes a required new ADR.

## Phase 6: Required ADRs
List every decision from phases 1-4 without an ADR, plus every uncovered requirement, grouped:
- Must exist before coding (Foundation and Core): e.g. composition root and service lifetimes; scene flow and
  loading strategy; event architecture; save format and ownership.
- Before the relevant system is built: e.g. inventory serialisation, AI decision model.
- Can wait for implementation: e.g. a specific shader technique.

Each entry: title, layer, the TR-IDs it covers, and what it unblocks.
