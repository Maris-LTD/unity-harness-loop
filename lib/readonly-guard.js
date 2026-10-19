const READ_ONLY_AGENTS = ['unity-verifier', 'unity-reviewer', 'run-log-auditor', 'plan-loader'];
const WRITE_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'write_to_file', 'replace_file_content', 'multi_replace_file_content'];
const SAFE_TARGET = /^(\/dev\/null|nul|&\d?|-|["']?\$\{?(TEMP|TMP|TMPDIR)\}?[\/\\]|["']?\/tmp\/)/i;
const AT_COMMAND = String.raw`(?:^|[;&|(\n]\s*|\bxargs\s+)`;
const GIT = String.raw`\bgit(?:\s+-[cC]\s+\S+)*\s+`;
const WRITE_COMMANDS = [
  { pattern: new RegExp(`${AT_COMMAND}(rm|rmdir|mv|cp|mkdir|touch|tee|truncate|ln|chmod|del)\\b`), why: 'file command' },
  { pattern: /\bsed\b[^|;&\n]*\s-[a-zA-Z]*i/, why: 'sed -i' },
  { pattern: new RegExp(`${GIT}(add|commit|restore|checkout|switch|reset|stash|mv|rm|apply|am|clean|push|merge|rebase|cherry-pick|revert)\\b`), why: 'git command that changes the tree' },
  { pattern: /\bunity\s+command\s+\S*(save|create|delete|destroy|import|move|rename|modify)/i, why: 'unity command that changes assets' },
  { pattern: /\bunity-harness\s+(init|studio\s+set)\b/, why: 'unity-harness command that writes config' },
];

function agentName(payload) {
  const raw = payload.agent_type || payload.subagent_type
    || (typeof payload.agent === 'string' ? payload.agent : payload.agent?.name)
    || (typeof payload.subagent === 'string' ? payload.subagent : payload.subagent?.name)
    || payload.agentName || '';
  const type = typeof raw === 'string' ? raw : '';
  return type.slice(type.lastIndexOf(':') + 1);
}

function stripHeredocBodies(command) {
  return command.replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g, ' $3');
}

function readTarget(command, start) {
  let end = start;
  const quote = command[start] === '"' || command[start] === "'" ? command[start] : null;
  if (quote) {
    end = command.indexOf(quote, start + 1);
    return end < 0 ? command.slice(start) : command.slice(start, end + 1);
  }
  while (end < command.length && !/[\s;|&)<>]/.test(command[end])) end++;
  return command.slice(start, end);
}

function redirectTargets(command) {
  const targets = [];
  let quote = null;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === '\\' && quote === '"') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') quote = c;
    else if (c === '\\') i++;
    else if (c === '>' && command[i - 1] !== '=') {
      let j = command[i + 1] === '>' ? i + 2 : i + 1;
      if (command[j] === '&') j++;
      while (command[j] === ' ' || command[j] === '\t') j++;
      const target = command[j - 1] === '&' && /\d|-/.test(command[j] || '') ? '&' : readTarget(command, j);
      targets.push(target || '&');
      i = j - 1;
    }
  }
  return targets;
}

function writeReason(command) {
  const code = stripHeredocBodies(command);
  const unsafe = redirectTargets(code).find(t => !SAFE_TARGET.test(t));
  if (unsafe) return `redirection to ${unsafe}`;
  const hit = WRITE_COMMANDS.find(c => c.pattern.test(code));
  return hit ? hit.why : null;
}

function checkReadOnlyTool(payload) {
  const name = agentName(payload);
  if (!READ_ONLY_AGENTS.includes(name)) return null;
  const tool = payload.tool_name || (payload.toolCall && payload.toolCall.name) || '';
  const command = (payload.tool_input && payload.tool_input.command)
    || (payload.toolCall && payload.toolCall.args && (payload.toolCall.args.CommandLine || payload.toolCall.args.command))
    || '';
  const reason = WRITE_TOOLS.includes(tool) ? `${tool} tool`
    : (tool === 'Bash' || tool === 'run_command') ? writeReason(String(command))
      : null;
  if (!reason) return null;
  return `unity-harness: ${name} is read-only and this call would change files (${reason}). Report the problem in your result instead of changing anything.`;
}

module.exports = { checkReadOnlyTool, writeReason };
