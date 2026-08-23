export default function PlayerList({ players, readyMap, username }) {
  return (
    <ul className="player-list">
      {players.map((p) => {
        const isReady = !!readyMap[p];
        const isSelf = p === username;
        return (
          <li key={p} className="player-row">
            <span className={`ready-dot ${isReady ? 'ready-dot-on' : ''}`} aria-hidden="true" />
            <span className="player-name">
              {p}
              {isSelf && <span className="player-you"> (you)</span>}
            </span>
            <span className={`ready-tag ${isReady ? 'ready-tag-on' : ''}`}>
              {isReady ? 'Ready' : 'Waiting'}
            </span>
          </li>
        );
      })}
      {players.length === 0 && <li className="player-row player-row-empty">Waiting for players…</li>}
    </ul>
  );
}
