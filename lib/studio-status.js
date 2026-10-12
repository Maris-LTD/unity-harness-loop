const fs = require('fs');
const path = require('path');
const { projectRoot } = require('./context');

const STATUS_LINE = /^\s*>?\s*\*{0,2}Status\*{0,2}\s*:\s*\**\s*([A-Za-z][A-Za-z -]*)/m;

function abs(rel) {
  return path.join(projectRoot(), rel);
}

function exists(rel) {
  return fs.existsSync(abs(rel));
}

function listDir(rel, filter) {
  try {
    return fs.readdirSync(abs(rel), { withFileTypes: true }).filter(filter).map(e => e.name).sort();
  } catch {
    return [];
  }
}

const NOT_GDD = new Set(['game-concept.md', 'game-pillars.md', 'systems-index.md', 'art-bible.md']);

function countFiles(rel) {
  let total = 0;
  for (const name of listDir(rel, e => e.isDirectory())) total += countFiles(path.posix.join(rel, name));
  return total + listDir(rel, e => e.isFile()).length;
}

function readStatus(rel) {
  try {
    const match = fs.readFileSync(abs(rel), 'utf8').match(STATUS_LINE);
    return match ? match[1].trim() : 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function scanEpics(paths) {
  const epics = [];
  for (const slug of listDir(paths.epicsDir, e => e.isDirectory())) {
    const dir = path.posix.join(paths.epicsDir, slug);
    const stories = listDir(dir, e => e.isFile() && /^story-\d+.*\.md$/.test(e.name)).map(name => ({
      file: path.posix.join(dir, name),
      status: readStatus(path.posix.join(dir, name)),
    }));
    epics.push({ slug, hasEpicFile: exists(path.posix.join(dir, 'EPIC.md')), stories });
  }
  return epics;
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) counts[item[key]] = (counts[item[key]] || 0) + 1;
  return counts;
}

function activeStory(sessionState) {
  try {
    const text = fs.readFileSync(abs(sessionState), 'utf8');
    const match = text.match(/(?:Current|Active) story\**\s*:\**\s*`?([^`\n*]+)`?/i);
    const value = match ? match[1].trim() : '';
    return /^(none|-|n\/a)?$/i.test(value) ? '' : value;
  } catch {
    return '';
  }
}

function collectStatus(studio) {
  const p = studio.paths;
  const epics = scanEpics(p);
  const stories = epics.flatMap(e => e.stories);
  const sprints = listDir(p.sprintsDir, e => e.isFile() && /^sprint-.*\.md$/.test(e.name));
  return {
    rigor: studio.rigor,
    stage: studio.stage,
    automation: studio.automation,
    unityProject: exists('ProjectSettings/ProjectVersion.txt'),
    unityVersion: studio.unityVersion || '',
    design: {
      brief: exists(p.brief) ? p.brief : '',
      concept: exists(p.concept) ? p.concept : '',
      gdds: listDir(p.gddDir, e => e.isFile() && e.name.endsWith('.md') && !NOT_GDD.has(e.name)),
    },
    epics: epics.map(e => ({ slug: e.slug, hasEpicFile: e.hasEpicFile, stories: e.stories.length, byStatus: countBy(e.stories, 'status') })),
    stories: { total: stories.length, byStatus: countBy(stories, 'status') },
    nextReadyStory: (stories.find(s => /^ready$/i.test(s.status)) || {}).file || '',
    inProgress: stories.filter(s => /in progress/i.test(s.status)).map(s => s.file),
    blocked: stories.filter(s => /blocked/i.test(s.status)).map(s => s.file),
    currentSprint: sprints.length ? path.posix.join(p.sprintsDir, sprints[sprints.length - 1]) : '',
    sessionState: exists(p.sessionState) ? p.sessionState : '',
    activeStory: activeStory(p.sessionState),
    evidenceFiles: countFiles(p.evidenceDir),
  };
}

function formatStatus(s) {
  const counts = obj => Object.entries(obj).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';
  const rows = [
    `Studio: rigor ${s.rigor}, stage ${s.stage}, automation ${s.automation}`,
    `Unity project: ${s.unityProject ? 'yes' : 'no'}${s.unityVersion ? ` (${s.unityVersion})` : ''}`,
    `Brief: ${s.design.brief || 'missing'} | Concept: ${s.design.concept || 'missing'} | GDDs: ${s.design.gdds.length}`,
    `Epics: ${s.epics.length} | Stories: ${s.stories.total} (${counts(s.stories.byStatus)})`,
  ];
  for (const e of s.epics) rows.push(`  - ${e.slug}: ${e.stories} stories (${counts(e.byStatus)})${e.hasEpicFile ? '' : ', no EPIC.md'}`);
  rows.push(`In progress: ${s.inProgress.join(', ') || 'none'}`);
  if (s.blocked.length) rows.push(`Blocked: ${s.blocked.join(', ')}`);
  rows.push(`Next ready story: ${s.nextReadyStory || 'none'}`);
  rows.push(`Current sprint: ${s.currentSprint || 'none'} | Session state: ${s.sessionState || 'none'}${s.activeStory ? ` (active: ${s.activeStory})` : ''}`);
  rows.push(`Evidence files: ${s.evidenceFiles}`);
  return rows.join('\n');
}

function printStatus(studio, asJson) {
  const status = collectStatus(studio);
  process.stdout.write((asJson ? JSON.stringify(status, null, 2) : formatStatus(status)) + '\n');
  return 0;
}

module.exports = { collectStatus, formatStatus, printStatus };
