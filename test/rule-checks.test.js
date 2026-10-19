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
