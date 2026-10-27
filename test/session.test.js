const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'unity-harness.js');
const CHECKPOINT = 'Docs/production/session-state/active.md';

function write(dir, rel, text) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), text);
}

function git(dir, ...args) {
  return spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, encoding: 'utf8' });
}

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-'));
  write(dir, 'ProjectSettings/ProjectVersion.txt', 'm_EditorVersion: 6000.3.1f1\n');
  write(dir, '.unity-harness/config.json', JSON.stringify({ studio: { rigor: 'minimal' } }));
  git(dir, 'init', '-q', '-b', 'main');
  return dir;
}

function brief(dir, configDir) {
  const env = { ...process.env, CLAUDE_CONFIG_DIR: configDir || fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-')) };
  const result = spawnSync(process.execPath, [CLI, '--project', dir, 'session', 'brief', '--json'], { encoding: 'utf8', env });
  assert.strictEqual(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

const codes = b => b.signals.map(s => s.code);

test('session brief flags a missing checkpoint and missing memory', () => {
  const dir = makeProject();
  const b = brief(dir);
  assert.strictEqual(b.checkpoint.exists, false);
  assert.ok(codes(b).includes('no-checkpoint'));
  assert.ok(codes(b).includes('no-memory'));
  assert.strictEqual(b.git.available, true);
});

test('session brief parses the checkpoint and lists commits made after it', () => {
  const dir = makeProject();
  write(dir, CHECKPOINT, '# Session\n<!-- CHECKPOINT -->\nUpdated: 2026-01-01\nBranch: feature\nCurrent story: Docs/production/epics/e/story-001-a.md\nNext step: game-done Docs/production/epics/e/story-001-a.md\n<!-- /CHECKPOINT -->\nnotes\n');
  write(dir, 'Docs/production/epics/e/story-001-a.md', '> **Status**: Complete\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'checkpoint');
  write(dir, 'Assets/A.cs', 'class A {}\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'later work');
  write(dir, 'Assets/B.cs', 'class B {}\n');
  const b = brief(dir);
  assert.strictEqual(b.checkpoint.fields['Next step'], 'game-done Docs/production/epics/e/story-001-a.md');
  assert.deepStrictEqual(b.git.commitsAfterCheckpoint.map(c => c.subject), ['later work']);
  assert.strictEqual(b.git.untrackedCount, 1);
  for (const code of ['commits-after-checkpoint', 'branch-changed', 'uncommitted-changes', 'active-story-not-in-progress']) {
    assert.ok(codes(b).includes(code), code);
  }
  assert.ok(!codes(b).includes('no-checkpoint'));
});

test('session brief anchors an ignored checkpoint on its modified time', () => {
  const dir = makeProject();
  write(dir, '.gitignore', '/Docs/production/session-state/\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'before checkpoint');
  write(dir, CHECKPOINT, '<!-- CHECKPOINT -->\nUpdated: 2026-01-01\nBranch: main\nCurrent story: none\n<!-- /CHECKPOINT -->\n');
  const past = new Date(Date.now() - 3600 * 1000);
  fs.utimesSync(path.join(dir, CHECKPOINT), past, past);
  const b = brief(dir);
  assert.strictEqual(b.git.checkpointCommit, '');
  assert.ok(b.git.checkpointWritten);
  assert.deepStrictEqual(b.git.commitsAfterCheckpoint.map(c => c.subject), ['before checkpoint']);
  assert.ok(!codes(b).includes('active-story-not-in-progress'));
});

test('session brief reads run verdicts and spots runs missing from the index', () => {
  const dir = makeProject();
  const runs = '.unity-harness/runs';
  write(dir, `${runs}/INDEX.md`, '| Run | Verdict | Log audit | Guard | Files | +/- | Title |\n|---|---|---|---|---|---|---|\n| [r1](r1/report.md) | pass | accurate | clean | 1 | +1/-0 | First |\n| [r2](r2/report.md) | needs-attention | accurate | clean | 2 | +3/-1 | Second |\n');
  for (const name of ['r1', 'r2', 'r3']) fs.mkdirSync(path.join(dir, runs, name), { recursive: true });
  const b = brief(dir);
  assert.deepStrictEqual(b.runs.recent.map(r => [r.verdict, r.title]), [['pass', 'First'], ['needs-attention', 'Second']]);
  assert.deepStrictEqual(b.runs.unfinished, [`${runs}/r3`]);
  assert.ok(codes(b).includes('last-run-not-pass'));
  assert.ok(codes(b).includes('unfinished-runs'));
});

test('session brief finds repo memory and the agent memory folder', () => {
  const dir = makeProject();
  write(dir, '.claude/memory/MEMORY.md', '- [A](a.md)\n');
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-'));
  const agentDir = path.join(configDir, 'projects', dir.replace(/[^A-Za-z0-9]/g, '-'), 'memory');
  write(agentDir, 'MEMORY.md', '- [B](b.md)\n');
  const b = brief(dir, configDir);
  assert.strictEqual(b.memory.repo.index, true);
  assert.strictEqual(b.memory.agent.dir, agentDir);
  assert.strictEqual(b.memory.linked, false);
  assert.ok(!codes(b).includes('no-memory'));
});

test('session rejects unknown subcommands and bad --runs', () => {
  const dir = makeProject();
  const run = (...args) => spawnSync(process.execPath, [CLI, '--project', dir, 'session', ...args], { encoding: 'utf8' }).status;
  assert.strictEqual(run('nope'), 64);
  assert.strictEqual(run('brief', '--runs', '0'), 64);
});
