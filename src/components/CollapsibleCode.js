import React from 'react';

// CollapsibleCode is a code block whose body starts hidden. Closed, it shows only
// a title bar like a fenced block's; open, it shows the fenced block written
// inside it, so the copy button and highlighting are the stock ones.
//
//   <CollapsibleCode title="models.go" note="User, Post, AppDB">
//
//   ```go
//   type User struct { ... }
//   ```
//
//   </CollapsibleCode>
export default function CollapsibleCode({title, note, open = false, children}) {
  return (
    <details className="collapsible-code" open={open}>
      <summary className="collapsible-code__bar">
        <span className="collapsible-code__chevron" aria-hidden="true" />
        <span className="collapsible-code__title">{title}</span>
        {note && <span className="collapsible-code__note">· {note}</span>}
      </summary>
      <div className="collapsible-code__body">{children}</div>
    </details>
  );
}
