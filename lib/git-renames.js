const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { projectRoot } = require('./context');

function run(args, input) {
  const proc = spawnSync('git', ['-c', 'core.quotepath=off', ...args], {
    cwd: projectRoot(),
    encoding: 'utf8',
    input,
    maxBuffer: 256 * 1024 * 1024,
  });
  return proc.stdout || '';
}

function splitZ(text) {
  return text.split('\0').filter(Boolean);
}

function existsNow(file) {
  return fs.existsSync(path.join(projectRoot(), file));
}

function trackedRenames(ref) {
  const pairs = new Map();
  const tokens = splitZ(run(['diff', ref, '-M', '--name-status', '-z']));
  for (let i = 0; i < tokens.length; i++) {
    const status = tokens[i];
    if (status.startsWith('R') || status.startsWith('C')) {
      if (status.startsWith('R')) pairs.set(tokens[i + 2], tokens[i + 1]);
      i += 2;
    } else {
      i += 1;
    }
  }
  return pairs;
}

function deletedSince(ref) {
  return splitZ(run(['diff', ref, '--name-only', '--diff-filter=D', '-z']));
}

function untrackedFiles() {
  return splitZ(run(['ls-files', '--others', '--exclude-standard', '-z']));
}

function pairByName(added, deleted, pairs) {
  const taken = new Set(pairs.values());
  const byName = new Map();
  for (const file of deleted) {
    if (taken.has(file)) continue;
    const key = path.posix.basename(file);
    byName.set(key, byName.has(key) ? null : file);
  }
  for (const file of added) {
    if (pairs.has(file)) continue;
    const match = byName.get(path.posix.basename(file));
    if (match) {
      pairs.set(file, match);
      byName.set(path.posix.basename(file), null);
    }
  }
  return pairs;
}

function renameMap(ref = 'HEAD') {
  const pairs = trackedRenames(ref);
  return pairByName(untrackedFiles().filter(existsNow), deletedSince(ref), pairs);
}

function blobToTemp(ref, file) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-'));
  const target = path.join(dir, path.posix.basename(file));
  const proc = spawnSync('git', ['show', `${ref}:${file}`], { cwd: projectRoot(), maxBuffer: 256 * 1024 * 1024 });
  fs.writeFileSync(target, proc.stdout || Buffer.alloc(0));
  return { target, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function diffFiles(fromPath, toPath, unified, labels) {
  const proc = spawnSync('git', ['diff', '--no-index', '--no-color', '-M', `-U${unified}`, fromPath, toPath], {
    cwd: projectRoot(),
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  const text = proc.stdout || '';
  return labels ? relabel(text, labels) : text;
}

function relabel(text, labels) {
  const out = [];
  for (const row of text.split('\n')) {
    if (row.startsWith('diff --git ')) {
      out.push(`diff --git a/${labels.from} b/${labels.to}`);
      if (labels.from !== labels.to) out.push(`rename from ${labels.from}`, `rename to ${labels.to}`);
    } else if (row.startsWith('--- ') && !row.startsWith('--- /dev/null')) {
      out.push(`--- a/${labels.from}`);
    } else if (row.startsWith('+++ ') && !row.startsWith('+++ /dev/null')) {
      out.push(`+++ b/${labels.to}`);
    } else {
      out.push(row);
    }
  }
  return out.join('\n');
}

function diffRenamed(ref, oldPath, newPath, unified) {
  const blob = blobToTemp(ref, oldPath);
  try {
    return diffFiles(blob.target, path.join(projectRoot(), newPath), unified, { from: oldPath, to: newPath });
  } finally {
    blob.cleanup();
  }
}

module.exports = { renameMap, diffFiles, diffRenamed, blobToTemp };
