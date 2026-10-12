# Acceptance mode (`accept ADR-NNNN`)

The only path from `Proposed` to `Accepted`. Authoring always writes `Proposed`, while studio-create-control-manifest,
studio-create-epics, studio-create-stories, studio-story-readiness and studio-gate-check rely on `Accepted`.
Acceptance authority: the user, or technical-director on the user's explicit confirmation. Never this skill on its
own, never another agent.

1. Resolve the id: list `adr-NNNN-*.md` in `paths.architectureDir`. No match or more than one → stop and say which;
   do not pick. No `> **Status**:` header line → stop: "ADR-NNNN has no Status line; run
   studio-architecture-decision retrofit <path> first."
2. Status already `Accepted` → say so and stop. `Deprecated` or `Superseded by …` → refuse: reviving a superseded
   decision is a new ADR, not a status edit.
3. Dependencies. Read the `## ADR Dependencies` table.
   - Section absent, empty, or `UNKNOWN` → refuse: "ADR-NNNN's dependencies are <absent / unknown>, so I cannot tell
     what it rests on. Run retrofit to establish them." An unexamined list must not pass as "no dependencies".
   - `Depends On` names an ADR that is not `Accepted` → refuse and name it: "ADR-NNNN depends on ADR-MMMM, which is
     still <status>. Accept ADR-MMMM first."
4. Find what acceptance unblocks, before asking. Search the story files in `paths.epicsDir` (`story-*.md`, every
   epic folder) for a Blocked Status line (`> **Status**: Blocked`, also `**Status:** Blocked` or `Status: Blocked`)
   and keep those that name this ADR's id as the reason. Leave out a story that names this ADR only as the successor
   to point at (a note for a Deprecated or Superseded ADR): it is still governed by the old ADR.
5. Confirm with {{ask}}, in every automation mode including autonomous:
   "Accept ADR-NNNN - <title>? <N> stories become Ready: <paths>" (or "No stories are waiting on this.").
   Options: accept it / not yet, leave it Proposed.
6. On yes: edit the header to `> **Status**: Accepted`. Keep `> **Date**:` (the authoring date) and
   `> **Last Verified**:` as they are: stories stamp their ADR Version from Last Verified, else Date, and
   studio-dev-story compares against the same field, so changing either here would make every story written while
   the ADR was Proposed look stale. No Date line → add one with today's date. Last Verified changes only when
   retrofit or a review re-verifies the decision content.
7. Set each story from step 4 to `> **Status**: Ready` and its `> **Last Updated**:` to today. Edit only the Status
   and Last Updated lines.
8. Report: the ADR (and any Date line added) and every story that became Ready. Suggest
   studio-create-control-manifest `update` when a manifest already exists, since its rules come from Accepted ADRs.
