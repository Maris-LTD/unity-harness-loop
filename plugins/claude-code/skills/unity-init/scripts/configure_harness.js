const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i += 2) {
  if (!args[i].startsWith('--') || args[i + 1] === undefined) {
    console.error('usage: configure_harness.js [--project dir] [--tests A,B] [--include p1,p2] [--scene Assets/x.unity] [--wait-scene Name] [--expect T1,T2]');
    process.exit(64);
  }
  opts[args[i].slice(2)] = args[i + 1];
}

const file = path.join(opts.project || process.cwd(), '.unity-harness', 'config.json');
if (!fs.existsSync(file)) {
  console.error(`missing ${file}; run unity-harness init first`);
  process.exit(1);
}

const list = value => value.split(',').map(s => s.trim()).filter(Boolean);
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
if (opts.tests) config.testAssemblies = list(opts.tests);
if (opts.include) config.rules.includePaths = list(opts.include);
if (opts.scene) {
  config.smoke.scene = opts.scene;
  config.smoke.waitForScene = path.basename(opts.scene, '.unity');
}
if (opts['wait-scene']) config.smoke.waitForScene = opts['wait-scene'];
if (opts.expect) config.smoke.expectTypes = list(opts.expect);
fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');

console.log(JSON.stringify({
  testAssemblies: config.testAssemblies,
  includePaths: config.rules.includePaths,
  scene: config.smoke.scene,
  waitForScene: config.smoke.waitForScene,
  expectTypes: config.smoke.expectTypes,
}, null, 2));
