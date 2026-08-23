# Typing Speed PvP — Frontend

A standalone React + Vite client for the [Typing-Speed-PvP](https://github.com/Bhagyaraj-B-K/Typing-Speed-PvP)
Socket.IO backend, styled around the "Test your typing skills" reference look
(warm cream background, yellow countdown ring, serif typing text).

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

The backend URL is already set to `https://typingspeed-pvp.apps.appstra.dev`
in `.env`. Change `VITE_SOCKET_URL` there if you point it at a different
deployment, then restart `npm run dev`.

## How it maps to the backend

This app talks to the exact socket.io protocol in `index.js` / `events/index.js`
of the backend repo — nothing was added server-side:

| Client emits | When |
|---|---|
| `create(room, gameMode, username)` | Creating a room from the landing screen |
| `joining(room, username)` | Checking a room exists, before joining |
| `join(room, username)` | Immediately after `joining room` comes back — this is what actually registers you as a room member (mirrors the debug client's redirect-then-join flow) |
| `player ready(bool)` | Ready / cancel-ready button |
| `chat message(text)` | Room chat |
| `completed(text)` | Fired automatically the instant your locally-built string matches the full paragraph |

| Server emits | Handled as |
|---|---|
| `joining room` | Triggers the `join` emit and moves you into the room screen |
| `error` | Shown inline on the form (room not found / name taken) or as a toast otherwise |
| `message` | Room chat log; also parsed to infer per-player ready state, since the backend doesn't broadcast a structured ready list |
| `playerInRoom` | Player roster |
| `start game({text, timer})` | Kicks off the 5s local countdown, then reveals the paragraph and starts the round |
| `result` | Shown as an interim "you finished, waiting on others" panel when *your* status flips to completed |
| `end game` | Final leaderboard for everyone; ready state resets client-side to match the server resetting everyone to ACTIVE |

## The one rule you asked for

You can't get to the next word until the current one is typed exactly right.
Space is intercepted: if the word you've typed doesn't match, the space is
swallowed and the box flashes red instead of advancing — so a mistake in the
middle of the passage can never be silently skipped past. This is implemented
in `src/hooks/useTypingEngine.js`.

## WPM / chars-per-min / accuracy

The backend only tracks completion time (seconds to finish), not live typing
stats, so words/min, chars/min, and accuracy are computed client-side in
real time from your own keystrokes (see `useTypingEngine`) purely for the
on-screen HUD — they aren't sent anywhere, and the actual PvP score is still
whatever the server calculates.

## Things added beyond the debug client, since you said that was fair game

- A proper landing screen (create/join tabs) instead of two hidden panels.
- A lobby with a player list, live ready badges, and chat, instead of raw `<li>`s.
- A 5s pre-round countdown screen.
- A results screen that distinguishes "you finished, waiting on the room" from
  the final leaderboard, with medals for top 3.
- Toasts for connection issues / server errors instead of `alert()`.
- The word-locking typing rule described above (the original debug client let
  you edit freely and only checked the whole string against the target).

## Project layout

```
src/
  lib/socket.js            socket.io-client instance + STATUS enum
  hooks/useGame.js         all server protocol + screen/phase state
  hooks/useTypingEngine.js word-by-word typing logic, stats, caret state
  components/              LandingScreen, RoomScreen, TypingText, TimerRing, …
  styles/                  theme.css (tokens), app.css, doodles.css
```

## Note on this build

I wasn't able to run `npm install` / a live build in the sandbox this was
written in (no network access there), so this hasn't been through an actual
`vite build`. I read through every file closely for the usual gotchas
(bad imports, stale closures, JSX bracket mismatches), but it's worth doing
`npm run dev` and clicking through a full round the first time before you
trust it fully.
