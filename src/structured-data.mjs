// JSON-LD for search engines: the home page describes the project, and every other
// doc page gets a breadcrumb trail from the sidebar. Plain functions, so that
// `npm test` can check them; the theme components only render what they return.
// An ES module, because webpack refuses module.exports in a file it imports.

// The home page: ant as source code, with its repository and author.
export function softwareSourceCode({url, description, repo}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'ant',
    description,
    codeRepository: repo,
    programmingLanguage: 'Go',
    license: 'https://opensource.org/license/mit',
    url,
    author: {
      '@type': 'Person',
      name: 'Alberts Liepiņš',
      url: 'https://github.com/borderss',
    },
  };
}

// The first doc a category leads to, which stands in for the category: sidebar
// categories here have no page of their own.
function firstHref(items) {
  for (const item of items) {
    if (item.type === 'link' && item.docId) {
      return item.href;
    }

    if (item.type === 'category') {
      const href = item.href ?? firstHref(item.items);

      if (href) {
        return href;
      }
    }
  }

  return undefined;
}

// The categories that lead to the page at permalink, outermost first, and the
// page's own sidebar item. Returns null when the sidebar doesn't list the page.
function trail(items, permalink) {
  for (const item of items) {
    if (item.type === 'link' && item.docId && item.href === permalink) {
      return [item];
    }

    if (item.type === 'category') {
      const rest = trail(item.items, permalink);

      if (rest) {
        return [item, ...rest];
      }
    }
  }

  return null;
}

// A folder's index page, such as transactions/transactions, has a permalink that
// ends in a slash, but its canonical URL doesn't (trailingSlash: false).
const canonical = (href) => href.replace(/(.)\/$/, '$1');

// Home, then each category, then the page. A category whose first doc is this
// page is left out, so no two entries share a URL. The home page gets none.
export function breadcrumbList({site, home, sidebarItems, permalink, title}) {
  if (permalink === home) {
    return null;
  }

  const crumbs = [{name: 'Home', href: home}];
  const path = sidebarItems ? trail(sidebarItems, permalink) : null;

  if (path) {
    for (const item of path.slice(0, -1)) {
      const href = item.href ?? firstHref(item.items);

      if (href && canonical(href) !== canonical(permalink)) {
        crumbs.push({name: item.label, href: canonical(href)});
      }
    }

    crumbs.push({name: path[path.length - 1].label, href: canonical(permalink)});
  } else {
    crumbs.push({name: title, href: canonical(permalink)});
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: site + crumb.href,
    })),
  };
}
