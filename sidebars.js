const api = require('./src/remark/api.json');

// The sidebar reads as a trail: groups, sections with an icon each, and pages as
// stops along a dashed line. Icons are CSS masks, named by className.
const group = (label) => ({type: 'html', value: label, className: 'sidebar-group', defaultStyle: true});
const page = (id, icon) => ({type: 'doc', id, className: `nav-icon nav-icon--${icon}`});
const section = (label, icon, items) => ({
  type: 'category',
  label,
  collapsed: true,
  className: `nav-icon nav-icon--${icon}`,
  items,
});

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    group('Get started'),
    page('index', 'home'),
    page('quick-start', 'bolt'),
    page('concepts', 'bulb'),
    page('why-ant', 'layers'),

    group('Build'),
    section('Models', 'box', [
      'models/defining-models',
      'models/field-probes',
      'models/keys',
      'models/nullable-and-defaults',
      'models/field-roles',
      'models/configure',
      'models/embedded-and-mixins',
      'models/shared-tables-and-views',
      'models/custom-types',
    ]),
    section('Queries', 'search', [
      'queries/conditions',
      'queries/reading-rows',
      'queries/ordering-and-paging',
      'queries/aggregates-and-grouping',
      'queries/expressions',
      'queries/projections',
      'queries/joins',
      'queries/subqueries-and-sets',
      'queries/window-functions',
      'queries/composing',
      'queries/raw-sql',
      'queries/locks-and-hints',
    ]),
    section('Relations', 'link', [
      'relations/declaring',
      'relations/loading',
      'relations/filtering',
      'relations/many-to-many',
      'relations/advanced',
    ]),
    section('Writing', 'pen', [
      'writing/insert',
      'writing/update-and-delete',
      'writing/upsert-and-merge',
      'writing/bulk',
    ]),
    section('Change tracking', 'eye', [
      'tracking/save-changes',
      'tracking/sessions',
      'tracking/changing-relations',
      'tracking/entity-states',
    ]),
    section('Transactions', 'swap', [
      'transactions/transactions',
      'transactions/retries',
      'transactions/connections',
    ]),
    section('Lifecycle', 'cycle', [
      'lifecycle/hooks-and-observers',
      'lifecycle/validation',
      'lifecycle/timestamps',
      'lifecycle/soft-deletes',
      'lifecycle/global-filters',
      'lifecycle/optimistic-concurrency',
    ]),

    group('Ship'),
    section('Migrations', 'layers', [
      'migrations/overview',
      'migrations/models-to-tables',
      'migrations/generated-sql',
      'migrations/hand-written',
      'migrations/deploying',
      'migrations/teams',
      'migrations/adopting',
      'migrations/configuration',
      'migrations/commands',
      'migrations/troubleshooting',
    ]),
    section('Tooling', 'wrench', [
      'tooling/inspecting-queries',
      'tooling/logging',
      'tooling/interceptors',
      'tooling/diagnostics',
      'tooling/errors',
      'tooling/metrics-and-tracing',
      'tooling/antvet',
    ]),
    page('testing', 'flask'),

    group('More'),
    section('Recipes', 'book', [
      'recipes/multi-tenancy',
      'recipes/auditing',
      'recipes/encrypted-fields',
      'recipes/partitioned-tables',
      'recipes/several-databases',
      'recipes/commit-failures',
    ]),
    section('Reference', 'list', [
      {type: 'link', label: 'API on pkg.go.dev', href: api.packages.ant.url},
      'reference/databases',
      'reference/benchmarks',
      'reference/compatibility',
      'reference/security',
    ]),
  ],
};

module.exports = sidebars;
