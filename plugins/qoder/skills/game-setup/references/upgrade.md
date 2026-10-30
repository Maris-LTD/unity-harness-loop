# game-setup: Unity version upgrade

Read when the user asks to upgrade Unity, or when `ProjectSettings/ProjectVersion.txt` no longer matches the
recorded `unityVersion`. This audits and records; it changes no source files. Source migration happens through
stories (`game-tasks` → `game-dev`) or by hand.

## 1. Versions
- Old: recorded `unityVersion` (`unity-harness studio config`), or the user's argument.
- New: the user's target, or `m_EditorVersion` if the project was already opened in the new editor.
- If the project is already on the new version, the audit below still applies: it finds what may now break.

## 2. Changes between the versions
- Read `unity-reference`: `references/breaking-changes.md`, `references/deprecated-apis.md`, and the module
  files for systems the game uses (input, UI, rendering, physics...).
- If the user allows web research, look for Unity's official upgrade guide and release notes for old → new. Extract
  renamed, removed and changed APIs, changed defaults and "must migrate" items, each with its source URL. Never fill
  gaps from memory.

## 3. Pre-upgrade audit
Search the game's code (`rules.includePaths` from `unity-harness config`, else `Assets/<Game>/`; skip third-party
folders) for every deprecated or changed API found in step 2. Present:

```
Pre-upgrade audit: Unity <old> → <new>

Files requiring changes:
  File                                   | API found                  | Effort
  -------------------------------------- | -------------------------- | ------
  Assets/<Game>/Scripts/Input/Player.cs  | Input.GetAxis              | Low

Breaking changes to watch:
  - <change> (<source>)

Migration order (fewest dependencies first):
  1. <system>
```

No matches → "No deprecated API usage found in the game code; the upgrade looks low-risk." The compiler is the final
judge: after the editor upgrade, run `unity-harness compile` and `unity-harness all`.

## 4. Confirm, then record
Ask: "Audit done, N files use deprecated APIs. May I record Unity <new> as the project version? This changes no
source files." On approval run `unity-harness studio set unityVersion=<new>`.

## 5. After
- Recommend: open the project in the new editor (back up or commit first), let it re-import, run
  `unity-harness all` and `unity-harness smoke`, and turn each audit row into a story or a fix.
- Compare the new version with the `unity-reference` pin again (SKILL.md step 4) and report the gap.
- If the reference turned out wrong or stale for this version, report the finding with its source; do not edit the
  reference unless asked.
