# Gate: polish → release

Read only for this transition. `full` baseline first, then the reductions.

**Required artifacts**
- [ ] Every feature in the milestone plan (the brief's MVP list at minimal) is implemented.
- [ ] Content complete: the levels, assets and text the design docs reference exist.
- [ ] Player-facing text is externalised: no hardcoded UI strings in `Assets/<Game>/` (phase 3 grep).
- [ ] A QA plan in `paths.qaDir` (game-qa-plan).
- [ ] Every Must Have story has its evidence: Logic/Integration tests pass; UI screenshots kept; Visual/Feel
      screenshots plus a `Visual sign-off` line in the story's Completion Notes, all under `paths.evidenceDir`. No
      qaLevel waives the screenshots.
- [ ] Build health on the release candidate: `unity-harness full` passes cleanly.
- [ ] No test regressions from the previous sprint.
- Not checked, no skill in this plugin yet (unless present): QA sign-off, balance check, release checklist, store
  metadata, changelog or patch notes, security audit, localization QA reports. Ask whether each was done by hand;
  an answer of "no" for something the user plans to ship is a CONCERNS line.

**Quality checks**
- [ ] All tests pass.
- [ ] Performance targets met on every target platform. Ask for device numbers; Editor numbers are not enough.
- [ ] No open S1, S2 or S3 bugs (ask).
- [ ] Accessibility basics where relevant: remapping, text scaling (ask).
- [ ] Legal: EULA, privacy policy, age rating where applicable (ask).
- [ ] The player build compiles and packages for each target platform (ask, or the user runs a build).

## Tier reductions
- `full`: all features + content complete + text externalised + build health + no open S1-S3 bugs required.
- `standard`: content-complete audit and text externalisation → recommended; all features + build health + no open
  S1 bugs required; open S2/S3 bugs → recommended.
- `minimal`: only build health + no open S1 bugs required; everything else drops.
