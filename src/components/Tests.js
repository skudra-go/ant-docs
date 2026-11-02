import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// Tests links a page to the feature tests that pin down what it says, as of the
// release the docs are checked against.
export default function Tests({path}) {
  const {release, repo} = useDocusaurusContext().siteConfig.customFields;

  return (
    <p className="tests-link">
      See it tested: <a href={`${repo}/tree/${release}/tests/features/${path}`}>tests/features/{path}</a>
    </p>
  );
}
