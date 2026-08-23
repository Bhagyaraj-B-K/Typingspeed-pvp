import { useEffect, useRef } from 'react';

function renderActiveWord(word, typed) {
  const nodes = [];
  const maxLen = Math.max(word.length, typed.length);
  // Walk one past the last character so the caret can render at the very end
  // (works whether the word is under-typed, exactly typed, or overtyped).
  for (let i = 0; i <= maxLen; i++) {
    if (i === typed.length) {
      nodes.push(<span key={`caret-${i}`} className="caret" aria-hidden="true" />);
    }
    if (i < maxLen) {
      if (i < word.length) {
        let cls = 'char-pending';
        if (i < typed.length) cls = typed[i] === word[i] ? 'char-correct' : 'char-incorrect';
        nodes.push(
          <span key={i} className={`char ${cls}`}>
            {word[i]}
          </span>
        );
      } else {
        nodes.push(
          <span key={i} className="char char-extra">
            {typed[i]}
          </span>
        );
      }
    }
  }
  return nodes;
}

export default function TypingText({
  wordStates,
  currentWordIndex,
  buffer,
  errorFlash,
  inputRef,
  onKeyDown,
  onChange,
  onPaste,
  onFocusBox,
  disabled,
  showStartHint,
}) {
  const activeWordRef = useRef(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (activeWordRef.current && scrollAreaRef.current) {
      activeWordRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentWordIndex]);

  return (
    <div
      className={`typing-box ${errorFlash ? 'typing-box-error' : ''} ${disabled ? 'typing-box-disabled' : ''}`}
      onClick={() => inputRef.current?.focus()}
    >
      {showStartHint && (
        <div className="start-hint">
          <span className="start-hint-tag">Start typing</span>
        </div>
      )}
      <div className="typing-text-scroll" ref={scrollAreaRef}>
        <p className="typing-text">
          {wordStates.map((ws, idx) => {
            const isActive = ws.status === 'active';
            return (
              <span
                key={idx}
                ref={isActive ? activeWordRef : null}
                className={`word word-${ws.status}`}
              >
                {isActive ? renderActiveWord(ws.word, buffer) : ws.word}
              </span>
            );
          })}
        </p>
      </div>
      <input
        ref={inputRef}
        className="typing-hidden-input"
        value={buffer}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocusBox}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        aria-label="Typing input"
      />
    </div>
  );
}
