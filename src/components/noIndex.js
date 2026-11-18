import React from 'react';
import Head from '@docusaurus/Head';

// Wraps a blog page that only lists other pages, such as a tag or an author, so
// that search engines index the posts instead. The sitemap leaves these pages
// out too (ignorePatterns in docusaurus.config.js).
export default function noIndex(Page) {
  return function NoIndexPage(props) {
    return (
      <>
        <Page {...props} />
        <Head>
          <meta name="robots" content="noindex" />
        </Head>
      </>
    );
  };
}
