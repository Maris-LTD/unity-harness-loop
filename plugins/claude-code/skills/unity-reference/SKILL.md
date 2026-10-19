---
name: unity-reference
description: Unity 6.3 LTS reference for API changes, deprecations and best practices the model may not know. Use before using an unfamiliar Unity API, after an upgrade breaks compile, or for "Unity 6 API", "deprecated", "API này còn dùng được không".
---

# Unity engine reference

The model's training data covers Unity up to about 2022 LTS. Unity 6 renamed, moved and deprecated many APIs. These
files are the source to check before trusting memory.

## Rule
- Before using an API you are not sure exists in this project's Unity version, read the matching file below.
- Compare the pin in `references/VERSION.md` (Unity 6.3 LTS) with the project's version: `unityVersion` from
  `unity-harness studio config`, or `m_EditorVersion` in `ProjectSettings/ProjectVersion.txt`. If the project is
  older than the pin, an API marked `6.2+` / `6.3+` may not exist there; if newer, the docs may be stale.
- The version timeline in `VERSION.md` is unverified. Treat version-boundary claims as unconfirmed and prefer APIs
  that work across 6.0-6.3. When it matters, check the official docs linked in each file.
- The compiler decides: `unity-harness compile` confirms an API exists in the installed editor.
- Code samples in the references show APIs only. When copying one, drop its comments and `Debug.Log` calls and
  follow the project's rules (`unity-harness config` `rules`, CLAUDE.md / AGENTS.md).

## Which file to read

| Need | File |
|---|---|
| Pin, knowledge gap, version risk | `references/VERSION.md` |
| Code that compiled on 2022 LTS and now breaks | `references/breaking-changes.md` (HIGH/MEDIUM/LOW risk, migration checklist) |
| An old API name and its replacement | `references/deprecated-apis.md` (Input, UI, DOTS, Rendering, Physics, Asset Loading, Animation, Particles, Scripting, Platform; quick migration patterns) |
| How to structure new code in Unity 6 | `references/current-best-practices.md` (project setup, render pipeline choice, scripting, async loading) |
| Input System actions, rebinding, legacy Input | `references/modules/input.md` |
| UI Toolkit (UXML/USS) vs UGUI | `references/modules/ui.md` |
| URP/HDRP, SRP Batcher, GPU Resident Drawer | `references/modules/rendering.md` |
| Physics and solver changes | `references/modules/physics.md` |
| Animator, Timeline | `references/modules/animation.md` |
| Audio Mixer | `references/modules/audio.md` |
| NavMesh / AI Navigation package | `references/modules/navigation.md` |
| Netcode for GameObjects | `references/modules/networking.md` |
| Optional packages index (status, package ids) | `references/PLUGINS.md` |
| Addressables | `references/plugins/addressables.md` |
| Cinemachine 3.x | `references/plugins/cinemachine.md` |
| Entities / DOTS | `references/plugins/dots-entities.md` |

Read only the file the task needs; the module files run 250-400 lines each.

## Keeping it current
- `game-setup` records the project's installed version and warns about the gap with this pin.
- Do not rewrite these files from memory. If you verify a change against Unity's release notes or docs, report it
  to the user with the source; edit the reference only when they ask.
