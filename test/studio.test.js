const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'unity-harness.js');

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-'));
  fs.mkdirSync(path.join(dir, 'ProjectSettings'));
  fs.writeFileSync(path.join(dir, 'ProjectSettings', 'ProjectVersion.txt'), 'm_EditorVersion: 6000.3.1f1\n');
  return dir;
}

function write(dir, rel, text) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), text);
}

function run(dir, ...args) {
  const result = spawnSync(process.execPath, [CLI, '--project', dir, ...args], { encoding: 'utf8' });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

test('studio config expands rigor into its sub-knobs', () => {
  const dir = makeProject();
  const minimal = JSON.parse(run(dir, 'studio', 'config').out);
  assert.deepStrictEqual(
    [minimal.rigor, minimal.reviewMode, minimal.storyGranularity, minimal.qaLevel, minimal.workflow],
    ['minimal', 'solo', 'coarse', 'minimal', 'minimal'],
  );
  assert.strictEqual(minimal.paths.brief, 'Docs/design/game-brief.md');
});

test('init does not create a studio block', () => {
  const dir = makeProject();
  run(dir, 'init');
  const config = JSON.parse(fs.readFileSync(path.join(dir, '.unity-harness', 'config.json'), 'utf8'));
  assert.strictEqual(config.studio, undefined);
});

test('studio set validates and persists, explicit sub-knobs beat rigor', () => {
  const dir = makeProject();
  assert.strictEqual(run(dir, 'studio', 'set', 'rigor=standard').code, 1);
  run(dir, 'init');
  assert.strictEqual(run(dir, 'studio', 'set', 'rigor=bogus').code, 64);
  assert.strictEqual(run(dir, 'studio', 'set', 'nope=1').code, 64);
  const set = run(dir, 'studio', 'set', 'rigor=standard', 'reviewMode=full', 'targetPlatforms=android,ios', 'targetFps=30');
  assert.strictEqual(set.code, 0);
  const resolved = JSON.parse(run(dir, 'studio', 'config').out);
  assert.deepStrictEqual(
    [resolved.rigor, resolved.reviewMode, resolved.qaLevel, resolved.targetFps],
    ['standard', 'full', 'standard', 30],
  );
  assert.deepStrictEqual(resolved.targetPlatforms, ['android', 'ios']);
  assert.deepStrictEqual(resolved.explicit.sort(), ['reviewMode', 'rigor', 'targetFps', 'targetPlatforms']);
});

test('studio status counts stories by their Status line', () => {
  const dir = makeProject();
  run(dir, 'init');
  run(dir, 'studio', 'set', 'docsRoot=Design Docs');
  write(dir, 'Design Docs/design/game-brief.md', '# Brief\n');
  write(dir, 'Design Docs/production/epics/core/EPIC.md', '# Epic\n');
  write(dir, 'Design Docs/production/epics/core/story-001-move.md', '# Move\n> **Status**: Complete\n');
  write(dir, 'Design Docs/production/epics/core/story-002-jump.md', '# Jump\n> **Status**: Ready\n');
  write(dir, 'Design Docs/production/epics/core/story-003-dash.md', '# Dash\nStatus: In Progress\n');
  write(dir, 'Design Docs/production/session-state/active.md', 'Current story: `story-003-dash.md`\n');
  const status = JSON.parse(run(dir, 'studio', 'status', '--json').out);
  assert.strictEqual(status.design.brief, 'Design Docs/design/game-brief.md');
  assert.deepStrictEqual(status.stories.byStatus, { Complete: 1, Ready: 1, 'In Progress': 1 });
  assert.strictEqual(status.nextReadyStory, 'Design Docs/production/epics/core/story-002-jump.md');
  assert.strictEqual(status.activeStory, 'story-003-dash.md');
  write(dir, 'Design Docs/production/session-state/active.md', 'Current story: none\n');
  assert.strictEqual(JSON.parse(run(dir, 'studio', 'status', '--json').out).activeStory, '');
  write(dir, 'Design Docs/production/session-state/active.md', '- **Current story:** `story-002-jump.md`\n');
  assert.strictEqual(JSON.parse(run(dir, 'studio', 'status', '--json').out).activeStory, 'story-002-jump.md');
  assert.strictEqual(status.epics[0].hasEpicFile, true);
  write(dir, 'Design Docs/production/qa/evidence/story-002-jump/01-peak.png', 'x');
  write(dir, 'Design Docs/design/gdd/game-pillars.md', '# Pillars\n');
  write(dir, 'Design Docs/design/gdd/combat.md', '# Combat\n');
  const later = JSON.parse(run(dir, 'studio', 'status', '--json').out);
  assert.strictEqual(later.evidenceFiles, 1);
  assert.deepStrictEqual(later.design.gdds, ['combat.md']);
});

test('claude session-start injects the protocol only for studio projects', () => {
  const dir = makeProject();
  run(dir, 'init');
  const hook = () => spawnSync(process.execPath, [CLI, 'hook', 'claude', 'session-start'], {
    input: JSON.stringify({ session_id: 's', cwd: dir }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  }).stdout;
  assert.strictEqual(hook(), '');
  run(dir, 'studio', 'set', 'rigor=minimal');
  const payload = JSON.parse(hook());
  assert.match(payload.hookSpecificOutput.additionalContext, /Unity Studio protocol/);
  assert.match(payload.hookSpecificOutput.additionalContext, /Current studio status/);
});
