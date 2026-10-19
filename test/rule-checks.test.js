const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'unity-harness.js');

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-'));
  fs.mkdirSync(path.join(dir, 'ProjectSettings'));
  fs.writeFileSync(path.join(dir, 'ProjectSettings', 'ProjectVersion.txt'), 'm_EditorVersion: 6000.3.1f1\n');
  spawnSync('git', ['init', '-q'], { cwd: dir });
  spawnSync(process.execPath, [CLI, '--project', dir, 'init'], { encoding: 'utf8' });
  return dir;
}

function writeLines(dir, count, ending) {
  fs.mkdirSync(path.join(dir, 'Assets'), { recursive: true });
  const body = Array.from({ length: count }, (_, i) => `int f${i};`).join(ending);
  fs.writeFileSync(path.join(dir, 'Assets', 'A.cs'), body + ending);
}

function rules(dir) {
  const result = spawnSync(process.execPath, [CLI, '--project', dir, 'rules', '--json'], { encoding: 'utf8' });
  return JSON.parse(result.stdout).checks[0];
}

for (const [name, ending] of [['LF', '\n'], ['CRLF', '\r\n']]) {
  test(`a ${name} file of exactly maxLines lines passes, one more line blocks`, () => {
    const dir = makeRepo();
    writeLines(dir, 250, ending);
    assert.deepStrictEqual(rules(dir).blocking, []);
    writeLines(dir, 251, ending);
    assert.match(rules(dir).blocking.join('\n'), /Assets\/A\.cs has 251 lines \(limit 250\)/);
  });
}

test('comments and Debug.Log moved into a split-out file are existing code, new ones still block', () => {
  const dir = makeRepo();
  fs.mkdirSync(path.join(dir, 'Assets'), { recursive: true });
  const big = path.join(dir, 'Assets', 'Big.cs');
  fs.writeFileSync(big, 'class Big {\n  void Keep() {}\n  // remembers the last score\n  void Save() {\n    Debug.Log("saved");\n  }\n}\n');
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A'], { cwd: dir });
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'big'], { cwd: dir });
  fs.writeFileSync(big, 'class Big {\n  void Keep() {}\n}\n');
  fs.writeFileSync(path.join(dir, 'Assets', 'Saver.cs'),
    'class Saver {\n  // remembers the last score\n  void Save() {\n    Debug.Log("saved");\n  }\n  // remembers the last score\n  // brand new note\n}\n');
  const blocking = rules(dir).blocking;
  assert.deepStrictEqual(blocking.map(b => b.split(' ')[0]), ['Assets/Saver.cs:6', 'Assets/Saver.cs:7']);
});

test('with --since-run, files dirty before the run are judged against their baseline copy', () => {
  const dir = makeRepo();
  fs.mkdirSync(path.join(dir, 'Assets'), { recursive: true });
  const write = (rel, text) => fs.writeFileSync(path.join(dir, 'Assets', rel), text);
  write('Mine.cs', 'class Mine {\n}\n');
  write('Touched.cs', 'class Touched {\n}\n');
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A'], { cwd: dir });
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base'], { cwd: dir });
  write('Mine.cs', 'class Mine {\n  // user work in progress\n}\n');
  write('Touched.cs', 'class Touched {\n  // user note\n}\n');
  write('Draft.cs', 'class Draft {\n  // untracked user draft\n}\n');
  const base = JSON.parse(spawnSync(process.execPath, [CLI, '--project', dir, 'run-log', 'baseline', '--slug', 't'], { encoding: 'utf8' }).stdout);
  write('Touched.cs', 'class Touched {\n  // user note\n  // added by the run\n}\n');
  write('New.cs', 'class New {\n  // new file from the run\n}\n');
  const since = JSON.parse(spawnSync(process.execPath, [CLI, '--project', dir, 'rules', '--json', '--since-run', base.runDir], { encoding: 'utf8' }).stdout).checks[0];
  assert.deepStrictEqual(since.blocking.map(b => b.split(' ')[0]).sort(), ['Assets/New.cs:2', 'Assets/Touched.cs:3']);
  assert.strictEqual(since.info.preExisting, 2);
  const all = rules(dir).blocking.map(b => b.split(' ')[0]).sort();
  assert.deepStrictEqual(all, ['Assets/Draft.cs:2', 'Assets/Mine.cs:2', 'Assets/New.cs:2', 'Assets/Touched.cs:2', 'Assets/Touched.cs:3']);
});

test('--since-run with a missing baseline warns and falls back to HEAD', () => {
  const dir = makeRepo();
  writeLines(dir, 1, '\n');
  const check = JSON.parse(spawnSync(process.execPath, [CLI, '--project', dir, 'rules', '--json', '--since-run', 'nope'], { encoding: 'utf8' }).stdout).checks[0];
  assert.match(check.warnings.join('\n'), /no baseline\.json in nope, checking against HEAD/);
});
