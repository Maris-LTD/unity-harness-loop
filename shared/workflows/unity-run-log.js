export const meta = {
  name: 'unity-run-log',
  description: 'Write report.md for a harness run from git-based change data, audit it independently, and fix it until accurate',
  whenToUse: 'Called by unity-feature at the end of a run; can run alone with {runDir, runId, task, verdict, facts} when the run has a baseline',
  phases: [
    { title: 'Log', detail: 'run-log-writer builds report.md from changes.json/changes.diff' },
    { title: 'Audit', detail: 'run-log-auditor checks report vs diff and facts, writer fixes' },
  ],
}

const input = args || {}
if (!input.runDir) throw new Error('args.runDir is required')
const routes = input.routes || {}
const AGENT_PREFIX = typeof input.agentPrefix === 'string' ? input.agentPrefix : '__AGENT_PREFIX__'
const agentType = name => AGENT_PREFIX + name
const MAX_LOG_FIXES = typeof input.maxLogFixes === 'number' ? input.maxLogFixes : 2
const verdict = input.verdict || 'unknown'
const header = `runDir: ${input.runDir}\nrunId: ${input.runId || input.runDir}\ntask: ${input.task || ''}\nverdict: ${verdict}\n\nFacts:\n${JSON.stringify(input.facts || {}, null, 2)}`

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

phase('Log')
await agent(`Write the run report.\n\n${header}`, {
  label: 'log:write', phase: 'Log', agentType: agentType('run-log-writer'), ...(routes.write || {}),
})

phase('Audit')
const audit = n => agent(`Audit the run report.\n\n${header}`, {
  label: `log:audit#${n}`, phase: 'Audit', agentType: agentType('run-log-auditor'), schema: AUDIT_SCHEMA, ...(routes.audit || {}),
})

let fixes = 0
let result = await audit(1)
while (result && !result.accurate && fixes < MAX_LOG_FIXES) {
  fixes += 1
  log(`Log audit found ${result.discrepancies.length} discrepancies, fix ${fixes}/${MAX_LOG_FIXES}`)
  await agent(`Fix these audit discrepancies in report.md, nothing else.\n\n${header}\n\nDiscrepancies:\n${JSON.stringify(result.discrepancies, null, 2)}`, {
    label: `log:fix#${fixes}`, phase: 'Audit', agentType: agentType('run-log-writer'), ...(routes.write || {}),
  })
  result = await audit(fixes + 1)
}

const auditState = !result ? 'not-audited' : result.accurate ? 'accurate' : 'inaccurate'
await agent(
  `Run exactly this from Bash at the project root and return its stdout:\nunity-harness run-log finalize "${input.runDir}" --verdict ${verdict} --audit ${auditState}`,
  { label: 'log:finalize', phase: 'Audit', ...(routes.finalize || {}) },
)

return {
  report: `${input.runDir}/report.md`,
  audit: `${input.runDir}/audit.md`,
  auditState,
  logFixes: fixes,
  discrepancies: result ? result.discrepancies : [],
}
