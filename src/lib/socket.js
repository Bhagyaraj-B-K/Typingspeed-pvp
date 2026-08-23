import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://typingspeed-pvp.apps.appstra.dev';

// A single shared socket instance for the whole app.
// autoConnect is false so we only open the connection once the app has mounted,
// which lets us wire up listeners before anything can fire.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const STATUS = {
  ACTIVE: 1,
  READY: 2,
  INGAME: 3,
  COMPLETED: 4,
};
