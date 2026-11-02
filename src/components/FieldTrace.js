import React from 'react';

function Field({children}) {
  return <span className="trace__field">{children}</span>;
}

function Value({children}) {
  return <span className="trace__value">{children}</span>;
}

// FieldTrace shows one condition beside the SQL it becomes. Each colour marks the
// same thing on both sides, so it reads at a glance.
export default function FieldTrace() {
  return (
    <figure className="trace" aria-label="A Go condition and the SQL it becomes">
      <div className="trace__pair">
        <div className="trace__side">
          <span className="trace__label">You write</span>
          <code className="trace__code">
            ant.Gt(<Field>&amp;U.Age</Field>, <Value>18</Value>)
          </code>
        </div>
        <div className="trace__arrow" aria-hidden="true" />
        <div className="trace__side">
          <span className="trace__label">PostgreSQL gets</span>
          <code className="trace__code">
            WHERE <Field>"users"."age"</Field> &gt; <Value>$1</Value>
          </code>
          <code className="trace__note">
            <Value>$1</Value> = 18
          </code>
        </div>
      </div>

      <dl className="trace__key">
        <div>
          <dt>
            <Field>&amp;U.Age</Field> becomes <Field>"users"."age"</Field>
          </dt>
          <dd>
            It points at the <code>Age</code> field of your <code>User</code> struct, so ant knows
            the column. Rename the field and every query follows.
          </dd>
        </div>
        <div>
          <dt>
            <Value>18</Value> becomes <Value>$1</Value>
          </dt>
          <dd>
            It has to be an <code>int</code>, because <code>Age</code> is one. Write{' '}
            <code>"18"</code> and it won't build. It's sent as a parameter, never pasted into the
            SQL.
          </dd>
        </div>
      </dl>

      <p className="trace__aside">
        <code>U</code> is declared once, next to the model: <code>var U = ant.Fields[User]()</code>
      </p>
    </figure>
  );
}
