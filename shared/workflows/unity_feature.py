import json
import os
import re
import subprocess
import unicodedata

# Input validation
input_args = args if isinstance(args, dict) else {"task": str(args)}
task = input_args.get("task", "")
if not task:
    raise ValueError("args.task is required, e.g. {'task': 'add a Hint booster'}")

plan_file = input_args.get("planFile")
plan_only = input_args.get("planOnly", False)
smoke_override = input_args.get("smoke")
max_fix_rounds = input_args.get("maxFixRounds", 2)
max_log_fixes = input_args.get("maxLogFixes", 2)

# Slug generation
def to_slug(text):
    norm = unicodedata.normalize('NFD', text)
    norm = ''.join(c for c in norm if unicodedata.category(c) != 'Mn')
    norm = norm.replace('đ', 'd').replace('Đ', 'D')
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', norm).strip('-').lower()
    return slug[:40] or "task"

slug = to_slug(task)

def exec_json(cmd):
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = p.stdout.strip()
    if not out:
        return {}
    try:
        return json.loads(out)
    except Exception:
        return {"raw": out, "returncode": p.returncode}

# Phase 1: Init
phase("Init")
run_data = exec_json(f"unity-harness run-log baseline --slug {slug}")
if not run_data or "runDir" not in run_data:
    raise RuntimeError(f"Could not create run baseline: {run_data}")

run_dir = run_data["runDir"]
run_id = run_data["runId"]
pre_existing_dirty = run_data.get("preExistingDirty", 0)
plan_path = os.path.join(run_dir, "plan.md").replace("\\", "/")
log(f"Run {run_id} ({pre_existing_dirty} files were already dirty before the run)")

last_tag = "start"
guard_events = []

def check_guard(tag, expect, phase_name):
    global last_tag
    since = last_tag
    res = exec_json(f'unity-harness run-log tree "{run_dir}" --tag {tag} --compare {since} --expect {expect}')
    last_tag = tag
    if not res:
        guard_events.append({"kind": "guard-unavailable", "step": tag, "since": since})
        return {"violation": False, "changed": [], "unavailable": True}
    if res.get("violation"):
        guard_events.append({"kind": "guard-violation", "step": tag, "since": since, "changed": res.get("changed", [])})
        log(f"GUARD VIOLATION at {tag}: read-only step changed {len(res.get('changed', []))} file(s)")
    if expect == "write" and not res.get("changed"):
        guard_events.append({"kind": "no-changes", "step": tag, "since": since})
    return res

PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "complexity": {"type": "string", "enum": ["low", "medium", "high"]},
        "complexityReason": {"type": "string"},
        "testAssemblies": {"type": "array", "items": {"type": "string"}},
        "needsSmoke": {"type": "boolean"},
        "smokeExpectations": {"type": "string"}
    },
    "required": ["summary", "complexity", "complexityReason", "needsSmoke"]
}

PLAN_RULES = """House rules: the rule switches printed by `unity-harness config` (maxLines, noComments, noDebugLog, compareTag), component-based SRP, [SerializeField] private fields, dependencies through the existing DI or service pattern of the project.
complexity: low = 1-2 files, local change; medium = several files in one feature; high = cross-module, new architecture, or risky runtime flow.
Never plan git commit, push, or staging-for-commit steps; the workflow never commits.
Content moved or split out of an existing file is existing code: keep its comments and Debug logs verbatim.
smokeExpectations must be checkable: target scene/screen, components that must exist, zero console errors and missing scripts."""

# Phase 2: Plan
phase("Plan")
if plan_file:
    exec_json(f'unity-harness run-log write "{run_dir}" plan.md --from "{plan_file}"')
    plan = await agent(
        f"Read the approved plan at {plan_file} and return it as the structured plan.\n\nTask: {task}\n\n{PLAN_RULES}",
        schema=PLAN_SCHEMA,
        role="Plan Loader",
        type_name="plan-loader"
    )
else:
    plan_prompt = (
        f"Plan this Unity change for this Unity project.\n\nTask: {task}\n\n"
        f"Explore the relevant code (start from rules.includePaths printed by `unity-harness config`). Do NOT modify any project file: this step is read-only and the working tree is fingerprinted.\n"
        f"Produce a Vietnamese markdown plan with sections Mục tiêu, Độ phức tạp (+ lý do), File (path | create/modify/move/delete | trách nhiệm), Các bước, Test, Smoke (điều kiện kiểm được), Rủi ro.\n"
        f"Save it only with this command: unity-harness run-log write {run_dir} plan.md --from <draft_file>\n\n"
        f"plan.md is the single source for files, steps and risks: do not repeat them in your structured result. summary is at most 2 sentences.\n"
        f"Test assemblies are listed under testAssemblies in `unity-harness config`. needsSmoke = true if scenes, prefabs, UI or startup flow change.\n{PLAN_RULES}"
    )
    plan = await agent(plan_prompt, schema=PLAN_SCHEMA, role="Architect Planner")

if not plan:
    raise RuntimeError("Planning agent returned nothing")

plan_guard = check_guard("after-plan", "readonly", "Plan")
log(f"Plan: complexity={plan['complexity']}, smoke={plan.get('needsSmoke')}")

if plan_only and not plan_guard.get("violation"):
    result = {
        "mode": "plan-only",
        "runDir": run_dir,
        "planFile": plan_path,
        "complexity": plan["complexity"],
        "summary": plan["summary"],
        "next": f"Review/edit {plan_path}, then run unity-feature with {{task, planFile: '{plan_path}'}}"
    }
else:
    # Phase 3: Implement
    def select_implementer(task_text, plan_data):
        forced = input_args.get("agent")
        if forced:
            return forced
        txt = (task_text + " " + plan_data.get("summary", "")).lower()
        if any(w in txt for w in ["ui", "hud", "menu", "panel", "popup", "ugui", "toolkit", "canvas"]):
            return "ui-programmer"
        if any(w in txt for w in ["ai", "npc", "enemy", "navmesh", "pathfinding", "behaviour", "patrol"]):
            return "ai-programmer"
        if any(w in txt for w in ["bootstrap", "pooling", "save", "load", "foundation", "lifecycle"]):
            return "engine-programmer"
        return "gameplay-programmer"

    implementer = select_implementer(task, plan)
    impl = {"changedFiles": [], "compiled": False, "notes": "not run"}
    stop_reason = "plan step modified the working tree" if plan_guard.get("violation") else None

    IMPLEMENT_SCHEMA = {
        "type": "object",
        "properties": {
            "changedFiles": {"type": "array", "items": {"type": "string"}},
            "compiled": {"type": "boolean"},
            "notes": {"type": "string"}
        },
        "required": ["changedFiles", "compiled"]
    }

    if not stop_reason:
        phase("Implement")
        impl_prompt = (
            f"Implement the plan in {plan_path} in the Unity project. Read it first: it lists files, steps, tests and risks.\n\n"
            f"Task: {task}\nSummary: {plan['summary']}\nComplexity: {plan['complexity']}\n\n"
            f"Edit code with your file tools. Never commit or push. Keep comments and Debug logs of moved content verbatim.\n"
            f"When logic is testable, add EditMode tests in an existing test assembly.\n"
            f"When done, run `unity-harness compile` and fix errors until it passes. Do not run tests or smoke yourself. Report any deviation in notes."
        )
        tier = "flash" if plan["complexity"] == "low" else "inherit"
        impl = await agent(impl_prompt, schema=IMPLEMENT_SCHEMA, role=f"Implementer ({plan['complexity']})", model=tier, type_name=implementer) or impl
        check_guard("after-implement", "write", "Implement")
        log(f"Implemented {len(impl.get('changedFiles', []))} files, compiled={impl.get('compiled')}")

    # Phase 4: Verify
    verify_mode = "full" if (smoke_override if smoke_override is not None else plan.get("needsSmoke")) else "all"
    assemblies = input_args.get("assemblies") or plan.get("testAssemblies") or []
    if isinstance(assemblies, str):
        assemblies = [a.strip() for a in assemblies.split(",") if a.strip()]
    assemblies = [a for a in assemblies if a]
    assemblies_flag = f" --assemblies {','.join(assemblies)}" if assemblies else ""
    verify_flags = f'--since-run "{run_dir}"{assemblies_flag}'

    VERIFY_SCHEMA = {
        "type": "object",
        "properties": {
            "verdict": {"type": "string", "enum": ["pass", "fail", "editor-unavailable"]},
            "checks": {"type": "string"},
            "issues": {"type": "array", "items": {"type": "object"}},
            "capture": {"type": ["string", "null"]},
            "unityNoise": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["verdict", "checks", "issues", "unityNoise"]
    }

    REVIEW_SCHEMA = {
        "type": "object",
        "properties": {
            "findings": {"type": "array", "items": {"type": "object"}}
        },
        "required": ["findings"]
    }

    FIX_SCHEMA = {
        "type": "object",
        "properties": {
            "compiled": {"type": "boolean"},
            "notes": {"type": "string"}
        },
        "required": ["compiled"]
    }

    verify_prompt = (
        f"Verify the current working tree. Run mode `{verify_mode}` with `{verify_flags}`.\n"
        f"Smoke expectations from the plan: {plan.get('smokeExpectations', 'none stated')}\n"
        f"You are read-only: report failures as verdict fail, never fix them."
    )
    review_prompt = f"Review the current C# diff for this task: {task}"

    def get_blocking(v, r):
        issues = []
        if v and v.get("verdict") == "fail":
            for i in v.get("issues", []):
                issues.append({"source": "harness", **i})
        for f in (r.get("findings", []) if r else []):
            if f.get("severity") != "minor":
                issues.append({"source": "review", "file": f.get("file"), "line": f.get("line"), "message": f.get("problem"), "fix": f.get("fix")})
        return issues

    verify = None
    review = None
    blocking = []
    round_num = 0

    if not stop_reason:
        phase("Verify")
        verify_tasks = [
            {"prompt": verify_prompt, "schema": VERIFY_SCHEMA, "role": "Harness Verifier", "type_name": "unity-verifier"},
            {"prompt": review_prompt, "schema": REVIEW_SCHEMA, "role": "Code Reviewer", "type_name": "unity-reviewer"}
        ]
        verify, review = await parallel(verify_tasks, lambda t: agent(t["prompt"], schema=t["schema"], role=t["role"], type_name=t["type_name"]))
        blocking = get_blocking(verify, review)
        vg = check_guard("after-verify-0", "readonly", "Verify")
        if vg.get("violation"):
            stop_reason = "verify/review modified the working tree"

    # Phase 5: Fix Loop
    if not stop_reason:
        while blocking and round_num < max_fix_rounds and not (verify and verify.get("verdict") == "editor-unavailable"):
            round_num += 1
            phase(f"Fix Round {round_num}")
            log(f"Fix round {round_num}/{max_fix_rounds}: {len(blocking)} blocking issues")
            fix_prompt = (
                f"Fix these blocking issues in the Unity project, nothing else.\n\nTask: {task}\n\n"
                f"Issues:\n{json.dumps(blocking, indent=2)}\n\n"
                f"Never delete existing comments or Debug logs just to satisfy rule check. Never commit. Make `unity-harness compile` pass."
            )
            await agent(fix_prompt, schema=FIX_SCHEMA, role=f"Fixer #{round_num}", type_name=implementer)
            check_guard(f"after-fix-{round_num}", "write", "Fix")

            # Re-verify
            verify_tasks = [
                {"prompt": verify_prompt, "schema": VERIFY_SCHEMA, "role": f"Harness Verifier #{round_num}", "type_name": "unity-verifier"},
                {"prompt": review_prompt, "schema": REVIEW_SCHEMA, "role": f"Code Reviewer #{round_num}", "type_name": "unity-reviewer"}
            ]
            verify, review = await parallel(verify_tasks, lambda t: agent(t["prompt"], schema=t["schema"], role=t["role"], type_name=t["type_name"]))
            blocking = get_blocking(verify, review)
            vg = check_guard(f"after-verify-{round_num}", "readonly", "Verify")
            if vg.get("violation"):
                stop_reason = f"verify round {round_num} modified the working tree"
                break

    verdict = "guard-violation" if any(e.get("kind") == "guard-violation" for e in guard_events) else (
        "needs-attention" if blocking else ("pass" if verify and verify.get("verdict") == "pass" else "unverified")
    )

    # Phase 6: Log & Audit
    phase("Log")
    facts = {
        "runId": run_id,
        "task": task,
        "verdict": verdict,
        "plan": {
            "summary": plan.get("summary"),
            "complexity": plan.get("complexity"),
            "complexityReason": plan.get("complexityReason"),
            "smokeExpectations": plan.get("smokeExpectations")
        },
        "implementer": implementer,
        "implementNotes": impl.get("notes"),
        "filesClaimedByImplementer": impl.get("changedFiles", []),
        "verification": verify,
        "review": review.get("findings", []) if review else [],
        "fixRounds": round_num,
        "remainingIssues": blocking,
        "stopReason": stop_reason,
        "guardEvents": guard_events
    }
    header = f"runDir: {run_dir}\nrunId: {run_id}\ntask: {task}\nverdict: {verdict}"

    LOG_WRITE_SCHEMA = {
        "type": "object",
        "properties": {
            "reportWritten": {"type": "boolean"},
            "notes": {"type": "string"}
        },
        "required": ["reportWritten"]
    }

    await agent(
        f"Write the run report.\n\n{header}\n\nFacts:\n{json.dumps(facts)}",
        schema=LOG_WRITE_SCHEMA,
        role="Run Log Writer",
        type_name="run-log-writer"
    )

    AUDIT_SCHEMA = {
        "type": "object",
        "properties": {
            "accurate": {"type": "boolean"},
            "discrepancies": {"type": "array", "items": {"type": "object"}}
        },
        "required": ["accurate", "discrepancies"]
    }

    audit_res = await agent(
        f"Audit the run report.\n\n{header}",
        schema=AUDIT_SCHEMA,
        role="Run Log Auditor",
        type_name="run-log-auditor"
    )

    log_fixes = 0
    while audit_res and not audit_res.get("accurate") and log_fixes < max_log_fixes:
        log_fixes += 1
        discrepancies = audit_res.get("discrepancies", [])
        log(f"Log audit found {len(discrepancies)} discrepancies, fix {log_fixes}/{max_log_fixes}")
        await agent(
            f"Fix these audit discrepancies in the report notes, nothing else.\n\n{header}\n\nDiscrepancies:\n{json.dumps(discrepancies, indent=2)}",
            schema=LOG_WRITE_SCHEMA,
            role=f"Run Log Writer Fix #{log_fixes}",
            type_name="run-log-writer"
        )
        audit_res = await agent(
            f"Audit the run report.\n\n{header}",
            schema=AUDIT_SCHEMA,
            role=f"Run Log Auditor #{log_fixes + 1}",
            type_name="run-log-auditor"
        )

    audit_state = "accurate" if audit_res and audit_res.get("accurate") else "inaccurate"
    exec_json(f'unity-harness run-log finalize "{run_dir}" --verdict {verdict} --audit {audit_state}')

    result = {
        "task": task,
        "runDir": run_dir,
        "verdict": verdict,
        "stopReason": stop_reason,
        "plan": plan.get("summary"),
        "complexity": plan.get("complexity"),
        "report": f"{run_dir}/report.md",
        "auditState": audit_state,
        "fixRounds": round_num,
        "remainingIssues": blocking,
        "guardEvents": guard_events,
        "capture": verify.get("capture") if verify else None,
        "unityNoise": verify.get("unityNoise", []) if verify else []
    }

result
