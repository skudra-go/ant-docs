import React, {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';

const loaded = {name: 'Ada', age: 36, active: true};
const edited = {...loaded, age: 0};
const columns = ['name', 'age', 'active'];
const countdown = [30, 22, 14, 7, 0];

function show(value) {
  return JSON.stringify(value);
}

// SaveDemo edits a loaded row and shows what each library leaves in the database.
// It plays once when it comes into view, so the point lands without a click.
export default function SaveDemo() {
  const [row, setRow] = useState(edited);
  const root = useRef(null);
  const timers = useRef([]);

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    setRow(loaded);

    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        watcher.disconnect();
        countdown.forEach((age, i) => {
          timers.current.push(
            setTimeout(() => setRow((r) => ({...r, age})), 900 + i * 130),
          );
        });
      },
      {threshold: 0.5},
    );

    watcher.observe(root.current);

    return () => {
      watcher.disconnect();
      stop();
    };
  }, []);

  const changed = columns.filter((c) => row[c] !== loaded[c]);
  const stored = Object.fromEntries(columns.map((c) => [c, row[c] || loaded[c]]));
  const lost = columns.filter((c) => stored[c] !== row[c]);

  let verdict = 'Nothing to save yet.';

  if (lost.length > 0) {
    const c = lost[0];

    verdict = (
      <>
        You set <code>{c}</code> to <code>{show(row[c])}</code>. GORM left it at{' '}
        <code>{show(stored[c])}</code>, and returned no error.
      </>
    );
  } else if (changed.length > 0) {
    verdict = 'Both saved it. GORM also rewrote every other non-zero field.';
  }

  return (
    <figure
      ref={root}
      className="save-demo"
      onPointerDown={stop}
      onFocus={stop}
      aria-label="What each library stores after a zero-value update">
      <div className="save-demo__fields">
        <label className={clsx(row.name !== loaded.name && 'is-changed')}>
          <span>Name</span>
          <input
            value={row.name}
            onChange={(e) => setRow({...row, name: e.target.value})}
            spellCheck={false}
          />
        </label>
        <label className={clsx(row.age !== loaded.age && 'is-changed')}>
          <span>Age</span>
          <input
            type="number"
            min="0"
            value={row.age}
            onChange={(e) => setRow({...row, age: Number(e.target.value)})}
          />
        </label>
        <label className="save-demo__toggle">
          <span>Active</span>
          <input
            type="checkbox"
            checked={row.active}
            onChange={(e) => setRow({...row, active: e.target.checked})}
          />
          <i aria-hidden="true" />
        </label>
        <button
          type="button"
          className="save-demo__reset"
          disabled={changed.length === 0}
          onClick={() => setRow(loaded)}>
          Reset
        </button>
        <p className="save-demo__hint">Loaded as Ada, 36, active. Try your own values.</p>
      </div>

      <p className={clsx('save-demo__verdict', lost.length > 0 && 'is-wrong')} aria-live="polite">
        {verdict}
      </p>

      <div className="save-demo__results">
        <div className={clsx('save-demo__result', lost.length > 0 && 'is-wrong')}>
          <h4>
            GORM <code>Updates(user)</code>
          </h4>
          <p className="save-demo__stored">The database now holds</p>
          <ul>
            {columns.map((c) => (
              <li key={c} className={clsx(lost.includes(c) && 'is-lost')}>
                <code>{c}</code>
                <span>{show(stored[c])}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="save-demo__result is-right">
          <h4>
            ant <code>SaveChanges</code>
          </h4>
          <p className="save-demo__stored">The database now holds</p>
          <ul>
            {columns.map((c) => (
              <li key={c} className={clsx(changed.includes(c) && 'is-saved')}>
                <code>{c}</code>
                <span>{show(row[c])}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}
