# Game brief template (workflow minimal)

The one-page brief is the whole design record at `minimal`: it replaces the concept document, the systems
decomposition and per-system GDDs. Keep it to one screen; a field that needs a second paragraph is a GDD, not a
brief. Fill every required field; the three recommended one-liners are cheap but optional. The engine is Unity
(version in `unity-harness studio config`); do not restate it. Write the brief in `language`, replacing every
bracketed hint.

```markdown
# Game Brief: [Working Title]

**One-sentence pitch:** [The game in one excited sentence. If it takes two, cut until it is one.]

## Core loop
[What the player does → what they get → why they do it again. 2-4 bullets.]
-

## Player goal & fail state
[What the player is trying to achieve (win, score, point) and how a run ends or fails. A cozy or sandbox game
still has "a session feels complete when...". Story acceptance criteria trace back to this field. 1-2 lines.]
-

## MVP — what must exist to be the game
[The short list without which this is not the game yet. Each item becomes a story. Past ~7 it is not an MVP.]
-

## Out of scope — not building this
[What is deliberately not done. Be specific: "no multiplayer", "no save system", "one level only".]
-

## Build order
[The sequence to build the MVP. Risky / core-fun item first: prove it is fun before polishing.]
1.

---
**Who it's for / what they feel:** [One line: the player and the feeling, e.g. "solo puzzle fans who want a cozy
20-minute sitting".]

**Art & audio direction:** [One line of aesthetic intent, e.g. "flat pastel vector art, lo-fi ambient".]

**Reference game:** [The shipped game this is closest to and the ~10% of it the MVP keeps, e.g. "Vampire Survivors
— the auto-attack loop on one map; no meta-progression".]
```
