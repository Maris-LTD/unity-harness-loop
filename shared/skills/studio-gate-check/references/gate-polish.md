# Gate: production → polish

Read only for this transition. `full` baseline first, then the reductions.

**Required artifacts**
- [ ] Game code under `Assets/<Game>/` organised into systems (asmdefs per module).
- [ ] Every core mechanic in the GDDs (the brief at minimal) is implemented: cross-check the systems index or brief
      against the code and the Complete stories in `studio status`.
- [ ] The main gameplay path is playable end to end (observed in Play mode).
- [ ] EditMode tests exist for the Logic and Integration stories, in the `testAssemblies` asmdefs.
- [ ] Build health, run now (phase 3): `unity-harness all` passes and `unity-harness smoke` passes. This replaces
      CCGS's smoke-check report and is never relaxed by qaLevel.
- [ ] A QA plan for this sprint, the last production sprint or this phase in `paths.qaDir` (studio-qa-plan).
      Advisory: missing → CONCERNS.
- Not checked, no skill in this plugin yet (unless present): QA sign-off report, playtest reports. The playtest
  questions below are still asked.

**Quality checks**
- [ ] Tests pass (`unity-harness all`).
- [ ] No open critical (S1) bugs. There is no bug tracker skill here: ask the user.
- [ ] The core loop plays as designed (compare with the GDD acceptance criteria).
- [ ] Performance within the budgets in `studio config` (phase 3).
- [ ] Playtest findings reviewed and critical fun issues fixed; no point where most players got stuck (ask).
- [ ] The fun hypothesis from the concept was validated or revised (ask).

## Tier reductions
- `full`: core mechanics + Logic/Integration tests + build health + 3 or more documented playtests (ask) required.
- `standard`: per-story test coverage → recommended; core mechanics + build health + playable end to end + at least
  one documented playtest (ask) + no open S1 bugs required.
- `minimal`: build health + playable end to end + no open S1 bugs required; the core-mechanics cross-check →
  recommended; everything else drops. A gate that closes production on "it boots" alone has not asked whether the
  game plays.
