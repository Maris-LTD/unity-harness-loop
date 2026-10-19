const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');

const { CLI } = require('./helpers');

function preToolUse(payload) {
  const out = spawnSync(process.execPath, [CLI, 'hook', 'claude', 'pre-tool-use'], { input: JSON.stringify(payload), encoding: 'utf8' }).stdout;
  return out ? JSON.parse(out).hookSpecificOutput : null;
}

const bash = (agent, command) => preToolUse({ agent_type: agent, tool_name: 'Bash', tool_input: { command } });

test('read-only agents cannot use file-writing tools, other agents can', () => {
  const denied = preToolUse({ agent_type: 'unity-harness:unity-verifier', tool_name: 'Write', tool_input: { file_path: 'a.cs' } });
  assert.strictEqual(denied.permissionDecision, 'deny');
  assert.match(denied.permissionDecisionReason, /unity-verifier is read-only .*Write tool/);
  assert.strictEqual(preToolUse({ agent_type: 'unity-reviewer', tool_name: 'Edit', tool_input: {} }).permissionDecision, 'deny');
  assert.strictEqual(preToolUse({ agent_type: 'unity-harness:gameplay-programmer', tool_name: 'Write', tool_input: {} }), null);
  assert.strictEqual(preToolUse({ tool_name: 'Write', tool_input: {} }), null);
});

test('read-only agents are denied Bash commands that write files', () => {
  for (const command of [
    'echo x > Assets/A.cs',
    'cat a >> b.txt',
    'sed -i "s/a/b/" Assets/A.cs',
    'git restore Assets/A.cs',
    'git -c core.quotepath=off checkout -- .',
    'rm -f Assets/A.cs',
    'git status && mv a b',
    'cat a | tee b',
    'cat > Assets/B.cs <<EOF\nclass B {}\nEOF',
    'unity command save_scene --json',
    'unity-harness studio set rigor=full',
  ]) {
    assert.strictEqual(bash('unity-harness:unity-verifier', command)?.permissionDecision, 'deny', command);
  }
});

test('read-only agents keep the Bash commands they need', () => {
  for (const command of [
    'unity-harness full --json --since-run .unity-harness/runs/x 2>&1',
    'git diff HEAD -M -- "*.cs" 2>/dev/null',
    'git status --porcelain',
    'node -e "const d=JSON.parse(s); console.log(d.checks.map(c => c.name))"',
    "grep -n 'a > b' Assets/A.cs",
    'unity status --json --no-banner >/dev/null 2>&1 || echo down',
    'git diff --no-index .unity-harness/runs/x/baseline-files/Assets/A.cs Assets/A.cs',
    "unity-harness run-log write .unity-harness/runs/x audit.md <<'__RUNLOG_EOF__'\n> quoted markdown\n| a | b |\n__RUNLOG_EOF__",
    'echo draft > "$TEMP/audit.md"',
    'unity command list_open_scenes --json',
  ]) {
    assert.strictEqual(bash('unity-harness:run-log-auditor', command), null, command);
  }
});
