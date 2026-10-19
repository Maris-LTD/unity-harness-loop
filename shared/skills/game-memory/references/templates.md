# Memory file templates

One fact cluster per file. The frontmatter is what the agent reads to decide relevance, so make `description`
specific. Link related files with `[[name]]`. Write dates as absolute dates (`2026-10-12`), never "today".

## MEMORY.md (index only, one line per file, no content)

```markdown
- [Project overview](project-overview.md) — <game/app name>, concept, rules, references, GDD path
- [Tech setup](tech-setup.md) — engine version, packages, harness config, git remote, memory location
- [Architecture](architecture.md) — folders, asmdefs, logic vs views, data, tests
- [Current work](current-work.md) — status, done changes, known gaps, user preferences
```

## project-overview.md

```markdown
---
name: project-overview
description: <Name> — concept, platform, core rules, references, GDD
metadata:
  type: project
---

<Name> (aka <alt name>), folder `<path>`, created <date>.

- Genre / platform / orientation / camera.
- Hook: <one sentence of the core interaction>.
- Win / lose.
- Level rollout: <bands of levels and the mechanic each introduces>.
- References: `References/<file>` (<what it is>), ...
- GDD: `Docs/<file>.md` (<language>, <scope>). Numbers must match code tuning.

**Why:** <what the user is building this for>.
**How to apply:** <what to keep in sync>. See [[tech-setup]], [[architecture]].
```

## tech-setup.md

```markdown
---
name: tech-setup
description: <Name> tooling — engine version, packages, harness config, git, memory location
metadata:
  type: project
---

- Engine <version>, template <id>, key packages and versions.
- Packages added / removed on setup.
- `.unity-harness/config.json`: testAssemblies, rules.includePaths, smoke scene, waitForScene, expectTypes.
- Git: branch, remote URL, who pushes (e.g. push is blocked for the agent, so ask the user to run `! git push`).
- Commit rules (e.g. no AI attribution lines).
- Project memory lives in-repo at `.claude/memory/`; the agent's memory folder links to it.

**Why:** <reason>.
**How to apply:** <reason to read it>. Related: [[project-overview]].
```

## architecture.md

Write this from the code that exists, not from the plan.

```markdown
---
name: architecture
description: <Name> code layout — asmdefs, folders, pure logic vs views, bootstrap, data, tests
metadata:
  type: project
---

All code lives in `Assets/<Game>/` (namespace `<Game>`).

- Asmdefs: ...
- `Core/` = pure C# rules: <list of models and what each owns>.
- `<Game>Tuning` = single source of tuning constants; GDD Appendix A mirrors it; `<Test>` checks it.
- Levels: <where, how many, invariants, solver test>.
- Bootstrap: <scene MonoBehaviour> → <factory> → <context> → <flow controller>.
- Views / rendering / audio / input / haptics: <one line each>.
- Editor menus: <menu path> (<what it rebuilds>).
- Persistence keys: <PlayerPrefs keys>.

**Why:** <design reason>.
**How to apply:** <where new work goes>. See [[current-work]].
```

## current-work.md

```markdown
---
name: current-work
description: <Name> status, user-requested changes, known gaps (as of <date>)
metadata:
  type: project
---

Status <date>: <milestone, how it was built, verdict>.
Harness: rules <x>, compile <x>, EditMode <passed>/<total>, smoke <x>.

User-requested changes <date> (done):
1. <change> — <where in code>.

Verification tricks learned: <e.g. Game view must be resized to 9:16 before captures>.
User preferences: <e.g. dislikes red-pink tones; keep UI blue/turquoise>.

Known gaps / ideas:
- <gap>

<Constraints on the agent, e.g. the user plays in the Editor; do not enter Play mode or clear progress without asking.>

**How to apply:** update this file whenever a milestone lands. Related: [[architecture]], [[tech-setup]].
```
