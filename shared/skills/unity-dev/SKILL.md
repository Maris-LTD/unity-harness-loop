---
name: unity-dev
description: Plan, implement, verify (Unity harness + rule review), auto-fix and log a Unity feature in a 6-phase engineering loop. Use for "unity-dev", "làm feature", "phát triển tính năng", "implement feature", "tính năng mới".
platforms:
  - antigravity
  - qoder
---

# Unity Feature Workflow

Plan, implement, verify (Unity harness + rule review), auto-fix and log a Unity feature or refactor end-to-end.
Routes each step to a fitting model, enforces read-only guards on verification, and logs diffs independently.

{{#antigravity}}
## Running with `run_workflow` (Automated Runner)

When the `run_workflow` tool is available, execute the dynamic runner script:
```python
run_workflow(
    ScriptPath="workflows/unity_dev.py",
    Args={"task": "<task_description>", "smoke": True},
    Description="Unity feature loop: <task_description>"
)
```
Script location is either inside the repo (`workflows/unity_dev.py` or `plugins/antigravity/workflows/unity_dev.py`) or in the installed plugin directory (`~/.gemini/config/plugins/unity-harness/workflows/unity_dev.py`).
{{/antigravity}}
{{#qoder}}
## Running in Qoder

Qoder plugins do not ship an automated workflow runner in this version. Drive the 6-phase loop interactively below;
it uses the same `unity-harness` commands and the plugin's Qoder subagents.
{{/qoder}}

---

## Interactive Execution (Step-by-Step)

If executing step-by-step or driving the loop directly:

```
[Phase 1: Init]      --> Git baseline + working-tree fingerprint
        ↓
[Phase 2: Plan]      --> plan.md + complexity estimation (read-only guarded)
        ↓
[Phase 3: Implement] --> Model routed from complexity, writes code & EditMode tests
        ↓
[Phase 4: Verify]    --> Concurrent unity-verifier (harness) + unity-reviewer (rules)
        ↓
[Phase 5: Fix]       --> Auto-fix loop for blocking issues (up to 2 rounds)
        ↓
[Phase 6: Log]       --> report.md generation & independent audit
```

### Phase 1: Init

1. Create a run baseline with the CLI:
   `unity-harness run-log baseline --slug <slug>`
   Extract `runId`, `runDir`, and `preExistingDirty` count from the JSON output.
2. Initialize working tree fingerprint:
   `unity-harness run-log tree <runDir> --tag start --expect readonly`
3. The plan will live at `<runDir>/plan.md`.

---

### Phase 2: Plan

If a pre-approved `planFile` was provided, copy it:
`unity-harness run-log write <runDir> plan.md --from "<planFile>"`
Then invoke {{spawn plan-loader}} to extract the structured plan.

Otherwise, generate a new plan:
1. Examine project configuration: `unity-harness config` to read `testAssemblies`, `rules`, and `smoke`.
2. Produce a plan with the following sections in Vietnamese:
   - **Mục tiêu**: Summary of the task (at most 2 sentences).
   - **Độ phức tạp**: `low` (1–2 files, local change), `medium` (several files in one feature), or `high` (cross-module, new architecture, risky flow). Include rationale.
   - **File**: Table of `path | action (create/modify/move/delete) | responsibility`.
   - **Các bước**: Concrete implementation steps.
   - **Test**: EditMode tests in existing test assemblies.
   - **Smoke**: Checkable smoke conditions (target screen, components present, no console errors).
   - **Rủi ro**: Potential edge cases and mitigations.
3. Save the plan:
   `unity-harness run-log write <runDir> plan.md --from <draft>`
4. Guard check:
   `unity-harness run-log tree <runDir> --tag after-plan --compare start --expect readonly`
   If the plan step modified any file, halt immediately.

If `planOnly` mode was requested, stop here and present `<runDir>/plan.md` to the user for review.

---

### Phase 3: Implement

1. Route implementation based on complexity and story type:
   - **Foundation / Architecture**: {{agent engine-programmer}}
   - **UI / HUD / Menus**: {{agent ui-programmer}}
   - **Gameplay / Mechanics / Physics**: {{agent gameplay-programmer}}
   - **AI / Navigation**: {{agent ai-programmer}}
{{#qoder}}
   - Low complexity: use the `lite` model tier. Medium/High complexity: `inherit`.
{{/qoder}}
{{^qoder}}
   - Low complexity: lighter model tier (`flash`). Medium/High complexity: `pro` / `inherit`.
{{/qoder}}
2. Spawn the implementer agent with the plan:
   - Read `<runDir>/plan.md`.
   - Edit code using standard file editing tools. Never commit or push.
   - Keep comments and Debug logs of moved content verbatim.
   - Add EditMode tests for testable logic.
   - Verify compilation passes with `unity-harness compile` before finishing. Exit 2 means Editor is not ready: stop and ask user.
3. Guard check:
   `unity-harness run-log tree <runDir> --tag after-implement --compare after-plan --expect write`

---

### Phase 4: Verify

1. Determine verification mode:
   - `full` if UI, scene, prefab, or startup flow changed (includes Play mode smoke test).
   - `all` otherwise (rules + compile + EditMode tests).
2. Concurrently execute verification:
   - **Harness check**: {{spawn unity-verifier}} runs `unity-harness <mode> --json --since-run <runDir>`.
   - **Rule review**: {{spawn unity-reviewer}} reviews C# diff against project rules (SRP, max lines, SerializeField, no LINQ/allocations in Update, CompareTag).
3. Guard check:
   `unity-harness run-log tree <runDir> --tag after-verify-0 --compare after-implement --expect readonly`
   If verify modified the working tree, mark as guard violation.
4. Collect blocking issues:
   - Harness failures (compile errors, test failures, rule check blocks).
   - Reviewer blocker / major findings.

---

### Phase 5: Auto-Fix Loop (Up to 2 Rounds)

While blocking issues remain and fix rounds < 2:
1. Provide the list of blocking issues to the implementer agent.
2. The implementer fixes the issues and confirms `unity-harness compile` passes.
3. Guard check:
   `unity-harness run-log tree <runDir> --tag after-fix-<round> --compare after-verify-<round-1> --expect write`
4. Re-verify with {{spawn unity-verifier}} and re-review changed files with {{spawn unity-reviewer}}.

---

### Phase 6: Log & Audit

1. **Write Run Report**:
   Spawn {{spawn run-log-writer}} with `runDir`, `runId`, `verdict`, and facts. It inspects `<runDir>/changes.diff` and writes judgment notes, then renders `<runDir>/report.md`.
2. **Audit Report** (only when the verdict is not `pass`, the plan complexity is `high`, or `audit: true` was passed):
   Spawn {{spawn run-log-auditor}} to audit `<runDir>/report.md` against diff and facts.
   If discrepancies are found, {{spawn run-log-writer}} fixes them (up to 2 fix rounds).
3. **Finalize**:
   Run `unity-harness run-log finalize "<runDir>" --verdict <verdict> --audit <auditState>`; `auditState` is `not-audited` when step 2 was skipped.
4. Present the final outcome, report link, and summary to the user.
