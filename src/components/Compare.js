import React from 'react';

// Compare sets how other libraries do a job beside the same job with ant. The
// outer div is the container its two-column layout queries, since a grid can't
// query its own width.
export default function Compare({children}) {
  return (
    <div className="compare-frame">
      <div className="compare">{children}</div>
    </div>
  );
}

// Others stacks the library cards on the left.
export function Others({children}) {
  return <div className="compare__others">{children}</div>;
}

// Lib is one library: a code block, then a sentence on what that means.
export function Lib({children}) {
  return <div className="lib">{children}</div>;
}

// Ant is the card on the right.
export function Ant({children}) {
  return <div className="lib lib--ant">{children}</div>;
}

export function Pain({children}) {
  return <section className="pain">{children}</section>;
}
