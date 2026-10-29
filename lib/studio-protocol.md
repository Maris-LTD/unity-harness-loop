# Unity Studio protocol (unity-harness)

Applies only in a Unity project whose `.unity-harness/config.json` has a `studio` block (the `studio-*` skills
create it). Elsewhere, ignore this file.

## Settings
- Read the settings once per skill run with `unity-harness studio config`: `rigor`, `automation`, `stage`,
  `reviewMode`, `workflow`, `storyGranularity`, `qaLevel`, `docsDensity`, `language` and the document `paths`.
  The blank sub-knobs follow `rigor` (minimal → solo/coarse/minimal/terse, standard → lean/balanced/standard/balanced,
  full → full/balanced/full/thorough; set storyGranularity=fine only when 1-AC stories are wanted).
- `unity-harness studio status` lists what exists (brief, GDDs, epics, stories by status, sprint, evidence,
  active story). It reports observations; the skill decides what they mean.
- Change settings only through `unity-harness studio set key=value`, and only after the user approves. Never
  hand-edit `.unity-harness/config.json`.
- Write documents and talk to the user in `language`. Skill and file names stay in English.

## Collaboration loop
Question → Options → Decision → Draft → Approval. The user makes every decision that shapes the game. Agents
return 2-4 options with trade-offs and a recommendation; the skill asks the user with the question tool
(`AskUserQuestion` in Claude Code, `ask_question` in Antigravity). Do not run the next skill on your own; name it.

`automation` sets how often to stop:

| Mode | Decisions | File writes |
|---|---|---|
| `collaborative` (default) | Ask for every multi-option decision, show drafts | Ask "May I write `<path>`?" before every write; multi-file changes need one explicit approval of the whole set |
| `guided` | Ask only for major decisions (names, paths, mutually exclusive directions, scope, anything costly to undo), at most 2 options with a recommendation; state minor choices and continue | A new file waits for "May I write?"; an update to an existing file goes ahead after a one-line summary |
| `autonomous` | Pick the recommended option and continue | Write directly; append every decision to `paths.decisionLog` as `- <date> <skill>: <decision> (why)` |

Always ask, in every mode: scope changes, deleting or moving files, changes to settings or config, commits and
pushes. A question that comes back skipped, dismissed or empty is not an answer: write nothing, pick nothing, ask
again in plain text and wait.

## Review gates
Gates are reviews by director or lead agents. `reviewMode` decides which run:
- `solo`: none. Note `[GATE-ID] skipped (solo)`.
- `lean`: only phase gates.
- `full`: every gate the skill names.

Spawn the gate's agent with the gate ID and the context the skill lists; the agent knows its gates. Handle the
verdict:
- APPROVE / READY: continue.
- CONCERNS: show them and ask: revise the flagged items, accept and proceed, or discuss.
- REJECT / NOT READY: show the blockers; write nothing and do not advance until they are resolved.
- NOT ASSESSED: name the missing input; never treat it as approval.

With several reviewers, the strictest verdict wins (NOT READY > CONCERNS > NOT ASSESSED > READY). Record the
outcome in the document header: `> **<Agent> review (<GATE-ID>)**: APPROVED|CONCERNS accepted|REVISED|NOT ASSESSED <date>`.

## Where things live
- Documents sit outside `Assets/` so Unity does not import them, under `paths` from `studio config`
  (`Docs/` by default): `design/game-brief.md` (minimal), `design/gdd/game-concept.md` and `design/gdd/<system>.md`
  (standard/full), `production/epics/<epic>/EPIC.md` and `story-NNN-<slug>.md`, `production/sprints/sprint-NNN.md`,
  `production/qa/evidence/`, `production/session-state/active.md`.
- Code lives under `Assets/<Game>/` with asmdefs `<Game>.Runtime`, `<Game>.Editor`, `<Game>.Tests.EditMode`.
  EditMode tests must sit in an asmdef listed in `testAssemblies` of `unity-harness config`, or they never run.
- `production/session-state/active.md` is the checkpoint: update it after each story step (current story, step,
  files touched, open questions). After a compaction or a new session, read it before anything else.

## Code
- The project's own rules come first: its CLAUDE.md / AGENTS.md and the `rules` block of `unity-harness config`
  (no new comments, no new `Debug.Log*`, `CompareTag`, max file length) override generic advice, including any
  habit of adding doc comments.
- Gameplay values are data (ScriptableObject or config asset), never literals in logic.
- Logic sits in plain C# classes that EditMode tests can construct; inject dependencies instead of adding
  singletons. MonoBehaviours stay thin.
- Unity 6 changed many APIs. Check `unity-reference` before using an API you are not sure exists in the
  project's Unity version.

## Proof
- A compile is not a run. `unity-harness all` (rules + compile + EditMode tests) is the minimum before a story is
  called done.
- Evidence by story type:

| Type | Evidence | Blocks at |
|---|---|---|
| Logic (rules, formulas, state machines) | EditMode test that passes | qaLevel standard/full (advisory at minimal) |
| Integration (several systems) | EditMode/PlayMode test or a written playtest note | qaLevel standard/full |
| Visual/Feel, UI | Screenshot kept in `paths.evidenceDir/<story-slug>/` (`unity-harness smoke` capture or `unity-capture`); Visual/Feel also needs the user's sign-off in `game-done` | every level |
| Config/Data (tuning) | `unity-harness smoke` passes | advisory |

- Anything the player sees is launched in Play mode and looked at before the story closes, at every rigor level.
  A screenshot that was not kept is not evidence.
- Commit only when the user asks.
