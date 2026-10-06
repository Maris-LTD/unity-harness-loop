const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHARED = path.join(ROOT, 'shared');
const PLUGINS = path.join(ROOT, 'plugins');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const PLUGIN_NAME = 'unity-harness';
const CLAUDE_AGENT_PREFIX = `${PLUGIN_NAME}:`;
const DESCRIPTION = 'Unity verification loop for AI agents: rule check, recompile, EditMode tests, Play mode smoke with Editor focus keeping, stop gate and run logs. Requires the unity-harness CLI (npm i -g github:Maris-LTD/unity-harness-loop).';

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

function yamlValue(value) {
  if (Array.isArray(value)) return '\n' + value.map(v => `  - ${v}`).join('\n');
  if (typeof value === 'string' && /[:#\-\[\]{}&*!|>'"%@`]/.test(value)) return ` ${JSON.stringify(value)}`;
  return ` ${value}`;
}

function frontmatter(fields) {
  const rows = Object.entries(fields).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}:${yamlValue(v)}`);
  return `---\n${rows.join('\n')}\n---\n`;
}

function sharedAgents() {
  const meta = JSON.parse(fs.readFileSync(path.join(SHARED, 'agents', 'agents.json'), 'utf8'));
  return Object.entries(meta).map(([name, m]) => ({
    name,
    ...m,
    body: fs.readFileSync(path.join(SHARED, 'agents', `${name}.md`), 'utf8').trim(),
  }));
}

function copySkills(target) {
  fs.cpSync(path.join(SHARED, 'skills'), path.join(target, 'skills'), { recursive: true });
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
    keywords: ['unity', 'testing', 'smoke-test', 'hooks'],
  }));
  copySkills(dir);
  for (const agent of sharedAgents().filter(a => a.targets.includes('claude'))) {
    const head = frontmatter({ name: agent.name, description: agent.description, tools: agent.claude.tools, model: agent.claude.model });
    write(path.join(dir, 'agents', `${agent.name}.md`), `${head}\n${agent.body}`);
  }
  write(path.join(dir, 'hooks', 'hooks.json'), json({
    hooks: {
      SessionStart: [{ matcher: 'startup|clear|resume|compact', hooks: [{ type: 'command', command: 'unity-harness hook claude session-start', timeout: 30 }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'unity-harness hook claude stop', timeout: 600 }] }],
    },
  }));
  for (const file of fs.readdirSync(path.join(SHARED, 'workflows'))) {
    const source = fs.readFileSync(path.join(SHARED, 'workflows', file), 'utf8');
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
  copySkills(dir);
  for (const agent of sharedAgents().filter(a => a.targets.includes('antigravity'))) {
    const ag = agent.antigravity;
    const head = frontmatter({
      name: agent.name,
      description: agent.description,
      tools: ag.tools,
      model: ag.model,
      commandExecutionPolicy: ag.commandExecutionPolicy,
      subagent: true,
      mainAgent: false,
    });
    write(path.join(dir, 'agents', `${agent.name}.md`), `${head}\n# System Prompt\n\n${agent.body}`);
  }
  write(path.join(dir, 'hooks.json'), json({
    [PLUGIN_NAME]: {
      enabled: true,
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

buildClaude();
buildAntigravity();
buildMarketplace();
process.stdout.write(`built plugins/claude-code, plugins/antigravity and .claude-plugin/marketplace.json (v${pkg.version})\n`);
