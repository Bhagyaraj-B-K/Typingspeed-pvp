import { STATUS } from '../lib/socket';

function getMedal(rank) {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return `${rank + 1}`;
}

function getStats(timeSeconds, text) {
  if (!timeSeconds || timeSeconds <= 0 || !text) {
    return {
      wpm: 0,
      cpm: 0,
    };
  }

  /*
   * Everyone types the same paragraph, so the number of
   * characters in the paragraph represents the completed
   * typing volume.
   */
  const characters = text.length;
  const words = text.trim().split(/\s+/).length;

  const cpm = Math.round(characters * 60 / timeSeconds);
  const wpm = Math.round(words * 60 / timeSeconds);

  return {
    wpm,
    cpm,
  };
}

export default function ResultsPanel({
  resultData,
  username,
  paragraph,
  onPlayAgain,
}) {
  if (!resultData) return null;

  const { users, final } = resultData;

  const entries = Object.entries(users);

  /*
   * Completed players are ranked by time.
   *
   * Lower time = better position.
   */
  const completed = entries
    .filter(([, user]) => user.status === STATUS.COMPLETED)
    .sort((a, b) => a[1].score - b[1].score);

  const rest = entries.filter(
    ([, user]) => user.status !== STATUS.COMPLETED
  );

  return (
    <div className="results-overlay">
      <div className="results-card">

        <h2 className="results-title">
          {final ? 'Round results' : 'You finished!'}
        </h2>

        <p className="results-sub">
          {final
            ? 'Here is how everyone in the room finished up.'
            : 'Nice pace — waiting on the rest of the room to wrap up…'}
        </p>

        <div className="results-list">

          {completed.map(([name, user], index) => {
            const stats = getStats(user.score, paragraph);

            return (
              <div
                key={name}
                className={`results-row ${
                  name === username ? 'results-row-me' : ''
                }`}
              >
                {/* Medal / rank */}
                <span className="results-rank">
                  {getMedal(index)}
                </span>

                {/* Player */}
                <div className="results-player">
                  <div className="results-name">
                    {name}

                    {name === username && (
                      <span className="player-you">
                        {' '} (you)
                      </span>
                    )}
                  </div>

                  <div className="results-time">
                    {user.score}s
                  </div>
                </div>

                {/* Stats */}
                <div className="results-stats">
                  <div className="results-stat">
                    <strong>{stats.wpm}</strong>
                    <span>WPM</span>
                  </div>

                  <div className="results-stat">
                    <strong>{stats.cpm}</strong>
                    <span>CPM</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Players who didn't finish */}
          {rest.map(([name]) => (
            <div
              key={name}
              className={`results-row results-row-pending ${
                name === username ? 'results-row-me' : ''
              }`}
            >
              <span className="results-rank">—</span>

              <div className="results-player">
                <div className="results-name">
                  {name}

                  {name === username && (
                    <span className="player-you">
                      {' '} (you)
                    </span>
                  )}
                </div>

                <div className="results-time">
                  {final ? 'Incomplete' : 'Typing…'}
                </div>
              </div>

              <div className="results-stats">
                <div className="results-stat">
                  <strong>—</strong>
                  <span>WPM</span>
                </div>

                <div className="results-stat">
                  <strong>—</strong>
                  <span>CPM</span>
                </div>
              </div>
            </div>
          ))}

        </div>

        {final ? (
          <button
            type="button"
            className="btn btn-accent btn-block"
            onClick={onPlayAgain}
          >
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