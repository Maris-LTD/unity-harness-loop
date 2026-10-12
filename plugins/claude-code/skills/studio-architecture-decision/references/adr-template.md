# ADR file format

Path: `<paths.architectureDir>/adr-NNNN-<slug>.md`. The header lines are exact: `unity-harness studio status`
counts ADRs by the `> **Status**:` line, and story-readiness, dev-story and the control manifest read it. Allowed
status values: `Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-NNNN`. New ADRs are always `Proposed`.

```markdown
# ADR-NNNN: <Title>

> **Status**: Proposed
> **Date**: <YYYY-MM-DD, when the decision was written; never changed on acceptance>
> **Last Verified**: <YYYY-MM-DD, last time it was confirmed accurate against the Unity version and the design>
> **Decision Makers**: <user, agents consulted>

## Summary
<Two sentences: the system, the problem, the chosen approach. Skills scanning many ADRs read only this.>

## Engine Compatibility

| Field | Value |
|---|---|
| **Engine** | Unity <unityVersion> (<renderPipeline>) |
| **Packages** | <com.unity.* packages and versions this decision relies on, or "None"> |
| **Domain** | <Core / Physics / Rendering / UI / Audio / Navigation / Animation / Networking / Input / Scripting / Data> |
| **Knowledge Risk** | <LOW / MEDIUM / HIGH from unity-engine-reference VERSION.md> |
| **References Consulted** | <unity-engine-reference files read, e.g. references/modules/physics.md> |
| **Post-Cutoff APIs Used** | <APIs newer than the model's training this decision depends on, or "None"> |
| **Verification Required** | <behaviour to confirm in the Editor or an EditMode/PlayMode test, or "None"> |

## ADR Dependencies

| Field | Value |
|---|---|
| **Depends On** | <ADR-NNNN (must be Accepted first), or "None"> |
| **Enables** | <ADR-NNNN, or "None"> |
| **Blocks** | <epic or story that cannot start until this is Accepted, or "None"> |
| **Ordering Note** | <any other sequencing constraint, or "None"> |

## Context

### Problem Statement
<What problem, and why decide now.>

### Constraints
- <technical, platform, budget, package, team constraints>

### Requirements
- <must support / must stay within / must integrate with>

## Decision
<The decision in enough detail to implement it.>

### Architecture Diagram
<ASCII diagram: modules (asmdefs), scenes, data and event flow.>

### Key Interfaces
<C# signatures this decision creates, without comments or logging.>

### Implementation Guidelines
<Rules for the programmer, stated as "must" / "must never" so the control manifest can extract them, e.g.
"Gameplay modules must receive services through the composition root; they must never call FindObjectOfType".>

## Alternatives Considered

### Alternative 1: <name>
- **Description**: <how it would work>
- **Pros**: <...>
- **Cons**: <...>
- **Rejection Reason**: <why not>

### Alternative 2: <name>
- (same fields)

## Consequences

### Positive
- <...>

### Negative
- <trade-offs accepted>

## Risks
- <risk> - mitigation: <...>

## GDD Requirements Addressed

| GDD System | Requirement (TR-ID if any) | How This ADR Addresses It |
|---|---|---|
| <system>.md | <rule, formula or constraint> | <...> |

## Performance Implications
- **CPU**: <per-frame cost, Update vs event-driven, jobs/Burst>
- **Memory**: <allocations, GC pressure, asset memory>
- **Load Time**: <scene / Addressables loading>
- **Draw calls / GPU**: <if rendering is involved>
- **Network**: <if applicable>

## Migration Plan
<How existing code under Assets/<Game>/ moves to this decision, or "New code only".>

## Validation Criteria
<How we will know it was right: EditMode tests, profiler numbers against the budgets, a smoke check.>

## Related
- <related ADRs (supersedes / depends on / conflicts with), GDDs, the master architecture section>
```

## Older ADRs
An ADR imported from elsewhere may carry `## Status`, `## Date` or `## Last Verified` as sections instead of header
lines. Retrofit mode adds the header lines with the same values and leaves the old sections in place.
