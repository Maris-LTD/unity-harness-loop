const { spawn } = require('child_process');
const path = require('path');
const { editorInstance } = require('./unity-cli');

const SCRIPT = path.join(__dirname, 'focus-unity.ps1');

function startEditorFocus(smoke, result) {
  if (process.platform !== 'win32' || smoke.keepFocus === false) return () => {};
  const instance = editorInstance();
  if (!instance || !instance.pid) {
    result.warnings.push('could not resolve the Unity Editor pid, smoke runs without keeping it in the foreground');
    return () => {};
  }
  const seconds = (smoke.maxWaitSec || 45) + (smoke.settleSec || 0) + 180;
  const child = spawn('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT,
    '-UnityPid', String(instance.pid),
    '-OwnerPid', String(process.pid),
    '-Seconds', String(seconds),
    '-IntervalMs', String(smoke.focusIntervalMs || 1000),
  ], { stdio: 'ignore', windowsHide: true });
  child.on('error', err => result.warnings.push(`focus keeper failed to start: ${err.message}`));
  result.info.focusKeeper = true;
  return () => {
    if (child.exitCode === null && !child.killed) child.kill();
  };
}

module.exports = { startEditorFocus };
