const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const g = require('./run-log-git');
const { isHarnessPath } = require('./harness-paths');

const NOISE_KINDS = ['asset', 'meta', 'settings'];

function snapshotTree() {
  const dirty = g.dirtyPaths().filter(p => !isHarnessPath(p));
  const hashes = g.hashFiles(dirty);
  const files = {};
  for (const file of dirty.sort()) files[file] = hashes[file] || 'absent';
  const head = g.head();
  const digest = crypto.createHash('sha1').update(head + JSON.stringify(files)).digest('hex');
  return { head, digest, files };
}

function diffTrees(before, after) {
  const paths = new Set([...Object.keys(before.files), ...Object.keys(after.files)]);
  const changed = [];
  for (const file of [...paths].sort()) {
    if (before.files[file] !== after.files[file]) changed.push(file);
  }
  if (before.head !== after.head) changed.unshift(`HEAD moved ${before.head.slice(0, 7)} -> ${after.head.slice(0, 7)}`);
  return changed;
}

function treeDir(runDir) {
  const dir = path.join(runDir, 'trees');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function recordTree(runDir, tag, compareTag, expect) {
  const snapshot = snapshotTree();
  fs.writeFileSync(path.join(treeDir(runDir), `${tag}.json`), JSON.stringify(snapshot, null, 2));
  const result = { tag, digest: snapshot.digest, dirtyCount: Object.keys(snapshot.files).length, compareTag: compareTag || null, changed: [], violation: false };
  if (!compareTag) return result;
  const previous = JSON.parse(fs.readFileSync(path.join(treeDir(runDir), `${compareTag}.json`), 'utf8'));
  result.changed = diffTrees(previous, snapshot);
  if (expect === 'readonly' && result.changed.length) {
    const serious = result.changed.filter(f => f.startsWith('HEAD moved') || !NOISE_KINDS.includes(g.kindOf(f)));
    const noise = result.changed.filter(f => !serious.includes(f));
    if (serious.length) {
      result.violation = true;
      appendEvent(runDir, { kind: 'guard-violation', step: tag, since: compareTag, changed: serious });
    }
    if (noise.length) appendEvent(runDir, { kind: 'unity-noise', step: tag, since: compareTag, changed: noise });
  }
  if (expect === 'write' && !result.changed.length) {
    appendEvent(runDir, { kind: 'no-changes', step: tag, since: compareTag });
  }
  return result;
}

function appendEvent(runDir, event) {
  const file = path.join(runDir, 'events.json');
  const events = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  events.push({ at: new Date().toISOString(), ...event });
  fs.writeFileSync(file, JSON.stringify(events, null, 2));
  return { events: events.length };
}

module.exports = { recordTree, appendEvent };
