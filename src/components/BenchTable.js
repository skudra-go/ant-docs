import React from 'react';

// BenchTable shows one metric from ant's tools/compare benchmarks: medians of 10
// runs on PostgreSQL 17, from tools/compare/results.txt in the ant repo. The best
// library in each row is worked out here, so the colours can't disagree with the
// numbers. database/sql is the baseline and never wins, so it sits last, set apart
// from the libraries it doesn't compete with.
const columns = [
  {key: 'ant', name: 'ant'},
  {key: 'antNT', name: 'ant', sub: 'NoTracking'},
  {key: 'gorm', name: 'GORM'},
  {key: 'bun', name: 'Bun'},
  {key: 'ent', name: 'ent'},
  {key: 'sql', name: 'Plain SQL', sub: 'baseline', baseline: true},
];

const data = {
  time: [
    {label: 'Read 1000 rows', ant: 2075, antNT: 1692, sql: 1692, gorm: 3361, bun: 2370, ent: 2240},
    {label: 'Find one by key', ant: 442, antNT: 397, sql: 398, gorm: 405, bun: 384, ent: 398},
    {label: 'Filter, sort, 10 rows', ant: 557, antNT: 539, sql: 535, gorm: 568, bun: 535, ent: 556},
    {label: '100 users, 500 posts', ant: 2238, antNT: 1774, sql: 1581, gorm: 2731, bun: 2030, ent: 2031},
    {label: 'Insert one', ant: 410, sql: 392, gorm: 420, bun: 1112, ent: 404},
    {label: 'Update one column', ant: 399, sql: 390, gorm: 407, bun: 424, ent: 402},
    {label: 'Load, edit, save', ant: 805, sql: 798, gorm: 818, bun: 812, ent: 1869},
  ],
  memory: [
    {label: 'Read 1000 rows', ant: 582, antNT: 275, sql: 257, gorm: 392, bun: 295, ent: 589},
    {label: 'Find one by key', ant: 3.8, antNT: 3.5, sql: 1.5, gorm: 5.7, bun: 6.3, ent: 4.9},
    {label: 'Filter, sort, 10 rows', ant: 11.5, antNT: 7.9, sql: 3.8, gorm: 9.7, bun: 9.2, ent: 11.9},
    {label: '100 users, 500 posts', ant: 486, antNT: 241, sql: 257, gorm: 362, bun: 277, ent: 335},
    {label: 'Insert one', ant: 2.5, sql: 1.3, gorm: 7.0, bun: 6.8, ent: 3.7},
    {label: 'Update one column', ant: 2.5, sql: 0.3, gorm: 5.6, bun: 5.0, ent: 3.1},
    {label: 'Load, edit, save', ant: 5.8, sql: 1.8, gorm: 11.2, bun: 11.2, ent: 10.7},
  ],
  allocs: [
    {label: 'Read 1000 rows', ant: 6850, antNT: 6794, sql: 7772, gorm: 14810, bun: 8790, ent: 15843},
    {label: 'Find one by key', ant: 67, antNT: 52, sql: 36, gorm: 89, bun: 41, ent: 126},
    {label: 'Filter, sort, 10 rows', ant: 146, antNT: 115, sql: 99, gorm: 219, bun: 124, ent: 305},
    {label: '100 users, 500 posts', ant: 5011, antNT: 3144, sql: 4063, gorm: 9558, bun: 6218, ent: 8152},
    {label: 'Insert one', ant: 47, sql: 23, gorm: 79, bun: 54, ent: 86},
    {label: 'Update one column', ant: 27, sql: 8, gorm: 61, bun: 14, ent: 64},
    {label: 'Load, edit, save', ant: 116, sql: 44, gorm: 146, bun: 52, ent: 269},
  ],
};

const units = {time: 'µs', memory: 'KiB', allocs: 'Allocations'};

// Results within 1% of the best are a tie, and share the green.
const tie = 1.01;

// Allocations are counts, so they never get a decimal place.
function format(value, metric) {
  return value >= 100 || metric === 'allocs' ? value.toLocaleString('en-US') : value.toFixed(1);
}

export default function BenchTable({metric}) {
  return (
    <div className="verdict">
      <table className="verdict__table verdict__table--bench">
        <colgroup>
          <col className="verdict__label" />
          {columns.map((c) => (
            <col
              key={c.key}
              className={c.baseline ? 'verdict__baseline' : undefined}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>
              <span className="verdict__name">{units[metric]} per operation</span>
              <span className="verdict__sub">lower is better</span>
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                className={c.baseline ? 'verdict__baseline' : c.name === 'ant' ? 'verdict__ant' : undefined}>
                <span className="verdict__name">{c.name}</span>
                <span className="verdict__sub">{c.sub || '\u00a0'}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data[metric].map((row) => {
            const scored = columns.filter((c) => !c.baseline && row[c.key] !== undefined);
            const best = Math.min(...scored.map((c) => row[c.key]));

            return (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {columns.map((c) => {
                  const value = row[c.key];

                  if (value === undefined) {
                    return (
                      <td key={c.key} className="verdict__none">
                        <span className="verdict__fill">–</span>
                      </td>
                    );
                  }

                  const wins = !c.baseline && value <= best * tie;

                  return (
                    <td key={c.key} className={c.baseline ? 'verdict__baseline' : undefined}>
                      <span className={`verdict__fill${wins ? ' verdict__good' : ''}`}>{format(value, metric)}</span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
