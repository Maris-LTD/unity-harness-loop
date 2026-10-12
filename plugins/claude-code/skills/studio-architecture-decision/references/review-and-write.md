# Steps 5-7: Draft, review, write, register

## Step 5: Draft
Fill `references/adr-template.md` from the confirmed assumptions and design answers, at the depth `docsDensity`
asks for. `> **Status**: Proposed`, `> **Date**:` and `> **Last Verified**:` today.

## Step 5a: Unity specialist validation (every review mode)
Spawn unity-specialist with the `Agent` tool with `subagent_type: "unity-harness:unity-specialist"`. Pass the Engine Compatibility table, the Decision, the Key
Interfaces, `unityVersion` and `renderPipeline`, and the unity-engine-reference files you read. Ask it to:
1. confirm the approach is idiomatic for that Unity version and the packages in use;
2. flag APIs or patterns that are deprecated or changed after the model's training cutoff;
3. name Unity-specific risks the draft misses;
4. say which unity-*-specialist (ui, shader, addressables, dots) should look at it, if any. If it names one and the
   decision is in that area, spawn that specialist the same way with the same inputs.

Blocking issue (wrong API, deprecated approach, version mismatch) → revise Decision and Engine Compatibility and
confirm the change with the user. Minor notes → add them under Risks.

## Step 5b: TD-ADR (and TD-ENGINE-RISK)
Per the studio protocol, only at `reviewMode: full`; otherwise note `TD-ADR skipped (<mode>)`.
- Spawn technical-director with the `Agent` tool with `subagent_type: "unity-harness:technical-director"`, gate TD-ADR. Context: the draft (or its path),
  `unityVersion` and the domain's risk level, related ADRs in the same domain.
- When `Post-Cutoff APIs Used` is not "None", ask in the same spawn for gate TD-ENGINE-RISK too, passing each API,
  `unityVersion` and the matching excerpt from unity-engine-reference.
- Handle verdicts per the protocol. On CONCERNS show them verbatim and ask: revise flagged items / accept and proceed
  / discuss; revise Decision or Alternatives only on "revise". On REJECT revise before going on. The revised draft
  still goes through the write ask below. NOT ASSESSED is not approval: name the missing input.

## Step 5c: GDD sync check
Compare the GDDs named in `GDD Requirements Addressed` with the names the ADR's Key Interfaces and Decision use
(events, methods, data types). Always report one of three outcomes:
- Found → show before the write ask:

```
! GDD SYNC REQUIRED
<gdd>.md uses names this ADR renamed:
  <old> -> <new>
Update the GDD with or before this ADR, or programmers reading the GDD will build the wrong interface.
```

- None found → `GDD sync: checked <N> GDD(s), no naming differences.`
- Could not check (no requirements table, no GDDs named, or a named GDD missing) →
  `GDD sync: NOT ASSESSED - <reason and files>`. An ADR naming no GDDs is not "consistent".

## Step 6: Write
Ask with `AskUserQuestion`:
- With sync issues: write the ADR and update the GDD in the same pass / write the ADR only, I will fix the GDD /
  not yet.
- Without: write `<paths.architectureDir>/adr-NNNN-<slug>.md` / not yet.
Create the folder if needed. "Write and update" also renames the terms in the listed GDDs, nothing else.

## Step 7: Architecture registry
Scan the written ADR for stances that constrain other systems:
- shared state it owns (state read or written by more than one system), with its interface;
- interface contracts it defines (events, methods, ScriptableObject channels);
- performance budgets it claims (ms per frame, memory);
- explicit API or package choices;
- patterns it bans (rejected alternatives, "must never").
Internal details that affect only this ADR are not registered.

Show the candidates, marking NEW vs EXISTING (only `referenced_by` grows):

```
Registry candidates from ADR-NNNN:
  NEW state ownership:     player_stamina -> stamina (interface: IStamina.Current, read-only)
  NEW interface contract:  StaminaDepleted event
  NEW performance budget:  stamina: 0.2 ms/frame
  NEW forbidden pattern:   polling stamina every frame from UI (subscribe to the event)
  EXISTING:                player_health -> health (add this ADR to referenced_by)
```

Writing to `paths.architectureRegistry` always needs explicit approval, in every mode: ask "May I update the
architecture registry with these <N> stances?" (update / review candidates first / skip). On yes:
- File missing → create it with the skeleton below.
- Re-read the file before each edit; append after the last entry of the right section, never assume `[]`.
- Never edit or delete an existing entry's content. A changed stance: set the old entry's `status:` to
  `superseded_by: ADR-NNNN`, then add the new entry.

```yaml
version: 1
last_updated: "<date>"
state_ownership: []
interfaces: []
performance_budgets: []
api_decisions: []
forbidden_patterns: []
```

Entry shapes:

```yaml
state_ownership:
  - state: player_health
    status: active
    owner_system: health
    adr: <paths.architectureDir>/adr-0001-health.md
    interface: "IHealth.Current (read-only int, 0..Max)"
    write_access: owner-only
    referenced_by: [<adr path>]
    added: <date>
interfaces:
  - contract: damage_delivery
    status: active
    pattern: csharp-event
    signature: "event Action<DamageInfo> DamageDealt"
    adr: <adr path>
    referenced_by: []
    added: <date>
performance_budgets:
  - system: combat
    budget: "1.0 ms/frame"
    adr: <adr path>
    added: <date>
api_decisions:
  - api: Addressables
    decision: "all level content loads through Addressables groups"
    adr: <adr path>
    added: <date>
forbidden_patterns:
  - pattern: find_object_lookup
    rule: "never use FindObjectOfType / GameObject.Find in gameplay code"
    adr: <adr path>
    added: <date>
```
