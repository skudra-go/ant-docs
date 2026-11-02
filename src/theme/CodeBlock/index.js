import React from 'react';
import CodeBlock from '@theme-original/CodeBlock';
import MarkedCode from '@site/src/components/MarkedCode';

// A fence with "marks" in its info string underlines parts of a line, which the
// stock block cannot do: it only knows whole lines.
export default function CodeBlockWrapper(props) {
  if (props.metastring?.split(/\s+/).includes('marks')) {
    return <MarkedCode {...props} />;
  }

  return <CodeBlock {...props} />;
}
