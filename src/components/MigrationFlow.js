import React from 'react';

const steps = [
  {label: 'Change a struct', detail: 'Add a field, a tag, an index'},
  {label: 'diff', detail: 'Compares models with a snapshot. No database needed'},
  {label: 'Read the .sql', detail: 'Plain SQL, yours to edit. Warnings sit above risky lines'},
  {label: 'up', detail: 'Applies it, under a lock, once'},
];

// MigrationFlow is the migration loop as a trail.
export default function MigrationFlow() {
  return (
    <ol className="flow">
      {steps.map((s) => (
        <li key={s.label} className="flow__step">
          <strong>{s.label}</strong>
          <span>{s.detail}</span>
        </li>
      ))}
    </ol>
  );
}
