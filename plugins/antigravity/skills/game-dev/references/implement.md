# game-dev - Phases 3-4: route and implement

Contents: routing table · Unity specialist · the brief · Antigravity implementation path · Config/Data ·
Visual/Feel.

## Routing table (primary agent)
| Story context | Primary agent |
|---|---|
| Foundation layer (bootstrap, scene flow, save/load, services, events, pooling, tooling), any type | engine-programmer |
| Type UI (HUD, menus, panels, popups) | ui-programmer |
| Type Visual/Feel (tweens, VFX triggers, camera feel, juice) | gameplay-programmer |
| Core or Feature gameplay mechanics, rules, input, physics | gameplay-programmer |
| Core or Feature AI: behaviour, pathfinding, NavMesh, perception | ai-programmer |
| Networking / multiplayer | gameplay-programmer (no network agent yet; say so) |
| Config/Data, no code | none: edit the data asset (below) |

## Unity specialist (secondary, for code stories)
Add a specialist next to the primary agent when the story touches engine-specific APIs or the engine risk is HIGH
(including unknown / NOT ASSESSED, or a Unity 6 API per unity-reference):
- unity-ui-specialist: Type UI, uGUI / UI Toolkit, TextMeshPro layout;
- unity-shader-specialist: shaders, Shader Graph, materials, URP renderer features, VFX Graph;
- unity-addressables-specialist: asset loading, Addressables, memory of loaded content;
- unity-dots-specialist: ECS, Jobs, Burst;
- unity-specialist: anything else engine-level (MonoBehaviour lifecycle, Input System, physics settings, packages,
  architecture-level Unity questions).
Specialists do not spawn each other; this skill spawns every agent it needs.

## The brief
Give paths and targeted reading instructions; do not paste whole documents.
1. Story file `<story-path>`: acceptance criteria, Out of Scope, QA Test Cases.
2. Design requirement: the GDD section (or brief MVP feature) and, if any, the TR registry entry's current text.
3. ADR guidance inline: the story's ADR Decision Summary and Implementation Notes (after mismatch option A, the text
   just re-read; after B, the story's summary plus "predates the current ADR").
4. Control manifest rules for the story's layer, if the project has a manifest.
5. Project rules: the `rules` block of `unity-harness config` and the project's CLAUDE.md / AGENTS.md (no new comments
   when `rules.noComments`, no new `Debug.Log*`, `CompareTag`, max file length, `[SerializeField] private` fields,
   cached components, no LINQ / allocations / string concatenation in Update).
6. Code root `Assets/<Game>/` and the existing structure found in phase 2. Tuning values in a ScriptableObject or
   config asset, never literals in logic. Logic in plain C# classes that EditMode tests can construct.
7. Test requirement (Logic / Integration, qaLevel standard/full): create the EditMode test at the story's Test
   Evidence path, inside an assembly listed in `testAssemblies`; class `<System>Tests`, methods
   `<Scenario>_<Expected>`; one or more per acceptance criterion; deterministic (no random seeds without a fixed
   seed, no time-dependent asserts, no file or network I/O). For Logic stories write the test first.
   At qaLevel minimal for a Logic / Integration story say explicitly: "Do not write a test for this story - test
   evidence is waived at qaLevel minimal." (An omitted instruction and a forgotten one look the same to the agent.)
   qaLevel full: also state a coverage target (every criterion and every edge case in QA Test Cases).
8. Performance: `targetFps`, `drawCallBudget`, `memoryBudgetMb` when the story touches the loop, rendering or physics.
9. Instruction: implement this story following the ADR, inside Out of Scope, report changed files and any deviation.

When an input does not exist at this tier, say so to the agent ("No ADR for this story; implement against the
acceptance criteria and the brief. Do not look for one.") and to the user in one line before starting
(`Brief omits: ADR (none), manifest (none) - implementing against acceptance criteria + brief`).

## Antigravity path: the unity-dev workflow skill
Run the `unity-dev` skill (or drive the 6-phase loop):
1. If a Unity specialist applies, spawn it first for a short read-only design note, e.g. `invoke_subagent` with the `unity-specialist` subagent.
2. Follow the 6-phase loop (Init → Plan → Implement → Verify → Fix → Log) in `unity-dev`:
   - Spawn the primary programmer agent from the routing table (e.g. `invoke_subagent` with the `gameplay-programmer` subagent) to write code and EditMode tests.
   - Run `unity-harness full` for Visual/Feel, UI, scene/prefab changes, or `unity-harness all` otherwise. Exit 2 means the Editor is not ready: ask the user to open it, do not loop.
   - Concurrently spawn `invoke_subagent` with the `unity-verifier` subagent and `invoke_subagent` with the `unity-reviewer` subagent for independent inspection.
   - Auto-fix loop: up to 2 fix rounds with the programmer agent for blocking issues; then report what is left.
   - Spawn `invoke_subagent` with the `run-log-writer` subagent and `invoke_subagent` with the `run-log-auditor` subagent to audit and finalize `report.md`.

## Config/Data stories
No agent. Show each change as `<asset/field>: <from> → <to>`, ask "May I write <asset path>?", edit it, then run
`unity-harness smoke` (Config/Data evidence).

## Visual/Feel stories
The gameplay-programmer implements the code / animation calls. The look half of the criteria (layout, presence,
clipping, colour) is verified in phase 5 with a retained screenshot. The feel half (timing, weight,
responsiveness) is not visible in a still: mark it DEFERRED for a playtest and say which half the capture covered.
