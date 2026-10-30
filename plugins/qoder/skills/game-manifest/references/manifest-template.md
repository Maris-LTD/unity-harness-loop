# Control manifest format

Path: `paths.controlManifest`. The `> **Manifest Version**:` line is read by game-tasks (stories embed
it) and game-readiness (compares a story's version with it), so keep the exact form. It always equals
`Last Updated`.

```markdown
# Control Manifest

> **Engine**: Unity <unityVersion> (<renderPipeline>, input: <inputSystem>)
> **Last Updated**: <YYYY-MM-DD>
> **Manifest Version**: <YYYY-MM-DD>
> **ADRs Covered**: <ADR-NNNN, ...>
> **ADRs Excluded**: <ADR-NNNN (Proposed), ... | None>
> **Status**: Active - regenerate with game-manifest update when ADRs change

Quick reference for programmers, extracted from Accepted ADRs, the harness house rules, studio budgets, project
conventions and unity-reference. The referenced ADR explains each rule.

---

## Foundation Layer Rules
*Applies to: bootstrap and composition root, scene flow, save/load, event bus, pooling, config loading*

### Required Patterns
- **<rule>** - source: ADR-NNNN

### Forbidden Approaches
- **Never <anti-pattern>** - <reason> - source: ADR-NNNN

### Performance Guardrails
- **<system>**: max <n> ms/frame - source: ADR-NNNN

---

## Core Layer Rules
*Applies to: core loop, player systems, physics and collision*

### Required Patterns
### Forbidden Approaches
### Performance Guardrails

---

## Feature Layer Rules
*Applies to: secondary systems, AI, meta progression*

### Required Patterns
### Forbidden Approaches
### Performance Guardrails

---

## Presentation Layer Rules
*Applies to: uGUI / UI Toolkit, rendering, audio, VFX, shaders, animation*

### Required Patterns
### Forbidden Approaches
### Performance Guardrails

---

## Global Rules (All Layers)

### House Rules
| Rule | Value | Source |
|---|---|---|
| Max file length | <maxLines> lines | .unity-harness/config.json rules.maxLines |
| No new comments | on | rules.noComments |
| No new Debug.Log* | on | rules.noDebugLog |
| CompareTag instead of .tag == | on | rules.compareTag |

### Code Structure
- Logic in plain C# classes that EditMode tests construct; MonoBehaviours stay thin - source: studio protocol
- Tuning values in ScriptableObject (or the project's config asset), never literals in logic - source: studio protocol
- Dependencies injected through the composition root, no new singletons - source: studio protocol / ADR-NNNN

### Naming Conventions
| Element | Convention | Example | Source |
|---|---|---|---|
| Classes / types | | | CLAUDE.md / observed in <path> |
| Private fields | | | |
| Events | | | |
| Files / folders / asmdefs | | | |
| Constants | | | |

### Performance Budgets
| Target | Value | Source |
|---|---|---|
| Frame rate | <targetFps> fps (<1000/targetFps> ms frame) | studio config targetFps |
| Draw calls | <drawCallBudget> | studio config drawCallBudget |
| Memory ceiling | <memoryBudgetMb> MB | studio config memoryBudgetMb |

### Approved Packages
- <com.unity.package> - approved for <purpose> - source: ADR-NNNN

### Forbidden APIs (Unity <unityVersion>)
- `<API>` - deprecated since <version> / changed after the model's cutoff - use `<replacement>` - source:
  unity-reference references/deprecated-apis.md

### Cross-Cutting Constraints
- <constraint that applies everywhere> - source: <ADR, house rule, budget or reference file>
```

Omit a table row whose value is not set (a budget of 0, a house rule switched off) rather than writing a placeholder.
A layer with no rules keeps its heading and says "No rules from Accepted ADRs yet."
