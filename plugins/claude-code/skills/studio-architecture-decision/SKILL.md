---
name: studio-architecture-decision
description: Write, accept or retrofit an Architecture Decision Record (ADR) for a Unity studio project - check the architecture registry for locked stances, load Unity 6 context from unity-engine-reference, guide the decision with 2-3 alternatives, have unity-specialist validate it, run the TD-ADR review, write `adr-NNNN-<slug>.md` as Proposed under the studio architecture folder, and update the registry. `accept ADR-NNNN` is the only route to Accepted and unblocks stories waiting on it. Port of CCGS /architecture-decision. Use when the user says "write an ADR", "architecture decision", "accept ADR-0003", "retrofit ADR", "ghi quyết định kiến trúc", "viết ADR", "duyệt ADR", "chốt quyết định kỹ thuật".
---

# Architecture decision

If this session's context has no "Unity Studio protocol" (it started before the studio block existed), run
`unity-harness studio protocol` once and follow it.

Records one technical decision as an ADR in `paths.architectureDir`. New ADRs are always written `Proposed`;
`accept` mode is the only path to `Accepted`, and acceptance is what unblocks the stories and epics that depend on
the decision. The master document (studio-create-architecture) lists which ADRs are needed.

References, read when the step starts and again after a compaction:
- `references/accept.md`: acceptance mode.
- `references/retrofit.md`: retrofit mode (add missing sections to an existing ADR).
- `references/adr-template.md`: the ADR file format, including the exact status header.
- `references/review-and-write.md`: steps 5-7 (specialist validation, TD-ADR, GDD sync, write, registry update).

## Settings
Run `unity-harness studio config`. Keep `reviewMode`, `automation`, `workflow`, `docsDensity`, `paths`, `language`,
`unityVersion`, `renderPipeline`, `inputSystem`, budgets.

`workflow`: `full` → every ADR on the required list must be written; `standard` → critical (Foundation-layer) ADRs
only; `minimal` → not required, run when the user asks. `docsDensity` sets prose depth (terse: decision and
alternatives as bullets with one line of rationale each; balanced: a paragraph per section; thorough: full
trade-offs). The tables (Engine Compatibility, ADR Dependencies, GDD Requirements) stay whole at every density.

## Step 0: Mode
- `accept ADR-NNNN` → read `references/accept.md` and follow it; stop there.
- `retrofit <path>` → read `references/retrofit.md` and follow it; stop there.
- A title → new ADR, continue with step 1.
- Nothing → ask for a short title ("event-architecture", "save-format", "scene-loading"), then step 1.

## Step 1: Unity context
- `unityVersion` empty → stop: "No Unity version recorded. Run studio-setup first, or tell me the version."
- Identify the domain from the title or description: Core, Physics, Rendering, UI, Audio, Navigation, Animation,
  Networking, Input, Scripting, Data/Save.
- From unity-engine-reference read `references/VERSION.md` (risk per version), the domain's module file under
  `references/modules/` or `references/plugins/` if one exists, `references/breaking-changes.md` and
  `references/deprecated-apis.md` for that domain.
- MEDIUM or HIGH risk domain → show before going on:

```
! UNITY KNOWLEDGE GAP
Unity <unityVersion> | Domain: <domain> | Risk: <level>
Verified changes from unity-engine-reference:
- <change>
This ADR uses verified information only, not training memory.
```

## Step 2: Next number
List `adr-*.md` in `paths.architectureDir`; the next number is the highest plus one, four digits (`0001` for the
first). The file is `adr-NNNN-<slug>.md` with a kebab-case slug of the title.

## Step 3: Context
1. Registry first (blocking). Read `paths.architectureRegistry` if it exists and take the entries for this domain,
   system or state. Show them as locked constraints (state ownership with its interface, interface contracts,
   forbidden patterns, budgets). If the proposal would contradict one, stop and offer: align with the existing
   stance / supersede that ADR explicitly / record why this case is an exception. Do not design until it is resolved.
2. Read a prior ADR only when the registry points at one whose reasoning (not just its facts) matters: map its
   headings first, read Context, Decision and Consequences.
3. GDDs: only those named by the registry, the master architecture's required-ADR entry, or the user; only their
   `## Dependencies`, `## Formulas` and `## Edge Cases` sections. Note the TR-IDs this ADR covers, only from
   `paths.trRegistry` (written by studio-create-architecture or studio-architecture-review). No registry yet → cite
   the GDD requirement in words and no TR-ID; studio-architecture-review assigns the IDs later.

## Step 4: Decide with the user
Derive assumptions first, then confirm or adjust them with `AskUserQuestion`, not open questions:
- problem statement (one sentence);
- 2-3 concrete alternatives (from the Unity reference, the GDD requirements, common Unity patterns such as a
  composition root, ScriptableObject channels, Addressables groups, DOTS vs MonoBehaviour);
- GDD systems driving it;
- dependencies on other ADRs. If the scan is inconclusive, show `UNKNOWN - please confirm`, never `None`; resolve it
  in this prompt, never write UNKNOWN to the file;
- status: always Proposed (never ask).

Options: proceed with these / change the alternatives / adjust GDD linkage / add a performance budget constraint /
something else. Schema and data-design questions (inline vs ScriptableObject, serialisation format) are asked
separately after the assumptions are confirmed, one question per point. Then confirm ADR dependencies: what it
depends on (must be Accepted before implementation), what it enables, which epic or story it blocks; "None" per
field when nothing applies.

## Steps 5-7: Draft, review, write, register
Read `references/review-and-write.md` and follow it.

## Step 8: Close
- Read `paths.architectureRegistry` and the master architecture's required ADR list; list every required ADR still
  unwritten as an option, plus "stop here". When all Foundation ADRs exist and GDDs are still missing, add
  "write the next GDD with studio-design-system".
- Do not unblock stories here: the new ADR is Proposed. Find stories in `paths.epicsDir` whose Status line is
  Blocked and that name this ADR's id, list them by path, and say: "ADR-NNNN is written and Proposed. <N> stories
  stay Blocked until you run studio-architecture-decision accept ADR-NNNN."
- Always add this notice:
  "To check ADR coverage against the GDDs, run studio-architecture-review in a fresh session (`/clear` first). Never
  in the same session as this skill: the reviewer must not share the author's context."
- Update `paths.sessionState`: ADR written, status, gates, registry changes, next step.
