#!/usr/bin/env node
const { setProjectRoot, projectRoot, loadConfig, configPath, hasConfig } = require('../lib/context');

const USAGE = `unity-harness <command> [--project <dir>]

Verify (needs the Unity CLI and an open Editor except for rules):
  rules | compile | tests | smoke | all | full   [--assemblies a,b] [--files f1,f2] [--json]

Project setup:
  init [--force]        create .unity-harness/config.json for this Unity project
  config                print the effective config as JSON
  where                 print the resolved project root and config path

Run logs (used by the unity-feature workflow and run-log agents):
  run-log baseline --slug <slug>
  run-log changes <runDir>
  run-log tree <runDir> --tag <tag> [--compare <tag> --expect readonly|write]
  run-log write <runDir> <plan.md|report.md|audit.md> [--from <file>]
  run-log event <runDir> --kind <kind> --step <step>
  run-log finalize <runDir> --verdict <v> --audit <a>

Agent hooks (stdin = hook payload):
  hook <claude|antigravity> <session-start|turn-start|stop>

Exit codes: 0 pass, 1 blocking failures, 2 Editor not ready, 64 bad usage.`;

function takeProjectFlag(argv) {
  const index = argv.indexOf('--project');
  if (index < 0) return argv;
  setProjectRoot(argv[index + 1]);
  return [...argv.slice(0, index), ...argv.slice(index + 2)];
}

function main(rawArgv) {
  const argv = takeProjectFlag(rawArgv);
  const [command, ...rest] = argv;
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(USAGE + '\n');
    return command ? 0 : 64;
  }
  if (command === 'init') return require('../lib/init').init(rest);
  if (command === 'config') {
    process.stdout.write(JSON.stringify(loadConfig(), null, 2) + '\n');
    return 0;
  }
  if (command === 'where') {
    process.stdout.write(JSON.stringify({ projectRoot: projectRoot(), config: configPath(), hasConfig: hasConfig() }, null, 2) + '\n');
    return 0;
  }
  if (command === 'run-log') return require('../lib/run-log').runLog(rest);
  if (command === 'hook') return require('../lib/hooks').runHook(rest[0], rest[1]);
  const { verify } = require('../lib/verify');
  const code = verify(command, rest);
  if (code === null) {
    process.stderr.write(USAGE + '\n');
    return 64;
  }
  return code;
}

process.exitCode = main(process.argv.slice(2));
