const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { CLI } = require('./helpers');

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-'));
  const files = {
    'ProjectSettings/ProjectVersion.txt': 'm_EditorVersion: 6000.3.1f1\n',
    'ProjectSettings/ProjectSettings.asset': 'runInBackground: 0\n',
    'Packages/manifest.json': '{"dependencies":{}}\n',
    'Packages/packages-lock.json': '{"dependencies":{}}\n',
    'Assets/Main.unity': 'scene: 1\n',
    'Assets/Main.unity.meta': 'guid: a\n',
    'Assets/Ui.prefab': 'prefab: 1\n',
    'Assets/Font SDF.asset': 'atlas: 1\n',
  };
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  const git = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: dir });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'baseline');
  return dir;
}

function readonlyStep(dir, edits) {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'run-'));
  fs.writeFileSync(path.join(runDir, 'baseline.json'), '{}');
  const tree = (...args) => JSON.parse(spawnSync(process.execPath, [CLI, '--project', dir, 'run-log', 'tree', runDir, ...args], { encoding: 'utf8' }).stdout);
  tree('--tag', 'before');
  for (const rel of edits) fs.appendFileSync(path.join(dir, rel), 'changed: 1\n');
  const result = tree('--tag', 'after', '--compare', 'before', '--expect', 'readonly');
  const events = JSON.parse(fs.readFileSync(path.join(runDir, 'events.json'), 'utf8'));
  const changedBy = kind => (events.find(e => e.kind === kind) || { changed: [] }).changed.sort();
  return { violation: result.violation, serious: changedBy('guard-violation'), noise: changedBy('unity-noise') };
}

test('a read-only step that edits a scene, a prefab or the package manifest is a guard violation', () => {
  const dir = makeRepo();
  const result = readonlyStep(dir, ['Assets/Main.unity', 'Assets/Ui.prefab', 'Packages/manifest.json', 'ProjectSettings/ProjectSettings.asset']);
  assert.strictEqual(result.violation, true);
  assert.deepStrictEqual(result.serious, ['Assets/Main.unity', 'Assets/Ui.prefab', 'Packages/manifest.json']);
  assert.deepStrictEqual(result.noise, ['ProjectSettings/ProjectSettings.asset']);
});

test('files Unity rewrites on its own during verification are noise, not a violation', () => {
  const dir = makeRepo();
  const result = readonlyStep(dir, ['ProjectSettings/ProjectSettings.asset', 'Packages/packages-lock.json', 'Assets/Main.unity.meta', 'Assets/Font SDF.asset']);
  assert.strictEqual(result.violation, false);
  assert.deepStrictEqual(result.serious, []);
  assert.deepStrictEqual(result.noise, ['Assets/Font SDF.asset', 'Assets/Main.unity.meta', 'Packages/packages-lock.json', 'ProjectSettings/ProjectSettings.asset']);
});
