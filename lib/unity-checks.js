const { sleep, unity, unityRetry } = require('./unity-cli');

const DONE_STATUSES = ['completed', 'up_to_date', 'idle'];

function newResult(name) {
  return { name, ok: true, blocking: [], warnings: [], info: {} };
}

function finish(result) {
  result.ok = result.blocking.length === 0;
  return result;
}

function checkCompile(config) {
  const result = newResult('compile');
  const trigger = unityRetry('recompile', {}, 60);
  if (!trigger.ok) {
    result.blocking.push(`recompile request failed: ${trigger.error}`);
    return finish(result);
  }
  const deadline = Date.now() + config.compileTimeoutSec * 1000;
  let status = null;
  while (Date.now() < deadline) {
    const poll = unity('recompile_status', {}, 15);
    if (poll.ok && DONE_STATUSES.includes(poll.result.status)) {
      status = poll.result;
      break;
    }
    sleep(1500);
  }
  if (!status) {
    result.blocking.push(`compilation did not finish within ${config.compileTimeoutSec}s`);
    return finish(result);
  }
  result.info.status = status.status;
  if (status.compilationFailed || status.failed) {
    const errors = (status.errors || []).map(String);
    result.blocking.push(...(errors.length ? errors : ['compilation failed without error details']));
  }
  return finish(result);
}

function checkTests(config, assemblies) {
  const result = newResult('tests');
  const targets = assemblies && assemblies.length ? assemblies : config.testAssemblies;
  result.info.assemblies = {};
  for (const assembly of targets) {
    const run = unityRetry('run_tests', {
      mode: 'editor',
      filter: assembly,
      filter_type: 'assembly',
      timeout: config.testTimeoutSec,
    }, config.testTimeoutSec);
    if (!run.ok) {
      result.blocking.push(`${assembly}: test run failed: ${run.error}`);
      continue;
    }
    const summary = run.result.Summary || {};
    result.info.assemblies[assembly] = summary;
    for (const test of run.result.Results || []) {
      if (test.Status !== 'Failed') continue;
      const message = (test.Message || '').split('\n')[0];
      result.blocking.push(`${test.FullName}: ${message}`);
    }
  }
  return finish(result);
}

module.exports = { newResult, finish, checkCompile, checkTests };
