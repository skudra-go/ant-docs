import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// A link to the repository that asks for a star. A plain link: no script, no
// iframe, and no star count fetched from GitHub.
export default function StarOnGitHub({compact = false, className}) {
  const {repo} = useDocusaurusContext().siteConfig.customFields;

  return (
    <Link
      className={clsx('ant-button', 'star-button', compact && 'star-button--compact', className)}
      to={repo}
      aria-label={compact ? 'Star ant on GitHub' : undefined}>
      <span className="star-button__star" aria-hidden="true">
        ★
      </span>
      {compact ? (
        <span>
          Star<span className="star-button__more"> on GitHub</span>
        </span>
      ) : (
        'Star ant on GitHub'
      )}
    </Link>
  );
}

// The box that ends a blog post or the quick start: a line of text, the star
// button, and one more place to go. The text is a prop, not children, so that the
// tag fits on one line, which is how src/plugins/llms.js drops widgets.
export function StarBox({text, next}) {
  return (
    <aside className="star-box">
      <p className="star-box__text">{text}</p>
      <div className="star-box__actions">
        <StarOnGitHub />
        {next && (
          <Link className="ant-button" to={next.to}>
            {next.label}
          </Link>
        )}
      </div>
    </aside>
  );
}

// The navbar's form: compact on wide screens, a menu link in the mobile menu.
export function StarNavbarItem({mobile = false}) {
  const {repo} = useDocusaurusContext().siteConfig.customFields;

  if (mobile) {
    return (
      <li className="menu__list-item">
        <Link className="menu__link" to={repo}>
          ★ Star ant on GitHub
        </Link>
      </li>
    );
  }

  return (
    <div className="navbar__item">
      <StarOnGitHub compact />
    </div>
  );
}
