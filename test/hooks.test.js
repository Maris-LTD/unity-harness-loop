const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'unity-harness.js');

function envWithoutUnity(dir) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir };
  const pathKey = Object.keys(env).find(k => k.toUpperCase() === 'PATH');
  const entries = (env[pathKey] || '').split(path.delimiter)
    .filter(p => p && !['unity', 'unity.exe', 'unity.cmd'].some(name => fs.existsSync(path.join(p, name))));
  for (const key of Object.keys(env)) if (key.toUpperCase() === 'PATH') delete env[key];
  env.PATH = entries.join(path.delimiter);
  return env;
}

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
  fs.mkdirSync(path.join(dir, 'ProjectSettings'));
  fs.writeFileSync(path.join(dir, 'ProjectSettings', 'ProjectVersion.txt'), 'm_EditorVersion: 6000.3.1f1\n');
  const git = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: dir });
  git('init', '-q');
  spawnSync(process.execPath, [CLI, '--project', dir, 'init'], { encoding: 'utf8' });
  git('add', '-A');
  git('commit', '-q', '-m', 'baseline');
  return dir;
}

function hook(dir, event) {
  return spawnSync(process.execPath, [CLI, 'hook', 'claude', event], {
    input: JSON.stringify({ session_id: 's', cwd: dir }),
    encoding: 'utf8',
    env: envWithoutUnity(dir),
  }).stdout;
}

function writeCs(dir, text) {
  fs.mkdirSync(path.join(dir, 'Assets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Assets', 'A.cs'), text);
}

test('stop gate stops blocking unchanged files after it gives up, and blocks again once they change', () => {
  const dir = makeRepo();
  hook(dir, 'session-start');
  writeCs(dir, 'class A {\n  // first\n}\n');
  for (let attempt = 1; attempt <= 3; attempt++) {
    assert.strictEqual(JSON.parse(hook(dir, 'stop')).decision, 'block');
  }
  assert.match(JSON.parse(hook(dir, 'stop')).systemMessage, /gave up after 3 attempts/);
  assert.strictEqual(hook(dir, 'stop'), '');
  writeCs(dir, 'class A {\n  // first\n  // second\n}\n');
  assert.strictEqual(JSON.parse(hook(dir, 'stop')).decision, 'block');
});
