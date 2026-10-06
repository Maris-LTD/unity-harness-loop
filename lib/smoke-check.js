const fs = require('fs');
const path = require('path');
const { sleep, unity, unityRetry } = require('./unity-cli');
const { projectRoot } = require('./context');
const { newResult, finish } = require('./unity-checks');
const { startEditorFocus } = require('./editor-focus');

const ERROR_LEVELS = ['error', 'exception', 'assert'];
const MISSING_SCRIPT_SCAN = [
  'var found = new System.Collections.Generic.List<string>();',
  'foreach (var go in UnityEngine.Object.FindObjectsByType<UnityEngine.GameObject>(UnityEngine.FindObjectsInactive.Include, UnityEngine.FindObjectsSortMode.None))',
  '{ if (UnityEditor.GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(go) > 0) found.Add(go.scene.name + ":" + go.name); }',
  'return string.Join("|", found);',
].join(' ');

function loadedSceneNames() {
  const open = unity('list_open_scenes', {}, 15);
  return open.ok ? (open.result.scenes || []).filter(s => s.isLoaded).map(s => s.name) : [];
}

function prepareScene(scene, result) {
  if (!scene) return;
  const open = unity('list_open_scenes', {}, 15);
  const active = open.ok ? (open.result.scenes || []).find(s => s.isActive) : null;
  if (active && active.path === scene) return;
  if (active && active.isDirty) {
    result.warnings.push(`active scene ${active.path} has unsaved changes, smoke runs it instead of ${scene}`);
    return;
  }
  const opened = unity('open_scene', { path: scene }, 60);
  if (!opened.ok) result.warnings.push(`could not open ${scene}: ${opened.error}`);
}

function waitForScene(smoke, result) {
  if (!smoke.waitForScene) {
    sleep((smoke.seconds || 8) * 1000);
    return;
  }
  const deadline = Date.now() + smoke.maxWaitSec * 1000;
  let names = [];
  while (Date.now() < deadline) {
    names = loadedSceneNames();
    if (names.includes(smoke.waitForScene)) {
      result.info.sceneReachedAfterSec = Math.round((smoke.maxWaitSec * 1000 - (deadline - Date.now())) / 1000);
      sleep((smoke.settleSec || 0) * 1000);
      return;
    }
    sleep(1000);
  }
  result.blocking.push(`scene "${smoke.waitForScene}" not loaded within ${smoke.maxWaitSec}s (loaded: ${names.join(', ') || 'none'})`);
}

function assertTypes(smoke, result) {
  for (const type of smoke.expectTypes || []) {
    const found = unity('find_gameobjects', { type, include_inactive: true }, 30);
    if (!found.ok) result.blocking.push(`find_gameobjects --type ${type} failed: ${found.error}`);
    else if (!found.result.count) result.blocking.push(`no GameObject with component ${type} in loaded scenes`);
  }
}

function assertNoMissingScripts(smoke, result) {
  if (!smoke.failOnMissingScripts) return;
  const scan = unity('eval', { code: MISSING_SCRIPT_SCAN }, 60);
  if (!scan.ok) {
    result.warnings.push(`missing-script scan failed: ${scan.error}`);
    return;
  }
  const hits = String(scan.result.result || '').split('|').filter(Boolean);
  result.info.missingScripts = hits.length;
  for (const hit of hits.slice(0, 20)) result.blocking.push(`missing script on ${hit}`);
  if (hits.length > 20) result.blocking.push(`...and ${hits.length - 20} more objects with missing scripts`);
}

function captureGameView(target, result) {
  const capture = unity('capture_game_view', { max_resolution: 1280 }, 60);
  if (!capture.ok || !capture.result.base64) {
    result.warnings.push(`capture failed: ${capture.error || 'no image data'}`);
    return null;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.from(capture.result.base64, 'base64'));
  return target;
}

function collectConsoleErrors(cursor, smoke, result) {
  const logs = unity('console', { since: cursor, tail: 1000 }, 30);
  const entries = logs.ok ? logs.result.entries || [] : [];
  const ignored = (smoke.ignoreErrorPatterns || []).map(p => new RegExp(p));
  const errors = entries
    .filter(e => ERROR_LEVELS.includes(String(e.level).toLowerCase()))
    .filter(e => !ignored.some(re => re.test(e.message)));
  result.info.logCount = entries.length;
  result.info.consoleErrors = errors.length;
  for (const entry of errors.slice(0, 30)) result.blocking.push(`[${entry.level}] ${String(entry.message).split('\n')[0]}`);
  if (!logs.ok) result.warnings.push(`console read failed: ${logs.error}`);
}

function checkSmoke(config) {
  const result = newResult('smoke');
  const smoke = config.smoke;
  const stopFocus = startEditorFocus(smoke, result);
  try {
    return runSmoke(smoke, result);
  } finally {
    stopFocus();
  }
}

function runSmoke(smoke, result) {
  prepareScene(smoke.scene, result);
  const status = unity('console_status', {}, 15);
  const cursor = status.ok ? status.result.cursor : 0;
  const play = unityRetry('editor_play', {}, 60);
  if (!play.ok) {
    result.blocking.push(`could not enter play mode: ${play.error}`);
    return finish(result);
  }
  try {
    waitForScene(smoke, result);
    result.info.loadedScenes = loadedSceneNames();
    assertTypes(smoke, result);
    assertNoMissingScripts(smoke, result);
    result.info.capture = captureGameView(path.join(projectRoot(), smoke.capturePath), result);
    collectConsoleErrors(cursor, smoke, result);
  } finally {
    unityRetry('editor_stop', {}, 60);
  }
  return finish(result);
}

module.exports = { checkSmoke };
