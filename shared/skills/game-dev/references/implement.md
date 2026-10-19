# game-dev - Phases 3-4: route and implement

Contents: routing table · Unity specialist · the brief · {{platform}} implementation path · Config/Data ·
Visual/Feel.

## Routing table (primary agent)
| Story context | Primary agent |
|---|---|
| Foundation layer (bootstrap, scene flow, save/load, services, events, pooling, tooling), any type | {{agent engine-programmer}} |
| Type UI (HUD, menus, panels, popups) | {{agent ui-programmer}} |
| Type Visual/Feel (tweens, VFX triggers, camera feel, juice) | {{agent gameplay-programmer}} |
| Core or Feature gameplay mechanics, rules, input, physics | {{agent gameplay-programmer}} |
| Core or Feature AI: behaviour, pathfinding, NavMesh, perception | {{agent ai-programmer}} |
| Networking / multiplayer | {{agent gameplay-programmer}} (no network agent yet; say so) |
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

{{#claude}}
## Claude Code path: the unity-dev workflow
Run `Workflow({ name: "unity-harness:unity-dev", args: { task, smoke } })`.
- `task`: the brief above written as one text (Vietnamese plan sections come from the workflow itself): story title
  and path, acceptance criteria verbatim, Out of Scope, files and folders to touch, test requirement, tuning-as-data
  rule, the project's coding rules copied from CLAUDE.md, the specialist's concerns when one applies, and the done
  criteria (compiles, EditMode tests pass, smoke conditions for visual stories).
- `smoke: true` for Visual/Feel, UI and Integration stories, and any story that changes scenes, prefabs or startup;
  otherwise leave it out (the plan decides).
- Large or risky story (many files, HIGH risk, coarse granularity): offer `planOnly: true` first, let the user edit
  the plan, then rerun with `planFile`.
- When a Unity specialist applies, spawn it first with {{spawn unity-specialist}} (or the matching sub-specialist)
  for a short read-only design note, and put that note in `task`.
- Tell the user: it runs in the background (watch with `/workflows`); nothing may write into the project while it
  runs, or the tree guard voids verification. Do not edit story files or the checkpoint until it returns.
- When it returns, read its result (`verdict`, `remainingIssues`, `runDir`) and `<runDir>/report.md`. Verdict `pass`
  with no remaining issues → phase 5. Otherwise fix the remaining issues by hand (small) or rerun the workflow with
  a narrower task, then rerun `unity-harness all`.
{{/claude}}
{{#antigravity}}
## Antigravity path: the unity-dev workflow skill
Run the `unity-dev` skill (or drive the 6-phase loop):
1. If a Unity specialist applies, spawn it first for a short read-only design note, e.g. {{spawn unity-specialist}}.
2. Follow the 6-phase loop (Init → Plan → Implement → Verify → Fix → Log) in `unity-dev`:
   - Spawn the primary programmer agent from the routing table (e.g. {{spawn gameplay-programmer}}) to write code and EditMode tests.
   - Run `unity-harness full` for Visual/Feel, UI, scene/prefab changes, or `unity-harness all` otherwise. Exit 2 means the Editor is not ready: ask the user to open it, do not loop.
   - Concurrently spawn {{spawn unity-verifier}} and {{spawn unity-reviewer}} for independent inspection.
   - Auto-fix loop: up to 2 fix rounds with the programmer agent for blocking issues; then report what is left.
   - Spawn {{spawn run-log-writer}} and {{spawn run-log-auditor}} to audit and finalize `report.md`.
{{/antigravity}}

## Config/Data stories
No agent. Show each change as `<asset/field>: <from> → <to>`, ask "May I write <asset path>?", edit it, then run
`unity-harness smoke` (Config/Data evidence).

## Visual/Feel stories
The gameplay-programmer implements the code / animation calls. The look half of the criteria (layout, presence,
clipping, colour) is verified in phase 5 with a retained screenshot. The feel half (timing, weight,
responsiveness) is not visible in a still: mark it DEFERRED for a playtest and say which half the capture covered.
