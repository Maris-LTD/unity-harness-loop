---
name: audit-agent-plugin
description: Audit an AI agent plugin (Antigravity & Claude Code) for IPC contract fidelity, permission security, lifecycle edge cases, type robustness, and semantic skill portability. Use for "audit plugin", "review plugin", "kiểm tra plugin", "chấm điểm plugin".
---

# Audit Agent Plugin

A rigorous runbook for auditing AI agent plugins (Antigravity and Claude Code).
Prevents superficial reviews and false-positive assessments by enforcing runtime IPC verification, permission safety checks, lifecycle termination audits, and semantic code scans.

## 6-Point Audit Checklist

### 1. Payload Reality & IPC Fidelity Check
- [ ] Inspect the actual IPC payloads received on `stdin` for every hook (`SessionStart`, `PreToolUse`, `PreInvocation`, `Stop`).
- [ ] **Hard Rule**: Never write unit tests that inject phantom properties (e.g. `agent_type` in Antigravity `PreToolUse`) not supported by the platform's runtime specification.
- [ ] Verify that tool names and arguments align with actual platform step types (e.g., Antigravity `code_action` for edits, `replace_file_content` vs `edit_file`).

### 2. Permission Model & Security Audit
- [ ] Inspect all outputs of `PreToolUse`:
  - `allow` must NEVER be returned as a default or passive outcome.
  - In Antigravity, returning `{"decision": "allow"}` automatically bypasses user approval. If the hook does not deny execution, it must return an empty object `{}` or no decision to preserve user permission prompts.
  - In Claude Code, returning nothing allows the tool while respecting user permission settings.
- [ ] If a guard cannot accurately identify the actor (e.g. lacking agent identity in payload), it MUST NOT be registered as an active hook.

### 3. Lifecycle & Stop Hook Termination Audit
- [ ] Inspect the `Stop` hook handler:
  - Antigravity passes `terminationReason`: `NO_TOOL_CALL`, `USER_CANCELED`, `ERROR`, `MAX_INVOCATIONS`, `MAX_TOKEN_BUDGET_EXCEEDED`, etc.
  - The hook MUST ONLY block (return `continue`) when `terminationReason === 'NO_TOOL_CALL'`.
  - The hook MUST allow termination (`allowStop()`) when the reason indicates user cancellation or errors (`USER_CANCELED`, `ERROR`, etc.).

### 4. Type Safety & Defensive Parsing
- [ ] Inspect all payload field access:
  - Ensure string methods (`.slice()`, `.lastIndexOf()`, `.toLowerCase()`) are never called directly on unverified fields.
  - Guard against fields that may be passed as objects (e.g., `agent: { name: "..." }` instead of a string).

### 5. Semantic Skill Review (Platform Portability)
- [ ] Do not rely solely on template token scans (such as looking for unrendered template delimiters).
- [ ] Perform full-text regex scans for hardcoded platform-specific APIs:
  - Claude-only constructs: `Workflow(...)`, `/workflows`, `ToolSearch`, `mcp__<server>__*`.
  - Antigravity constructs: `run_workflow(...)`, `call_mcp_tool(...)`, `ask_question`, `invoke_subagent`.
- [ ] Ensure all platform-specific paths are wrapped in conditional platform blocks.

### 6. Subagent Tool Compatibility
- [ ] Cross-check all tool lists declared in agent frontmatters against the host platform's native tools:
  - Claude: `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`.
  - Antigravity: `run_command`, `view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`, `search_web`.
