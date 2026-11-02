// @ts-check
const antPrism = require('./src/theme/prism-ant');

const repo = 'https://github.com/skudra-go/ant';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ant',
  tagline: 'A Go ORM with plain structs, compiler-checked queries, and no code generation',
  favicon: 'img/favicon.svg',

  url: process.env.DOCS_URL ?? 'https://skudra-go.github.io',
  baseUrl: process.env.DOCS_BASE_URL ?? '/',
  organizationName: 'skudra-go',
  projectName: 'ant-docs',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  clientModules: ['./src/fonts.js'],

  // assets/ holds the logo and favicon sources, served beside static/.
  staticDirectories: ['static', 'assets'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          breadcrumbs: false,
          editUrl: 'https://github.com/skudra-go/ant-docs/edit/main/',
        },
        blog: false,
        pages: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        searchBarShortcutKeymap: 'mod+k',
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {
          name: 'description',
          content:
            'ant is a Go ORM. Models are plain structs, queries are checked by the compiler, and there is no code generation step.',
        },
      ],
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          autoCollapseCategories: false,
        },
      },
      navbar: {
        title: '',
        logo: {
          alt: 'ant',
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
          width: 62,
          height: 32,
        },
        items: [
          {to: '/quick-start', label: 'Quick start', position: 'left'},
          {to: '/models/defining-models', label: 'Models', position: 'left'},
          {to: '/queries/conditions', label: 'Queries', position: 'left'},
          {to: '/migrations/overview', label: 'Migrations', position: 'left'},
          {href: 'https://github.com/skudra-go/ant-examples', label: 'Examples', position: 'right'},
          {href: repo, label: 'GitHub', position: 'right'},
        ],
      },
      footer: {
        style: 'light',
        copyright: 'ant is open source under the Apache License 2.0.',
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 2,
      },
      prism: {
        theme: antPrism,
        darkTheme: antPrism,
        additionalLanguages: ['sql', 'bash', 'json', 'yaml', 'diff'],
        // The first entry is what a {3-5} range in a fence's metastring applies.
        magicComments: [
          {
            className: 'code-spot',
            line: 'spot-next-line',
            block: {start: 'spot-start', end: 'spot-end'},
          },
        ],
      },
    }),
};

module.exports = config;
