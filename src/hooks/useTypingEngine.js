import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Drives the word-by-word typing interaction.
 *
 * The core rule: the player can never advance past the current word unless
 * they've typed it exactly right. Pressing space on a wrong/incomplete word
 * is swallowed and flashes an error instead of moving on — so a mid-sentence
 * mistake can never be silently skipped.
 */
export function useTypingEngine({ text, enabled, onComplete }) {
  const words = useMemo(() => (text ? text.split(' ') : []), [text]);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [buffer, setBuffer] = useState('');
  const [confirmed, setConfirmed] = useState([]);
  const [errorFlash, setErrorFlash] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({ wpm: 0, cpm: 0, accuracy: 100 });

  const bufferRef = useRef('');
  const startedAtRef = useRef(null);
  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const inputRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const completionSentRef = useRef(false);

  const reset = useCallback(() => {
    setCurrentWordIndex(0);
    setBuffer('');
    setConfirmed([]);
    setErrorFlash(false);
    setFinished(false);
    setStats({ wpm: 0, cpm: 0, accuracy: 100 });

    bufferRef.current = '';
    startedAtRef.current = null;
    totalKeystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    completionSentRef.current = false;
  }, []);

  // Reset the whole engine whenever a fresh paragraph comes in.
  useEffect(() => {
    reset();
  }, [text, reset]);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const triggerErrorFlash = useCallback(() => {
    setErrorFlash(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorFlash(false), 260);
  }, []);

  const confirmCurrentWord = useCallback(
    (finalWord) => {
      const isLastWord = currentWordIndex === words.length - 1;

      setConfirmed((prev) => [...prev, finalWord]);

      setCurrentWordIndex((i) => i + 1);
      setBuffer('');
      bufferRef.current = '';

      if (isLastWord) {
        setFinished(true);

        if (!completionSentRef.current) {
          completionSentRef.current = true;

          onComplete?.(words.join(' '));
        }
      }
    },
    [currentWordIndex, words, onComplete]
  );

  const tryAdvanceWord = useCallback(() => {
    const target = words[currentWordIndex] || '';
    if (buffer.length > 0 && buffer === target) {
      confirmCurrentWord(buffer);
    } else {
      triggerErrorFlash();
    }
  }, [buffer, words, currentWordIndex, confirmCurrentWord, triggerErrorFlash]);

  const handleBufferChange = useCallback(
    (rawVal) => {
      const newVal = rawVal.replace(/\s/g, '');
      const prevVal = bufferRef.current;
      const target = words[currentWordIndex] || '';

      if (!startedAtRef.current && newVal.length > 0) {
        startedAtRef.current = Date.now();
      }

      if (newVal.length > prevVal.length) {
        const added = newVal.slice(prevVal.length);
        for (let i = 0; i < added.length; i++) {
          const pos = prevVal.length + i;
          totalKeystrokesRef.current += 1;
          if (target[pos] === added[i]) correctKeystrokesRef.current += 1;
        }
      }

      const capped = newVal.slice(0, target.length + 15);
      setBuffer(capped);
      bufferRef.current = capped;

      // Last word has no trailing space to confirm it — detect exact match directly.
      if (currentWordIndex === words.length - 1 && capped === target && target.length > 0) {
        confirmCurrentWord(capped);
      }
    },
    [words, currentWordIndex, confirmCurrentWord]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled || finished) return;
      if (e.key === ' ') {
        e.preventDefault();
        tryAdvanceWord();
      } else if (e.key === 'Enter') {
        e.preventDefault();
      }
    },
    [enabled, finished, tryAdvanceWord]
  );

  const handleChange = useCallback(
    (e) => {
      if (!enabled || finished) return;
      handleBufferChange(e.target.value);
    },
    [enabled, finished, handleBufferChange]
  );

  const handlePaste = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Live WPM / CPM / accuracy, ticking every 400ms while the round is active.
  useEffect(() => {
    if (!enabled || finished) return undefined;
    const tick = () => {
      if (!startedAtRef.current) return;
      const elapsedMin = Math.max((Date.now() - startedAtRef.current) / 60000, 1 / 600);
      const doneChars = confirmed.reduce((acc, w) => acc + w.length + 1, 0);
      const target = words[currentWordIndex] || '';
      let curCorrect = 0;
      for (let i = 0; i < buffer.length && i < target.length; i++) {
        if (buffer[i] === target[i]) curCorrect++;
      }
      const correctChars = doneChars + curCorrect;
      const correctWords = confirmed.length + (curCorrect === target.length && target.length > 0 ? 1 : 0);
      const wpm = Math.round(correctWords / elapsedMin);
      const cpm = Math.round(correctChars / elapsedMin);
      const accuracy =
        totalKeystrokesRef.current > 0
          ? Math.round((correctKeystrokesRef.current / totalKeystrokesRef.current) * 100)
          : 100;
      setStats({ wpm: Math.max(wpm, 0), cpm: Math.max(cpm, 0), accuracy });
    };
    const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, [enabled, finished, buffer, confirmed, words, currentWordIndex]);

  const wordStates = useMemo(
    () =>
      words.map((word, idx) => {
        if (idx < currentWordIndex) return { word, status: 'done' };
        if (idx === currentWordIndex) return { word, status: 'active', typed: buffer };
        return { word, status: 'pending' };
      }),
    [words, currentWordIndex, buffer]
  );

  return {
    wordStates,
    currentWordIndex,
    totalWords: words.length,
    buffer,
    errorFlash,
    finished,
    stats,
    inputRef,
    focus,
    handleKeyDown,
    handleChange,
    handlePaste,
    reset,
  };
}
