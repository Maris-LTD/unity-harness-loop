# Gate: concept → systems-design

Read only for this transition. `full` baseline first, then the reductions.

**Required artifacts**
- [ ] `paths.concept` exists and has real content (not template placeholders).
- [ ] Game pillars defined: in the concept doc, or `paths.pillars`.
- [ ] A Visual Identity Anchor section in `paths.concept` (studio-brainstorm's art-director step).

**Recommended (not blocking)**
- [ ] A played prototype proves the core mechanic. CCGS `/prototype` is not in this plugin yet; a
      `unity-ref-to-prototype` build or a hand-built prototype counts. Ask the user; absent → CONCERNS note: GDDs may
      be written for an idea nobody has played.

**Quality checks**
- [ ] The concept has been reviewed: `game-concept-review-*.md` (studio-design-review concept) in `paths.gddReviewsDir`, verdict
      not MAJOR REVISION NEEDED.
- [ ] The core loop is described and understandable.
- [ ] The target audience is identified.
- [ ] The Visual Identity Anchor has a one-line visual rule and at least 2 supporting principles.

## Tier reductions
- `full`: everything above as stated.
- `standard`: pillars and Visual Identity Anchor → recommended; `paths.concept` stays required.
- `minimal`: the gate target is `paths.brief`, not the concept doc; the concept, pillars and Visual Identity Anchor
  checks drop. A brief with real content passes.
