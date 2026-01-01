import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API || "http://localhost:4000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});

export default socket;
