# Gate: pre-production → production

Read only for this transition. `full` baseline first, then the reductions.

**Required artifacts**
- [ ] First sprint plan in `paths.sprintsDir` (studio-sprint-plan).
- [ ] Every MVP-tier GDD from the systems index is complete.
- [ ] `paths.architectureDoc` exists.
- [ ] At least 3 Foundation-layer ADRs, and every Foundation and Core ADR has `Status: Accepted` (not Proposed):
      stories stay blocked until their governing ADR is accepted.
- [ ] `paths.controlManifest` exists (studio-create-control-manifest, generated from Accepted ADRs).
- [ ] Epics in `paths.epicsDir` with at least the Foundation and Core layer epics (studio-create-epics), each with
      stories (studio-create-stories).
- Not checked, no skill in this plugin yet (unless the user made them, then check them): vertical slice build and
  report, its playtest report, art bible completion and its sign-off, entity inventory, UX specs for key screens
  (main menu, HUD, pause), HUD design doc, UX review verdicts.

**Quality checks**
- [ ] The core loop is fun, not just functional. Ask: has someone played it, and is it fun? "No" is FAIL; "not yet"
      (nobody has played it) is NOT ASSESSED.
- [ ] The sprint plan references real story files under `paths.epicsDir`, and the stories embed their GDD
      requirement and ADR references.
- [ ] The architecture doc has no unresolved open questions in the Foundation or Core layers.
- [ ] Every ADR has an Engine Compatibility section and an ADR Dependencies section (even if all "None").
- [ ] GDDs, architecture and epics are coherent: studio-architecture-review ran after the last GDD or ADR change.
- [ ] If the user built a vertical slice: a human played the core loop without guidance; the game says what to do
      within 2 minutes; no fun-blocking bugs; the core mechanic feels good (ask). Any "no" is FAIL. A slice that was
      never played is NOT ASSESSED. Skipping the slice is CONCERNS at most: advancing without one raises the risk of
      a late design pivot.

## Tier reductions
- `full`: sprint plan + epics + control manifest + everything above required.
- `standard`: epics + sprint plan required; control manifest → recommended.
- `minimal`: only the floor: `paths.brief` with its build order, and stories under `paths.epicsDir` (the build order
  is the plan; no sprint plan). Everything else drops. Two current-build checks replace the slice checks: the core
  loop is fun (ask; "no" is FAIL, "not yet" is NOT ASSESSED) and it runs end to end (one start → challenge →
  resolution cycle, observed in Play mode with `unity-harness smoke` or unity-playmode-capture). Reductions relax
  what must exist, never what must work.
