import React from 'react';

// CatchTable shows where each library catches a mistake in the query that Why ant
// compares, as icons, with the detail in each cell's tooltip. Every cell was
// checked by compiling the mistake, or for sqlc by running sqlc generate 1.30 on it.
const libraries = ['ant', 'GORM', 'Bun', 'ent', 'sqlc'];

const yes = {mark: 'yes', title: 'Compile error: your editor and go build flag it'};
const no = {mark: 'no', title: 'Not caught: it compiles and fails at runtime'};
const sqlc = {mark: 'tool', title: 'Caught by sqlc generate, before the build'};

const rows = [
  {mistake: 'Misspelled column', cells: [yes, no, no, yes, sqlc]},
  {
    mistake: (
      <>
        <code>"18"</code> for an <code>int</code>
      </>
    ),
    cells: [yes, no, no, yes, yes],
  },
  {mistake: 'Misspelled relation', cells: [yes, no, no, yes, sqlc]},
  {
    mistake: 'Column of another model',
    full: true,
    cells: [{mark: 'tool', title: 'Caught by antvet. ant refuses it before sending the query'}, no, no, yes, sqlc],
  },
  {
    mistake: 'No code generation step',
    cells: [
      {mark: 'yes', title: 'Nothing to generate'},
      {mark: 'yes', title: 'Nothing to generate'},
      {mark: 'yes', title: 'Nothing to generate'},
      {mark: 'none', title: 'Needs go generate after a schema change'},
      {mark: 'none', title: 'Needs sqlc generate after a query or schema change'},
    ],
  },
];

function Mark({mark}) {
  const paths = {
    yes: <path d="M7 12.5l3.2 3.2L17 9" />,
    no: <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />,
    tool: <path d="M12 7.5v5.5M12 16.4v.1" />,
  };

  if (mark === 'none') {
    return <span className="catch__dash" aria-hidden="true" />;
  }

  return (
    <svg className={`catch__mark catch__mark--${mark}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" />
      {paths[mark]}
    </svg>
  );
}

export default function CatchTable({short = false}) {
  return (
    <div className="verdict">
      <table className="verdict__table catch">
        <colgroup>
          <col className="verdict__label" />
          {libraries.map((name) => (
            <col key={name} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>Mistake</th>
            {libraries.map((name) => (
              <th key={name} className={name === 'ant' ? 'verdict__ant' : undefined}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((row) => !(short && row.full))
            .map((row, i) => (
              <tr key={i}>
                <th scope="row">{row.mistake}</th>
                {row.cells.map((cell, j) => (
                  <td key={j} title={`${libraries[j]}: ${cell.title}`}>
                    <Mark mark={cell.mark} />
                    <span className="sr-only">{cell.title}</span>
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      <p className="verdict__legend">
        <span>
          <Mark mark="yes" /> Compile error, shown in your editor
        </span>
        <span>
          <Mark mark="tool" /> Caught by a separate step: <code>sqlc generate</code>, or <code>antvet</code> for ant
        </span>
        <span>
          <Mark mark="no" /> Compiles and fails at runtime
        </span>
        <span>
          <Mark mark="none" /> Needs <code>go generate</code> or <code>sqlc generate</code>
        </span>
      </p>
    </div>
  );
}
