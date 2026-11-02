import React from 'react';

const base = 'https://github.com/skudra-go/ant/tree/main/tests/features/';

// Tests links a page to the feature tests that pin down what it says.
export default function Tests({path}) {
  return (
    <p className="tests-link">
      See it tested: <a href={base + path}>tests/features/{path}</a>
    </p>
  );
}
