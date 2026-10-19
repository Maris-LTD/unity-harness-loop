const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { CLI, envWithoutUnity } = require('./helpers');

function makeNestedProject() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'nested-'));
  const project = path.join(repo, 'Proj');
  fs.mkdirSync(path.join(project, 'ProjectSettings'), { recursive: true });
  fs.writeFileSync(path.join(project, 'ProjectSettings', 'ProjectVersion.txt'), 'm_EditorVersion: 6000.3.1f1\n');
  fs.mkdirSync(path.join(project, 'Assets'));
  fs.writeFileSync(path.join(project, 'Assets', 'A.cs'), 'class A {\n}\n');
  fs.writeFileSync(path.join(repo, 'Outside.cs'), 'class Outside {\n}\n');
  const git = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repo });
  git('init', '-q');
  spawnSync(process.execPath, [CLI, '--project', project, 'init'], { encoding: 'utf8' });
  git('add', '-A');
  git('commit', '-q', '-m', 'baseline');
  return { repo, project };
}

function cli(project, ...args) {
  const result = spawnSync(process.execPath, [CLI, '--project', project, ...args], { encoding: 'utf8', env: envWithoutUnity(project) });
  return result.stdout;
}

function edit(dir, rel, text) {
  fs.writeFileSync(path.join(dir, rel), text);
}

test('rules see modified and new files when the Unity project is a subfolder of the repo', () => {
  const { repo, project } = makeNestedProject();
  edit(project, 'Assets/A.cs', 'class A {\n  // changed\n}\n');
  edit(project, 'Assets/B.cs', 'class B {\n  // new\n}\n');
  edit(repo, 'Outside.cs', 'class Outside {\n  // outside the project\n}\n');
  const check = JSON.parse(cli(project, 'rules', '--json')).checks[0];
  assert.deepStrictEqual(check.info.files.sort(), ['Assets/A.cs', 'Assets/B.cs']);
  assert.match(check.blocking.join('\n'), /Assets\/A\.cs:2 new comment/);
  assert.match(check.blocking.join('\n'), /Assets\/B\.cs:2 new comment/);
});

test('rules compare line counts with HEAD when the Unity project is a subfolder', () => {
  const { project } = makeNestedProject();
  const long = n => Array.from({ length: n }, (_, i) => `int f${i};`).join('\n') + '\n';
  edit(project, 'Assets/A.cs', long(300));
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'long'], { cwd: project });
  edit(project, 'Assets/A.cs', long(290));
  const check = JSON.parse(cli(project, 'rules', '--json')).checks[0];
  assert.deepStrictEqual(check.blocking, []);
  assert.match(check.warnings.join('\n'), /already over before this change/);
});

test('stop gate blocks on a modified tracked file when the Unity project is a subfolder', () => {
  const { project } = makeNestedProject();
  const hook = event => spawnSync(process.execPath, [CLI, 'hook', 'claude', event], {
    input: JSON.stringify({ session_id: 's', cwd: project }),
    encoding: 'utf8',
    env: envWithoutUnity(project),
  }).stdout;
  hook('session-start');
  edit(project, 'Assets/A.cs', 'class A {\n  // changed\n}\n');
  assert.strictEqual(JSON.parse(hook('stop')).decision, 'block');
});

test('tree guard sees edits to already dirty files when the Unity project is a subfolder', () => {
  const { project } = makeNestedProject();
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'run-'));
  fs.writeFileSync(path.join(runDir, 'baseline.json'), '{}');
  edit(project, 'Assets/A.cs', 'class A {\n  int x;\n}\n');
  const before = JSON.parse(cli(project, 'run-log', 'tree', runDir, '--tag', 'before'));
  assert.strictEqual(before.dirtyCount, 1);
  edit(project, 'Assets/A.cs', 'class A {\n  int y;\n}\n');
  const after = JSON.parse(cli(project, 'run-log', 'tree', runDir, '--tag', 'after', '--compare', 'before', '--expect', 'readonly'));
  assert.deepStrictEqual(after.changed, ['Assets/A.cs']);
  assert.strictEqual(after.violation, true);
});
