import { useCallback, useEffect, useRef, useState } from 'react';
import { socket, STATUS } from '../lib/socket';

const READY_RE = /^(.+) is Ready to Play!!!$/;
const NOT_READY_RE = /^(.+) is Not Ready!$/;
const JOINED_RE = /^(.+) has joined the room\.$/;
const LEFT_RE = /^(.+) has left the room\.$/;

let msgId = 0;

export function useGame() {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [screen, setScreen] = useState('landing');
  const [phase, setPhase] = useState('waiting');
  const [room, setRoom] = useState('');
  const [username, setUsername] = useState('');
  const [players, setPlayers] = useState([]);
  const [readyMap, setReadyMap] = useState({});
  const [messages, setMessages] = useState([]);
  const [paragraph, setParagraph] = useState('');
  const [roundTimer, setRoundTimer] = useState(60);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [resultData, setResultData] = useState(null);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const usernameRef = useRef('');
  const intentionalDisconnectRef = useRef(false);

  /*
   * IMPORTANT:
   *
   * This prevents the backend's second
   * "joining room" event from causing another
   * "join" request.
   */
  const joinSentRef = useRef(false);

  const toastTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({
      message,
      type,
      id: Date.now(),
    });

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const pushMessage = useCallback((text, kind = 'system') => {
    setMessages((prev) => [
      ...prev.slice(-199),
      {
        id: ++msgId,
        text,
        kind,
        ts: Date.now(),
      },
    ]);
  }, []);

  const resetToLanding = useCallback(() => {
    setScreen('landing');
    setPhase('waiting');
    setRoom('');
    setPlayers([]);
    setReadyMap({});
    setMessages([]);
    setParagraph('');
    setResultData(null);
    setPendingAction(null);

    /*
     * Allow a future room join.
     */
    joinSentRef.current = false;

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------
  // SOCKET EVENT LISTENERS
  // ---------------------------------------------------------

  useEffect(() => {
    function onConnect() {
      setConnectionStatus('connected');
    }

    function onDisconnect() {
      setConnectionStatus('disconnected');

      if (intentionalDisconnectRef.current) {
        return;
      }

      showToast(
        'Lost connection to the server. Trying to reconnect…',
        'error'
      );
    }

    function onConnectError() {
      setConnectionStatus('disconnected');
    }

    /*
     * BACKEND EVENT:
     *
     * create
     *   ↓
     * "joining room"
     *   ↓
     * join
     *   ↓
     * "joining room"
     *
     * We only emit "join" once.
     */
    function onJoiningRoom(data) {
      setRoom(data.room);
      setUsername(data.username);
      usernameRef.current = data.username;

      /*
       * The first "joining room" event tells us to join.
       *
       * The second "joining room" event comes from the
       * backend after join() has already happened.
       *
       * Therefore don't emit join twice.
       */
      if (!joinSentRef.current) {
        joinSentRef.current = true;

        socket.emit(
          'join',
          data.room,
          data.username
        );
      }

      setScreen('room');
      setPhase('waiting');
      setPendingAction(null);
    }

    function onError(msg) {
      /*
       * If joining failed, allow another join attempt.
       */
      if (msg === 'Room not found!') {
        joinSentRef.current = false;

        resetToLanding();

        setFormError(msg);
        setPendingAction(null);

        return;
      }

      if (msg === 'Room name already in use!') {
        joinSentRef.current = false;

        setFormError(msg);
        setPendingAction(null);

        return;
      }

      showToast(msg, 'error');
    }

    function onMessage(msg) {
      pushMessage(msg, 'system');

      let m;

      if ((m = READY_RE.exec(msg))) {
        setReadyMap((prev) => ({
          ...prev,
          [m[1]]: true,
        }));

      } else if ((m = NOT_READY_RE.exec(msg))) {
        setReadyMap((prev) => ({
          ...prev,
          [m[1]]: false,
        }));

      } else if ((m = JOINED_RE.exec(msg))) {
        setReadyMap((prev) => ({
          ...prev,
          [m[1]]: prev[m[1]] ?? false,
        }));

      } else if ((m = LEFT_RE.exec(msg))) {
        setReadyMap((prev) => {
          const next = { ...prev };

          delete next[m[1]];

          return next;
        });
      }
    }

    function onPlayerInRoom(users) {
      setPlayers(users);

      setReadyMap((prev) => {
        const next = {};

        users.forEach((user) => {
          next[user] = prev[user] ?? false;
        });

        return next;
      });
    }

    function onStartGame(data) {
      setParagraph(data.text);
      setRoundTimer(data.timer);
      setResultData(null);

      setPhase('countdown');
      setCountdownSeconds(5);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      let n = 5;

      countdownIntervalRef.current = setInterval(() => {
        n -= 1;

        setCountdownSeconds(n);

        if (n <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;

          setPhase('playing');
        }
      }, 1000);
    }

    function onResult(users) {
      const me = users[usernameRef.current];

      if (
        me &&
        me.status === STATUS.COMPLETED
      ) {
        setResultData({
          users,
          final: false,
        });

        setPhase('results');
      }
    }

    function onEndGame(users) {
      setResultData({
        users,
        final: true,
      });

      setPhase('results');
      setReadyMap({});
    }

    function onRoomDisbanded(msg) {
      showToast(msg, 'error');
      resetToLanding();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.on('joining room', onJoiningRoom);
    socket.on('error', onError);
    socket.on('message', onMessage);
    socket.on('playerInRoom', onPlayerInRoom);
    socket.on('start game', onStartGame);
    socket.on('result', onResult);
    socket.on('end game', onEndGame);
    socket.on('room disbanded', onRoomDisbanded);

    /*
     * Only connect if the socket isn't already connected.
     */
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);

      socket.off('joining room', onJoiningRoom);
      socket.off('error', onError);
      socket.off('message', onMessage);
      socket.off('playerInRoom', onPlayerInRoom);
      socket.off('start game', onStartGame);
      socket.off('result', onResult);
      socket.off('end game', onEndGame);
      socket.off('room disbanded', onRoomDisbanded);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, [
    pushMessage,
    resetToLanding,
    showToast,
  ]);

  // ---------------------------------------------------------
  // CREATE ROOM
  // ---------------------------------------------------------

  const createRoom = useCallback(
    (roomName, user, gameMode = 'WPM') => {
      setFormError(null);

      setPendingAction('create');

      /*
       * New room = new join operation.
       */
      joinSentRef.current = false;

      socket.emit(
        'create',
        roomName,
        gameMode,
        user
      );
    },
    []
  );

  // ---------------------------------------------------------
  // JOIN EXISTING ROOM
  // ---------------------------------------------------------

  const joinRoom = useCallback(
    (roomName, user) => {
      setFormError(null);

      setPendingAction('join');

      /*
       * New room = new join operation.
       */
      joinSentRef.current = false;

      socket.emit(
        'joining',
        roomName,
        user
      );
    },
    []
  );

  // ---------------------------------------------------------
  // READY
  // ---------------------------------------------------------

  const setReady = useCallback(
    (ready) => {
      socket.emit(
        'player ready',
        ready
      );

      setReadyMap((prev) => ({
        ...prev,
        [usernameRef.current]: ready,
      }));
    },
    []
  );

  // ---------------------------------------------------------
  // CHAT
  // ---------------------------------------------------------

  const sendChat = useCallback((text) => {
    if (!text.trim()) {
      return;
    }

    socket.emit(
      'chat message',
      text.trim()
    );
  }, []);

  // ---------------------------------------------------------
  // COMPLETION
  // ---------------------------------------------------------

  const submitCompletion = useCallback((text) => {
    socket.emit(
      'completed',
      text
    );
  }, []);

  // ---------------------------------------------------------
  // RESULTS
  // ---------------------------------------------------------

  const dismissResults = useCallback(() => {
    setResultData(null);
    setPhase('waiting');
  }, []);

  // ---------------------------------------------------------
  // LEAVE ROOM
  // ---------------------------------------------------------

  const leaveRoom = useCallback(() => {
    /*
     * Prevent any pending "joining room" event from
     * starting another join.
     */
    joinSentRef.current = false;

    intentionalDisconnectRef.current = true;

    /*
     * Your backend removes a player from a room on
     * socket disconnect, so preserve that behavior.
     */
    socket.disconnect();

    resetToLanding();

    /*
     * Reconnect after the state has been reset.
     *
     * Do this asynchronously so the disconnect event
     * finishes first.
     */
    setTimeout(() => {
      if (!socket.connected) {
        socket.connect();
      }

      intentionalDisconnectRef.current = false;
    }, 0);
  }, [resetToLanding]);

  // ---------------------------------------------------------
  // TOAST
  // ---------------------------------------------------------

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    connectionStatus,
    screen,
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
    toast,
    formError,
    pendingAction,

    createRoom,
    joinRoom,
    setReady,
    sendChat,
    submitCompletion,
    dismissResults,
    leaveRoom,
    dismissToast,
  };
}