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

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    });

    // Listen for user joined
    socket.on('userJoined', (data) => {
      console.log('User joined:', data);
      setOnlineUsers(data.users || []);
      if (String(currentRoom) === String(data.roomId)) {
        setMessages((m) => [...m, {
          id: Date.now(),
          text: `${data.userName} joined the chat`,
          isSystem: true,
          timestamp: new Date(),
        }]);
      }
    });

    // Listen for new messages
    socket.on('newMessage', (message) => {
      console.log('📨 newMessage received:', message);
      if (String(currentRoom) === String(message.roomId)) {
        setMessages((prev) => {
          // Deduplicate optimistic message if present.
          // Prefer strict match (userId + text + timestamp), but fall back to relaxed match (text + timestamp)
          let optIndex = prev.findIndex(m => m._optimistic && String(m.userId) === String(message.userId) && m.text === message.text && Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 5000);
          if (optIndex === -1) {
            optIndex = prev.findIndex(m => m._optimistic && m.text === message.text && Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 5000);
          }
          if (optIndex !== -1) {
            const copy = [...prev];
            // Preserve optimistic userId/userName if server broadcast omitted them
            const optimistic = copy[optIndex];
            if ((!message.userId || message.userId === '') && optimistic && optimistic.userId) {
              message.userId = optimistic.userId;
            }
            if ((!message.userName || message.userName === '') && optimistic && optimistic.userName) {
              message.userName = optimistic.userName;
            }
            copy.splice(optIndex, 1);
            return [...copy, message];
          }
          // If no optimistic match found, try to match against recentSends buffer (handles race where server broadcast arrives before optimistic appended)
          const recentIndex = recentSendsRef.current.findIndex(s => s.roomId === message.roomId && s.text === message.text && Math.abs(s.ts - new Date(message.timestamp).getTime()) < 5000);
          if (recentIndex !== -1) {
            const s = recentSendsRef.current.splice(recentIndex, 1)[0];
            if ((!message.userId || message.userId === '') && s.userId) message.userId = s.userId;
            if ((!message.userName || message.userName === '') && s.userName) message.userName = s.userName;
            return [...prev, message];
          }
          return [...prev, message];
        });
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
    setMessages((m) => [...m, optimisticMsg]);
    // record recent send so we can match server broadcast if it arrives before optimistic is added
    recentSendsRef.current.push({ text, roomId: currentRoom, ts: Date.now(), userId: optimisticMsg.userId, userName: optimisticMsg.userName });
    // keep buffer small
    recentSendsRef.current = recentSendsRef.current.slice(-20);

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
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    No messages yet. Start the conversation!
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
                  <MdSend /> Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
