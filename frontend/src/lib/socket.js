/**
 * Socket.io client for real-time transfer.
 * Connect to same host as API (or VITE_API_URL for LAN).
 */
import { io } from 'socket.io-client';
import { getSocketURL } from './api';

let socket = null;

export function getSocket() {
  if (socket?.connected) return socket;
  const url = getSocketURL();
  socket = io(url || window.location.origin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
