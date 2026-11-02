// api-links turns the first mention of each ant API on a page into a link to its
// entry on pkg.go.dev, with the declaration and first sentence of its doc as a hover
// card. A mention like `ant.Foo` that names nothing fails the build, so a page can't
// promise an API the release doesn't have.
//
// api.json comes from tools/doccheck, for the release doccheck checks samples
// against: `npm run api` rebuilds it after a version bump.

const fs = require('fs');
const path = require('path');

const api = require('./api.json');

// A variable named the way these docs name it stands for its type.
const receivers = {
  db: 'Context',
  tx: 'Context',
  b: 'ModelBuilder',
  q: 'Query',
};

// When a bare method name belongs to several types, the first of these that has it
// is meant. A name that is also a function, such as Count, or that an interface
// declares too, such as an interceptor's After, is never linked bare.
const preferred = ['Table', 'Query', 'Context', 'ModelBuilder'];

// Code inside these belongs to other libraries, so its names aren't ant's.
const foreign = new Set(['Others', 'Lib']);

// These compare ant with other libraries, so a bare name may be theirs: only names
// written with their package, like ant.Gt, are linked.
const mixed = new Set(['Pain']);

// Skipped entirely: a link can't hold another, and headings feed the table of contents.
const skipped = new Set(['link', 'linkReference', 'heading', 'code']);

const ant = api.packages.ant.symbols;
const methods = new Map();
const interfaces = new Set();

for (const [key, symbol] of Object.entries(ant)) {
  const [type, name] = key.split('.');

  if (name && symbol.kind === 'method') {
    methods.set(name, [...(methods.get(name) ?? []), type]);
  }

  if (!name && symbol.interface) {
    interfaces.add(type);
  }
}

// A mention is a selector path, optionally called: `ant.Gt(&U.Age, 18)`,
// `db.Users.Find(ctx, 1)`, `Join[J]`. Anything else, like a struct tag, isn't one.
const mention = /^&?([A-Za-z_]\w*(?:\[[^\]]*\])?(?:\.[A-Za-z_]\w*(?:\[[^\]]*\])?)*)(\(.*\))?$/s;

function resolve(text, qualifiedOnly = false) {
  const match = mention.exec(text.trim());

  if (!match) {
    return null;
  }

  const parts = match[1].replace(/\[[^\]]*\]/g, '').split('.');
  const [first, ...rest] = parts;
  const pkg = api.packages[first];

  if (pkg && rest.length > 0) {
    const key = rest.join('.');

    if (/^[A-Z]/.test(key)) {
      return {pkg: first, key, known: Boolean(pkg.symbols[key])};
    }

    return null;
  }

  if (qualifiedOnly) {
    return null;
  }

  if (receivers[first] && rest.length === 1) {
    return found('ant', `${receivers[first]}.${rest[0]}`);
  }

  // db.Users.Find: a table on the context.
  if (first === 'db' && rest.length === 2 && /^[A-Z]/.test(rest[0])) {
    return found('ant', `Table.${rest[1]}`);
  }

  if (/^[A-Z]/.test(first) && rest.length === 1 && ant[first]) {
    return found('ant', `${first}.${rest[0]}`);
  }

  if (rest.length === 0 && /^[A-Z]/.test(first) && !ant[first]) {
    const types = methods.get(first) ?? [];
    const shared = types.length > 1 && types.some((t) => interfaces.has(t));
    const type = types.length === 1 ? types[0] : !shared && preferred.find((t) => types.includes(t));

    return type ? found('ant', `${type}.${first}`) : null;
  }

  return null;
}

function found(pkg, key) {
  return api.packages[pkg].symbols[key] ? {pkg, key, known: true} : null;
}

function card(symbol) {
  const children = [
    {
      type: 'element',
      tagName: 'span',
      properties: {className: ['api-card__decl']},
      children: [{type: 'text', value: symbol.decl}],
    },
  ];

  if (symbol.doc) {
    children.push({
      type: 'element',
      tagName: 'span',
      properties: {className: ['api-card__doc']},
      children: [{type: 'text', value: symbol.doc}],
    });
  }

  return {
    type: 'apiCard',
    data: {
      hName: 'span',
      hProperties: {className: ['api-card'], ariaHidden: 'true'},
      hChildren: children,
    },
  };
}

function versionInGoMod() {
  const goMod = fs.readFileSync(path.join(__dirname, '../../tools/doccheck/go.mod'), 'utf8');
  const required = new RegExp(`^\\s*${api.module.replace(/\./g, '\\.')} (\\S+)`, 'm').exec(goMod);

  return required?.[1];
}

module.exports = function apiLinks() {
  const wanted = versionInGoMod();

  if (wanted !== api.version) {
    throw new Error(
      `src/remark/api.json is for ${api.module} ${api.version}, but tools/doccheck/go.mod asks for ${wanted}. Run npm run api.`,
    );
  }

  return (tree, file) => {
    const linked = new Set();
    const unknown = [];

    const walk = (node, qualifiedOnly) => {
      if (skipped.has(node.type)) {
        return;
      }

      const jsx = node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';

      if (jsx && foreign.has(node.name)) {
        return;
      }

      const inMixed = qualifiedOnly || (jsx && mixed.has(node.name));

      node.children?.forEach((child, i) => {
        if (child.type !== 'inlineCode') {
          walk(child, inMixed);

          return;
        }

        const target = resolve(child.value, inMixed);

        if (!target) {
          return;
        }

        if (!target.known) {
          unknown.push(child.value);

          return;
        }

        const id = `${target.pkg}.${target.key}`;

        if (linked.has(id)) {
          return;
        }

        linked.add(id);

        const pkg = api.packages[target.pkg];
        const symbol = pkg.symbols[target.key];

        node.children[i] = {
          type: 'link',
          url: symbol.url ?? `${pkg.url}#${target.key}`,
          data: {hProperties: {className: ['api-ref']}},
          children: [child, card(symbol)],
        };
      });
    };

    walk(tree, false);

    if (unknown.length > 0) {
      throw new Error(`${file.path}: no such API in ${api.module} ${api.version}: ${unknown.join(', ')}`);
    }
  };
};

module.exports.resolve = resolve;
