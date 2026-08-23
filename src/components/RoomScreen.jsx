import { useEffect, useState } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import TimerRing from './TimerRing';
import StatTile from './StatTile';
import TypingText from './TypingText';
import PlayerList from './PlayerList';
import ChatPanel from './ChatPanel';
import ResultsPanel from './ResultsPanel';

// Ticks a local per-second countdown once the round is live. The server only
// tells us the starting duration once at kickoff, so the remaining time is
// tracked client-side from there.
function useSecondsLeft(isPlaying, roundTimer) {
  const [value, setValue] = useState(roundTimer);

  useEffect(() => {
    if (!isPlaying) {
      setValue(roundTimer);
      return undefined;
    }
    setValue(roundTimer);
    const id = setInterval(() => {
      setValue((v) => Math.max(v - 1, 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, roundTimer]);

  return value;
}

export default function RoomScreen(game) {
  const {
    phase,
    room,
    username,
    players,
    readyMap,
    messages,
    paragraph,
    roundTimer,
    countdownSeconds,
    resultData,
    setReady,
    sendChat,
    submitCompletion,
    dismissResults,
    leaveRoom,
  } = game;

  const isPlaying = phase === 'playing';
  const isReady = !!readyMap[username];
  const secondsLeft = useSecondsLeft(isPlaying, roundTimer);

  const engine = useTypingEngine({
    text: paragraph,
    enabled: isPlaying,
    onComplete: submitCompletion,
  });

  useEffect(() => {
    if (isPlaying) engine.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, paragraph]);

  const hasStartedTyping = engine.currentWordIndex > 0 || engine.buffer.length > 0;

  return (
    <div className="room">
      <header className="room-header">
        <div className="room-header-left">
          <span className="room-code-label">Room</span>
          <span className="room-code">{room}</span>
        </div>
        <div className="room-header-right">
          <span className="room-username">{username}</span>
          <button type="button" className="btn btn-ghost btn-small" onClick={leaveRoom}>
            Leave
          </button>
        </div>
      </header>

      {phase === 'waiting' && (
        <div className="room-waiting">
          <div className="room-waiting-main">
            <h1 className="room-waiting-title">Get set.</h1>
            <p className="room-waiting-sub">
              Everyone in the room needs to hit ready before the round can start.
            </p>
            <button
              type="button"
              className={`btn btn-block btn-lg ${isReady ? 'btn-danger' : 'btn-accent'}`}
              onClick={() => setReady(!isReady)}
            >
              {isReady ? 'Cancel ready' : "I'm ready"}
            </button>
          </div>
          <aside className="room-sidebar">
            <section>
              <h3 className="sidebar-heading">Players in room</h3>
              <PlayerList players={players} readyMap={readyMap} username={username} />
            </section>
            <section className="sidebar-chat">
              <h3 className="sidebar-heading">Chat</h3>
              <ChatPanel messages={messages} onSend={sendChat} username={username} />
            </section>
          </aside>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="room-countdown">
          <span className="room-countdown-eyebrow">Round starting</span>
          <div className="room-countdown-number">{countdownSeconds}</div>
          <p className="room-countdown-sub">Get your fingers ready…</p>
        </div>
      )}

      {(isPlaying || phase === 'results') && (
        <div className="game-view">
          <h1 className="game-title">Test your typing skills</h1>

          <div className="game-hud">
            <TimerRing value={secondsLeft} max={roundTimer} urgent={secondsLeft <= 10} />
            <div className="stat-row">
              <StatTile value={engine.stats.wpm} label="words/min" />
              <StatTile value={engine.stats.cpm} label="chars/min" />
              <StatTile value={`${engine.stats.accuracy}%`} label="accuracy" />
            </div>
          </div>

          <TypingText
            wordStates={engine.wordStates}
            currentWordIndex={engine.currentWordIndex}
            buffer={engine.buffer}
            errorFlash={engine.errorFlash}
            inputRef={engine.inputRef}
            onKeyDown={engine.handleKeyDown}
            onChange={engine.handleChange}
            onPaste={engine.handlePaste}
            disabled={!isPlaying || engine.finished}
            showStartHint={isPlaying && !hasStartedTyping}
          />

          <p className="game-hint">
            {engine.finished
              ? 'Nice! Submitting your result…'
              : 'Each word locks in before the next one unlocks — get it right to keep moving.'}
          </p>
        </div>
      )}

      {phase === 'results' && (
        <ResultsPanel resultData={resultData} username={username} paragraph={paragraph} onPlayAgain={dismissResults} />
      )}
    </div>
  );
}
