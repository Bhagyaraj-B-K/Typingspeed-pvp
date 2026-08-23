# Typing Speed PvP — Frontend

A lightweight React + Vite client for the Typing Speed PvP game.

## Quick start

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

Set the backend Socket.IO URL by updating `VITE_SOCKET_URL` in `.env`.

## How to play

- Create or join a room and ready up.
- When the round starts a paragraph appears; type it word-by-word.
- You must type each word exactly to advance; mistakes prevent progressing.

## Backend

This frontend pairs with the Typing-Speed-PvP backend: https://github.com/Bhagyaraj-B-K/Typing-Speed-PvP

## Project structure (brief)

- `src/` — components, hooks, and styles
- `src/hooks/useTypingEngine.js` — core typing logic and stats

## Notes

- This README was trimmed for clarity. For protocol details or development notes, refer to the backend repo and the source files in `src/`.
