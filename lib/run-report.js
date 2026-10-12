const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./context');

const TEXT = {
  vi: {
    none: 'Không có',
    noDescription: '_(chưa mô tả)_',
    preExisting: '(đã có thay đổi trước run, chỉ ghi phần run này sửa)',
    defaultSuggestion: 'Xem lại, revert nếu không chủ ý',
    planLink: 'Chi tiết: [plan.md](plan.md)',
    harness: 'Harness',
    notRun: 'không chạy',
    review: 'Review',
    fixRounds: 'Vòng fix',
    stopped: 'Dừng sớm',
    capture: 'Capture',
    violation: 'Guard violation',
    noChanges: 'bước ghi không đổi file nào',
  },
  en: {
    none: 'None',
    noDescription: '_(not described)_',
    preExisting: '(already changed before the run, only this run\'s edits listed)',
    defaultSuggestion: 'Review, revert if unintended',
    planLink: 'Details: [plan.md](plan.md)',
    harness: 'Harness',
    notRun: 'not run',
    review: 'Review',
    fixRounds: 'Fix rounds',
    stopped: 'Stopped early',
    capture: 'Capture',
    violation: 'Guard violation',
    noChanges: 'write step changed no file',
  },
};

function cell(value) {
  return String(value === undefined || value === null ? '' : value).replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim();
}

function bullets(items, none) {
  const rows = (items || []).filter(Boolean);
  return rows.length ? rows.map(item => `- ${item}`).join('\n') : none;
}

function codeList(files) {
  return (files || []).map(f => `\`${f}\``).join(', ');
}

function header(facts, notes, changes) {
  return [
    `# ${notes.title || facts.task || 'Run report'}`,
    '',
    `- Run: ${facts.runId || path.basename(changes.runDir)} · Kết quả: ${facts.verdict || 'unknown'} · Baseline: ${String(changes.baselineHead || '').slice(0, 7)}`,
    `- Task: ${facts.task || ''}`,
  ].join('\n');
}

function summarySection(notes, events, t) {
  const violations = events.filter(e => e.kind === 'guard-violation')
    .map(e => `**${t.violation}** @ \`${e.step}\`: ${codeList(e.changed)}`);
  return `## Tóm tắt\n${bullets([...violations, ...(notes.summary || [])], t.none)}`;
}

function modelsSection(facts) {
  const rows = (facts.modelsUsed || []).map(u => `| ${cell(u.step)} | ${cell(u.model)} | ${cell(u.effort)} | ${u.calls || 1} | ${cell(u.note)} |`);
  return ['## Model đã dùng', '| Bước | Model | Effort | Lần gọi | Ghi chú |', '|---|---|---|---|---|', ...rows].join('\n');
}

function planSection(notes, runDir, t) {
  const lines = [notes.plan || ''];
  if (fs.existsSync(path.join(runDir, 'plan.md'))) lines.push('', t.planLink);
  return `## Plan\n${lines.join('\n').trim()}`;
}

function filesSection(changes, notes, t) {
  const described = notes.files || {};
  const rows = changes.files.map(f => {
    const name = f.from ? `\`${f.from}\` → \`${f.path}\`` : `\`${f.path}\``;
    const counts = f.binary ? 'binary' : `+${f.added}/-${f.removed}`;
    const text = [described[f.path] ? cell(described[f.path]) : t.noDescription, f.preExistingDirty ? t.preExisting : ''].filter(Boolean).join(' ');
    return `| ${name} | ${f.status} | ${f.kind} | ${counts} | ${text} |`;
  });
  if (!rows.length) return `## File thay đổi\n${t.none}`;
  return ['## File thay đổi', '| File | Trạng thái | Loại | +/- | Nội dung thay đổi |', '|---|---|---|---|---|', ...rows].join('\n');
}

function eventLine(event, t) {
  const where = `\`${event.step}\`${event.since ? ` (since \`${event.since}\`)` : ''}`;
  if (event.kind === 'no-changes') return `**no-changes** @ ${where}: ${t.noChanges}`;
  return `**${event.kind}** @ ${where}: ${codeList(event.changed)}`;
}

function eventsSection(events, t) {
  return `## Sự kiện guard\n${bullets(events.map(e => eventLine(e, t)), t.none)}`;
}

function checksSection(facts, t) {
  const lines = [];
  const v = facts.verification;
  if (v) {
    lines.push(`- ${t.harness}: **${v.verdict}**`);
    for (const row of String(v.checks || '').split('\n').filter(s => s.trim())) lines.push(`  - ${row.trim()}`);
    if (v.capture) lines.push(`- ${t.capture}: ${cell(v.capture)}`);
  } else {
    lines.push(`- ${t.harness}: ${t.notRun}`);
  }
  const findings = facts.review || [];
  const count = s => findings.filter(f => f.severity === s).length;
  lines.push(`- ${t.review}: ${count('blocker')} blocker, ${count('major')} major, ${count('minor')} minor`);
  for (const f of findings) lines.push(`  - [${f.severity}] \`${f.file}${f.line ? `:${f.line}` : ''}\` ${cell(`${f.rule || ''} ${f.problem}`)}`);
  lines.push(`- ${t.fixRounds}: ${facts.fixRounds || 0}`);
  if (facts.stopReason) lines.push(`- ${t.stopped}: ${cell(facts.stopReason)}`);
  return `## Kiểm tra\n${lines.join('\n')}`;
}

function issueLine(issue) {
  const where = issue.file ? ` \`${issue.file}${issue.line ? `:${issue.line}` : ''}\`` : '';
  return `[${issue.source || 'issue'}]${where} ${cell(issue.message)}`;
}

function remainingSection(facts, t) {
  return `## Vấn đề còn lại\n${bullets((facts.remainingIssues || []).map(issueLine), t.none)}`;
}

function unityFilesSection(events, facts, notes, t) {
  const suggestions = notes.unityFiles || {};
  const files = new Set(Object.keys(suggestions));
  for (const e of events.filter(e => e.kind === 'unity-noise')) (e.changed || []).forEach(f => files.add(f));
  for (const f of (facts.verification && facts.verification.unityNoise) || []) files.add(f);
  const rows = [...files].sort().map(f => `\`${f}\`: ${cell(suggestions[f] || t.defaultSuggestion)}`);
  return `## File Unity tự sinh\n${bullets(rows, t.none)}`;
}

function render(runDir, changes, facts, notes) {
  const t = TEXT[loadConfig().language] || TEXT.vi;
  const events = changes.events || [];
  return [
    header(facts, notes, changes),
    summarySection(notes, events, t),
    modelsSection(facts),
    planSection(notes, runDir, t),
    filesSection(changes, notes, t),
    eventsSection(events, t),
    checksSection(facts, t),
    remainingSection(facts, t),
    unityFilesSection(events, facts, notes, t),
  ].join('\n\n') + '\n';
}

function validate(changes, notes) {
  const described = notes.files || {};
  const known = new Set(changes.files.map(f => f.path));
  const missingFields = ['title', 'summary', 'plan'].filter(k => !notes[k] || (Array.isArray(notes[k]) && !notes[k].length));
  return {
    missingFields,
    missingDescriptions: changes.files.filter(f => !String(described[f.path] || '').trim()).map(f => f.path),
    unknownPaths: Object.keys(described).filter(p => !known.has(p)),
  };
}

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function writeReport(runDir, changes, input) {
  const factsFile = path.join(runDir, 'facts.json');
  const notesFile = path.join(runDir, 'notes.json');
  if (input.facts) fs.writeFileSync(factsFile, JSON.stringify(input.facts, null, 2));
  if (input.notes) fs.writeFileSync(notesFile, JSON.stringify(input.notes, null, 2));
  const facts = readJson(factsFile);
  const notes = readJson(notesFile);
  if (!facts) throw new Error('no facts: pass {"facts": ...} once');
  if (!notes) throw new Error('no notes: pass {"notes": ...}');
  fs.writeFileSync(path.join(runDir, 'report.md'), render(runDir, changes, facts, notes));
  return validate(changes, notes);
}

module.exports = { writeReport };
