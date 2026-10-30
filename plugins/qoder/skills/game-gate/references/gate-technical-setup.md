# Gate: systems-design → technical-setup

Read only for this transition. `full` baseline first, then the reductions.

**Required artifacts**
- [ ] `paths.systemsIndex` exists and lists at least the MVP systems (game-systems).
- [ ] Every MVP-tier system has a GDD in `paths.gddDir` (game-design), and each passed game-design-review:
      a report in `paths.gddReviewsDir` with a verdict that is not MAJOR REVISION NEEDED.
- [ ] Cross-GDD review report: CCGS `/review-all-gdds` is not in this plugin yet → `not checked: no skill in this
      plugin yet`. If the user has a `gdd-cross-review-*.md` in `paths.gddDir`, read its verdict: FAIL blocks;
      NOT ASSESSED satisfies nothing (the item is NOT ASSESSED).

**Quality checks**
- [ ] Every MVP GDD has the sections its tier requires (phase 3 section scan): full all 8; standard the 5 standard
      sections plus Formulas when the system defines numeric rules. `## Detailed Design` counts as Detailed Rules.
- [ ] System dependencies are mapped in the systems index and consistent both ways.
- [ ] The MVP priority tier is defined in the systems index.
- [ ] No stale references: older GDDs do not contradict decisions recorded in later ones.

## Tier reductions
- `full`: systems index + all MVP GDDs at 8 sections + design reviews required.
- `standard`: MVP GDDs validated at the 5 standard sections (+ conditional Formulas).
- `minimal`: **gate not applicable.** Return PASS with the note "No design gate at minimal workflow - minimal skips
  the systems-design phase; advancing brief → code." Do not flag absent GDDs. The director panel does not run
  ("Director panel skipped - gate not applicable at workflow minimal"); the stage write still asks first.
