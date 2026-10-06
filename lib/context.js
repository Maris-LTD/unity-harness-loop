const fs = require('fs');
const path = require('path');

const DATA_DIR = '.unity-harness';
const CONFIG_FILE = 'config.json';

const DEFAULTS = {
  language: 'vi',
  compileTimeoutSec: 180,
  testTimeoutSec: 300,
  testAssemblies: [],
  rules: {
    maxLines: 250,
    noComments: true,
    noDebugLog: true,
    compareTag: true,
    includePaths: ['Assets/'],
  },
  smoke: {
    scene: '',
    waitForScene: '',
    maxWaitSec: 45,
    settleSec: 3,
    keepFocus: true,
    focusIntervalMs: 1000,
    expectTypes: [],
    failOnMissingScripts: true,
    capturePath: 'Temp/harness/smoke.png',
    ignoreErrorPatterns: [],
  },
  stopGate: {
    enabled: true,
    rules: true,
    compile: true,
    tests: false,
    maxBlocks: 3,
  },
};

let root = null;
let config = null;

function isUnityProject(dir) {
  return fs.existsSync(path.join(dir, 'ProjectSettings', 'ProjectVersion.txt'));
}

function findUp(start) {
  let dir = path.resolve(start);
  while (true) {
    if (isUnityProject(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function setProjectRoot(dir) {
  root = dir ? path.resolve(dir) : null;
  config = null;
}

function projectRoot() {
  if (root) return root;
  const hinted = process.env.UNITY_HARNESS_PROJECT || process.env.CLAUDE_PROJECT_DIR;
  root = findUp(hinted || process.cwd()) || path.resolve(hinted || process.cwd());
  return root;
}

function dataDir() {
  return path.join(projectRoot(), DATA_DIR);
}

function configPath() {
  return path.join(dataDir(), CONFIG_FILE);
}

function hasConfig() {
  return fs.existsSync(configPath());
}

function merge(base, extra) {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra || {})) {
    const nested = value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object';
    out[key] = nested ? merge(base[key], value) : value;
  }
  return out;
}

function loadConfig() {
  if (config) return config;
  const own = hasConfig() ? JSON.parse(fs.readFileSync(configPath(), 'utf8')) : {};
  config = merge(DEFAULTS, own);
  return config;
}

module.exports = { DATA_DIR, DEFAULTS, isUnityProject, setProjectRoot, projectRoot, dataDir, configPath, hasConfig, loadConfig, merge };
