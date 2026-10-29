const fs = require('fs');
const path = require('path');
const { DEFAULTS, projectRoot, configPath, hasConfig, loadConfig } = require('./context');

const ENUMS = {
  rigor: ['minimal', 'standard', 'full'],
  automation: ['collaborative', 'guided', 'autonomous'],
  stage: ['concept', 'systems-design', 'technical-setup', 'pre-production', 'production', 'polish', 'release'],
  reviewMode: ['', 'solo', 'lean', 'full'],
  workflow: ['', 'minimal', 'standard', 'full'],
  storyGranularity: ['', 'coarse', 'balanced', 'fine'],
  qaLevel: ['', 'minimal', 'standard', 'full'],
  docsDensity: ['', 'terse', 'balanced', 'thorough'],
};

const FREE_TEXT = ['docsRoot', 'unityVersion', 'renderPipeline', 'inputSystem', 'targetPlatforms', 'targetFps', 'drawCallBudget', 'memoryBudgetMb'];

const RIGOR_EXPANSION = {
  minimal: { workflow: 'minimal', reviewMode: 'solo', storyGranularity: 'coarse', qaLevel: 'minimal', docsDensity: 'terse' },
  standard: { workflow: 'standard', reviewMode: 'lean', storyGranularity: 'balanced', qaLevel: 'standard', docsDensity: 'balanced' },
  full: { workflow: 'full', reviewMode: 'full', storyGranularity: 'balanced', qaLevel: 'full', docsDensity: 'thorough' },
};

function ownConfig() {
  return hasConfig() ? JSON.parse(fs.readFileSync(configPath(), 'utf8')) : null;
}

function isStudioProject() {
  const own = ownConfig();
  return Boolean(own && own.studio);
}

function docPaths(docsRoot) {
  const rel = (...parts) => path.posix.join(docsRoot, ...parts);
  return {
    brief: rel('design', 'game-brief.md'),
    concept: rel('design', 'gdd', 'game-concept.md'),
    gddDir: rel('design', 'gdd'),
    pillars: rel('design', 'gdd', 'game-pillars.md'),
    systemsIndex: rel('design', 'gdd', 'systems-index.md'),
    gddReviewsDir: rel('design', 'gdd', 'reviews'),
    entityRegistry: rel('design', 'registry', 'entities.yaml'),
    artBible: rel('design', 'art-bible.md'),
    architectureDir: rel('architecture'),
    architectureDoc: rel('architecture', 'architecture.md'),
    architectureRegistry: rel('architecture', 'architecture-registry.yaml'),
    trRegistry: rel('architecture', 'tr-registry.yaml'),
    traceability: rel('architecture', 'requirements-traceability.md'),
    controlManifest: rel('architecture', 'control-manifest.md'),
    epicsDir: rel('production', 'epics'),
    epicsIndex: rel('production', 'epics', 'index.md'),
    sprintsDir: rel('production', 'sprints'),
    qaDir: rel('production', 'qa'),
    evidenceDir: rel('production', 'qa', 'evidence'),
    techDebt: rel('production', 'tech-debt-register.md'),
    sessionState: rel('production', 'session-state', 'active.md'),
    decisionLog: rel('production', 'session-logs', 'decision-log.md'),
  };
}

function resolveStudio() {
  const studio = loadConfig().studio;
  const rigor = ENUMS.rigor.includes(studio.rigor) ? studio.rigor : 'minimal';
  const expanded = RIGOR_EXPANSION[rigor];
  const resolved = { rigor };
  for (const key of Object.keys(expanded)) resolved[key] = studio[key] || expanded[key];
  resolved.automation = studio.automation;
  resolved.stage = studio.stage;
  for (const key of FREE_TEXT) resolved[key] = studio[key];
  resolved.language = loadConfig().language;
  resolved.paths = docPaths(studio.docsRoot || DEFAULTS.studio.docsRoot);
  resolved.explicit = Object.keys((ownConfig() || {}).studio || {});
  return resolved;
}

function parseValue(key, raw) {
  if (key === 'targetPlatforms') return raw.split(',').map(s => s.trim()).filter(Boolean);
  if (['targetFps', 'drawCallBudget', 'memoryBudgetMb'].includes(key)) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) throw new Error(`${key} must be a non-negative number, got "${raw}"`);
    return value;
  }
  if (ENUMS[key]) {
    if (!ENUMS[key].includes(raw)) throw new Error(`${key} must be one of ${ENUMS[key].filter(Boolean).join('|')}${ENUMS[key].includes('') ? ' (or empty to follow rigor)' : ''}, got "${raw}"`);
    return raw;
  }
  if (FREE_TEXT.includes(key)) return raw;
  throw new Error(`unknown studio key "${key}", expected one of ${[...Object.keys(ENUMS), ...FREE_TEXT].join(', ')}`);
}

function setStudio(pairs) {
  const own = ownConfig();
  if (!own) {
    process.stderr.write(`${configPath()} not found. Run "unity-harness init" first.\n`);
    return 1;
  }
  if (!pairs.length) {
    process.stderr.write('usage: unity-harness studio set key=value [key=value ...]\n');
    return 64;
  }
  const studio = { ...(own.studio || {}) };
  try {
    for (const pair of pairs) {
      const index = pair.indexOf('=');
      if (index < 1) throw new Error(`expected key=value, got "${pair}"`);
      const key = pair.slice(0, index);
      studio[key] = parseValue(key, pair.slice(index + 1));
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 64;
  }
  own.studio = studio;
  fs.writeFileSync(configPath(), JSON.stringify(own, null, 2) + '\n');
  process.stdout.write(JSON.stringify(resolveStudioFresh(), null, 2) + '\n');
  return 0;
}

function resolveStudioFresh() {
  require('./context').setProjectRoot(projectRoot());
  return resolveStudio();
}

function studio(argv) {
  const [sub, ...rest] = argv;
  if (sub === 'set') return setStudio(rest);
  if (sub === 'config' || !sub) {
    if (!isStudioProject()) process.stderr.write('note: no "studio" block in config yet, showing defaults (run the game-start skill or "unity-harness studio set rigor=minimal").\n');
    process.stdout.write(JSON.stringify(resolveStudio(), null, 2) + '\n');
    return 0;
  }
  if (sub === 'protocol') {
    process.stdout.write(fs.readFileSync(path.join(__dirname, 'studio-protocol.md'), 'utf8'));
    return 0;
  }
  if (sub === 'status') return require('./studio-status').printStatus(resolveStudio(), rest.includes('--json'));
  process.stderr.write('usage: unity-harness studio <config|set key=value ...|status [--json]|protocol>\n');
  return 64;
}

module.exports = { studio, resolveStudio, isStudioProject, RIGOR_EXPANSION, ENUMS };
