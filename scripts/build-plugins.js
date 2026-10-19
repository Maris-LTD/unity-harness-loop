const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHARED = path.join(ROOT, 'shared');
const PLUGINS = path.join(ROOT, 'plugins');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const PLUGIN_NAME = 'unity-harness';
const CLAUDE_AGENT_PREFIX = `${PLUGIN_NAME}:`;
const DESCRIPTION = 'Unity verification loop and studio workflow for AI agents: rule check, recompile, EditMode tests, Play mode smoke that runs with the Editor in the background, stop gate, run logs, and a brief-to-story-to-done studio pipeline with director and specialist agents. Requires the unity-harness CLI (npm i -g github:Maris-LTD/unity-harness-loop).';

const TARGET_TEXT = {
  claude: {
    platform: 'Claude Code',
    ask: '`AskUserQuestion`',
    spawn: name => `the \`Agent\` tool with \`subagent_type: "${CLAUDE_AGENT_PREFIX}${name}"\``,
    agent: name => `${CLAUDE_AGENT_PREFIX}${name}`,
  },
  antigravity: {
    platform: 'Antigravity',
    ask: '`ask_question`',
    spawn: name => `\`invoke_subagent\` with the \`${name}\` subagent`,
    agent: name => name,
  },
};

const ANTIGRAVITY_TOOLS = {
  Read: 'view_file',
  Glob: 'find_by_name',
  Grep: 'grep_search',
  Write: 'write_to_file',
  Edit: 'replace_file_content',
  Bash: 'run_command',
  WebSearch: 'search_web',
};

function reset(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`);
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

const YAML_RESERVED = /^(y|yes|n|no|true|false|on|off|null|~)$/i;
const YAML_NUMBER = /^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$|^0[xob]|^[-+]?\.(inf|nan)$/i;

function yamlScalar(value) {
  if (typeof value !== 'string') return String(value);
  const plain = value !== '' &&
    value === value.trim() &&
    !/[\n\r\t]/.test(value) &&
    !/^[-?:,\[\]{}#&*!|>'"%@`]/.test(value) &&
    !/: |:$| #/.test(value) &&
    !YAML_RESERVED.test(value) &&
    !YAML_NUMBER.test(value);
  return plain ? value : JSON.stringify(value);
}

function yamlValue(value) {
  if (Array.isArray(value)) return '\n' + value.map(v => `  - ${yamlScalar(v)}`).join('\n');
  return ` ${yamlScalar(value)}`;
}

function frontmatter(fields) {
  const rows = Object.entries(fields).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}:${yamlValue(v)}`);
  return `---\n${rows.join('\n')}\n---\n`;
}

function render(file, source, target) {
  const text = TARGET_TEXT[target];
  const other = target === 'claude' ? 'antigravity' : 'claude';
  const out = source
    .replace(new RegExp(`\\{\\{#${other}\\}\\}[\\s\\S]*?\\{\\{/${other}\\}\\}\\n?`, 'g'), '')
    .replace(new RegExp(`\\{\\{[#/]${target}\\}\\}\\n?`, 'g'), '')
    .replace(/\{\{platform\}\}/g, text.platform)
    .replace(/\{\{ask\}\}/g, text.ask)
    .replace(/\{\{spawn ([a-z0-9-]+)\}\}/g, (_, name) => text.spawn(name))
    .replace(/\{\{agent ([a-z0-9-]+)\}\}/g, (_, name) => text.agent(name));
  const leftover = out.match(/\{\{[^}\n]*\}\}/);
  if (leftover) throw new Error(`${file}: unknown template token ${leftover[0]}`);
  return out;
}

function renderTree(dir, target) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) renderTree(full, target);
    else if (entry.name.endsWith('.md')) {
      const source = fs.readFileSync(full, 'utf8');
      assertNoHiddenCharacters(full, source, INVISIBLE_IN_TEXT);
      fs.writeFileSync(full, render(full, source, target));
    }
  }
}

const AGENT_KEYS = ['description', 'targets', 'claude', 'antigravity'];
const TARGETS = ['claude', 'antigravity'];

function agentProblems(meta, mdNames) {
  const problems = [];
  for (const [name, m] of Object.entries(meta)) {
    const where = `agents.json "${name}"`;
    const unknown = Object.keys(m).filter(k => !AGENT_KEYS.includes(k));
    if (unknown.length) problems.push(`${where}: unknown keys ${unknown.join(', ')}`);
    if (typeof m.description !== 'string' || !m.description.trim()) problems.push(`${where}: description must be a non-empty string`);
    const targets = Array.isArray(m.targets) ? m.targets : [];
    if (!targets.length || targets.some(t => !TARGETS.includes(t))) problems.push(`${where}: targets must list ${TARGETS.join(' and/or ')}`);
    if (!mdNames.includes(name)) problems.push(`${where}: no ${name}.md body`);
    const claudeTools = m.claude && typeof m.claude.tools === 'string' ? m.claude.tools.split(',').map(t => t.trim()) : null;
    if (targets.includes('claude') && !claudeTools) problems.push(`${where}: claude.tools must be a comma-separated string`);
    if (targets.includes('antigravity') && !(m.antigravity && m.antigravity.tools)) {
      const unmapped = (claudeTools || []).filter(t => !ANTIGRAVITY_TOOLS[t]);
      if (!claudeTools) problems.push(`${where}: antigravity needs antigravity.tools or claude.tools to map`);
      else if (unmapped.length) problems.push(`${where}: no Antigravity tool for ${unmapped.join(', ')}; set antigravity.tools`);
    }
  }
  for (const name of mdNames.filter(n => !(n in meta))) problems.push(`shared/agents/${name}.md has no entry in agents.json`);
  return problems;
}

function sharedAgents() {
  const meta = JSON.parse(fs.readFileSync(path.join(SHARED, 'agents', 'agents.json'), 'utf8'));
  const mdNames = fs.readdirSync(path.join(SHARED, 'agents')).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3));
  const problems = agentProblems(meta, mdNames);
  if (problems.length) throw new Error(`invalid agent definitions:\n  ${problems.join('\n  ')}`);
  return Object.entries(meta).map(([name, m]) => {
    const file = path.join(SHARED, 'agents', `${name}.md`);
    const body = fs.readFileSync(file, 'utf8').trim();
    assertNoHiddenCharacters(file, body + m.description, INVISIBLE_IN_TEXT);
    return { name, ...m, body };
  });
}

function antigravityTools(agent) {
  if (agent.antigravity && agent.antigravity.tools) return agent.antigravity.tools;
  return agent.claude.tools.split(',').map(t => ANTIGRAVITY_TOOLS[t.trim()]).filter(Boolean);
}

const HIDDEN_IN_WORKFLOW = /[\p{Mn}\p{Me}\p{Cf}\p{Co}\p{Cs}]|[^\P{Cc}\t\r\n]/u;
const INVISIBLE_IN_TEXT = /[\p{Cf}\p{Co}\p{Cs}]|[^\P{Cc}\t\r\n]/u;

function assertNoHiddenCharacters(file, source, pattern = HIDDEN_IN_WORKFLOW) {
  source.split('\n').forEach((line, index) => {
    const match = line.match(pattern);
    if (!match) return;
    const code = match[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    const why = pattern === HIDDEN_IN_WORKFLOW
      ? 'Claude Code rejects workflow scripts with characters hidden in the approval dialog. Use a \\u escape instead.'
      : 'invisible characters (zero-width, bidi controls) hide text from reviewers. Remove it.';
    throw new Error(`${file}:${index + 1} contains hidden character U+${code}; ${why}`);
  });
}

function copySkills(target, platform) {
  fs.cpSync(path.join(SHARED, 'skills'), path.join(target, 'skills'), { recursive: true });
  renderTree(path.join(target, 'skills'), platform);
}

function copyLegalFiles(dir) {
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) fs.copyFileSync(path.join(ROOT, file), path.join(dir, file));
}

function buildClaude() {
  const dir = path.join(PLUGINS, 'claude-code');
  reset(dir);
  write(path.join(dir, '.claude-plugin', 'plugin.json'), json({
    name: PLUGIN_NAME,
    version: pkg.version,
    description: DESCRIPTION,
    author: { name: 'Maris-LTD' },
    repository: 'https://github.com/Maris-LTD/unity-harness-loop',
    license: 'MIT',
    keywords: ['unity', 'testing', 'smoke-test', 'hooks', 'studio', 'workflow'],
  }));
  copySkills(dir, 'claude');
  copyLegalFiles(dir);
  for (const agent of sharedAgents().filter(a => a.targets.includes('claude'))) {
    const c = agent.claude;
    const head = frontmatter({ name: agent.name, description: agent.description, tools: c.tools, disallowedTools: c.disallowedTools, model: c.model, maxTurns: c.maxTurns });
    write(path.join(dir, 'agents', `${agent.name}.md`), `${head}\n${render(agent.name, agent.body, 'claude')}`);
  }
  write(path.join(dir, 'hooks', 'hooks.json'), json({
    hooks: {
      SessionStart: [{ matcher: 'startup|clear|resume|compact', hooks: [{ type: 'command', command: 'unity-harness hook claude session-start', timeout: 30 }] }],
      PreToolUse: [{ matcher: 'Bash|Write|Edit|MultiEdit|NotebookEdit', hooks: [{ type: 'command', command: 'unity-harness hook claude pre-tool-use', timeout: 10 }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'unity-harness hook claude stop', timeout: 600 }] }],
    },
  }));
  for (const file of fs.readdirSync(path.join(SHARED, 'workflows'))) {
    const source = fs.readFileSync(path.join(SHARED, 'workflows', file), 'utf8');
    assertNoHiddenCharacters(file, source);
    write(path.join(dir, 'workflows', file), source.split('__AGENT_PREFIX__').join(CLAUDE_AGENT_PREFIX));
  }
}

function buildAntigravity() {
  const dir = path.join(PLUGINS, 'antigravity');
  reset(dir);
  write(path.join(dir, 'plugin.json'), json({
    $schema: 'https://antigravity.google/schemas/v1/plugin.json',
    name: PLUGIN_NAME,
    description: DESCRIPTION,
  }));
  copySkills(dir, 'antigravity');
  copyLegalFiles(dir);
  for (const agent of sharedAgents().filter(a => a.targets.includes('antigravity'))) {
    const ag = agent.antigravity || {};
    const head = frontmatter({
      name: agent.name,
      description: agent.description,
      tools: antigravityTools(agent),
      model: ag.model,
      commandExecutionPolicy: ag.commandExecutionPolicy || 'auto',
      subagent: true,
      mainAgent: false,
    });
    write(path.join(dir, 'agents', `${agent.name}.md`), `${head}\n# System Prompt\n\n${render(agent.name, agent.body, 'antigravity')}`);
  }
  write(path.join(dir, 'rules', 'AGENTS.md'), fs.readFileSync(path.join(ROOT, 'lib', 'studio-protocol.md'), 'utf8'));
  write(path.join(dir, 'hooks.json'), json({
    [PLUGIN_NAME]: {
      enabled: true,
      SessionStart: [{ type: 'command', command: 'unity-harness hook antigravity session-start', timeout: 30 }],
      PreToolUse: [{ matcher: 'run_command|write_to_file|replace_file_content', hooks: [{ type: 'command', command: 'unity-harness hook antigravity pre-tool-use', timeout: 10 }] }],
      PreInvocation: [{ type: 'command', command: 'unity-harness hook antigravity turn-start', timeout: 30 }],
      Stop: [{ type: 'command', command: 'unity-harness hook antigravity stop', timeout: 600 }],
    },
  }));
}

function buildMarketplace() {
  write(path.join(ROOT, '.claude-plugin', 'marketplace.json'), json({
    name: 'unity-harness-loop',
    owner: { name: 'Maris-LTD' },
    metadata: { description: 'Unity verification loop plugins for AI coding agents' },
    plugins: [{ name: PLUGIN_NAME, source: './plugins/claude-code', description: DESCRIPTION }],
  }));
}

if (require.main === module) {
  buildClaude();
  buildAntigravity();
  buildMarketplace();
  process.stdout.write(`built plugins/claude-code, plugins/antigravity and .claude-plugin/marketplace.json (v${pkg.version})\n`);
}

module.exports = { yamlValue, agentProblems, assertNoHiddenCharacters, INVISIBLE_IN_TEXT };
