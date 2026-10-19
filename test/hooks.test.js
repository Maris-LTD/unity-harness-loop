const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { CLI, envWithoutUnity } = require('./helpers');

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

function hook(dir, event, extra = {}) {
  return spawnSync(process.execPath, [CLI, 'hook', 'claude', event], {
    input: JSON.stringify({ session_id: 's', cwd: dir, ...extra }),
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

test('session-start keeps unverified edits across compact and resume, and resets on startup', () => {
  const dir = makeRepo();
  hook(dir, 'session-start', { source: 'startup' });
  writeCs(dir, 'class A {\n  // unverified\n}\n');
  hook(dir, 'session-start', { source: 'compact' });
  hook(dir, 'session-start', { source: 'resume' });
  assert.strictEqual(JSON.parse(hook(dir, 'stop')).decision, 'block');
  hook(dir, 'session-start', { source: 'startup' });
  assert.strictEqual(hook(dir, 'stop'), '');
});
