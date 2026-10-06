const fs = require('fs');
const path = require('path');
const { setProjectRoot, projectRoot, dataDir, hasConfig, loadConfig, isUnityProject } = require('./context');
const { changedCsFiles } = require('./rule-checks');
const { editorState } = require('./unity-cli');
const { runChecks, formatReport } = require('./verify');

const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

const AGENTS = {
  claude: {
    sessionId: payload => payload.session_id || 'default',
    workspaces: payload => [process.env.CLAUDE_PROJECT_DIR, payload.cwd],
    block: reason => ({ decision: 'block', reason }),
    info: message => ({ systemMessage: message }),
    allowStop: () => null,
  },
  antigravity: {
    sessionId: payload => payload.conversationId || 'default',
    workspaces: payload => payload.workspacePaths || [],
    block: reason => ({ decision: 'continue', reason }),
    info: () => ({ decision: 'stop' }),
    allowStop: () => ({ decision: 'stop' }),
  },
};

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function resolveProject(candidates) {
  for (const dir of candidates.filter(Boolean)) {
    if (isUnityProject(dir)) return dir;
  }
  return null;
}

function stateFile() {
  return path.join(dataDir(), 'state', 'sessions.json');
}

function loadSessions() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
  } catch {
    return {};
  }
}

function saveSessions(sessions) {
  const now = Date.now();
  for (const [id, entry] of Object.entries(sessions)) {
    if (now - (entry.at || 0) > SESSION_TTL_MS) delete sessions[id];
  }
  fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
  fs.writeFileSync(stateFile(), JSON.stringify(sessions, null, 2));
}

function fingerprint() {
  const result = {};
  for (const file of changedCsFiles()) {
    const absolute = path.join(projectRoot(), file);
    result[file] = fs.existsSync(absolute) ? fs.statSync(absolute).mtimeMs : 'deleted';
  }
  return result;
}

function touchedSince(snapshot, current) {
  const files = new Set([...Object.keys(snapshot), ...Object.keys(current)]);
  return [...files].filter(file => snapshot[file] !== current[file] && current[file] !== undefined);
}

function plannedSteps(gate) {
  const steps = [];
  if (gate.rules) steps.push('rules');
  if (editorState() !== 'ready') return { steps, editorReady: false };
  if (gate.compile || gate.tests) steps.push('compile');
  if (gate.tests) steps.push('tests');
  return { steps, editorReady: true };
}

function snapshotSession(id, onlyIfMissing) {
  const sessions = loadSessions();
  if (onlyIfMissing && sessions[id]) return;
  sessions[id] = { snapshot: fingerprint(), blocks: 0, at: Date.now() };
  saveSessions(sessions);
}

function stopGate(agent, id) {
  const gate = loadConfig().stopGate;
  const sessions = loadSessions();
  const entry = sessions[id];
  if (!entry) {
    snapshotSession(id, false);
    return agent.allowStop();
  }
  const current = fingerprint();
  const touched = touchedSince(entry.snapshot, current);
  if (!touched.length) return agent.allowStop();

  const { steps, editorReady } = plannedSteps(gate);
  const report = runChecks(steps, { files: touched });
  const failed = report.checks.some(c => c.blocking.length > 0);
  const text = formatReport(report);
  entry.at = Date.now();

  if (failed && entry.blocks < gate.maxBlocks) {
    entry.blocks += 1;
    saveSessions(sessions);
    return agent.block(`Unity harness gate failed (attempt ${entry.blocks}/${gate.maxBlocks}). Fix every item below, then finish again.\n${text}`);
  }
  if (failed) {
    entry.blocks = 0;
    saveSessions(sessions);
    return agent.info(`Unity harness: gave up after ${gate.maxBlocks} attempts, issues remain:\n${text}`);
  }
  if (editorReady) entry.snapshot = current;
  entry.blocks = 0;
  saveSessions(sessions);
  const note = editorReady ? '' : '\n(Unity Editor not ready: compile not verified)';
  return agent.info(`Unity harness: ${touched.length} changed .cs file(s) checked\n${text}${note}`);
}

function runHook(agentName, event) {
  const agent = AGENTS[agentName];
  if (!agent) {
    process.stderr.write(`unknown agent "${agentName}", expected ${Object.keys(AGENTS).join('|')}\n`);
    return 64;
  }
  const payload = readStdin();
  const project = resolveProject(agent.workspaces(payload));
  const quiet = event === 'stop' ? agent.allowStop() : null;
  if (!project) return emit(quiet);
  setProjectRoot(project);
  if (!hasConfig() || !loadConfig().stopGate.enabled) return emit(quiet);

  const id = agent.sessionId(payload);
  if (event === 'session-start') {
    snapshotSession(id, false);
    return emit(null);
  }
  if (event === 'turn-start') {
    snapshotSession(id, true);
    return emit(null);
  }
  if (event === 'stop') return emit(stopGate(agent, id));
  process.stderr.write(`unknown hook event "${event}", expected session-start|turn-start|stop\n`);
  return 64;
}

function emit(payload) {
  if (payload) process.stdout.write(JSON.stringify(payload));
  return 0;
}

module.exports = { runHook };
