# Implicit systems

Concepts name a fraction of the systems a game needs. For each explicit system, check what it implies and explain
each inferred system to the user in one line.

| Explicit | Implies |
|---|---|
| Inventory | item database (ScriptableObject catalog), equipment slots, weight/capacity rules, inventory UI, item save data |
| Combat | damage calculation, health, hit detection (colliders, layers, raycasts), status effects, enemy AI, combat UI (health bars, damage numbers), death/respawn |
| Open world | streaming (additive scenes or Addressables), LOD, fast travel, map/minimap, points of interest, world state persistence |
| Multiplayer | networking layer (Netcode for GameObjects or another stack), lobby/matchmaking, state sync, anti-cheat, network UI |
| Crafting | recipe database, ingredient gathering, crafting UI, success/failure rules, recipe discovery |
| Dialogue | dialogue graph, dialogue UI, choice tracking, NPC state, localization hooks |
| Progression | XP, level-up, skill tree, unlock tracking, progression UI, progression save data |
| Levels / puzzles | level data format, level loader, solvability rules, level select, star/score rating |
| Hybrid-casual meta | currency, shop, boosters, daily rewards, ads/IAP hooks, remote config |

Unity-side systems most games need, usually Foundation (the rest go to Feature or Presentation):
- Bootstrap and scene flow (boot scene, loading, scene transitions).
- Input (Input System actions or legacy input, touch vs gamepad), from `inputSystem` in `studio config`.
- Save/load and settings (PlayerPrefs for small data, files for profiles).
- Audio manager (mixer groups, SFX pooling, music).
- Object pooling for anything spawned often.
- Tuning data (ScriptableObject assets the designers edit).
- Feedback/juice (tweens, haptics, VFX) wrapping gameplay events.
- Analytics and tutorial/onboarding (Feature layer), accessibility options (Presentation layer).
