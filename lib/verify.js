const { loadConfig } = require('./context');
const { editorState } = require('./unity-cli');
const { checkCompile, checkTests } = require('./unity-checks');
const { checkSmoke } = require('./smoke-check');
const { checkRules } = require('./rule-checks');

const PLANS = {
  rules: ['rules'],
  compile: ['compile'],
  tests: ['compile', 'tests'],
  smoke: ['compile', 'smoke'],
  all: ['rules', 'compile', 'tests'],
  full: ['rules', 'compile', 'tests', 'smoke'],
};

const NEEDS_EDITOR = ['compile', 'tests', 'smoke'];

function runChecks(steps, options = {}) {
  const report = { ok: true, editor: null, checks: [] };
  for (const step of steps) {
    if (NEEDS_EDITOR.includes(step)) {
      report.editor = report.editor || editorState();
      if (report.editor !== 'ready') {
        report.checks.push({ name: step, ok: false, skipped: true, blocking: [], warnings: [`Unity Editor is ${report.editor}`], info: {} });
        report.ok = false;
        continue;
      }
    }
    const check = runStep(step, options);
    report.checks.push(check);
    if (!check.ok) report.ok = false;
    if (step === 'compile' && !check.ok) break;
  }
  return report;
}

function runStep(step, options) {
  const config = loadConfig();
  if (step === 'rules') return checkRules(config, options.files);
  if (step === 'compile') return checkCompile(config);
  if (step === 'tests') return checkTests(config, options.assemblies);
  return checkSmoke(config);
}

function formatReport(report) {
  const lines = [];
  for (const check of report.checks) {
    const state = check.skipped ? 'SKIP' : check.ok ? 'PASS' : 'FAIL';
    lines.push(`[${state}] ${check.name}${summarize(check)}`);
    for (const item of check.blocking) lines.push(`  x ${item}`);
    for (const item of check.warnings) lines.push(`  ! ${item}`);
  }
  return lines.join('\n');
}

function summarize(check) {
  if (check.name === 'tests' && check.info.assemblies) {
    const parts = Object.entries(check.info.assemblies).map(([name, s]) => `${name} ${s.Passed}/${s.Total}`);
    return parts.length ? ` (${parts.join(', ')})` : '';
  }
  if (check.name === 'smoke') {
    const i = check.info;
    const parts = [];
    if (i.sceneReachedAfterSec !== undefined) parts.push(`target scene after ${i.sceneReachedAfterSec}s`);
    if (i.loadedScenes) parts.push(`loaded: ${i.loadedScenes.join(',')}`);
    if (i.consoleErrors !== undefined) parts.push(`console errors: ${i.consoleErrors}`);
    if (i.missingScripts !== undefined) parts.push(`missing scripts: ${i.missingScripts}`);
    if (i.capture) parts.push(`capture: ${i.capture}`);
    return parts.length ? ` (${parts.join('; ')})` : '';
  }
  if (check.name === 'rules' && check.info.files) return ` (${check.info.files.length} files, ${check.info.renamed || 0} renamed)`;
  return '';
}

function parseList(argv, flag) {
  const index = argv.indexOf(flag);
  if (index < 0 || !argv[index + 1]) return undefined;
  return argv[index + 1].split(',').map(s => s.trim()).filter(Boolean);
}

function verify(mode, argv) {
  const steps = PLANS[mode];
  if (!steps) return null;
  const report = runChecks(steps, { assemblies: parseList(argv, '--assemblies'), files: parseList(argv, '--files') });
  process.stdout.write((argv.includes('--json') ? JSON.stringify(report, null, 2) : formatReport(report)) + '\n');
  if (report.checks.some(c => c.skipped)) return 2;
  return report.ok ? 0 : 1;
}

module.exports = { PLANS, runChecks, formatReport, verify };
