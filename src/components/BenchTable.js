import React from 'react';

// BenchTable shows one metric from ant's tools/compare benchmarks: medians of 10
// runs on PostgreSQL 17, from tools/compare/results.txt in the ant repo. The best
// library in each row is worked out here, so the colours can't disagree with the
// numbers. database/sql is the baseline and never wins.
const columns = [
  {key: 'ant', name: 'ant'},
  {key: 'antNT', name: 'ant', sub: 'NoTracking'},
  {key: 'sql', name: 'Plain SQL', sub: 'baseline', baseline: true},
  {key: 'gorm', name: 'GORM'},
  {key: 'bun', name: 'Bun'},
  {key: 'ent', name: 'ent'},
];

const data = {
  time: [
    {label: 'Read 1000 rows', ant: 2799, antNT: 1688, sql: 1557, gorm: 3285, bun: 2259, ent: 2226},
    {label: 'Find one by key', ant: 406, antNT: 389, sql: 365, gorm: 416, bun: 372, ent: 383},
    {label: 'Filter, sort, 10 rows', ant: 574, antNT: 552, sql: 518, gorm: 561, bun: 584, ent: 635},
    {label: '100 users, 500 posts', ant: 3039, antNT: 2091, sql: 1750, gorm: 3034, bun: 2198, ent: 2194},
    {label: 'Insert one', ant: 431, sql: 400, gorm: 442, bun: 1164, ent: 441},
    {label: 'Update one column', ant: 413, sql: 396, gorm: 444, bun: 444, ent: 412},
    {label: 'Load, edit, save', ant: 830, sql: 806, gorm: 861, bun: 779, ent: 1784},
  ],
  memory: [
    {label: 'Read 1000 rows', ant: 823, antNT: 277, sql: 257, gorm: 392, bun: 295, ent: 589},
    {label: 'Find one by key', ant: 7.5, antNT: 6.5, sql: 1.5, gorm: 5.7, bun: 6.3, ent: 4.9},
    {label: 'Filter, sort, 10 rows', ant: 15.1, antNT: 10.5, sql: 3.8, gorm: 9.7, bun: 9.3, ent: 11.9},
    {label: '100 users, 500 posts', ant: 649, antNT: 327, sql: 257, gorm: 362, bun: 277, ent: 335},
    {label: 'Insert one', ant: 4.3, sql: 1.3, gorm: 7.0, bun: 6.8, ent: 3.7},
    {label: 'Update one column', ant: 2.9, sql: 0.3, gorm: 5.6, bun: 5.0, ent: 3.1},
    {label: 'Load, edit, save', ant: 10.2, sql: 1.8, gorm: 11.2, bun: 11.2, ent: 10.7},
  ],
  allocs: [
    {label: 'Read 1000 rows', ant: 19373, antNT: 6831, sql: 7772, gorm: 14810, bun: 8790, ent: 15843},
    {label: 'Find one by key', ant: 118, antNT: 94, sql: 36, gorm: 89, bun: 41, ent: 126},
    {label: 'Filter, sort, 10 rows', ant: 306, antNT: 176, sql: 99, gorm: 219, bun: 124, ent: 305},
    {label: '100 users, 500 posts', ant: 11370, antNT: 4528, sql: 4063, gorm: 9558, bun: 6218, ent: 8152},
    {label: 'Insert one', ant: 107, sql: 23, gorm: 79, bun: 54, ent: 86},
    {label: 'Update one column', ant: 45, sql: 8, gorm: 61, bun: 14, ent: 64},
    {label: 'Load, edit, save', ant: 202, sql: 44, gorm: 146, bun: 52, ent: 269},
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
            <col key={c.key} />
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
