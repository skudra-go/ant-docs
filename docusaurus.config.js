// @ts-check
const antPrism = require('./src/theme/prism-ant');

const api = require('./src/remark/api.json');
const apiLinks = require('./src/remark/api-links');

const repo = 'https://github.com/skudra-go/ant';

// The release the docs are checked against, as tools/doccheck/go.mod names it, and
// its reference on pkg.go.dev.
const release = api.version;
const reference = api.packages.ant.url;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ant',
  tagline: 'A Go ORM with plain structs, compiler-checked queries, and no code generation',
  favicon: 'img/favicon.svg',

  url: process.env.DOCS_URL ?? 'https://skudra.net',
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

  clientModules: ['./src/fonts.js', './src/api-cards.js'],

  customFields: {
    release,
    reference,
    repo,
  },

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
          remarkPlugins: [apiLinks],
          editUrl: 'https://github.com/skudra-go/ant-docs/edit/main/',
        },
        blog: {
          routeBasePath: 'blog',
          path: 'blog',
          blogTitle: 'ant blog',
          blogDescription: 'Design notes and releases for ant, a typed ORM for Go.',
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
          postsPerPage: 10,
          showReadingTime: true,
          editUrl: 'https://github.com/skudra-go/ant-docs/edit/main/',
          authorsMapPath: 'authors.yml',
          tags: 'tags.yml',
          onInlineAuthors: 'throw',
          onInlineTags: 'throw',
          onUntruncatedBlogPosts: 'throw',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            title: 'ant blog',
            description: 'Design notes and releases for ant, a typed ORM for Go.',
            copyright: `Copyright © ${new Date().getFullYear()} the ant authors`,
          },
        },
        pages: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    [
      './src/plugins/llms',
      {
        summary:
          'ant is a Go ORM. Models are plain structs, columns are field pointers that the compiler checks, and there is no code generation.',
      },
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
        ignoreCssSelectors: ['.api-card'],
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // The social card shown when any page is shared. Blog posts set their own.
      image: 'img/blog/field-pointers.png',
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
          {to: '/why-ant', label: 'Why ant', position: 'left'},
          {to: '/queries/conditions', label: 'Queries', position: 'left'},
          {to: '/migrations/overview', label: 'Migrations', position: 'left'},
          {to: '/blog', label: 'Blog', position: 'right'},
          {href: reference, label: 'API', position: 'right'},
          {href: 'https://github.com/skudra-go/ant-examples', label: 'Examples', position: 'right'},
          {href: repo, label: 'GitHub', position: 'right'},
        ],
      },
      footer: {
        style: 'light',
        links: [
          {label: 'Blog', to: '/blog'},
          {label: 'RSS', href: 'pathname:///blog/rss.xml'},
          {label: 'llms.txt', href: 'pathname:///llms.txt'},
        ],
        copyright: 'ant is open source under the MIT License.',
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
