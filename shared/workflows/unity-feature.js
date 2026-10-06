export const meta = {
  name: 'unity-feature',
  description: 'Plan, implement, verify (Unity harness + rule review), auto-fix and log a Unity feature, routing each step to a fitting model and guarding read-only steps',
  whenToUse: 'Medium or large Unity C# feature/refactor that must end compiled, tested, reviewed and logged. Needs the unity-harness CLI and .unity-harness/config.json in the project. args: {task, planOnly?, planFile?, smoke?, assemblies?, maxFixRounds?, maxLogFixes?, models?, agentPrefix?}',
  phases: [
    { title: 'Init', detail: 'git baseline + working-tree fingerprint', model: 'haiku' },
    { title: 'Plan', detail: 'plan.md + complexity (or load an approved plan, read-only)' },
    { title: 'Implement', detail: 'model picked from plan complexity' },
    { title: 'Verify', detail: 'unity-verifier and unity-reviewer, read-only guarded' },
    { title: 'Fix', detail: 'sonnet first, escalate to session model' },
    { title: 'Log', detail: 'report.md from git diff (rename-aware), independent audit' },
  ],
}

const input = typeof args === 'string' ? { task: args } : (args || {})
if (!input.task) throw new Error('args.task is required, e.g. {task: "add a Hint booster"}')
const MAX_FIX_ROUNDS = typeof input.maxFixRounds === 'number' ? input.maxFixRounds : 2
const MAX_LOG_FIXES = typeof input.maxLogFixes === 'number' ? input.maxLogFixes : 2
const AGENT_PREFIX = typeof input.agentPrefix === 'string' ? input.agentPrefix : '__AGENT_PREFIX__'
const agentType = name => AGENT_PREFIX + name
const slug = input.task.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'task'

const ROUTES = {
  init: { model: 'haiku' },
  guard: { model: 'haiku' },
  loadPlan: { model: 'haiku' },
  plan: { effort: 'high' },
  implement: { low: { model: 'sonnet', effort: 'medium' }, medium: { model: 'sonnet', effort: 'high' }, high: { effort: 'high' } },
  verify: { model: 'haiku' },
  review: { low: {}, medium: {}, high: { effort: 'high' } },
  fix: [{ model: 'sonnet', effort: 'high' }, { effort: 'high' }],
  logWrite: { model: 'sonnet', effort: 'medium' },
  logAudit: { model: 'sonnet', effort: 'medium' },
  finalize: { model: 'haiku' },
}
const AGENT_DEFAULT_MODEL = { loadPlan: 'haiku', verify: 'haiku', logWrite: 'sonnet', logAudit: 'sonnet' }

function route(step, variant) {
  const forced = (input.models || {})[step]
  if (forced === 'inherit') return {}
  if (typeof forced === 'string') return { model: forced }
  if (forced && typeof forced === 'object') return forced
  const r = ROUTES[step]
  if (Array.isArray(r)) return r[Math.min(variant || 0, r.length - 1)]
  return variant !== undefined && r[variant] ? r[variant] : r
}

const modelsUsed = []
function routed(step, variant, note) {
  const r = route(step, variant)
  const entry = { step, model: r.model || AGENT_DEFAULT_MODEL[step] || 'session', effort: r.effort || 'session', note: note || '' }
  const same = modelsUsed.find(u => u.step === entry.step && u.model === entry.model && u.effort === entry.effort)
  if (same) same.calls += 1
  else modelsUsed.push({ ...entry, calls: 1 })
  return r
}

const str = { type: 'string' }
const strList = { type: 'array', items: str }
const bool = { type: 'boolean' }
const obj = (properties, required) => ({ type: 'object', properties, required: required || Object.keys(properties) })
const INIT_SCHEMA = obj({ runId: str, runDir: str, preExistingDirty: { type: 'number' } })
const TREE_SCHEMA = obj({ tag: str, changed: strList, violation: bool }, ['tag', 'changed', 'violation'])
const PLAN_SCHEMA = obj({
  summary: str,
  complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
  complexityReason: str,
  files: { type: 'array', items: obj({ path: str, action: { type: 'string', enum: ['create', 'modify', 'move', 'delete'] }, responsibility: str }) },
  steps: strList, testAssemblies: strList, needsSmoke: bool, smokeExpectations: str, risks: strList,
})
const IMPLEMENT_SCHEMA = obj({ changedFiles: strList, compiled: bool, notes: str })
const ISSUE = obj({ file: str, line: { type: 'number' }, message: str, probableCause: str }, ['message'])
const VERIFY_SCHEMA = obj({
  verdict: { type: 'string', enum: ['pass', 'fail', 'editor-unavailable'] },
  checks: str, issues: { type: 'array', items: ISSUE }, capture: { type: ['string', 'null'] }, unityNoise: strList,
}, ['verdict', 'checks', 'issues', 'unityNoise'])
const FINDING = obj({ severity: { type: 'string', enum: ['blocker', 'major', 'minor'] }, file: str, line: { type: 'number' }, rule: str, problem: str, fix: str }, ['severity', 'file', 'problem', 'fix'])
const REVIEW_SCHEMA = obj({ findings: { type: 'array', items: FINDING } })

const shell = (command, label, phaseName, schema) => agent(
  `Run exactly this one command from Bash at the project root. Do nothing else: no other commands, no file edits. Return the JSON it prints.\n${command}`,
  { label, phase: phaseName, schema, ...routed(label.startsWith('guard') ? 'guard' : 'init') },
)

async function writeRunLog(logInput) {
  const routes = logInput.routes || {}
  const verdict = logInput.verdict || 'unknown'
  const header = `runDir: ${logInput.runDir}\nrunId: ${logInput.runId || logInput.runDir}\ntask: ${logInput.task || ''}\nverdict: ${verdict}\n\nFacts:\n${JSON.stringify(logInput.facts || {}, null, 2)}`

  const AUDIT_SCHEMA = {
    type: 'object',
    properties: {
      accurate: { type: 'boolean' },
      discrepancies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            section: { type: 'string' },
            problem: { type: 'string' },
            expected: { type: 'string' },
          },
          required: ['section', 'problem'],
        },
      },
    },
    required: ['accurate', 'discrepancies'],
  }

  await agent(`Write the run report.\n\n${header}`, {
    label: 'log:write', phase: 'Log', agentType: agentType('run-log-writer'), ...(routes.write || {}),
  })

  const audit = n => agent(`Audit the run report.\n\n${header}`, {
    label: `log:audit#${n}`, phase: 'Log', agentType: agentType('run-log-auditor'), schema: AUDIT_SCHEMA, ...(routes.audit || {}),
  })

  let fixes = 0
  let result = await audit(1)
  while (result && !result.accurate && fixes < MAX_LOG_FIXES) {
    fixes += 1
    log(`Log audit found ${result.discrepancies.length} discrepancies, fix ${fixes}/${MAX_LOG_FIXES}`)
    await agent(`Fix these audit discrepancies in report.md, nothing else.\n\n${header}\n\nDiscrepancies:\n${JSON.stringify(result.discrepancies, null, 2)}`, {
      label: `log:fix#${fixes}`, phase: 'Log', agentType: agentType('run-log-writer'), ...(routes.write || {}),
    })
    result = await audit(fixes + 1)
  }

  const auditState = !result ? 'not-audited' : result.accurate ? 'accurate' : 'inaccurate'
  await agent(
    `Run exactly this from Bash at the project root and return its stdout:\nunity-harness run-log finalize "${logInput.runDir}" --verdict ${verdict} --audit ${auditState}`,
    { label: 'log:finalize', phase: 'Log', ...(routes.finalize || {}) },
  )

  return {
    report: `${logInput.runDir}/report.md`,
    audit: `${logInput.runDir}/audit.md`,
    auditState,
    logFixes: fixes,
    discrepancies: result ? result.discrepancies : [],
  }
}

phase('Init')
const run = await shell(`unity-harness run-log baseline --slug ${slug}`, 'init', 'Init', INIT_SCHEMA)
if (!run) throw new Error('could not create run baseline')
const planPath = `${run.runDir}/plan.md`
log(`Run ${run.runId} (${run.preExistingDirty} files were already dirty before the run)`)

const guardEvents = []
let lastTag = 'start'
async function guard(tag, expect, phaseName) {
  const since = lastTag
  const res = await shell(`unity-harness run-log tree ${run.runDir} --tag ${tag} --compare ${since} --expect ${expect}`, `guard:${tag}`, phaseName, TREE_SCHEMA)
  lastTag = tag
  if (!res) {
    guardEvents.push({ kind: 'guard-unavailable', step: tag, since })
    return { violation: false, changed: [] }
  }
  if (res.violation) {
    guardEvents.push({ kind: 'guard-violation', step: tag, since, changed: res.changed })
    log(`GUARD VIOLATION at ${tag}: read-only step changed ${res.changed.length} file(s)`)
  }
  if (expect === 'write' && !res.changed.length) guardEvents.push({ kind: 'no-changes', step: tag, since })
  return res
}

phase('Plan')
const PLAN_RULES = [
  'House rules: the rule switches printed by `unity-harness config` (maxLines, noComments, noDebugLog, compareTag), component-based SRP, [SerializeField] private fields, dependencies through the existing DI or service pattern of the project.',
  'complexity: low = 1–2 files, local change; medium = several files in one feature; high = cross-module, new architecture, or risky runtime flow.',
  'Never plan git commit, push, or staging-for-commit steps; the workflow never commits.',
  'Content moved or split out of an existing file is existing code: keep its comments (including XML docs) and Debug logs verbatim. Do not write instructions that contradict this.',
  'smokeExpectations must be checkable: target scene/screen, components that must exist, zero console errors and missing scripts.',
].join('\n')
let plan = null
if (input.planFile) {
  await shell(`unity-harness run-log write ${run.runDir} plan.md --from "${input.planFile}"`, 'init:copy-plan', 'Plan')
  plan = await agent(
    `Read the approved plan at ${input.planFile} and return it as the structured plan.\n\nTask: ${input.task}\n\n${PLAN_RULES}`,
    { label: 'plan:load', phase: 'Plan', agentType: agentType('plan-loader'), schema: PLAN_SCHEMA, ...routed('loadPlan') },
  )
} else {
  plan = await agent(
    `Plan this Unity change for this Unity project.\n\nTask: ${input.task}\n\n` +
    `Explore the relevant code (start from rules.includePaths printed by \`unity-harness config\`).Do NOT modify any project file: this step is read-only and the working tree is fingerprinted. ` +
    `Produce a Vietnamese markdown plan with sections Mục tiêu, Độ phức tạp (+ lý do), File (path | create/modify/move/delete | trách nhiệm), Các bước, Test, Smoke (điều kiện kiểm được), Rủi ro.\n` +
    `Save it only with this Bash command and confirm it prints {"written": ...}; if the heredoc fails, write a draft under $TEMP and use --from <draft>:\n` +
    `unity-harness run-log write ${run.runDir} plan.md <<'__RUNLOG_EOF__'\n<markdown>\n__RUNLOG_EOF__\n\n` +
    `Test assemblies are listed under testAssemblies in \`unity-harness config\`.needsSmoke = true if scenes, prefabs, UI or startup flow change.\n${PLAN_RULES}`,
    { label: 'plan', phase: 'Plan', schema: PLAN_SCHEMA, ...routed('plan') },
  )
}
if (!plan) throw new Error('planning agent returned nothing')
const planGuard = await guard('after-plan', 'readonly', 'Plan')
log(`Plan: complexity=${plan.complexity}, ${plan.files.length} files, smoke=${plan.needsSmoke}`)

if (input.planOnly && !planGuard.violation) {
  return {
    mode: 'plan-only', runDir: run.runDir, planFile: planPath, complexity: plan.complexity, summary: plan.summary,
    next: `Review/edit ${planPath}, then run unity-feature with {task, planFile: "${planPath}"}`,
  }
}

let impl = { changedFiles: [], compiled: false, notes: 'not run' }
let verify = null
let review = null
let blocking = []
let round = 0
let stopReason = planGuard.violation ? 'plan step modified the working tree' : null

if (!stopReason) {
  phase('Implement')
  impl = await agent(
    `Implement this plan in the Unity project.\n\nTask: ${input.task}\n\nPlan (${planPath}):\n${JSON.stringify(plan, null, 2)}\n\n` +
    `Edit code with your file tools (git mv is fine for moves). Never commit or push. Keep comments and Debug logs of moved content verbatim. ` +
    `When logic is testable, add EditMode tests in an existing test assembly. ` +
    `When done, run \`unity-harness compile\` from Bash and fix errors until it passes ` +
    `(exit 2 = Editor not ready: stop and report). Do not run tests or smoke yourself. Report any deviation from the plan in notes.`,
    { label: `implement(${plan.complexity})`, phase: 'Implement', schema: IMPLEMENT_SCHEMA, ...routed('implement', plan.complexity, `complexity=${plan.complexity}`) },
  ) || impl
  await guard('after-implement', 'write', 'Implement')
  log(`Implemented ${impl.changedFiles.length} files, compiled=${impl.compiled}`)
}

const verifyMode = (typeof input.smoke === 'boolean' ? input.smoke : plan.needsSmoke) ? 'full' : 'all'
const assemblies = (input.assemblies || plan.testAssemblies || []).filter(Boolean)
const assemblyFlag = assemblies.length ? ` with \`--assemblies ${assemblies.join(',')}\`` : ''

function verifyRound(n) {
  return parallel([
    () => agent(
      `Verify the current working tree. Run mode \`${verifyMode}\`${assemblyFlag}.\n` +
      `Smoke expectations from the plan: ${plan.smokeExpectations || 'none stated'}\n` +
      `You are read-only: report failures as verdict fail, never fix them.`,
      { label: `verify#${n}`, phase: 'Verify', agentType: agentType('unity-verifier'), schema: VERIFY_SCHEMA, ...routed('verify') }),
    () => agent(`Review the current C# diff for this task: ${input.task}`,
      { label: `review#${n}`, phase: 'Verify', agentType: agentType('unity-reviewer'), schema: REVIEW_SCHEMA, ...routed('review', plan.complexity) }),
  ])
}

function blockingOf(v, r) {
  const fromVerify = v && v.verdict === 'fail' ? v.issues.map(i => ({ source: 'harness', ...i })) : []
  const fromReview = (r ? r.findings : []).filter(f => f.severity !== 'minor')
    .map(f => ({ source: 'review', file: f.file, line: f.line, message: `${f.rule || ''} ${f.problem}`.trim(), fix: f.fix }))
  return [...fromVerify, ...fromReview]
}

async function verifyGuarded(n) {
  ;[verify, review] = await verifyRound(n)
  blocking = blockingOf(verify, review)
  const g = await guard(`after-verify-${n}`, 'readonly', 'Verify')
  if (g.violation) {
    stopReason = `verify/review round ${n} modified the working tree`
    blocking.unshift({ source: 'guard', message: `read-only verify/review changed: ${g.changed.join(', ')}` })
  }
}

if (!stopReason) {
  await verifyGuarded(0)
  while (!stopReason && blocking.length && round < MAX_FIX_ROUNDS && !(verify && verify.verdict === 'editor-unavailable')) {
    round += 1
    const fixRoute = routed('fix', round - 1, `round ${round}`)
    log(`Fix round ${round}/${MAX_FIX_ROUNDS} on ${fixRoute.model || 'session model'}: ${blocking.length} blocking issues`)
    await agent(
      `Fix these blocking issues in the Unity project, nothing else.\n\nTask context: ${input.task}\n\nIssues:\n${JSON.stringify(blocking, null, 2)}\n\n` +
      `Never delete existing comments or Debug logs just to satisfy the rule check; if a rule issue points at old or moved content, leave it and say so. ` +
      `Never commit. After editing, run \`unity-harness compile\` and make it pass.`,
      { label: `fix#${round}`, phase: 'Fix', ...fixRoute },
    )
    await guard(`after-fix-${round}`, 'write', 'Fix')
    await verifyGuarded(round)
  }
}

const verdict = guardEvents.some(e => e.kind === 'guard-violation') ? 'guard-violation'
  : blocking.length ? 'needs-attention'
    : verify && verify.verdict === 'pass' ? 'pass' : 'unverified'
const logRoutes = { write: routed('logWrite'), audit: routed('logAudit'), finalize: routed('finalize') }
const facts = {
  plan: { summary: plan.summary, complexity: plan.complexity, complexityReason: plan.complexityReason, plannedFiles: plan.files, smokeExpectations: plan.smokeExpectations, risks: plan.risks },
  implementNotes: impl.notes, filesClaimedByImplementer: impl.changedFiles,
  verification: verify, review: review ? review.findings : [], fixRounds: round, remainingIssues: blocking,
  stopReason, guardEvents, modelsUsed,
}

phase('Log')
let logResult = null
try {
  logResult = await writeRunLog({ runDir: run.runDir, runId: run.runId, task: input.task, verdict, facts, routes: logRoutes })
} catch (error) {
  log(`Run log failed: ${error.message}`)
}
if (logResult && logResult.logFixes) {
  for (const u of modelsUsed) if (u.step === 'logWrite' || u.step === 'logAudit') u.calls += logResult.logFixes
}

return {
  task: input.task, runDir: run.runDir, verdict, stopReason, plan: plan.summary, complexity: plan.complexity,
  report: logResult ? logResult.report : null, logAudit: logResult ? logResult.auditState : 'failed',
  fixRounds: round, remainingIssues: blocking, guardEvents,
  minorFindings: (review ? review.findings : []).filter(f => f.severity === 'minor'),
  capture: verify ? verify.capture || null : null, unityNoise: verify ? verify.unityNoise : [], modelsUsed,
}
