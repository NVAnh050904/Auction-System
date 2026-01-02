import React, { useEffect, useState, useRef } from 'react';
import socket from '../utils/socket.js';
import { useSelector } from 'react-redux';
import { MdSend, MdLogout } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API || 'http://localhost:4000';

export default function ChatPage() {
  const { user } = useSelector((state) => state.auth);
  // Support different shapes for the auth user object
  const currentUserId = user?._id || user?.user?._id || user?.id || null;
  const currentUserName = user?.name || user?.user?.name || '';
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const recentSendsRef = useRef([]); // buffer recent sends to match server broadcasts
  const messagesRef = useRef([]);
  const messageIdsRef = useRef(new Set()); // track ids/local ids to avoid duplicates
  const currentRoomRef = useRef(currentRoom);  // Refs to support quick on-demand fetching when new messages arrive
  const fetchMessagesRef = useRef(null);
  const refetchTimeoutRef = useRef(null);
  // keep refs in sync so global socket handlers and poller can reliably check current state
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to add a single message uniquely (dedupe by id, or by user/text/timestamp proximity)
  const addUniqueMessage = (message) => {
    const mid = String(message.id || message._id || '');

    // 1) If message with same id exists, replace it
    if (mid && messagesRef.current.findIndex(m => String(m.id || m._id || '') === mid) !== -1) {
      setMessages(prev => prev.map(m => (String(m.id || m._id || '') === mid ? message : m)));
      messagesRef.current = messagesRef.current.map(m => (String(m.id || m._id || '') === mid ? message : m));
      if (mid) messageIdsRef.current.add(mid);
      console.log('addUniqueMessage(chat): replaced existing by id=', mid);
      return;
    }

    // 2) Try to find an optimistic message to replace (strict)
    const strictIndex = messagesRef.current.findIndex(m => m._optimistic && String(m.userId) === String(message.userId) && m.text === message.text && Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 5000);
    if (strictIndex !== -1) {
      setMessages(prev => {
        const next = prev.slice();
        next.splice(strictIndex, 1, message);
        messagesRef.current = next;
        if (mid) messageIdsRef.current.add(mid);
        console.log('addUniqueMessage(chat): replaced optimistic (strict) at index', strictIndex, 'with id=', mid);
        return next;
      });
      return;
    }

    // 3) Looser optimistic match
    const looseIndex = messagesRef.current.findIndex(m => m._optimistic && m.text === message.text && String(m.userId) === String(message.userId));
    if (looseIndex !== -1) {
      setMessages(prev => {
        const next = prev.slice();
        next.splice(looseIndex, 1, message);
        messagesRef.current = next;
        if (mid) messageIdsRef.current.add(mid);
        console.log('addUniqueMessage(chat): replaced optimistic (loose) at index', looseIndex, 'with id=', mid);
        return next;
      });
      return;
    }

    // 4) Prevent near-duplicates
    const dup = messagesRef.current.find(existing => String(existing.userId) === String(message.userId) && existing.text === message.text && Math.abs(new Date(existing.timestamp || existing.createdAt).getTime() - new Date(message.timestamp || message.createdAt).getTime()) < 3000);
    if (dup) {
      console.log('addUniqueMessage(chat): ignored near-duplicate for user', message.userId);
      return;
    }

    // 5) Otherwise append
    setMessages(prev => {
      const next = [...prev, message];
      messagesRef.current = next;
      if (mid) messageIdsRef.current.add(mid);
      console.log('addUniqueMessage(chat): appended message id=', mid);
      return next;
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !user._id) return;

      // Fetch available rooms
    socket.emit('getRooms');
    socket.on('roomsList', (roomList) => {
      console.log('Rooms received:', roomList);
      setRooms(roomList);

      // If we're currently in a room, update the online users from the rooms list
      // This avoids a race where the client misses the immediate 'userJoined' event
      if (currentRoom !== null && currentRoom !== undefined) {
        const r = roomList.find(rr => String(rr.id) === String(currentRoom));
        if (r) {
          setOnlineUsers(r.users || []);
        }
      }
    });

    // Global handler: ensure we also listen for the initial roomsList emitted by server even
    // before auth is available (the global effect below will set rooms/users). This guards
    // against races where the server emits before this effect runs.

    // Listen for new messages
    socket.on('newMessage', (message) => {
      try {
        console.log('📨 newMessage received:', message);
        if (String(currentRoom) !== String(message.roomId)) return;

        const mid = String(message.id || message._id || '');

        // If message id is already known, replace optimistic entry and skip
        if (mid && messageIdsRef.current.has(mid)) {
          console.log('newMessage: known id, replacing existing entry by id=', mid);
          setMessages(prev => prev.map(m => (String(m.id || m._id) === mid ? message : m)));
          messagesRef.current = messagesRef.current.map(m => (String(m.id || m._id) === mid ? message : m));
          // quick on-demand refetch nearby messages from server (debounced)
          clearTimeout(refetchTimeoutRef.current);
          refetchTimeoutRef.current = setTimeout(() => { if (fetchMessagesRef.current) fetchMessagesRef.current(); }, 250);
          return;
        }

        // Try to replace optimistic message by content+timestamp proximity
        const optimisticIndex = messagesRef.current.findIndex(m => m._optimistic && String(m.userId) === String(message.userId) && m.text === message.text && Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp || message.createdAt).getTime()) < 3000);
        if (optimisticIndex !== -1) {
          console.log('newMessage: replacing optimistic message at index', optimisticIndex);
          setMessages(prev => {
            const next = prev.slice();
            const optimistic = next[optimisticIndex];

            // fill missing user info from optimistic
            if ((!message.userId || message.userId === '') && optimistic && optimistic.userId) message.userId = optimistic.userId;
            if ((!message.userName || message.userName === '') && optimistic && optimistic.userName) message.userName = optimistic.userName;

            // remove optimistic id from id set, add server id
            if (optimistic.id) messageIdsRef.current.delete(String(optimistic.id));
            if (optimistic._id) messageIdsRef.current.delete(String(optimistic._id));
            if (message.id) messageIdsRef.current.add(String(message.id));
            if (message._id) messageIdsRef.current.add(String(message._id));

            next.splice(optimisticIndex, 1, message);
            messagesRef.current = next;
            // quick on-demand refetch nearby messages from server (debounced)
            clearTimeout(refetchTimeoutRef.current);
            refetchTimeoutRef.current = setTimeout(() => { if (fetchMessagesRef.current) fetchMessagesRef.current(); }, 250);
            return next;
          });
          return;
        }

        // If no optimistic match found, try to match against recent sends buffer
        // Use addUniqueMessage helper (handles optimistic replacement and dedupe)
        addUniqueMessage(message);
        // quick on-demand refetch nearby messages from server (debounced)
        clearTimeout(refetchTimeoutRef.current);
        refetchTimeoutRef.current = setTimeout(() => { if (fetchMessagesRef.current) fetchMessagesRef.current(); }, 250);
      } catch (err) {
        console.error('Error handling newMessage:', err, message);
      }
    });

    // Listen for user left
    socket.on('userLeft', (data) => {
      console.log('User left:', data);
      setOnlineUsers(data.users || []);
      if (String(currentRoom) === String(data.roomId)) {
        setMessages((m) => [...m, {
          id: Date.now(),
          text: `${data.userName} left the chat`,
          isSystem: true,
          timestamp: new Date(),
        }]);
      }
    });

    return () => {
      socket.off('roomsList');
      socket.off('userJoined');
      socket.off('newMessage');
      socket.off('userLeft');
    };
  }, [user, currentRoom]);

  // Ensure global roomsList handler is registered once so the initial server emit is never missed
  useEffect(() => {
    const onRoomsListGlobal = (roomList) => {
      console.log('Rooms received (global):', roomList);
      setRooms(roomList);
      if (currentRoomRef.current !== null && currentRoomRef.current !== undefined) {
        const r = roomList.find(rr => String(rr.id) === String(currentRoomRef.current));
        if (r) {
          setOnlineUsers(r.users || []);
        }
      }
    };

    socket.on('roomsList', onRoomsListGlobal);
    return () => { socket.off('roomsList', onRoomsListGlobal); };
  }, []);

  // Rejoin and fetch messages on socket reconnect/connect to ensure clients don't miss messages
  useEffect(() => {
    if (!user || !user._id) return;
    const onConnect = async () => {
      console.log('Socket connected/reconnected, socket.id=', socket.id, 'currentRoom=', currentRoom);

      // Always refresh rooms so we get correct online counts
      try {
        socket.emit('getRooms');
      } catch (err) {
        console.error('Error requesting rooms on connect:', err);
      }

      if (currentRoom === null || currentRoom === undefined) return;

      // Fetch latest messages for the room to recover any missed messages
      try {
        const response = await fetch(`${API_URL}/chat/room/${currentRoom}`, { credentials: 'include' });
        if (response.ok) {
          const messagesData = await response.json();
          const normalizedMessages = messagesData.map(msg => ({
            ...msg,
            userId: msg.userId ? String(msg.userId) : null,
          }));
          console.log(`Reconnected: loaded ${normalizedMessages.length} messages for room ${currentRoom}`);
          setMessages(normalizedMessages);
        }
      } catch (err) {
        console.error('Error fetching messages on reconnect:', err);
      }

      // Re-join the room so server will broadcast to us
      try {
        socket.emit('joinRoom', {
          roomId: currentRoom,
          userId: user._id,
          userName: user.name,
        });
      } catch (err) {
        console.error('Error emitting joinRoom on reconnect:', err);
      }
    };

    socket.on('connect', onConnect);
    socket.on('reconnect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('reconnect', onConnect);
    };
  }, [user, currentRoom]);

  // Poll rooms periodically to keep online user counts fresh in case of missed socket events
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const pollInterval = 1000; // faster updates for online user counts
    let timer = null;

    const pollRooms = () => {
      try {
        socket.emit('getRooms');
      } catch (err) {
        console.error('Error emitting getRooms during poll:', err);
      } finally {
        if (!cancelled) timer = setTimeout(pollRooms, pollInterval);
      }
    };

    // start immediately
    pollRooms();

    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [user]);

  // Poll for new messages periodically so the UI reflects messages even if a socket event is missed
  useEffect(() => {
    if (currentRoom === null || currentRoom === undefined) return;
    let cancelled = false;
    const pollInterval = 800; // ms (reduced for faster UI updates)
    let timer = null;

    const fetchLatestMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/chat/room/${currentRoom}`, { credentials: 'include' });
        if (!response.ok) return;
        const messagesData = await response.json();
        const normalized = messagesData.map(msg => ({ ...msg, userId: msg.userId ? String(msg.userId) : null }));

        // Use messageIdsRef to avoid races where messagesRef may be stale
        const toAdd = normalized.filter(m => {
          const mid = String(m.id || m._id || '');
          if (mid && messageIdsRef.current.has(mid)) return false;
          // Check for near-duplicate by user/text/timestamp
          const dup = messagesRef.current.find(existing => {
            const existingTs = new Date(existing.timestamp || existing.createdAt).getTime();
            const newTs = new Date(m.timestamp || m.createdAt).getTime();
            return String(existing.userId) === String(m.userId) && existing.text === m.text && Math.abs(existingTs - newTs) < 3000;
          });
          return !dup;
        });
        if (toAdd.length > 0) {
          setMessages(prev => {
            const next = [...prev, ...toAdd];
            // Add ids to the id set and update messagesRef synchronously
            toAdd.forEach(m => {
              if (m.id) messageIdsRef.current.add(String(m.id));
              if (m._id) messageIdsRef.current.add(String(m._id));
            });
            messagesRef.current = next;
            return next;
          });
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    };

    // Expose on-demand fetch so 'newMessage' handler can request a quick reconciliation
    fetchMessagesRef.current = fetchLatestMessages;

    const poll = async () => {
      await fetchLatestMessages();
      if (!cancelled) timer = setTimeout(poll, pollInterval);
    };

    // Start poll immediately
    poll();

    return () => { cancelled = true; if (timer) clearTimeout(timer); if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current); fetchMessagesRef.current = null; };
  }, [currentRoom]);

  const handleJoinRoom = async (roomId) => {
    setCurrentRoom(roomId);
    setMessages([]);
    setOnlineUsers([]);
    setLoadingMessages(true);

    // Fetch message history from database
    try {
      const response = await fetch(`${API_URL}/chat/room/${roomId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const messagesData = await response.json();
        console.log(`Loaded ${messagesData.length} messages from DB for room ${roomId}`);
        const normalizedMessages = messagesData.map(msg => ({
          ...msg,
          userId: msg.userId ? String(msg.userId) : null,
        }));
        setMessages(normalizedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
    
    socket.emit('joinRoom', {
      roomId,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
    });

    // Refresh the rooms list immediately so we can update online users if needed
    try {
      socket.emit('getRooms');
    } catch (err) {
      console.error('Error requesting rooms after join:', err);
    }
  };

  const handleLeaveRoom = () => {
    if (currentRoom !== null) {
      socket.emit('leaveRoom', {
        roomId: currentRoom,
        userId: user._id,
        userName: user.name,
      });
    }
    setCurrentRoom(null);
    setMessages([]);
    setOnlineUsers([]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || currentRoom === null) return;

    const text = messageText.trim();

    // Optimistically add the message to UI so it appears immediately
    const optimisticMsg = {
      id: `local-${Date.now()}`,
      roomId: currentRoom,
      userId: currentUserId ? String(currentUserId) : String(user._id),
      userName: currentUserName || user.name,
      text,
      timestamp: new Date(),
      _optimistic: true,
    };

    // Add via dedupe helper
    addUniqueMessage(optimisticMsg);
    // record recent send so we can match server broadcast if it arrives before optimistic is added
    recentSendsRef.current.push({ text, roomId: currentRoom, ts: Date.now(), userId: optimisticMsg.userId, userName: optimisticMsg.userName });
    recentSendsRef.current = recentSendsRef.current.slice(-20);
    // keep optimistic id in id set
    messageIdsRef.current.add(String(optimisticMsg.id));

    socket.emit('sendMessage', {
      roomId: currentRoom,
      userId: currentUserId || user._id,
      userName: currentUserName || user.name,
      text,
      timestamp: new Date(),
    });

    setMessageText('');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Please login to access chat.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Rooms List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4 h-fit">
          <h2 className="text-lg font-semibold mb-4">Chat Rooms</h2>
          <div className="space-y-2 mb-4">
            <button
              onClick={() => handleJoinRoom(0)}
              className={`w-full text-left px-3 py-2 rounded transition ${
                currentRoom === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">General</div>
              <div className="text-xs">Public chat</div>
            </button>
            {[1, 2, 3].map((rid) => (
              <button
                key={rid}
                onClick={() => handleJoinRoom(rid)}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  currentRoom === rid
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">Room {rid}</div>
                <div className="text-xs">
                  {rooms.find((r) => r.id === rid)?.userCount || 0} users
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-3">
          {currentRoom === null ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">Select a room to start chatting</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow flex flex-col h-screen md:h-96">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">
                    {currentRoom === 0 ? 'General Chat' : `Room ${currentRoom}`}
                  </h3>
                  <p className="text-xs">
                    {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
                  </p>
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-3 py-2 rounded"
                >
                  <MdLogout /> Leave
                </button>
              </div>

              {/* Online Users */}
              {onlineUsers.length > 0 && (
                <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Online Users:</p>
                  <div className="flex gap-2 flex-wrap">
                    {onlineUsers.map((userName, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {userName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
                {loadingMessages ? (
                  <div className="text-center text-gray-400 mt-8">
                    Đang tải tin nhắn...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const key = msg.id || msg._id || `${msg.roomId}-${msg.timestamp || msg.createdAt}-${Math.random()}`;
                    // Check userId - it should match current user if we sent it
                    const msgUserId = msg.userId;
                    const normalizedMsgUserId = msgUserId ? String(msgUserId).trim() : '';
                    const normalizedCurrentUserId = currentUserId ? String(currentUserId).trim() : '';
                    const isMine = msg._optimistic ? true : (normalizedMsgUserId && normalizedCurrentUserId && normalizedMsgUserId === normalizedCurrentUserId);
                    const ts = msg.timestamp || msg.createdAt || new Date();
                    console.log(`📨 Chat msg render: msgUserId='${normalizedMsgUserId}', user._id='${normalizedCurrentUserId}', isMine=${isMine}, userName='${msg.userName}'`);

                    return (
                      <div
                        key={key}
                        className={`w-full flex ${msg.isSystem ? 'justify-center' : ''}`}
                      >
                        {msg.isSystem ? (
                          <div className="text-center text-xs text-gray-400 italic">{msg.text}</div>
                        ) : (
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              isMine ? 'bg-blue-600 text-white rounded-br-none ml-auto' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none mr-auto'
                            }`}
                          >
                            <div className="text-xs font-semibold">{msg.userName || (msg.sender && msg.sender.name) || (isMine ? currentUserName : 'Unknown')}</div>
                            <div className="break-words">{msg.text}</div>
                            <div className="text-xs opacity-70 mt-1">{new Date(ts).toLocaleTimeString()}</div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-200 p-3 flex gap-2"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <MdSend /> Gửi
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
