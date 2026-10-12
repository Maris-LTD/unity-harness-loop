# Gate: technical-setup → pre-production

Read only for this transition. `full` baseline first, then the reductions.

**Required artifacts**
- [ ] Unity configured: `ProjectSettings/ProjectVersion.txt` exists and `unityVersion` is set in `studio config`
      (studio-setup), with `renderPipeline`, `inputSystem` and `targetPlatforms` recorded.
- [ ] Performance budgets recorded: `targetFps`, `drawCallBudget`, `memoryBudgetMb` (0 means unset).
- [ ] At least 3 ADRs in `paths.architectureDir` covering Foundation-layer systems: scene flow / bootstrap, events or
      messaging, save/load (studio-architecture-decision).
- [ ] Test framework working: an EditMode test asmdef listed in `testAssemblies` (`unity-harness config`) with at
      least one test that runs (`unity-harness tests` reports a non-zero total; 0/0 right after a compile means rerun).
- [ ] `paths.architectureDoc` exists (studio-create-architecture).
- [ ] `paths.controlManifest` exists (studio-create-control-manifest, written after the ADRs are Accepted and before
      the architecture review).
- [ ] `paths.traceability` exists.
- [ ] An architecture review report `architecture-review-*.md` in `paths.architectureDir`
      (studio-architecture-review).
- CI test workflow (`.github/workflows/*.yml` or equivalent): recommended only; no skill here sets it up.
- Not checked, no skill in this plugin yet (unless the file exists, then check it): art bible at `paths.artBible`
  with sections 1-4, accessibility requirements, interaction-pattern library, a started UX spec.

**Quality checks**
- [ ] ADRs cover the core systems: render pipeline, input, state management.
- [ ] Every ADR has an Engine Compatibility section stamped with the Unity version, and a GDD Requirements Addressed
      section.
- [ ] No ADR relies on an API listed in unity-engine-reference `deprecated-apis.md`.
- [ ] Every HIGH-risk Unity domain in unity-engine-reference `VERSION.md` is addressed in the architecture doc or
      listed there as an open question.
- [ ] ADRs touching post-cutoff Unity APIs carry Knowledge Risk HIGH or MEDIUM.
- [ ] All ADRs name the same Unity version (no stale versions).
- [ ] The traceability matrix has zero Foundation-layer gaps.
- [ ] No circular ADR dependencies (phase 3 graph check).

## Tier reductions
- `full`: everything above required.
- `standard`: ADRs reduced to critical (Foundation-layer) only; traceability index → recommended; control manifest
  stays required.
- `minimal`: only "Unity configured" is required (the minimal floor); everything else drops.
