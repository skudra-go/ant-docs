import React, {useState} from 'react';

const sizes = [3, 10, 50];
const shown = 8;

function Log({title, count, lines, more, good}) {
  return (
    <div className="log">
      <div className="log__head">
        <span>{title}</span>
        <strong className={good ? 'is-good' : 'is-bad'}>
          {count} {count === 1 ? 'query' : 'queries'}
        </strong>
      </div>
      <ol className={good ? 'log__lines is-good' : 'log__lines is-bad'}>
        {lines.map((line, i) => (
          <li key={`${count}-${i}`} style={{animationDelay: `${i * 45}ms`}}>
            <code>{line}</code>
          </li>
        ))}
        {more > 0 && <li className="log__more">and {more} more, one for each user</li>}
      </ol>
    </div>
  );
}

// QueryLog shows the statements themselves, because a reader who has never heard of
// N+1 can still count them.
export default function QueryLog() {
  const [users, setUsers] = useState(3);
  const each = Array.from({length: users}, (_, i) => i + 1);
  const perRow = ['SELECT * FROM users'];

  each.slice(0, shown).forEach((id) => {
    perRow.push(`SELECT * FROM posts WHERE user_id = ${id}`);
  });

  const ids = users > 5 ? `1, 2, 3, ... ${users}` : each.join(', ');
  const batched = ['SELECT * FROM users', `SELECT * FROM posts WHERE user_id IN (${ids})`];

  return (
    <figure className="logs" aria-label="The statements behind loading posts for a list of users">
      <div className="logs__control">
        <span>A page shows</span>
        {sizes.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={n === users}
            className={n === users ? 'is-active' : ''}
            onClick={() => setUsers(n)}>
            {n}
          </button>
        ))}
        <span>users with their posts</span>
      </div>
      <div className="logs__pair">
        <Log
          title="One query per row"
          count={users + 1}
          lines={perRow}
          more={Math.max(0, users - shown)}
        />
        <Log good title="All at once" count={2} lines={batched} more={0} />
      </div>
    </figure>
  );
}
