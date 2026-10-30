const test = require('node:test');
const assert = require('node:assert');

const { yamlValue, agentProblems, assertNoHiddenCharacters, INVISIBLE_IN_TEXT, render } = require('../scripts/build-plugins');

test('yamlValue keeps plain scalars plain and quotes what YAML would misread', () => {
  const plain = ['unity-verifier', 'Bash, Read, Grep, Glob', 'Reviews the diff. Use after implementing', 'sonnet', 'ratio 16:9 and a-b'];
  for (const value of plain) assert.strictEqual(yamlValue(value), ` ${value}`, value);
  const quoted = ['yes', 'No', 'null', '~', 'on', '123', '1.0', '0x1F', '.5', '- list', ': x', '? q', ' padded', 'trail ', 'two\nlines', 'key: value', 'note #tag', 'ends with:', '', '"quoted"', "'single'", '[flow]', '{map}', '*alias', '&anchor', '!tag', '|block', '>fold', '%dir', '@at', '`tick`'];
  for (const value of quoted) assert.strictEqual(yamlValue(value), ` ${JSON.stringify(value)}`, JSON.stringify(value));
  assert.strictEqual(yamlValue(20), ' 20');
  assert.strictEqual(yamlValue(true), ' true');
  assert.strictEqual(yamlValue(['view_file', 'no']), '\n  - view_file\n  - "no"');
});

test('agentProblems reports every broken agent definition', () => {
  const ok = { description: 'Does a thing.', targets: ['claude', 'antigravity'], claude: { tools: 'Bash, Read' } };
  assert.deepStrictEqual(agentProblems({ a: ok }, ['a']), []);
  const problems = agentProblems({
    noTargets: { description: 'x', claude: { tools: 'Read' } },
    noBody: ok,
    unmapped: { description: 'x', targets: ['antigravity'], claude: { tools: 'Read, WebFetch' } },
    typo: { description: '', targets: ['claud'], claude: { tools: 'Read' }, model: 'opus' },
  }, ['noTargets', 'unmapped', 'typo', 'orphan']);
  const text = problems.join('\n');
  assert.match(text, /"noTargets": targets must list/);
  assert.match(text, /"noBody": no noBody\.md body/);
  assert.match(text, /"unmapped": no Antigravity tool for WebFetch/);
  assert.match(text, /"typo": unknown keys model/);
  assert.match(text, /"typo": description must be a non-empty string/);
  assert.match(text, /"typo": targets must list/);
  assert.match(text, /orphan\.md has no entry in agents\.json/);
});

test('qoder renders claude-family content with qoder branches and plain agent names', () => {
  const source = [
    '---',
    'name: demo',
    '{{#claude}}',
    '{{^qoder}}',
    'model: haiku',
    '{{/qoder}}',
    '{{/claude}}',
    '---',
    '{{#claude}}',
    '{{#qoder}}',
    'Qoder path',
    '{{/qoder}}',
    '{{^qoder}}',
    'Claude path',
    '{{/qoder}}',
    '{{/claude}}',
    'Ask {{ask}}; spawn {{spawn unity-verifier}}; agent {{agent producer}}. Platform {{platform}}.',
    '',
  ].join('\n');
  const qoder = render('demo', source, 'qoder');
  assert.match(qoder, /^---\nname: demo\n---/);
  assert.doesNotMatch(qoder, /model: haiku/);
  assert.match(qoder, /Qoder path/);
  assert.doesNotMatch(qoder, /Claude path/);
  assert.match(qoder, /Ask `AskUserQuestion`/);
  assert.match(qoder, /subagent_type: "unity-verifier"/);
  assert.match(qoder, /agent producer\. Platform Qoder\./);
  const claude = render('demo', source, 'claude');
  assert.match(claude, /model: haiku/);
  assert.match(claude, /Claude path/);
  assert.doesNotMatch(claude, /Qoder path/);
  assert.match(claude, /subagent_type: "unity-harness:unity-verifier"/);
  const antigravity = render('demo', source, 'antigravity');
  assert.doesNotMatch(antigravity, /model: haiku/);
  assert.match(antigravity, /ask_question/);
});

test('text files reject invisible characters but allow emoji variation selectors and Vietnamese', () => {
  assert.doesNotThrow(() => assertNoHiddenCharacters('a.md', '⚠️ Tiếng Việt', INVISIBLE_IN_TEXT));
  assert.throws(() => assertNoHiddenCharacters('a.md', 'line one\nzero​width', INVISIBLE_IN_TEXT), /a\.md:2 contains hidden character U\+200B/);
  assert.throws(() => assertNoHiddenCharacters('a.md', 'bidi ‮ override', INVISIBLE_IN_TEXT), /U\+202E/);
  assert.throws(() => assertNoHiddenCharacters('w.js', 'combining á'), /U\+0301.*workflow scripts/);
});
