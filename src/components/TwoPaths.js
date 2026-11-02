import React from 'react';
import Link from '@docusaurus/Link';

function Step({title, children}) {
  return (
    <li>
      <strong>{title}</strong>
      <span>{children}</span>
    </li>
  );
}

// TwoPaths shows how a project reaches ant's migrations, from nothing or from a
// running database, and that both end in the same loop.
export default function TwoPaths() {
  return (
    <figure className="paths">
      <div className="paths__pair">
        <div className="path">
          <h4>Starting a new project</h4>
          <ol>
            <Step title="Write your structs">They're the schema.</Step>
            <Step title={<code>migrate diff create_tables</code>}>
              Writes the first SQL file. No database needed.
            </Step>
            <Step title="Read the file">It's plain SQL, and yours to edit.</Step>
            <Step title={<code>migrate up</code>}>Applies it, and records that it ran.</Step>
          </ol>
        </div>
        <div className="path">
          <h4>Bringing an existing database</h4>
          <ol>
            <Step title={<code>pg_dump --schema-only</code>}>Your schema, as it is today.</Step>
            <Step title="Write structs to match">
              By hand, or with an AI assistant and{' '}
              <Link to="/migrations/adopting#a-prompt-for-your-assistant">this prompt</Link>.
            </Step>
            <Step title={<code>migrate drift</code>}>
              Lists every difference. Fix the structs until there are none left.
            </Step>
            <Step title={<code>migrate adopt</code>}>
              Your dump becomes migration 0001. <code>baseline</code> marks it as already applied.
            </Step>
          </ol>
        </div>
      </div>
      <div className="paths__join">
        <strong>From here, both are the same.</strong> Change a struct, run <code>diff</code>, read
        the SQL, run <code>up</code>. <code>check</code> fails your CI if someone forgot.
      </div>
    </figure>
  );
}
