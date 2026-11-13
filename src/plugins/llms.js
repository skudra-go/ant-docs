// llms writes the docs in plain Markdown for AI assistants, following
// https://llmstxt.org:
//
//   /llms.txt        an index: what ant is, the rules that matter most, and a
//                    link to every page, in sidebar order
//   /llms-full.txt   every page in one file
//   /<page>.md       each page on its own, beside its HTML
//
// It reads the MDX source, not the rendered HTML, and turns the site's own
// components into Markdown: spotlight comments and underline marks are dropped,
// tabs become labelled blocks, test links become links, and the interactive
// widgets, which hold no facts a sample doesn't, are left out. Code that belongs
// to other libraries is labelled so it isn't read as ant's.
//
// llms-intro.md, beside this file, opens both text files: the rules an assistant
// gets wrong when it guesses from other ORMs. The files exist only in a build
// (`npm run build`), not under `npm start`.

const fs = require('fs');
const path = require('path');

// Widgets with no Markdown form. Each page says in prose what they show.
const widgets = new Set([
  'BenchTable',
  'CatchTable',
  'FieldTrace',
  'Hero',
  'LostUpdate',
  'MigrationFlow',
  'QueryLog',
  'SaveDemo',
  'TwoPaths',
]);

// Wrappers whose content is kept and whose tags are dropped.
const wrappers = new Set(['Compare', 'Lib', 'Pain', 'Routes', 'Tabs', 'CollapsibleCode']);

// What a wrapper's opening tag says before its content, when it needs saying.
const labels = {
  Others: 'Other libraries, for comparison. This is not ant code:',
  Ant: 'The same in ant:',
};

const spot = /^\s*(\/\/|--|#)\s*spot-(start|end|next-line)\s*$/;
const marks = /⟦[-+]:(.*?)⟧/g;

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));

  return m ? m[1] : undefined;
}

// A fence's info string keeps only the language. The title becomes a line above
// it, and a sample written to fail compiling says so.
function fence(info) {
  const lang = info.split(/\s+/)[0];
  const title = attr(info, 'title');
  const notes = [];

  if (title) {
    notes.push(`${title}:`);
  }

  if (/\bcompile-fail\b/.test(info)) {
    notes.push('This does not compile, on purpose:');
  }

  return {lang, notes};
}

// toMarkdown turns one MDX page into Markdown.
function toMarkdown(source, {link, testsURL}) {
  const lines = source.replace(/^---\n[\s\S]*?\n---\n/, '').split('\n');
  const out = [];
  let inFence = false;
  let fenceMark = '';
  let comment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // An MDX comment, which may hide whole fences that only the sample checker reads.
    if (comment || (!inFence && line.trim().startsWith('{/*'))) {
      comment = !line.includes('*/}');

      continue;
    }

    const open = line.match(/^(\s*)(`{3,})(.*)$/);

    if (open && !inFence) {
      const {lang, notes} = fence(open[3].trim());

      if (notes.length > 0) {
        out.push(...notes, '');
      }

      inFence = true;
      fenceMark = open[2];
      out.push(`${open[1]}${fenceMark}${lang}`);

      continue;
    }

    if (inFence) {
      if (line.trim() === fenceMark) {
        inFence = false;
        out.push(line);

        continue;
      }

      if (!spot.test(line)) {
        out.push(line.replace(marks, '$1'));
      }

      continue;
    }

    if (/^import\s.+\sfrom\s'.+';?\s*$/.test(line)) {
      continue;
    }

    const tag = line.trim().match(/^<\/?([A-Z][A-Za-z]*)\b[^]*$/);

    if (tag) {
      const name = tag[1];
      const closing = line.trim().startsWith('</');

      if (name === 'Tests') {
        const p = attr(line, 'path');

        out.push(`Tested in [tests/features/${p}](${testsURL}/${p}).`);
      } else if (name === 'Route') {
        const m = line.trim().match(/^<Route\b[^>]*>(.*)<\/Route>$/);

        out.push(`- [${attr(line, 'title')}](${link(attr(line, 'to'))}): ${m ? m[1] : ''}`);
      } else if (name === 'TabItem' && !closing) {
        out.push(`**${attr(line, 'label')}:**`);
      } else if (name === 'CollapsibleCode' && !closing) {
        out.push(`${attr(line, 'title')}:`);
      } else if (labels[name] && !closing) {
        out.push(labels[name]);
      } else if (!widgets.has(name) && !wrappers.has(name) && !labels[name] && name !== 'TabItem') {
        throw new Error(`llms: no Markdown form for <${name}>; add it to src/plugins/llms.js`);
      }

      continue;
    }

    out.push(
      line
        .replace(/\s*\{#[a-z0-9-]+\}\s*$/, '')
        .replace(/\]\((?:pathname:\/\/)?(\/[^)\s]*)\)/g, (_, to) => `](${link(to)})`),
    );
  }

  if (inFence || comment) {
    throw new Error('llms: unclosed fence or comment');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// The page ids in sidebar order, with the section each belongs to.
function walk(items, section, into) {
  for (const item of items) {
    if (item.type === 'doc') {
      into.push({id: item.id, section});
    } else if (item.type === 'category') {
      walk(item.items, item.label, into);
    } else if (item.type === 'html' && item.className === 'sidebar-group') {
      section = item.value;
    }
  }

  return into;
}

module.exports = function llms(context, options) {
  const {siteConfig, siteDir} = context;
  const site = siteConfig.url + siteConfig.baseUrl.replace(/\/$/, '');
  const intro = fs.readFileSync(path.join(__dirname, 'llms-intro.md'), 'utf8').trim();
  let pages = [];
  let posts = [];

  return {
    name: 'llms',

    async allContentLoaded({allContent}) {
      const docs = allContent['docusaurus-plugin-content-docs'].default.loadedVersions[0];
      const blog = allContent['docusaurus-plugin-content-blog']?.default;
      const byID = new Map(docs.docs.map((d) => [d.id, d]));

      pages = walk(docs.sidebars.docs, '', []).map(({id, section}) => {
        const doc = byID.get(id);

        return {
          section,
          title: doc.title,
          description: doc.description,
          // A folder's index page, such as transactions/transactions, ends in a slash.
          permalink: doc.permalink.replace(/(.)\/$/, '$1'),
          file: path.join(siteDir, doc.source.replace(/^@site\//, '')),
        };
      });

      posts = (blog?.blogPosts ?? []).map((p) => ({
        title: p.metadata.title,
        description: p.metadata.description,
        permalink: p.metadata.permalink,
      }));
    },

    async postBuild({outDir}) {
      const permalinks = new Set(pages.map((p) => p.permalink));

      // A link to a page goes to its Markdown copy; anything else to the site.
      const link = (to) => {
        const [p, hash] = to.split('#');
        const page = p.replace(/\/$/, '') || '/';

        if (permalinks.has(page)) {
          return `${site}${mdPath(page)}${hash ? `#${hash}` : ''}`;
        }

        return site + to;
      };

      const testsURL = `${siteConfig.customFields.repo}/tree/${siteConfig.customFields.release}/tests/features`;
      const full = [];

      for (const page of pages) {
        const body = toMarkdown(fs.readFileSync(page.file, 'utf8'), {link, testsURL});
        const md = `# ${page.title}\n\n> ${page.description}\n\nSource: ${site}${page.permalink}\n\n${body}\n`;

        fs.mkdirSync(path.dirname(path.join(outDir, mdPath(page.permalink))), {recursive: true});
        fs.writeFileSync(path.join(outDir, mdPath(page.permalink)), md);
        full.push(md);
      }

      const index = [
        `# ${siteConfig.title}`,
        '',
        `> ${options.summary}`,
        '',
        intro,
        '',
      ];

      let section;

      for (const page of pages) {
        if (page.section !== section) {
          section = page.section;
          index.push('', `## ${section}`, '');
        }

        index.push(`- [${page.title}](${site}${mdPath(page.permalink)}): ${page.description}`);
      }

      index.push(
        '',
        '## Optional',
        '',
        `- [Full documentation](${site}/llms-full.txt): every page above in one file`,
        `- [API reference](${siteConfig.customFields.reference}): every exported name, on pkg.go.dev`,
        ...posts.map((p) => `- [${p.title}](${site}${p.permalink}): ${p.description}`),
      );

      fs.writeFileSync(path.join(outDir, 'llms.txt'), `${index.join('\n')}\n`);
      fs.writeFileSync(path.join(outDir, 'llms-full.txt'), `${intro}\n\n${full.join('\n\n')}`);
    },
  };
};

// The home page is /, so its copy is /index.md.
function mdPath(permalink) {
  return permalink === '/' ? '/index.md' : `${permalink}.md`;
}

module.exports.toMarkdown = toMarkdown;
