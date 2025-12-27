import { io } from 'socket.io-client';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function connectSocket() {
  return io(baseURL, {
    transports: ['websocket'],
  });
}
