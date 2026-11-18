import React, {useState} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {softwareSourceCode} from '@site/src/structured-data.mjs';
import AntMark from './AntMark';

const install = 'go get github.com/skudra-go/ant';

// The home page's title in search results and shares. It replaces the usual
// "<page> | ant Go ORM", because "ant" alone can't be searched for.
const title = 'ant: a typed Go ORM with compile-checked queries and no codegen';

function Install() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(install).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="hero-ant__install">
      <code>
        <span className="hero-ant__prompt" aria-hidden="true">
          $
        </span>
        {install}
      </code>
      <button type="button" onClick={copy} aria-label="Copy the install command">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function Hero() {
  const {siteConfig} = useDocusaurusContext();
  const {release, reference, repo} = siteConfig.customFields;
  const project = softwareSourceCode({
    url: siteConfig.url,
    description: useDoc().metadata.description,
    repo,
  });

  return (
    <header className="hero-ant">
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <script type="application/ld+json">{JSON.stringify(project)}</script>
      </Head>
      <div className="hero-ant__mark">
        <AntMark watch size={96} />
      </div>
      <p className="hero-ant__status">
        <Link to={reference}>{release}</Link> · pre-1.0 · Go 1.27+
      </p>
      <h1 className="hero-ant__title">A typed ORM for Go.</h1>
      <p className="hero-ant__lede">
        Plain structs, queries the compiler checks, and no code generation. Built on
        database/sql, for PostgreSQL, MySQL, MariaDB, SQLite and SQL Server.
      </p>
      <Install />
      <div className="hero-ant__actions">
        <Link className="ant-button ant-button--solid" to="/quick-start">
          Quick start
        </Link>
        <Link className="ant-button" to="/why-ant">
          Why ant
        </Link>
        <Link className="ant-button" to={repo}>
          GitHub
        </Link>
        <Link className="ant-button" to="https://github.com/skudra-go/ant-examples">
          Example projects
        </Link>
      </div>
    </header>
  );
}

export function Descriptors({children}) {
  return <div className="descriptors">{children}</div>;
}

export function Descriptor({title, children}) {
  return (
    <div className="descriptor">
      <h3 className="descriptor__title">{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function Routes({children}) {
  return <nav className="routes">{children}</nav>;
}

export function Route({to, title, children}) {
  return (
    <Link className="route" to={to}>
      <span className="route__title">{title}</span>
      <span className="route__text">{children}</span>
    </Link>
  );
}
