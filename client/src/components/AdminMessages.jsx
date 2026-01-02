import React, { useEffect, useState, useRef } from 'react';
import socket from '../utils/socket.js';
import { useSelector } from 'react-redux';
import { MdSend, MdLogout, MdAdminPanelSettings } from 'react-icons/md';
import ChatPage from '../pages/Chat';

export default function AdminMessages() {
  // Unified chat for admin and users
  return <ChatPage />;
  const { user } = useSelector((state) => state.auth);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const recentSendsRef = useRef([]);

  // Check admin role - handle both nested and flat user structures
  const isAdmin = user && (user.role === 'admin' || user.user?.role === 'admin');
  const userId = user?._id || user?.user?._id;
  const userName = user?.name || user?.user?.name;
  const userRole = user?.role || user?.user?.role;

  // Rooms configuration
  const rooms = [
    { id: 0, name: 'General', description: 'Public chat' },
    { id: 1, name: 'Room 1', description: 'Discussion' },
    { id: 2, name: 'Room 2', description: 'Support' },
    { id: 3, name: 'Room 3', description: 'Feedback' },
  ];

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection and listeners
  useEffect(() => {
    if (!isAdmin || !userId) return;

    socket.connect();

    // Listen for user joined
    socket.on('userJoined', (data) => {
      setOnlineUsers(data.users || []);
      if (String(currentRoom) === String(data.roomId)) {
        setMessages((m) => [
          ...m,
          {
            id: Date.now(),
            text: `${data.userName} joined the chat`,
            isSystem: true,
            timestamp: new Date(),
          },
        ]);
      }
    });

    // Listen for new messages
    socket.on('newMessage', (message) => {
      if (String(currentRoom) === String(message.roomId)) {
        setMessages((prev) => {
          // Deduplicate optimistic message: try strict (userId) then relaxed (text+timestamp)
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
          // fallback: match recent sends buffer
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
      setOnlineUsers(data.users || []);
      if (String(currentRoom) === String(data.roomId)) {
        setMessages((m) => [
          ...m,
          {
            id: Date.now(),
            text: `${data.userName} left the chat`,
            isSystem: true,
            timestamp: new Date(),
          },
        ]);
      }
    });

    return () => {
      socket.off('userJoined');
      socket.off('newMessage');
      socket.off('userLeft');
    };
  }, [isAdmin, userId, currentRoom]);

  const handleJoinRoom = (roomId) => {
    // Leave current room if exists
    if (currentRoom !== null) {
      socket.emit('leaveRoom', {
        roomId: currentRoom,
        userId,
        userName,
      });
    }

    // Join new room
    setCurrentRoom(roomId);
    setMessages([]);
    setOnlineUsers([]);

    socket.emit('joinRoom', {
      roomId,
      userId,
      userName,
      userRole,
    });
  };

  const handleLeaveRoom = () => {
    if (currentRoom !== null) {
      socket.emit('leaveRoom', {
        roomId: currentRoom,
        userId,
        userName,
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
    const optimisticMsg = {
      id: `local-${Date.now()}`,
      roomId: currentRoom,
      userId: userId ? String(userId) : '',
      userName: userName || '',
      text,
      timestamp: new Date(),
      _optimistic: true,
    };
    setMessages((m) => [...m, optimisticMsg]);
    recentSendsRef.current.push({ text, roomId: currentRoom, ts: Date.now(), userId: optimisticMsg.userId, userName: optimisticMsg.userName });
    recentSendsRef.current = recentSendsRef.current.slice(-20);

    socket.emit('sendMessage', {
      roomId: currentRoom,
      userId: userId,
      userName: userName,
      text,
      timestamp: new Date(),
    });

    setMessageText('');
  };

  if (!isAdmin) {
    return (
      <div className="w-full px-4 py-8">
        <div className="max-w-2xl mx-auto text-center bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-4">Admin access only. Please login as admin.</p>
          <p className="text-gray-600 text-sm font-mono bg-gray-100 p-3 rounded break-all">
            {JSON.stringify(user)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Admin Header */}
        <div className="bg-red-600 text-white rounded-t-lg p-4 flex items-center gap-2 mb-0 shadow">
          <MdAdminPanelSettings className="text-2xl flex-shrink-0" />
          <h1 className="text-xl md:text-2xl font-bold">Admin Chat Management</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 bg-white rounded-b-lg shadow">
          {/* Sidebar - Chat Rooms List */}
          <div className="md:col-span-1 md:border-r border-gray-200 p-6 md:h-[600px] md:overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Chat Rooms</h2>
            <div className="space-y-2 mb-6">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleJoinRoom(room.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition duration-200 ${
                    currentRoom === room.id
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold text-sm">{room.name}</div>
                  <div className={`text-xs ${currentRoom === room.id ? 'text-red-100' : 'text-gray-600'}`}>
                    {room.description}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${currentRoom === room.id ? 'text-red-100' : 'text-gray-500'}`}>
                    {onlineUsers.length > 0 && currentRoom === room.id ? `${onlineUsers.length} online` : ''}
                  </div>
                </button>
              ))}
            </div>

            {/* Admin Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-yellow-800 mb-2 flex items-center gap-1">
                <MdAdminPanelSettings className="text-lg" />
                Admin Tools
              </h3>
              <p className="text-xs text-yellow-700">
                Monitor and participate in any chat room. All users can see your messages as admin.
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-3 p-6 md:h-[600px] flex flex-col">
            {currentRoom === null ? (
              <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 md:p-12 text-center border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                <MdAdminPanelSettings className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-semibold">Select a room to start</p>
                <p className="text-gray-400 text-sm mt-2">
                  Choose from the rooms in the sidebar to begin monitoring and chatting
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full">
                {/* Room Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 rounded-t-lg flex justify-between items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {rooms.find((r) => r.id === currentRoom)?.name || 'Room'}
                      <span className="bg-red-800 text-xs px-2 py-1 rounded font-medium">ADMIN</span>
                    </h3>
                    <p className="text-sm text-red-100 mt-1">
                      {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
                    </p>
                  </div>
                  <button
                    onClick={handleLeaveRoom}
                    className="flex items-center gap-2 bg-red-800 hover:bg-red-900 px-3 py-2 rounded-lg text-sm font-medium transition duration-200 flex-shrink-0"
                    title="Leave this room"
                  >
                    <MdLogout className="text-lg" />
                    <span className="hidden sm:inline">Leave</span>
                  </button>
                </div>

                {/* Online Users */}
                {onlineUsers.length > 0 && (
                  <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                    <p className="text-xs font-semibold text-red-700 mb-2">
                      Online Users ({onlineUsers.length}):
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {onlineUsers.map((uName, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-red-200 text-red-900 text-xs px-3 py-1 rounded-full font-medium"
                        >
                          {uName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                      <p className="text-sm">No messages yet in this room</p>
                      <p className="text-xs mt-1">Monitoring this room...</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const key = msg.id || msg._id || `${msg.roomId}-${msg.timestamp || msg.createdAt}-${Math.random()}`;
                      const msgUserId = msg.userId;
                      const normalizedMsgUserId = String(msgUserId).trim();
                      const normalizedCurrentUserId = String(userId).trim();
                      const isMine = msg._optimistic ? true : (normalizedMsgUserId === normalizedCurrentUserId);
                      const ts = msg.timestamp || msg.createdAt || new Date();
                      console.log(`📨 AdminMessages msg render: msgUserId='${normalizedMsgUserId}', userId='${normalizedCurrentUserId}', isMine=${isMine}, userName='${msg.userName}'`);

                      return (
                        <div
                          key={key}
                          className={`w-full flex ${msg.isSystem ? 'justify-center' : ''}`}
                        >
                          {msg.isSystem ? (
                            <div className="text-center text-xs text-gray-500 italic py-2 px-3 bg-gray-200 rounded-full max-w-xs">{msg.text}</div>
                          ) : (
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isMine ? 'bg-red-600 text-white rounded-br-none shadow-md ml-auto' : 'bg-white text-gray-900 border border-gray-300 rounded-bl-none mr-auto'
                              }`}
                            >
                              <div className={`text-xs font-semibold mb-1 ${isMine ? 'text-red-100' : 'text-gray-600'}`}>{msg.userName || 'Unknown'}</div>
                              <p className="text-sm break-words">{msg.text}</p>
                              <div className={`text-xs mt-1 ${isMine ? 'text-red-100' : 'text-gray-500'}`}>{new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-gray-200 p-4 bg-white rounded-b-lg flex gap-2"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your admin message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm"
                    autoFocus={true}
                  />
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 flex items-center gap-2 font-medium transition duration-200 flex-shrink-0"
                    title="Send message"
                  >
                    <MdSend className="text-lg" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
