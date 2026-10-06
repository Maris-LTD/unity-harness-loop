const fs = require('fs');
const path = require('path');
const g = require('./run-log-git');
const { diffFiles, blobToTemp } = require('./git-renames');
const { recordTree, appendEvent } = require('./tree-guard');
const { projectRoot, dataDir } = require('./context');

const runsDir = () => path.join(dataDir(), 'runs');
const { isHarnessPath } = require('./harness-paths');
const MAX_FILE_DIFF = 200 * 1024;
const WRITABLE = ['plan.md', 'report.md', 'audit.md'];

function stamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function rel(p) {
  return path.relative(projectRoot(), p).replace(/\\/g, '/');
}

function resolveRunDir(arg) {
  const dir = path.isAbsolute(arg) ? arg : path.join(projectRoot(), arg);
  if (!fs.existsSync(path.join(dir, 'baseline.json'))) throw new Error(`no baseline.json in ${arg}`);
  return dir;
}

function baseline(slug) {
  const runId = `${stamp()}-${(slug || 'run').replace(/[^a-z0-9-]/gi, '-').slice(0, 40)}`;
  const runDir = path.join(runsDir(), runId);
  const copyRoot = path.join(runDir, 'baseline-files');
  fs.mkdirSync(runDir, { recursive: true });
  const dirty = g.dirtyPaths().filter(p => !isHarnessPath(p));
  const hashes = g.hashFiles(dirty);
  const state = { createdAt: new Date().toISOString(), head: g.head(), dirty: {}, copies: [] };
  for (const file of dirty) {
    state.dirty[file] = hashes[file] || 'absent';
    if (hashes[file] && g.copyBaselineFile(file, copyRoot)) state.copies.push(file);
  }
  fs.writeFileSync(path.join(runDir, 'baseline.json'), JSON.stringify(state, null, 2));
  recordTree(runDir, 'start');
  return { runId, runDir: rel(runDir), preExistingDirty: dirty.length };
}

function baseSource(file, base, runDir) {
  if (file in base.dirty) {
    return base.copies.includes(file) ? { path: path.join(runDir, 'baseline-files', file), cleanup() {} } : null;
  }
  const blob = blobToTemp(base.head, file);
  return { path: blob.target, cleanup: blob.cleanup };
}

function diffBetween(fromFile, toFile, base, runDir, fromState, toState) {
  const source = fromState === 'absent' ? { path: '/dev/null', cleanup() {} } : baseSource(fromFile, base, runDir);
  if (!source) return null;
  try {
    const target = toState === 'absent' ? '/dev/null' : path.join(projectRoot(), toFile);
    const text = diffFiles(source.path, target, 3, { from: fromFile, to: toFile });
    if (text || fromFile === toFile) return text;
    return `diff --git a/${fromFile} b/${toFile}\nsimilarity index 100%\nrename from ${fromFile}\nrename to ${toFile}\n`;
  } finally {
    source.cleanup();
  }
}

function pairRenames(entries) {
  const deleted = entries.filter(e => e.status === 'deleted');
  const used = new Set();
  for (const added of entries.filter(e => e.status === 'added')) {
    const free = deleted.filter(d => !used.has(d));
    const sameContent = free.find(d => d.baseState === added.currentState);
    const sameName = free.filter(d => path.posix.basename(d.path) === path.posix.basename(added.path));
    const match = sameContent || (sameName.length === 1 ? sameName[0] : null);
    if (!match) continue;
    used.add(match);
    Object.assign(added, { status: 'renamed', from: match.path, baseState: match.baseState, preExistingDirty: added.preExistingDirty || match.preExistingDirty });
  }
  return entries.filter(e => !used.has(e));
}

function collectEntries(base) {
  const candidates = [...new Set([...g.changedSince(base.head), ...g.untrackedPaths(), ...Object.keys(base.dirty)])]
    .filter(p => !isHarnessPath(p))
    .sort();
  const current = g.hashFiles(candidates);
  const entries = [];
  for (const file of candidates) {
    const baseState = file in base.dirty ? base.dirty[file] : g.blobAt(base.head, file) || 'absent';
    const currentState = current[file] || 'absent';
    if (baseState === currentState) continue;
    const status = baseState === 'absent' ? 'added' : currentState === 'absent' ? 'deleted' : 'modified';
    entries.push({ path: file, status, baseState, currentState, preExistingDirty: file in base.dirty });
  }
  return pairRenames(entries);
}

function changes(runArg) {
  const runDir = resolveRunDir(runArg);
  const base = JSON.parse(fs.readFileSync(path.join(runDir, 'baseline.json'), 'utf8'));
  const files = [];
  const diffs = [];
  for (const entry of collectEntries(base)) {
    const from = entry.from || entry.path;
    let diff = diffBetween(from, entry.path, base, runDir, entry.baseState, entry.currentState);
    const counts = diff ? g.countLines(diff) : { added: 0, removed: 0, binary: false };
    if (diff && diff.length > MAX_FILE_DIFF) diff = `diff for ${entry.path} truncated (${diff.length} bytes)\n`;
    if (diff) diffs.push(diff);
    const record = { path: entry.path, status: entry.status, kind: g.kindOf(entry.path), ...counts, diffAvailable: Boolean(diff), preExistingDirty: entry.preExistingDirty };
    if (entry.from) record.from = entry.from;
    files.push(record);
  }
  const totals = { files: files.length, added: 0, removed: 0, byKind: {}, byStatus: {} };
  for (const f of files) {
    totals.added += f.added;
    totals.removed += f.removed;
    totals.byKind[f.kind] = (totals.byKind[f.kind] || 0) + 1;
    totals.byStatus[f.status] = (totals.byStatus[f.status] || 0) + 1;
  }
  const eventsFile = path.join(runDir, 'events.json');
  const events = fs.existsSync(eventsFile) ? JSON.parse(fs.readFileSync(eventsFile, 'utf8')) : [];
  const result = { runDir: rel(runDir), baselineHead: base.head, currentHead: g.head(), files, totals, events };
  fs.writeFileSync(path.join(runDir, 'changes.json'), JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(runDir, 'changes.diff'), diffs.join('\n'));
  return result;
}

function write(runArg, name, fromFile) {
  if (!WRITABLE.includes(name)) throw new Error(`only ${WRITABLE.join(', ')} can be written`);
  const runDir = resolveRunDir(runArg);
  const content = fromFile ? fs.readFileSync(path.resolve(projectRoot(), fromFile), 'utf8') : fs.readFileSync(0, 'utf8');
  if (!content.trim()) throw new Error('empty content');
  const target = path.join(runDir, name);
  fs.writeFileSync(target, content.endsWith('\n') ? content : `${content}\n`);
  return { written: rel(target), bytes: Buffer.byteLength(content) };
}

function finalize(runArg, verdict, audit) {
  const runDir = resolveRunDir(runArg);
  const reportPath = path.join(runDir, 'report.md');
  const title = fs.existsSync(reportPath) ? (fs.readFileSync(reportPath, 'utf8').match(/^#\s+(.+)$/m) || [])[1] || '' : '';
  const summary = JSON.parse(fs.readFileSync(path.join(runDir, 'changes.json'), 'utf8'));
  const violations = summary.events.filter(e => e.kind === 'guard-violation').length;
  const indexPath = path.join(runsDir(), 'INDEX.md');
  if (!fs.existsSync(indexPath)) fs.writeFileSync(indexPath, '| Run | Verdict | Log audit | Guard | Files | +/- | Title |\n|---|---|---|---|---|---|---|\n');
  const name = path.basename(runDir);
  const guard = violations ? `${violations} violation(s)` : 'clean';
  fs.appendFileSync(indexPath, `| [${name}](${name}/report.md) | ${verdict} | ${audit} | ${guard} | ${summary.totals.files} | +${summary.totals.added}/-${summary.totals.removed} | ${title.replace(/\|/g, '/')} |\n`);
  return { index: rel(indexPath), runDir: rel(runDir) };
}

function option(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

const USAGE = [
  'baseline --slug <slug>',
  'changes <runDir>',
  'tree <runDir> --tag <tag> [--compare <tag> --expect readonly|write]',
  'write <runDir> <plan.md|report.md|audit.md> [--from <file>]   (else stdin)',
  'event <runDir> --kind <kind> --step <step>',
  'finalize <runDir> --verdict <v> --audit <a>',
].join('\n  ');

function main(argv) {
  const [command, target] = argv;
  if (command === 'baseline') return baseline(option(argv, '--slug'));
  if (command === 'changes') return changes(target);
  if (command === 'tree') return recordTree(resolveRunDir(target), option(argv, '--tag'), option(argv, '--compare'), option(argv, '--expect'));
  if (command === 'write') return write(target, argv[2], option(argv, '--from'));
  if (command === 'event') return appendEvent(resolveRunDir(target), { kind: option(argv, '--kind'), step: option(argv, '--step') });
  if (command === 'finalize') return finalize(target, option(argv, '--verdict') || 'unknown', option(argv, '--audit') || 'unknown');
  throw new Error(`usage: unity-harness run-log <command>\n  ${USAGE}`);
}

function runLog(argv) {
  try {
    process.stdout.write(JSON.stringify(main(argv), null, 2) + '\n');
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

module.exports = { runLog };
