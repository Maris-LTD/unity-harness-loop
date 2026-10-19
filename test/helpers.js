const fs = require('fs');
const path = require('path');

const CLI = path.join(__dirname, '..', 'bin', 'unity-harness.js');

function envWithoutUnity(projectDir) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: projectDir };
  const pathKey = Object.keys(env).find(k => k.toUpperCase() === 'PATH');
  const entries = (env[pathKey] || '').split(path.delimiter)
    .filter(p => p && !['unity', 'unity.exe', 'unity.cmd'].some(name => fs.existsSync(path.join(p, name))));
  for (const key of Object.keys(env)) if (key.toUpperCase() === 'PATH') delete env[key];
  env.PATH = entries.join(path.delimiter);
  return env;
}

module.exports = { CLI, envWithoutUnity };
