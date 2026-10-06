const fs = require('fs');
const path = require('path');
const { DEFAULTS, projectRoot, dataDir, configPath, hasConfig, isUnityProject, merge } = require('./context');

const SKIP_DIRS = new Set(['Library', 'Temp', 'Logs', 'obj', 'Build', 'Builds', 'UserSettings', '.git']);

function firstBuildScene() {
  const file = path.join(projectRoot(), 'ProjectSettings', 'EditorBuildSettings.asset');
  if (!fs.existsSync(file)) return '';
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (let i = 0; i < rows.length; i++) {
    if (!/enabled:\s*1/.test(rows[i])) continue;
    const match = (rows[i + 1] || '').match(/path:\s*(.+\.unity)\s*$/);
    if (match) return match[1].trim();
  }
  return '';
}

function walk(dir, found) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), found);
    } else if (entry.name.endsWith('.asmdef')) {
      found.push(path.join(dir, entry.name));
    }
  }
  return found;
}

function editModeTestAssemblies() {
  const assets = path.join(projectRoot(), 'Assets');
  if (!fs.existsSync(assets)) return [];
  const names = [];
  for (const file of walk(assets, [])) {
    try {
      const asmdef = JSON.parse(fs.readFileSync(file, 'utf8'));
      const refs = [...(asmdef.references || []), ...(asmdef.optionalUnityReferences || [])].join(' ');
      const isTest = /TestRunner|TestAssemblies|nunit/i.test(refs) || (asmdef.precompiledReferences || []).some(r => /nunit/i.test(r));
      const editorOnly = (asmdef.includePlatforms || []).length === 1 && asmdef.includePlatforms[0] === 'Editor';
      if (isTest && editorOnly) names.push(asmdef.name);
    } catch {
      continue;
    }
  }
  return names.sort();
}

function sceneName(scenePath) {
  return scenePath ? path.basename(scenePath, '.unity') : '';
}

function init(argv) {
  if (!isUnityProject(projectRoot())) {
    process.stderr.write(`${projectRoot()} is not a Unity project (no ProjectSettings/ProjectVersion.txt). Run from the project or pass --project <dir>.\n`);
    return 1;
  }
  if (hasConfig() && !argv.includes('--force')) {
    process.stdout.write(`${configPath()} already exists (use --force to overwrite)\n`);
    return 0;
  }
  const scene = firstBuildScene();
  const config = merge(DEFAULTS, {
    testAssemblies: editModeTestAssemblies(),
    smoke: { scene, waitForScene: sceneName(scene) },
  });
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2) + '\n');
  fs.writeFileSync(path.join(dataDir(), '.gitignore'), 'state/\nruns/\n');
  process.stdout.write(`created ${configPath()}\n`);
  process.stdout.write(`  smoke.scene: ${scene || '(none found, set it by hand)'}\n`);
  process.stdout.write(`  testAssemblies: ${config.testAssemblies.join(', ') || '(none found)'}\n`);
  process.stdout.write('Review rules.includePaths, smoke.waitForScene and smoke.expectTypes before relying on smoke.\n');
  return 0;
}

module.exports = { init };
