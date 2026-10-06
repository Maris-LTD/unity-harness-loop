const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { projectRoot } = require('./context');
const { newResult, finish } = require('./unity-checks');
const { renameMap, diffRenamed } = require('./git-renames');

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
  const tracked = git(['diff', 'HEAD', '--name-only', '--', '*.cs']).split('\n');
  const untracked = git(['ls-files', '--others', '--exclude-standard', '--', '*.cs']).split('\n');
  return [...new Set([...tracked, ...untracked].map(f => f.trim()).filter(Boolean))];
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
    return text.split(/\r?\n/).map((content, i) => ({ line: i + 1, content }));
  }
  const lines = [];
  let cursor = 0;
  for (const row of diffText(file, renames).split('\n')) {
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
  const text = git(['show', `HEAD:${source}`]);
  return text ? text.split(/\r?\n/).length : 0;
}

function checkLines(file, lines, rules, result) {
  for (const { line, content } of lines) {
    const code = content.replace(STRING_LITERAL, '""');
    const where = `${file}:${line}`;
    if (rules.noComments && COMMENT.test(code)) result.blocking.push(`${where} new comment (rule: no comments): ${content.trim()}`);
    if (rules.noDebugLog && DEBUG_LOG.test(code)) result.blocking.push(`${where} new Debug.Log* (rule: no debug logs): ${content.trim()}`);
    if (rules.compareTag && TAG_COMPARE.test(code)) result.blocking.push(`${where} tag compared with ==, use CompareTag: ${content.trim()}`);
  }
}

function checkLength(file, maxLines, result, renames) {
  if (!maxLines) return;
  const absolute = path.join(projectRoot(), file);
  const now = fs.readFileSync(absolute, 'utf8').split(/\r?\n/).length;
  if (now <= maxLines) return;
  const before = headLineCount(file, renames);
  const message = `${file} has ${now} lines (limit ${maxLines})`;
  if (before > maxLines && now <= before) result.warnings.push(`${message}, already over before this change`);
  else result.blocking.push(`${message}, split it into smaller components`);
}

function checkRules(config, onlyFiles) {
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
  for (const file of files) {
    checkLines(file, addedLines(file, renames), rules, result);
    checkLength(file, rules.maxLines, result, renames);
  }
  return finish(result);
}

module.exports = { checkRules, changedCsFiles };
