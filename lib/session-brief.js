const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { projectRoot, dataDir, hasConfig } = require('./context');
const { resolveStudio, isStudioProject } = require('./studio');
const { collectStatus } = require('./studio-status');

const MAX_FILES = 25;

function git(args) {
  const proc = spawnSync('git', ['-c', 'core.quotepath=off', ...args], { cwd: projectRoot(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return proc.status === 0 ? proc.stdout || '' : null;
}

function lines(text) {
  return (text || '').split('\n').map(s => s.replace(/\r$/, '')).filter(Boolean);
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function modified(file) {
  try {
    return fs.statSync(file).mtime.toISOString();
  } catch {
    return '';
  }
}

function commit(line) {
  const [hash, date, ...subject] = line.split('\t');
  return { hash, date, subject: subject.join('\t') };
}

function parseCheckpoint(rel) {
  const text = readText(path.join(projectRoot(), rel));
  if (text === null) return { file: rel, exists: false, hasMarkers: false, fields: {} };
  const block = text.match(/<!-- CHECKPOINT -->([\s\S]*?)<!-- \/CHECKPOINT -->/);
  const fields = {};
  for (const line of lines(block ? block[1] : '')) {
    const match = line.match(/^\s*[-*]?\s*\**([A-Za-z][A-Za-z ]*?)\**\s*:\s*(.*)$/);
    if (match) fields[match[1].trim()] = match[2].trim();
  }
  return { file: rel, exists: true, hasMarkers: Boolean(block), fields };
}

function gitFacts(checkpointRel) {
  if (git(['rev-parse', '--is-inside-work-tree']) === null) return { available: false };
  const format = '--format=%h%x09%cI%x09%s';
  const status = lines(git(['status', '--porcelain=v1', '--', '.']));
  const changed = status.filter(l => !l.startsWith('??')).map(l => l.slice(3));
  const untracked = status.filter(l => l.startsWith('??')).map(l => l.slice(3));
  const anchor = (git(['log', '-1', '--format=%h', '--', checkpointRel]) || '').trim();
  const written = modified(path.join(projectRoot(), checkpointRel));
  const prefix = (git(['rev-parse', '--show-prefix']) || '').trim();
  const checkpointPath = path.posix.join(prefix, checkpointRel);
  const checkpointUncommitted = changed.includes(checkpointPath) || untracked.includes(checkpointPath);
  let since = [];
  if (anchor && !checkpointUncommitted) since = lines(git(['log', format, `${anchor}..HEAD`]));
  else if (written) since = lines(git(['log', format, `--since=${written}`]));
  const counts = (git(['rev-list', '--left-right', '--count', '@{upstream}...HEAD']) || '').trim().split(/\s+/);
  return {
    available: true,
    branch: (git(['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim(),
    head: commit((git(['log', '-1', format]) || '').trim()),
    recent: lines(git(['log', '-5', format])).map(commit),
    changed: changed.slice(0, MAX_FILES),
    changedCount: changed.length,
    untracked: untracked.slice(0, MAX_FILES),
    untrackedCount: untracked.length,
    checkpointCommit: anchor,
    checkpointWritten: written,
    checkpointUncommitted,
    commitsAfterCheckpoint: since.map(commit).map(c => ({ ...c, minutesAfterCheckpoint: written ? Math.round((Date.parse(c.date) - Date.parse(written)) / 60000) : null })),
    upstream: counts.length === 2 ? { behind: Number(counts[0]), ahead: Number(counts[1]) } : null,
  };
}

function runFacts(limit) {
  const dir = path.join(dataDir(), 'runs');
  const rel = name => path.posix.join('.unity-harness', 'runs', name);
  const rows = lines(readText(path.join(dir, 'INDEX.md'))).filter(l => l.startsWith('| [')).map(l => {
    const cells = l.split('|').slice(1, -1).map(s => s.trim());
    const name = (cells[0].match(/^\[([^\]]+)\]/) || [])[1] || '';
    return { run: rel(name), verdict: cells[1] || '', audit: cells[2] || '', guard: cells[3] || '', title: cells[6] || '', report: rel(`${name}/report.md`) };
  });
  const indexed = new Set(rows.map(r => r.run));
  let dirs = [];
  try {
    dirs = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => rel(e.name)).sort();
  } catch {
    dirs = [];
  }
  return { total: rows.length, recent: rows.slice(-limit), unfinished: dirs.filter(d => !indexed.has(d)) };
}

function tail(rel, count) {
  const text = readText(path.join(projectRoot(), rel));
  return { file: rel, exists: text !== null, last: lines(text).slice(-count) };
}

function claudeMemoryDir() {
  const config = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return path.join(config, 'projects', projectRoot().replace(/[^A-Za-z0-9]/g, '-'), 'memory');
}

function describeMemory(dir) {
  let files = [];
  try {
    files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  } catch {
    return null;
  }
  if (!files.length) return null;
  return {
    dir,
    index: files.includes('MEMORY.md'),
    files: files.map(f => ({ file: f, modified: fs.statSync(path.join(dir, f)).mtime.toISOString().slice(0, 10) })),
  };
}

function memoryFacts() {
  const repoDir = path.join(projectRoot(), '.claude', 'memory');
  const agentDir = claudeMemoryDir();
  let linked = false;
  try {
    linked = fs.realpathSync(agentDir) === fs.realpathSync(repoDir);
  } catch {
    linked = false;
  }
  return { repo: describeMemory(repoDir), agent: linked ? null : describeMemory(agentDir), linked };
}

function studioFacts(studio) {
  const s = collectStatus(studio);
  return {
    onboarded: isStudioProject(),
    rigor: s.rigor,
    workflow: studio.workflow,
    automation: s.automation,
    stage: s.stage,
    stories: s.stories,
    inProgress: s.inProgress,
    blocked: s.blocked,
    nextReadyStory: s.nextReadyStory,
    activeStory: s.activeStory,
  };
}

function signals(brief) {
  const out = [];
  const add = (code, detail) => out.push({ code, detail });
  const cp = brief.checkpoint;
  const g = brief.git;
  if (!cp.exists) add('no-checkpoint', `${cp.file} does not exist`);
  else if (!cp.hasMarkers) add('checkpoint-no-markers', `${cp.file} has no CHECKPOINT block`);
  if (g.available) {
    if (g.commitsAfterCheckpoint.length) add('commits-after-checkpoint', `${g.commitsAfterCheckpoint.length}: ${g.commitsAfterCheckpoint.slice(0, 5).map(c => `${c.hash} ${c.subject}${c.minutesAfterCheckpoint === null ? '' : ` (+${c.minutesAfterCheckpoint} min)`}`).join('; ')}`);
    if (g.checkpointUncommitted) add('checkpoint-uncommitted', `${cp.file} has uncommitted edits`);
    if (cp.fields.Branch && g.branch && cp.fields.Branch !== g.branch) add('branch-changed', `checkpoint ${cp.fields.Branch}, now ${g.branch}`);
    if (g.changedCount || g.untrackedCount) add('uncommitted-changes', `${g.changedCount} changed, ${g.untrackedCount} untracked`);
    if (g.upstream && g.upstream.behind) add('behind-upstream', `${g.upstream.behind} commit(s) behind (as of the last fetch)`);
  }
  if (brief.runs.unfinished.length) add('unfinished-runs', brief.runs.unfinished.join(', '));
  const last = brief.runs.recent[brief.runs.recent.length - 1];
  if (last && last.verdict !== 'pass') add('last-run-not-pass', `${last.run}: ${last.verdict}`);
  const st = brief.studio;
  if (st && /\.md\b/.test(st.activeStory) && !st.inProgress.includes(st.activeStory)) add('active-story-not-in-progress', st.activeStory);
  if (!brief.memory.repo && !brief.memory.agent) add('no-memory', 'no .claude/memory and no agent memory for this project');
  return out;
}

function collectBrief(runLimit = 3) {
  const studio = resolveStudio();
  const checkpoint = parseCheckpoint(studio.paths.sessionState);
  const brief = {
    projectRoot: projectRoot(),
    hasConfig: hasConfig(),
    language: studio.language,
    checkpoint,
    git: gitFacts(studio.paths.sessionState),
    runs: runFacts(runLimit),
    decisionLog: tail(studio.paths.decisionLog, 5),
    memory: memoryFacts(),
    studio: hasConfig() ? studioFacts(studio) : null,
  };
  brief.signals = signals(brief);
  return brief;
}

function formatBrief(b) {
  const rows = [`Project: ${b.projectRoot}${b.hasConfig ? '' : ' (no .unity-harness/config.json)'}`];
  const f = b.checkpoint.fields;
  rows.push(b.checkpoint.exists ? `Checkpoint ${b.checkpoint.file}: updated ${f.Updated || '?'} | story ${f['Current story'] || '?'} | next ${f['Next step'] || '?'}` : `Checkpoint: missing (${b.checkpoint.file})`);
  if (b.git.available) {
    rows.push(`Git: ${b.git.branch} @ ${b.git.head.hash} ${b.git.head.date.slice(0, 10)} ${b.git.head.subject}`);
    rows.push(`  ${b.git.commitsAfterCheckpoint.length} commit(s) after checkpoint | ${b.git.changedCount} changed, ${b.git.untrackedCount} untracked`);
  } else rows.push('Git: not a repository');
  for (const r of b.runs.recent) rows.push(`Run ${r.verdict}/${r.audit}: ${r.title || r.run}`);
  if (b.studio) rows.push(`Studio: rigor ${b.studio.rigor}, stage ${b.studio.stage} | in progress ${b.studio.inProgress.join(', ') || 'none'} | next ready ${b.studio.nextReadyStory || 'none'}`);
  const mem = b.memory.repo || b.memory.agent;
  rows.push(mem ? `Memory: ${mem.files.length} file(s) in ${mem.dir}${b.memory.linked ? ' (linked)' : ''}` : 'Memory: none');
  rows.push(b.signals.length ? 'Signals:' : 'Signals: none');
  for (const s of b.signals) rows.push(`  - ${s.code}: ${s.detail}`);
  return rows.join('\n');
}

function session(argv) {
  const [sub, ...rest] = argv;
  if (sub !== 'brief') {
    process.stderr.write('usage: unity-harness session brief [--json] [--runs N]\n');
    return 64;
  }
  const index = rest.indexOf('--runs');
  const limit = index >= 0 ? Number(rest[index + 1]) : 3;
  if (!Number.isInteger(limit) || limit < 1) {
    process.stderr.write('--runs must be a positive integer\n');
    return 64;
  }
  const brief = collectBrief(limit);
  process.stdout.write((rest.includes('--json') ? JSON.stringify(brief, null, 2) : formatBrief(brief)) + '\n');
  return 0;
}

module.exports = { session, collectBrief };
