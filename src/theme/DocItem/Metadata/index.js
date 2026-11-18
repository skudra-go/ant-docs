import React from 'react';
import Metadata from '@theme-original/DocItem/Metadata';
import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc, useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import {breadcrumbList} from '@site/src/structured-data.mjs';

// Adds a BreadcrumbList for search engines. The visible breadcrumbs are off
// (breadcrumbs: false), and Docusaurus only writes this data along with them.
export default function MetadataWrapper(props) {
  const {siteConfig} = useDocusaurusContext();
  const {metadata} = useDoc();
  const sidebar = useDocsSidebar();
  const home = useBaseUrl('/');
  const list = breadcrumbList({
    site: siteConfig.url,
    home,
    sidebarItems: sidebar?.items ?? null,
    permalink: metadata.permalink,
    title: metadata.title,
  });

  return (
    <>
      <Metadata {...props} />
      {list && (
        <Head>
          <script type="application/ld+json">{JSON.stringify(list)}</script>
        </Head>
      )}
    </>
  );
}
