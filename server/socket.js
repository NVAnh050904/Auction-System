import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { saveMessage } from './controllers/chat.controller.js';

let io;
const rooms = new Map(); // Store room info: { roomId: { name, users: [] } }
const userRooms = new Map(); // Track which room each user is in

export const initSocket = (server, options = {}) => {
  const allowedOrigins = [process.env.ORIGIN];
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow non-browser clients and same-origin
        if (!origin) return callback(null, true);
        // Allow exact allowed origins
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        // Allow localhost / 127.0.0.1 with any dev port
        try {
          const lc = origin.toLowerCase();
          if (lc.startsWith('http://localhost') || lc.startsWith('http://127.0.0.1') || lc.startsWith('http://[::1]')) return callback(null, true);
        } catch (e) {
          // fall through
        }
        // If a custom ORIGIN is set, allow any same-base origin
        if (process.env.ORIGIN && origin && origin.startsWith(process.env.ORIGIN)) return callback(null, true);
        return callback(new Error('CORS policy: Origin not allowed'));
      },
      credentials: true,
    },
    ...options,
  });

  // Initialize default rooms
  rooms.set(0, { name: 'General', users: [] });
  rooms.set(1, { name: 'Room 1', users: [] });
  rooms.set(2, { name: 'Room 2', users: [] });
  rooms.set(3, { name: 'Room 3', users: [] });
  console.log('🔌 Socket.IO initialized with rooms:', Array.from(rooms.keys()));

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Helper: try to extract user info from auth cookie (JWT) if client didn't send it
    const getUserFromSocket = () => {
      try {
        const cookieHeader = socket.handshake.headers?.cookie;
        if (!cookieHeader) return null;
        const cookies = cookieHeader.split(';').map(c => c.trim()).reduce((acc, pair) => {
          const idx = pair.indexOf('=');
          if (idx === -1) return acc;
          const key = decodeURIComponent(pair.slice(0, idx));
          const val = decodeURIComponent(pair.slice(idx + 1));
          acc[key] = val;
          return acc;
        }, {});
        const token = cookies.auth_token || cookies['auth-token'] || cookies.authToken || cookies.auth;
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
      } catch (err) {
        return null;
      }
    };

    // Get all available rooms
    socket.on('getRooms', () => {
      const roomList = Array.from(rooms.entries()).map(([roomId, room]) => ({
        id: roomId,
        name: room.name,
        userCount: room.users.length,
        users: room.users.map(u => u.name),
      }));
      socket.emit('roomsList', roomList);
    });

    // User joins a chat room
    socket.on('joinRoom', (data) => {
      const { roomId } = data || {};
      let { userId, userName, userRole } = data || {};
      // fallback to JWT decoded user if fields missing
      if (!userId || !userName) {
        const sUser = getUserFromSocket();
        if (sUser) {
          userId = userId || (sUser.id || sUser._id);
          userName = userName || sUser.name;
          userRole = userRole || sUser.role;
        }
      }

      // sanitize values: reject empty-string or literal 'undefined' values
      if (userName === 'undefined') userName = null;
      if (typeof userId === 'string') userId = userId.trim();
      if (!userId) {
        // try to recover from JWT decode again
        const sUser2 = getUserFromSocket();
        if (sUser2 && (sUser2.id || sUser2._id)) {
          userId = String(sUser2.id || sUser2._id);
          if (!userName) userName = sUser2.name || null;
        }
      }

      if (!userId) {
        socket.emit('messageError', { error: 'Not authenticated or missing userId' });
        console.warn('sendMessage rejected: missing userId after fallback');
        return;
      }

      console.log(`🚪 joinRoom request: roomId=${roomId}, user=${userName} (${userId}), role=${userRole}`);
      
      // Leave previous room if any
      const prevRoom = userRooms.get(userId);
      if (prevRoom !== undefined) {
        console.log(`  🚪 User was in room ${prevRoom}, leaving it first`);
        socket.leave(`room:${prevRoom}`);
        if (rooms.has(prevRoom)) {
          const room = rooms.get(prevRoom);
          room.users = room.users.filter(u => u.id !== userId);
          io.to(`room:${prevRoom}`).emit('userLeft', {
            userId,
            userName,
            userCount: room.users.length,
            roomId: prevRoom,
            users: room.users.map(u => u.name),
          });
        }
      }

      // Join new room
      socket.join(`room:${roomId}`);
      userRooms.set(userId, roomId);

      if (!rooms.has(roomId)) {
        console.log(`  ❌ Room ${roomId} does not exist! Creating it...`);
        rooms.set(roomId, { name: `Room ${roomId}`, users: [] });
      }
      const room = rooms.get(roomId);
      room.users.push({ id: userId, name: userName, role: userRole });

      console.log(`  ✅ User ${userName} joined room ${roomId}. Room now has ${room.users.length} users: ${room.users.map(u => u.name).join(', ')}`);

      // Notify all users in room
      io.to(`room:${roomId}`).emit('userJoined', {
        userId,
        userName,
        userRole,
        userCount: room.users.length,
        roomId,
        users: room.users.map(u => u.name),
      });
    });

    // User sends message
    socket.on('sendMessage', async (data) => {
      const { roomId, text, timestamp } = data || {};
      let { userId, userName, userRole } = data || {};
      if (!userId || !userName) {
        const sUser = getUserFromSocket();
        if (sUser) {
          userId = userId || (sUser.id || sUser._id);
          userName = userName || sUser.name;
          userRole = userRole || sUser.role || 'user';
        }
      }

      console.log(`📨 sendMessage received: roomId=${roomId}, user=${userName} (${userId}), msg=${String(text || '').slice(0,50)}`);
      
      if (!rooms.has(roomId)) {
        console.log(`❌ Room ${roomId} not found in rooms:`, Array.from(rooms.keys()));
        return;
      }

      try {
        // Save to database
        const savedMsg = await saveMessage({ roomId, userId, userName, userRole, text });

        // Prefer the DB-saved values (and stringify ObjectIds) to ensure clients receive stable string IDs
        const broadcastUserId = savedMsg.userId ? String(savedMsg.userId) : (userId ? String(userId) : null);
        const broadcastUserName = (savedMsg.userName && savedMsg.userName !== 'undefined') ? savedMsg.userName : (userName && userName !== 'undefined' ? userName : null);
        const broadcastId = savedMsg.id || savedMsg._id ? String(savedMsg.id || savedMsg._id) : `db-${Date.now()}`;

        const message = {
          id: broadcastId,
          roomId: parseInt(roomId),
          userId: broadcastUserId,
          userName: broadcastUserName,
          text: savedMsg.text || text,
          timestamp: savedMsg.timestamp || savedMsg.createdAt || new Date(),
        };

        const roomSockets = io.sockets.adapter.rooms.get(`room:${roomId}`);
        const socketCount = roomSockets ? roomSockets.size : 0;
        console.log(`📤 Broadcasting to room:${roomId}, sockets=${socketCount}, message=`, message);
        io.to(`room:${roomId}`).emit('newMessage', message);
        console.log(`✅ Message broadcast complete to room:${roomId}`);
      } catch (error) {
        console.error(`❌ Error processing message:`, error);
        socket.emit('messageError', { error: 'Failed to save message' });
      }
    });

    // User leaves room
    socket.on('leaveRoom', (data) => {
      const { roomId, userId, userName } = data;
      console.log(`🚪 leaveRoom request: roomId=${roomId}, user=${userName} (${userId})`);
      socket.leave(`room:${roomId}`);
      userRooms.delete(userId);

      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.users = room.users.filter(u => u.id !== userId);
        io.to(`room:${roomId}`).emit('userLeft', {
          userId,
          userName,
          userCount: room.users.length,
          roomId,
          users: room.users.map(u => u.name),
        });

        // Delete empty room
        if (room.users.length === 0) {
          rooms.delete(roomId);
          console.log(`  ✅ Room ${roomId} is now empty, deleted`);
        }
      }
      console.log(`  ✅ User ${userName} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Clean up user's room on disconnect
      for (const [userId, roomId] of userRooms.entries()) {
        if (rooms.has(roomId)) {
          const room = rooms.get(roomId);
          room.users = room.users.filter(u => u.id !== userId);
          // Notify others that user left
          io.to(`room:${roomId}`).emit('userLeft', {
            userId,
            userName: 'Unknown User',
            userCount: room.users.length,
            roomId,
            users: room.users.map(u => u.name),
          });
          if (room.users.length === 0) {
            rooms.delete(roomId);
          }
        }
        userRooms.delete(userId);
      }
    });
  });

  return io;
};

export const getIO = () => io;
