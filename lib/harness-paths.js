function isHarnessPath(p) {
  return p.startsWith('.claude/') || p.startsWith('.unity-harness/') || p.startsWith('.agents/');
}

module.exports = { isHarnessPath };
