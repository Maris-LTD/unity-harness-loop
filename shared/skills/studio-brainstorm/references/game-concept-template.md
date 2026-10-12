# Game concept template (workflow standard / full)

Fill every section from the brainstorm conversation, in `language`, replacing every bracketed hint. Depth per
`docsDensity`. Record gate outcomes as header lines under the status line.

```markdown
# Game Concept: [Working Title]

*Created: [Date]*
*Status: [Draft / Under Review / Approved]*

## Elevator Pitch
> [1-2 sentences: "It's a [genre] where you [core action] in a [setting] to [goal]." Someone new must understand
> what they would be doing within 10 seconds.]

## Core Identity
| Aspect | Detail |
|---|---|
| **Genre** | [Primary genre + subgenres] |
| **Platform** | [From studio config targetPlatforms, or the Phase 6 answer] |
| **Target Audience** | [See Target Player Profile] |
| **Player Count** | [Single-player / Co-op / Multiplayer] |
| **Session Length** | [10 min / 30 min / 1 hr / 2+ hr] |
| **Monetization** | [Premium / F2P / Ads / none yet] |
| **Estimated Scope** | [Must match the full-vision row of Scope Tiers, e.g. "Medium (4-6 months, solo)"] |
| **Comparable Titles** | [2-3 games in the same space] |

## Core Fantasy
[The emotional promise: what the player gets here that they cannot get anywhere else. Not a feature list.]

## Unique Hook
[The single most important differentiator. Passes the "like X, and also Y" test, explainable in one sentence,
connected to the core fantasy, affects gameplay rather than only aesthetics.]

## Player Experience Analysis (MDA)
### Target Aesthetics
| Aesthetic | Priority (1-8 or N/A) | How we deliver it |
|---|---|---|
| Sensation | | |
| Fantasy | | |
| Narrative | | |
| Challenge | | |
| Fellowship | | |
| Discovery | | |
| Expression | | |
| Submission | | |

### Key Dynamics
[Behaviours we want to emerge without being told, e.g. "players experiment with ability combinations".]

### Core Mechanics
1. [The 3-5 systems that generate the dynamics above]

## Player Motivation Profile
| Need | How this game satisfies it | Strength (Core / Supporting / Minimal) |
|---|---|---|
| Autonomy | | |
| Competence | | |
| Relatedness | | |

### Player Type Appeal
- [ ] Achievers — how: [...]
- [ ] Explorers — how: [...]
- [ ] Socializers — how: [...]
- [ ] Competitors — how: [...]

### Flow State Design
- **Onboarding curve**: [How the first 10 minutes teach the player]
- **Difficulty scaling**: [How challenge grows with skill]
- **Feedback clarity**: [How the player knows they are improving]
- **Recovery from failure**: [How fast they retry; punishing or educational]

## Core Loop
### Moment-to-Moment (30 seconds)
[The repeated action; must be satisfying on its own.]
### Short-Term (5-15 minutes)
[The cycle that structures it; where "one more run" lives.]
### Session-Level (30-120 minutes)
[A full session, its natural stopping point and the reason to return.]
### Long-Term Progression
[How the player grows over days or weeks and what they work toward.]
### Retention Hooks
- **Curiosity**: [...]
- **Investment**: [...]
- **Social**: [...]
- **Mastery**: [...]

## Game Pillars
### Pillar 1: [Name]
[One-sentence definition.]
*Design test*: [If we debate X vs Y, this pillar picks __.]
[Repeat for 3-5 pillars.]

### Anti-Pillars
- **NOT [thing]**: [Why it is excluded and what it would compromise]

## Visual Identity Anchor
- **Direction**: [Chosen direction name]
- **Visual rule**: [One line that guides every visual decision]
- **Supporting principles**: [2-3, each with a design test]
- **Color philosophy**: [Palette direction and what colours mean in this world]

## Inspiration and References
| Reference | What we take | What we do differently | Why it matters |
|---|---|---|---|

**Non-game inspirations**: [Films, books, music, art, real experiences.]

## Target Player Profile
| Attribute | Detail |
|---|---|
| Age range | |
| Gaming experience | [Casual / Mid-core / Hardcore] |
| Time availability | |
| Platform preference | |
| Current games they play | |
| What they look for | |
| What would turn them away | |

## Technical Considerations
| Consideration | Assessment |
|---|---|
| **Engine** | Unity [unityVersion from studio config, or "set by studio-setup"] |
| **Render pipeline** | [URP / HDRP / Built-in, or "set by studio-setup"] |
| **Performance budget** | [targetFps, draw calls, memory from studio config, or the target to set] |
| **Key technical challenges** | [What is technically hard] |
| **Art style** | [2D / 2.5D / 3D stylized / 3D realistic] |
| **Art pipeline complexity** | [Low (store assets + edits) / Medium (custom 2D) / High (custom 3D)] |
| **Audio needs** | [Minimal / Moderate / Music-heavy / Adaptive] |
| **Networking** | [None / P2P / Client-Server] |
| **Content volume** | [X levels, Y items, Z hours] |
| **Procedural systems** | [Any, and their scope] |

## Risks and Open Questions
### Design Risks
- [...]
### Technical Risks
- [... include the TD-FEASIBILITY result, or "feasibility not assessed"]
### Market Risks
- [...]
### Scope Risks
- [...]
### Open Questions
- [Question, and the prototype or research that answers it]

## MVP Definition
**Core hypothesis**: [The one statement the MVP tests]

**Required for MVP**:
1. [Feature that directly tests the hypothesis]

**Explicitly NOT in MVP**:
- [...]

### Scope Tiers
| Tier | Content | Features | Timeline |
|---|---|---|---|
| MVP | | Core loop only | |
| Vertical Slice | One complete area | Core + progression | |
| Alpha | All areas, placeholder | All features, rough | |
| Full Vision | Complete content | All features, polished | |

## Next Steps
- [ ] Configure the Unity project (`studio-setup`)
- [ ] Prototype the core mechanic if it is unproven
- [ ] Write per-system GDDs in the GDD folder
- [ ] Create epics (`studio-create-epics`), then stories (`studio-create-stories`)
- [ ] Plan the first sprint (`studio-sprint-plan`)
```
