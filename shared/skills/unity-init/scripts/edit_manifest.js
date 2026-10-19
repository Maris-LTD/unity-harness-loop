const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let project = process.cwd();
const add = {};
const remove = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project') project = args[++i];
  else if (args[i] === '--add') {
    const spec = args[++i] || '';
    const at = spec.lastIndexOf('@');
    if (at <= 0) { console.error(`--add needs id@version, got "${spec}"`); process.exit(64); }
    add[spec.slice(0, at)] = spec.slice(at + 1);
  } else if (args[i] === '--remove') remove.push(args[++i]);
  else { console.error('usage: edit_manifest.js [--project dir] [--add id@version]... [--remove id]...'); process.exit(64); }
}

const file = path.join(project, 'Packages', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const id of remove) {
  console.log(id in manifest.dependencies ? `removed ${id}` : `not present ${id}`);
  delete manifest.dependencies[id];
}
for (const [id, version] of Object.entries(add)) {
  console.log(`${id}: ${manifest.dependencies[id] || '(none)'} -> ${version}`);
  manifest.dependencies[id] = version;
}
fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
