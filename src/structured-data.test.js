// Run with `npm test`, which `npm run check` does.

const test = require('node:test');
const assert = require('node:assert/strict');

const {softwareSourceCode, breadcrumbList} = require('./structured-data.mjs');

const site = 'https://skudra.net';

// The shape Docusaurus gives a sidebar: html group labels, links to docs,
// categories without a page, and links out.
const sidebar = [
  {type: 'html', value: 'Get started', className: 'sidebar-group'},
  {type: 'link', docId: 'index', label: 'Introduction', href: '/'},
  {type: 'link', docId: 'why-ant', label: 'Why ant', href: '/why-ant'},
  {
    type: 'category',
    label: 'Queries',
    items: [
      {type: 'link', docId: 'queries/conditions', label: 'Conditions', href: '/queries/conditions'},
      {type: 'link', docId: 'queries/joins', label: 'Joins', href: '/queries/joins'},
    ],
  },
  {
    type: 'category',
    label: 'Transactions',
    items: [
      {type: 'link', docId: 'transactions/transactions', label: 'Transactions', href: '/transactions/'},
      {type: 'link', docId: 'transactions/retries', label: 'Retries', href: '/transactions/retries'},
    ],
  },
  {
    type: 'category',
    label: 'Reference',
    items: [
      {type: 'link', label: 'API on pkg.go.dev', href: 'https://pkg.go.dev/github.com/skudra-go/ant'},
      {type: 'link', docId: 'reference/databases', label: 'Databases', href: '/reference/databases'},
    ],
  },
];

const crumbs = (permalink, title = 'T') =>
  breadcrumbList({site, home: '/', sidebarItems: sidebar, permalink, title});

const pairs = (list) => list.itemListElement.map((e) => [e.position, e.name, e.item]);

test('a page in a category: home, the category, the page', () => {
  assert.deepEqual(pairs(crumbs('/queries/joins')), [
    [1, 'Home', 'https://skudra.net/'],
    [2, 'Queries', 'https://skudra.net/queries/conditions'],
    [3, 'Joins', 'https://skudra.net/queries/joins'],
  ]);
});

test('the first page of a category does not repeat its own URL', () => {
  assert.deepEqual(pairs(crumbs('/queries/conditions')), [
    [1, 'Home', 'https://skudra.net/'],
    [2, 'Conditions', 'https://skudra.net/queries/conditions'],
  ]);
});

test("a folder's index page drops the trailing slash, like its canonical URL", () => {
  assert.deepEqual(pairs(crumbs('/transactions/')), [
    [1, 'Home', 'https://skudra.net/'],
    [2, 'Transactions', 'https://skudra.net/transactions'],
  ]);

  assert.deepEqual(pairs(crumbs('/transactions/retries')), [
    [1, 'Home', 'https://skudra.net/'],
    [2, 'Transactions', 'https://skudra.net/transactions'],
    [3, 'Retries', 'https://skudra.net/transactions/retries'],
  ]);
});

test('a category that opens with a link out stands for its first doc', () => {
  assert.deepEqual(pairs(crumbs('/reference/databases')), [
    [1, 'Home', 'https://skudra.net/'],
    [2, 'Databases', 'https://skudra.net/reference/databases'],
  ]);
});

test('a top-level page: home and the page', () => {
  const list = crumbs('/why-ant');

  assert.equal(list['@type'], 'BreadcrumbList');
  assert.deepEqual(pairs(list), [
    [1, 'Home', 'https://skudra.net/'],
    [2, 'Why ant', 'https://skudra.net/why-ant'],
  ]);
});

test('the home page gets no trail', () => {
  assert.equal(crumbs('/'), null);
});

test('a page outside the sidebar uses its title', () => {
  assert.deepEqual(pairs(crumbs('/hidden', 'Hidden page')), [
    [1, 'Home', 'https://skudra.net/'],
    [2, 'Hidden page', 'https://skudra.net/hidden'],
  ]);

  const none = breadcrumbList({site, home: '/', sidebarItems: null, permalink: '/x', title: 'X'});

  assert.equal(none.itemListElement.length, 2);
});

test('the home page describes ant as Go source code', () => {
  const data = softwareSourceCode({
    url: site,
    description: 'D',
    repo: 'https://github.com/skudra-go/ant',
  });

  assert.equal(data['@type'], 'SoftwareSourceCode');
  assert.equal(data.name, 'ant');
  assert.equal(data.description, 'D');
  assert.equal(data.codeRepository, 'https://github.com/skudra-go/ant');
  assert.equal(data.programmingLanguage, 'Go');
  assert.equal(data.url, site);
  assert.equal(data.author['@type'], 'Person');
  assert.equal(data.author.url, 'https://github.com/borderss');
});
