#!/usr/bin/env node
const { setProjectRoot, projectRoot, loadConfig, configPath, hasConfig } = require('../lib/context');

const USAGE = `unity-harness <command> [--project <dir>]

Verify (needs the Unity CLI and an open Editor except for rules):
  rules | compile | tests | smoke | all | full   [--assemblies a,b] [--files f1,f2] [--since-run <runDir>] [--json]
    --since-run: rules judge files that were dirty before the run against their baseline copy, and skip them when untouched

Project setup:
  init [--force]        create .unity-harness/config.json for this Unity project
  config                print the effective config as JSON
  where                 print the resolved project root and config path
  fingerprint save|compare <name>   snapshot the working tree (HEAD + dirty file hashes) / list what changed since; exit 1 when changed

Studio workflow (skills studio-*):
  studio config         print the resolved studio settings (rigor expansion, doc paths)
  studio set k=v ...    write studio settings (rigor, automation, stage, docsRoot, ...)
  studio status [--json]  scan brief, epics, stories, sprint and evidence (observations only)
  studio protocol       print the always-on studio rules

Run logs (used by the unity-feature workflow and run-log agents):
  run-log baseline --slug <slug>
  run-log changes <runDir>
  run-log tree <runDir> --tag <tag> [--compare <tag> --expect readonly|write]
  run-log write <runDir> <plan.md|report.md|audit.md> [--from <file>]
  run-log report <runDir> [--from <file>]   stdin JSON {facts?, notes}
  run-log event <runDir> --kind <kind> --step <step>
  run-log finalize <runDir> --verdict <v> --audit <a>

Agent hooks (stdin = hook payload):
  hook <claude|antigravity> <session-start|turn-start|stop|pre-tool-use>

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
  if (command === 'fingerprint') {
    try {
      const result = require('../lib/tree-guard').fingerprint(rest[0], rest[1]);
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      return result.unchanged === false ? 1 : 0;
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      return 64;
    }
  }
  if (command === 'studio') return require('../lib/studio').studio(rest);
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
