// Run with `npm test`, which `npm run check` does.

const test = require('node:test');
const assert = require('node:assert/strict');

const {toMarkdown} = require('./llms');

const options = {
  link: (to) => `https://site${to}.md`,
  testsURL: 'https://repo/tests',
};

const md = (lines) => toMarkdown(lines.join('\n'), options);

test('drops front matter and imports, but not Go imports in a fence', () => {
  const out = md([
    '---',
    'title: T',
    '---',
    "import Tabs from '@theme/Tabs';",
    '',
    '```go',
    'import (',
    '\t"fmt"',
    ')',
    '```',
  ]);

  assert.equal(out, '```go\nimport (\n\t"fmt"\n)\n```');
});

test('drops spotlight comments and keeps the marked text', () => {
  const out = md([
    '```go marks title="ant"',
    '// spot-start',
    'db.Users.Where(ant.Lte(⟦-:&Users.Agee⟧, 18))',
    '// spot-end',
    '-- spot-next-line',
    'x := ⟦+:y⟧',
    '```',
  ]);

  assert.equal(out, 'ant:\n\n```go\ndb.Users.Where(ant.Lte(&Users.Agee, 18))\nx := y\n```');
});

test('says a compile-fail sample does not compile', () => {
  const out = md(['```go compile-fail', 'bad()', '```']);

  assert.match(out, /^This does not compile, on purpose:\n\n```go\n/);
});

test('drops MDX comments, with the fences inside them', () => {
  const out = md(['before', '{/*', '```go', 'hidden()', '```', '*/}', 'after']);

  assert.equal(out, 'before\nafter');
});

test('labels other libraries apart from ant', () => {
  const out = md(['<Compare>', '<Others>', '<Lib>', 'gorm', '</Lib>', '</Others>', '<Ant>', 'ant', '</Ant>', '</Compare>']);

  assert.equal(out, 'Other libraries, for comparison. This is not ant code:\ngorm\nThe same in ant:\nant');
});

test('turns tabs, routes, tests and collapsible code into Markdown', () => {
  const out = md([
    '<Tabs groupId="db">',
    '<TabItem value="sqlite" label="SQLite" default>',
    'one',
    '</TabItem>',
    '</Tabs>',
    '<Routes>',
    '  <Route to="/quick-start" title="Quick start">A program.</Route>',
    '</Routes>',
    '<Tests path="writing/insert_test.go" />',
    '<CollapsibleCode title="models.go" note="x">',
    '</CollapsibleCode>',
  ]);

  assert.equal(
    out,
    [
      '**SQLite:**',
      'one',
      '- [Quick start](https://site/quick-start.md): A program.',
      'Tested in [tests/features/writing/insert_test.go](https://repo/tests/writing/insert_test.go).',
      'models.go:',
    ].join('\n'),
  );
});

test('drops widgets, heading ids, and rewrites site links', () => {
  const out = md([
    '<SaveDemo />',
    '## Old name {#old-name}',
    'See [keys](/models/keys#composite) and [the file](pathname:///llms.txt), not [Go](https://go.dev).',
  ]);

  assert.equal(
    out,
    '## Old name\nSee [keys](https://site/models/keys#composite.md) and [the file](https://site/llms.txt.md), not [Go](https://go.dev).',
  );
});

test('fails on a component it has no Markdown for', () => {
  assert.throws(() => md(['<NewWidget />']), /no Markdown form for <NewWidget>/);
});

test('fails on an unclosed fence', () => {
  assert.throws(() => md(['```go', 'x']), /unclosed/);
});
