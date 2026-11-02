import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import AntMark from './AntMark';

const install = 'go get github.com/skudra-go/ant';

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
  const {release, reference, repo} = useDocusaurusContext().siteConfig.customFields;

  return (
    <header className="hero-ant">
      <div className="hero-ant__mark">
        <AntMark watch size={96} />
      </div>
      <p className="hero-ant__status">
        <Link to={reference}>{release}</Link> · pre-1.0, so the API can still change
      </p>
      <h1 className="hero-ant__title">Database code the compiler can read.</h1>
      <p className="hero-ant__lede">
        ant is a Go ORM built on plain structs. Queries point at your fields instead of naming
        columns in strings, so the compiler reads them too: rename a field and every query
        follows, get a type wrong and it won't build. And there's nothing to generate.
      </p>
      <Install />
      <div className="hero-ant__actions">
        <Link className="ant-button ant-button--solid" to="/quick-start">
          Quick start
        </Link>
        <Link className="ant-button" to={reference}>
          API reference
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
