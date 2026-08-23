import { useState } from 'react';

const MODES = [
  { id: 'create', label: 'Create room' },
  { id: 'join', label: 'Join room' },
];

export default function LandingScreen({ onCreate, onJoin, formError, pendingAction, connectionStatus }) {
  const [mode, setMode] = useState('create');
  const [room, setRoom] = useState('');
  const [username, setUsername] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!room.trim() || !username.trim()) return;
    if (mode === 'create') onCreate(room.trim(), username.trim());
    else onJoin(room.trim(), username.trim());
  }

  const busy = pendingAction !== null;

  return (
    <div className="landing">
      <div className="landing-eyebrow">Typing Speed PvP</div>
      <h1 className="landing-title">
        Race someone.
        <br />
        Word for word.
      </h1>
      <p className="landing-sub">
        Open a room, get your opponent in, and see who clears the passage first —
        every word has to land before the next one unlocks.
      </p>

      <div className="landing-card">
        <div className="mode-tabs" role="tablist">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              className={`mode-tab ${mode === m.id ? 'mode-tab-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form className="landing-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Room name</span>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder={mode === 'create' ? 'e.g. friday-showdown' : 'Enter the room code'}
              autoComplete="off"
              required
            />
          </label>
          <label className="field">
            <span>Your name</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="What should we call you?"
              autoComplete="off"
              required
            />
          </label>

          {formError && <div className="form-error">{formError}</div>}

          <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
            {busy
              ? mode === 'create'
                ? 'Creating room…'
                : 'Joining room…'
              : mode === 'create'
              ? 'Create room'
              : 'Join room'}
          </button>
        </form>
      </div>

      <div className={`conn-badge conn-${connectionStatus}`}>
        <span className="conn-dot" />
        {connectionStatus === 'connected' && 'Connected to server'}
        {connectionStatus === 'connecting' && 'Connecting…'}
        {connectionStatus === 'disconnected' && 'Disconnected — retrying'}
      </div>
    </div>
  );
}
