const { unity } = require('./unity-cli');

const FORCE_ON = 'var was = UnityEditor.PlayerSettings.runInBackground; UnityEditor.PlayerSettings.runInBackground = true; return was;';
const RESTORE_OFF = 'UnityEditor.PlayerSettings.runInBackground = false; return 0;';

const NOOP = { reassert() {}, restore() {} };

function keepRunningInBackground(smoke, result) {
  if (smoke.runInBackground === false) return NOOP;
  const forced = unity('eval', { code: FORCE_ON }, 30);
  if (!forced.ok) {
    result.warnings.push(`could not turn on runInBackground, an unfocused Editor may stall Play mode: ${forced.error}`);
    return NOOP;
  }
  const wasOn = String(forced.result.result).toLowerCase() === 'true';
  result.info.runInBackground = wasOn ? 'already on' : 'forced on for this run';
  return {
    reassert() {
      unity('eval', { code: FORCE_ON }, 15);
    },
    restore() {
      if (wasOn) return;
      const restored = unity('eval', { code: RESTORE_OFF }, 30);
      if (!restored.ok) result.warnings.push(`could not restore runInBackground = false: ${restored.error}`);
    },
  };
}

module.exports = { keepRunningInBackground };
