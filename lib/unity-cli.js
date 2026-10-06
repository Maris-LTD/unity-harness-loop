const { spawnSync } = require('child_process');
const path = require('path');
const { projectRoot } = require('./context');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function toArgs(params) {
  const args = [];
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === false) continue;
    args.push(`--${key}`, String(value));
  }
  return args;
}

function spawnUnity(args, timeoutSec) {
  return spawnSync('unity', args, {
    cwd: projectRoot(),
    encoding: 'utf8',
    timeout: (timeoutSec + 30) * 1000,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function parseEnvelope(proc) {
  const raw = (proc.stdout || '').trim();
  try {
    return JSON.parse(raw);
  } catch {
    return { success: false, errors: [(proc.stderr || raw || String(proc.error || 'no output')).trim().slice(0, 2000)] };
  }
}

function unity(command, params = {}, timeoutSec = 30) {
  const args = ['command', command, ...toArgs(params), '--timeout', String(timeoutSec), '--json', '--no-banner'];
  const envelope = parseEnvelope(spawnUnity(args, timeoutSec));
  if (!envelope.success) return { ok: false, error: JSON.stringify(envelope.errors || envelope).slice(0, 2000) };
  return { ok: true, result: envelope.data ? envelope.data.result : undefined };
}

function unityRetry(command, params, timeoutSec, attempts = 2) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    last = unity(command, params, timeoutSec);
    if (last.ok) return last;
    sleep(2000);
  }
  return last;
}

function normalizePath(p) {
  return path.resolve(p).replace(/\\/g, '/').toLowerCase();
}

function editorInstance() {
  const envelope = parseEnvelope(spawnUnity(['status', '--json', '--no-banner'], 15));
  if (!envelope.success || !envelope.data) return undefined;
  return (envelope.data.instances || []).find(i => normalizePath(i.project) === normalizePath(projectRoot())) || null;
}

function editorState() {
  const instance = editorInstance();
  if (instance === undefined) return 'unreachable';
  return instance ? instance.state : 'not-open';
}

module.exports = { sleep, unity, unityRetry, editorState, editorInstance };
