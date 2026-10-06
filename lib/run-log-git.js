const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { projectRoot } = require('./context');

const MAX_COPY_BYTES = 512 * 1024;
const ASSET_EXT = ['.unity', '.prefab', '.asset', '.mat', '.anim', '.controller', '.overrideController', '.playable', '.shadergraph', '.spriteatlas', '.inputactions', '.json', '.png', '.jpg', '.psd', '.fbx', '.wav', '.mp3', '.ogg'];

function git(args, input) {
  const proc = spawnSync('git', ['-c', 'core.quotepath=off', ...args], {
    cwd: projectRoot(),
    encoding: 'utf8',
    input,
    maxBuffer: 256 * 1024 * 1024,
  });
  return proc.stdout || '';
}

function lines(text) {
  return text.split('\n').map(s => s.replace(/\r$/, '')).filter(Boolean);
}

function head() {
  return git(['rev-parse', 'HEAD']).trim();
}

function dirtyPaths() {
  return lines(git(['status', '--porcelain', '-uall', '-z', '--no-renames']).replace(/\0/g, '\n'))
    .map(row => row.slice(3))
    .filter(p => p && !p.endsWith('/'));
}

function untrackedPaths() {
  return lines(git(['ls-files', '--others', '--exclude-standard']));
}

function changedSince(commit) {
  return lines(git(['diff', '--name-only', '--no-renames', commit]));
}

function hashFiles(paths) {
  const existing = paths.filter(p => fs.existsSync(path.join(projectRoot(), p)) && fs.statSync(path.join(projectRoot(), p)).isFile());
  const hashes = existing.length ? lines(git(['hash-object', '--stdin-paths'], existing.join('\n') + '\n')) : [];
  const result = {};
  existing.forEach((p, i) => { result[p] = hashes[i]; });
  return result;
}

function blobAt(commit, file) {
  const out = git(['ls-tree', commit, '--', file]).trim();
  return out ? out.split(/\s+/)[2] : null;
}

function kindOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.cs' || ext === '.asmdef' || ext === '.asmref') return 'code';
  if (ext === '.meta') return 'meta';
  if (ASSET_EXT.includes(ext)) return 'asset';
  if (file.startsWith('ProjectSettings/') || file.startsWith('Packages/')) return 'settings';
  return 'other';
}

function copyBaselineFile(file, copyRoot) {
  const source = path.join(projectRoot(), file);
  if (fs.statSync(source).size > MAX_COPY_BYTES) return false;
  const target = path.join(copyRoot, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

function countLines(diffText) {
  let added = 0;
  let removed = 0;
  for (const row of diffText.split('\n')) {
    if (row.startsWith('+++') || row.startsWith('---')) continue;
    if (row.startsWith('+')) added++;
    else if (row.startsWith('-')) removed++;
  }
  return { added, removed, binary: /^Binary files /m.test(diffText) };
}

module.exports = {
  head, dirtyPaths, untrackedPaths, changedSince, hashFiles, blobAt,
  kindOf, copyBaselineFile, countLines,
};
