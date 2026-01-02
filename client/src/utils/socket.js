import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API || "http://localhost:4000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // connect explicitly after auth completes
});

// Basic client-side logging to help debug connection issues
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('⚠️ Socket connect_error:', err && err.message ? err.message : err);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Socket disconnected:', reason);
});

export default socket;
