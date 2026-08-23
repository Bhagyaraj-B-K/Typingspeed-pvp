import { STATUS } from '../lib/socket';

function medal(rank) {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return `${rank + 1}`;
}

export default function ResultsPanel({ resultData, username, onPlayAgain }) {
  if (!resultData) return null;
  const { users, final } = resultData;
  const entries = Object.entries(users);

  const completed = entries
    .filter(([, u]) => u.status === STATUS.COMPLETED)
    .sort((a, b) => a[1].score - b[1].score);
  const rest = entries.filter(([, u]) => u.status !== STATUS.COMPLETED);

  return (
    <div className="results-overlay">
      <div className="results-card">
        <h2 className="results-title">{final ? 'Round results' : 'You finished!'}</h2>
        <p className="results-sub">
          {final
            ? 'Here is how everyone in the room finished up.'
            : 'Nice pace — waiting on the rest of the room to wrap up…'}
        </p>

        <ol className="results-list">
          {completed.map(([name, u], idx) => (
            <li key={name} className={`results-row ${name === username ? 'results-row-me' : ''}`}>
              <span className="results-rank">{medal(idx)}</span>
              <span className="results-name">
                {name}
                {name === username && <span className="player-you"> (you)</span>}
              </span>
              <span className="results-score">{u.score}s</span>
            </li>
          ))}
          {rest.map(([name]) => (
            <li key={name} className={`results-row results-row-pending ${name === username ? 'results-row-me' : ''}`}>
              <span className="results-rank">—</span>
              <span className="results-name">
                {name}
                {name === username && <span className="player-you"> (you)</span>}
              </span>
              <span className="results-score">{final ? 'Incomplete' : 'Typing…'}</span>
            </li>
          ))}
        </ol>

        {final ? (
          <button type="button" className="btn btn-accent btn-block" onClick={onPlayAgain}>
            Back to lobby
          </button>
        ) : (
          <div className="results-waiting">
            <span className="spinner" aria-hidden="true" />
            Waiting for the round to end…
          </div>
        )}
      </div>
    </div>
  );
}
