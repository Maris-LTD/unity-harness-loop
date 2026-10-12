# studio-dev-story - Phase 2: load context

Contents: required files by tier · story fields · governing ADR · dependencies · project context · mark In Progress.

## Required files by tier (`workflow`)
| Input | full | standard | minimal |
|---|---|---|---|
| Design source | GDD in `paths.gddDir` named by the story; if the story or epic says `GDD: none yet`, `paths.concept` instead; neither present → STOP, route to the design step | same | `paths.brief`; missing → STOP, route to studio-brainstorm |
| TR registry (`paths.trRegistry`, kept by studio-architecture-review) | missing → WARN and continue | optional | not expected |
| Governing ADR the story names | missing / Proposed / Deprecated / Superseded → BLOCKED | same, only if the story names one | same, only if the story names one |
| Control manifest (`paths.controlManifest`) | missing → WARN and continue | WARN | skip |

A story whose ADR field reads `N/A (...)` references none: proceed. BLOCKED means: write `Blocked on` in the
session checkpoint (see collect.md), set nothing else, spawn no agent, tell the user the unblocking action.

## The story file
Hold: title, ID, epic, Layer, Type (Logic / Integration / Visual/Feel / UI / Config/Data), GDD path + requirement
(or brief MVP feature), ADR reference + ADR Version + ADR Decision Summary, Engine / Risk, acceptance criteria
verbatim, Implementation Notes, Out of Scope, QA Test Cases, Test Evidence path, Dependencies.

If a TR-ID is present and a registry exists, search that one ID in it and use its current `requirement` text, not
text quoted in the story.

## Governing ADR (only when the story names one)
Do not read the ADR by default: the story's ADR Decision Summary and Implementation Notes are what the programmer
reads instead of the ADR (`paths.architectureDir/adr-NNNN-*.md`). Search it for its Status (`> **Status**:` or
`## Status`), Last Verified and Date lines only.
- Status Proposed / Deprecated / Superseded → BLOCKED (point the story at the successor; studio-create-stories never
  rewrites an existing story).
- Current version = Last Verified date, else Date, else `unversioned`. Compare with the story's ADR Version:
  - match, or the story has no ADR Version field, or both `unversioned` → trust the story (note the last two cases in
    the summary);
  - differ, or the ADR lost its date while the story has one → mismatch. Ask with `AskUserQuestion`:
    - A (recommended): re-read the ADR's Decision / Engine Compatibility sections, implement against them, and update
      the story's ADR Decision Summary, Implementation Notes and ADR Version (set to the ADR's version, not today);
    - B: implement from the story's summary, drift risk accepted (record under Deviations);
    - C: stop to review the ADR first (spawn nothing).
- A control manifest, if the project has one: read only the story's layer section. Story Manifest Version older than
  the manifest → ask: A update the field and use current rules (recommended) / B keep old rules, set the field and
  add `Manifest-Note: proceeded with old manifest rules on <date>` / C stop.

## Dependencies
For each dependency: find its story file under `paths.epicsDir` and read its Status.
- Complete → fine.
- Anything else → ask with `AskUserQuestion`:
  - A proceed anyway (record "Implemented with incomplete dependency: <title> - <status>" under Deviations);
  - B stop (set the checkpoint `Blocked on`, spawn nothing);
  - C it is done but unmarked → "May I set <path> Status to Complete?" then continue.
- Dependency file not found → warn with the path and ask whether to continue.

## Project context
- `unity-harness config`: `testAssemblies`, `rules`, `smoke.scene`, `smoke.expectTypes`.
- Studio config: `unityVersion`, `renderPipeline`, `inputSystem`, `targetFps`, `drawCallBudget`, `memoryBudgetMb`.
- Existing code layout: search `Assets/<Game>/` for the system's folder, its asmdefs and the existing service / DI
  pattern, so the agent extends what is there instead of inventing a parallel structure.
- Engine risk: the story's Risk field. If absent, `NOT ASSESSED`, or the API is Unity 6 specific
  (unity-engine-reference), treat it as HIGH for the specialist decision in implement.md.

## Mark In Progress
In collaborative mode ask once: "May I mark this story In Progress? This sets Status and Last Updated in
<story-path>". Guided / autonomous update without
asking. Then:
- story header: `> **Status**: In Progress`, `> **Last Updated**: <YYYY-MM-DD>` (add the field after Status if
  absent).
  The story's Status line is the only status record; sprint files list stories without a status column, so do not
  edit them.
If the user declines, change nothing, continue, and print `Story not marked In Progress - declined` in the summary.

Write the session checkpoint now too (format in collect.md, `Next step: implementing`), before any workflow starts:
the workflow's tree guard voids its verification if project files change while it runs.
