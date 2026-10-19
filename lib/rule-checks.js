const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { projectRoot } = require('./context');
const { newResult, finish } = require('./unity-checks');
const { renameMap, diffRenamed, diffFiles } = require('./git-renames');
const { hashFiles } = require('./run-log-git');

const STRING_LITERAL = /\$?@?"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])'/g;
const COMMENT = /\/\/|\/\*/;
const DEBUG_LOG = /\bDebug\.(Log|LogWarning|LogError|LogFormat|LogException)\s*\(/;
const TAG_COMPARE = /\.tag\s*[!=]=/;

function git(args) {
  try {
    return execFileSync('git', args, { cwd: projectRoot(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return '';
  }
}

function toRepoPath(file) {
  const absolute = path.isAbsolute(file) ? file : path.join(projectRoot(), file);
  return path.relative(projectRoot(), absolute).replace(/\\/g, '/');
}

function changedCsFiles() {
  const tracked = git(['diff', 'HEAD', '--name-only', '--relative', '--', '*.cs']).split('\n');
  const untracked = git(['ls-files', '--others', '--exclude-standard', '--', '*.cs']).split('\n');
  return [...new Set([...tracked, ...untracked].map(f => f.trim()).filter(Boolean))];
}

function splitLines(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function isTracked(file) {
  return git(['ls-files', '--', file]).trim().length > 0;
}

function diffText(file, renames) {
  if (renames.has(file)) return diffRenamed('HEAD', renames.get(file), file, 0);
  return git(['diff', 'HEAD', '-U0', '--', file]);
}

function addedLines(file, renames) {
  if (!renames.has(file) && !isTracked(file)) {
    const text = fs.readFileSync(path.join(projectRoot(), file), 'utf8');
    return splitLines(text).map((content, i) => ({ line: i + 1, content }));
  }
  return parseAddedLines(diffText(file, renames));
}

function parseAddedLines(text) {
  const lines = [];
  let cursor = 0;
  for (const row of text.split('\n')) {
    const hunk = row.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunk) {
      cursor = Number(hunk[1]);
      continue;
    }
    if (row.startsWith('+') && !row.startsWith('+++')) lines.push({ line: cursor++, content: row.slice(1) });
  }
  return lines;
}

function headLineCount(file, renames) {
  const source = renames.has(file) ? renames.get(file) : file;
  return splitLines(git(['show', `HEAD:./${source}`])).length;
}

function removedLines() {
  const pool = new Map();
  for (const row of git(['diff', 'HEAD', '-U0', '--no-renames', '--relative', '--', '*.cs']).split('\n')) {
    if (!row.startsWith('-') || row.startsWith('---')) continue;
    const key = row.slice(1).trim();
    pool.set(key, (pool.get(key) || 0) + 1);
  }
  return pool;
}

function takeMoved(pool, content) {
  const key = content.trim();
  const left = pool.get(key) || 0;
  if (!left) return false;
  pool.set(key, left - 1);
  return true;
}

function checkLines(file, lines, rules, result, pool) {
  for (const { line, content } of lines) {
    const code = content.replace(STRING_LITERAL, '""');
    const flagged = (rules.noComments && COMMENT.test(code)) || (rules.noDebugLog && DEBUG_LOG.test(code)) || (rules.compareTag && TAG_COMPARE.test(code));
    if (!flagged) continue;
    if (takeMoved(pool, content)) {
      result.info.moved += 1;
      continue;
    }
    const where = `${file}:${line}`;
    if (rules.noComments && COMMENT.test(code)) result.blocking.push(`${where} new comment (rule: no comments): ${content.trim()}`);
    if (rules.noDebugLog && DEBUG_LOG.test(code)) result.blocking.push(`${where} new Debug.Log* (rule: no debug logs): ${content.trim()}`);
    if (rules.compareTag && TAG_COMPARE.test(code)) result.blocking.push(`${where} tag compared with ==, use CompareTag: ${content.trim()}`);
  }
}

function loadBaseline(sinceRun, result) {
  if (!sinceRun) return null;
  const runDir = path.isAbsolute(sinceRun) ? sinceRun : path.join(projectRoot(), sinceRun);
  const file = path.join(runDir, 'baseline.json');
  if (!fs.existsSync(file)) {
    result.warnings.push(`no baseline.json in ${sinceRun}, checking against HEAD`);
    return null;
  }
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { runDir, dirty: state.dirty || {}, copies: new Set(state.copies || []) };
}

function baselineSource(base, file) {
  if (!base || !(file in base.dirty)) return null;
  const before = base.dirty[file];
  if (before !== 'absent' && hashFiles([file])[file] === before) return { unchanged: true };
  if (base.copies.has(file)) return { copy: path.join(base.runDir, 'baseline-files', file) };
  return null;
}

function checkLength(file, maxLines, result, renames, copy) {
  if (!maxLines) return;
  const absolute = path.join(projectRoot(), file);
  const now = splitLines(fs.readFileSync(absolute, 'utf8')).length;
  if (now <= maxLines) return;
  const before = copy ? splitLines(fs.readFileSync(copy, 'utf8')).length : headLineCount(file, renames);
  const message = `${file} has ${now} lines (limit ${maxLines})`;
  if (before > maxLines && now <= before) result.warnings.push(`${message}, already over before this change`);
  else result.blocking.push(`${message}, split it into smaller components`);
}

function checkRules(config, onlyFiles, sinceRun) {
  const result = newResult('rules');
  const rules = config.rules;
  const candidates = onlyFiles && onlyFiles.length ? onlyFiles.map(toRepoPath) : changedCsFiles();
  const files = candidates.filter(f =>
    f.endsWith('.cs') &&
    fs.existsSync(path.join(projectRoot(), f)) &&
    rules.includePaths.some(p => f.startsWith(p)));
  const renames = renameMap('HEAD');
  result.info.files = files;
  result.info.renamed = files.filter(f => renames.has(f)).length;
  result.info.moved = 0;
  result.info.preExisting = 0;
  const pool = removedLines();
  const base = loadBaseline(sinceRun, result);
  for (const file of files) {
    const since = baselineSource(base, file);
    if (since && since.unchanged) {
      result.info.preExisting += 1;
      continue;
    }
    const added = since ? parseAddedLines(diffFiles(since.copy, path.join(projectRoot(), file), 0)) : addedLines(file, renames);
    checkLines(file, added, rules, result, pool);
    checkLength(file, rules.maxLines, result, renames, since && since.copy);
  }
  return finish(result);
}

module.exports = { checkRules, changedCsFiles };
