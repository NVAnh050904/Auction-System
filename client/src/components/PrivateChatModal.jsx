import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getMessages, sendMessage, markRead } from '../api/messages.js';
import socket from '../utils/socket.js';
import { useSelector } from 'react-redux';

export default function PrivateChatModal({ open, onClose, recipientId, recipientName, auctionId }) {
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.user?._id || user?.id || null;
  const currentUserName = user?.name || user?.user?.name || '';
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef();

  useEffect(() => {
    console.log('PrivateChatModal: open=', open, 'recipientId=', recipientId);
    if (!open || !user || !user._id) return;

    // Join private room for current user (to receive messages)
    console.log('PrivateChatModal: joining private room for', user._id);
    socket.emit('joinPrivate', user._id);

    const onPrivate = ({ message }) => {
      console.log('PrivateChatModal: received privateMessage from', message?.sender?._id);
      // Only show messages from the recipient in this conversation
      if ((String(message.sender._id) === String(recipientId) && String(message.recipient._id) === String(user._id)) ||
          (String(message.recipient._id) === String(recipientId) && String(message.sender._id) === String(user._id))) {
        setMessages((m) => [...m, message]);
      }
    };

    const onRead = ({ messageId, reader }) => {
      console.log('PrivateChatModal: received messageRead', messageId);
      setMessages((m) => m.map(msg => msg._id === messageId ? { ...msg, read: true } : msg));
    };

    socket.on('privateMessage', onPrivate);
    socket.on('messageRead', onRead);

    // Fetch message history with this user
    (async () => {
      console.log('PrivateChatModal: fetching history with user', recipientId);
      const msgs = await getMessages({ withUserId: recipientId });
      console.log('PrivateChatModal: fetched', (msgs || []).length, 'messages');
      // Normalize sender/recipient ids for stable comparisons
      const normalized = (msgs || []).map(m => {
        const out = { ...m };
        if (out.sender) {
          if (typeof out.sender === 'object') {
            out.sender = { ...out.sender, _id: out.sender._id ? String(out.sender._id) : String(out.sender._id || '') };
          } else {
            out.sender = String(out.sender);
          }
        }
        if (out.recipient) {
          if (typeof out.recipient === 'object') {
            out.recipient = { ...out.recipient, _id: out.recipient._id ? String(out.recipient._id) : String(out.recipient._id || '') };
          } else {
            out.recipient = String(out.recipient);
          }
        }
        return out;
      });
      setMessages(normalized);
      // Mark unread messages as read
      if (msgs && msgs.length > 0) {
        msgs.forEach(m => {
          if (m.recipient && String(m.recipient._id) === String(user._id) && !m.read) {
            markRead(m._id).catch(() => {});
          }
        });
      }
      // Auto-scroll to bottom
      setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 50);
    })();

    return () => {
      console.log('PrivateChatModal: cleanup - leaving private room');
      socket.emit('leavePrivate', currentUserId || user._id);
      socket.off('privateMessage', onPrivate);
      socket.off('messageRead', onRead);
    };
  }, [open, recipientId, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    console.log('PrivateChatModal: sending message to', recipientId);
    const msg = await sendMessage({ recipientId, text: text.trim(), auctionId });
    if (msg) {
      setMessages((m) => [...m, msg]);
      setText('');
      setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 50);
    }
  };

  const handleMarkRead = async (id) => {
    await markRead(id);
    setMessages((m) => m.map(msg => msg._id === id ? { ...msg, read: true } : msg));
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50" data-testid="private-chat-modal">
      <div className="w-full max-w-xl bg-white rounded p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Chat with {recipientName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div ref={listRef} className="h-64 overflow-auto border rounded p-2 mb-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No messages yet. Start a conversation!</div>
          ) : (
            messages.map((m) => {
              const senderId = m.sender && (m.sender._id || m.sender);
              const normalizedSenderId = senderId ? String(senderId).trim() : '';
              const normalizedCurrentUserId = currentUserId ? String(currentUserId).trim() : '';
              const isMine = normalizedSenderId && normalizedCurrentUserId && normalizedSenderId === normalizedCurrentUserId;
              const ts = m.createdAt || m.timestamp || new Date();
              const senderName = m.userName || (m.sender && (m.sender.name || m.sender)) || (isMine ? currentUserName : 'Unknown');
              console.log(`📨 PrivateChat msg render: senderId='${normalizedSenderId}', user._id='${normalizedCurrentUserId}', isMine=${isMine}, senderName='${senderName}'`);

              return (
                <div key={m._id} className="mb-2 w-full flex">
                  <div className={`flex flex-col ${isMine ? 'ml-auto' : 'mr-auto'} max-w-xs`}>
                    <div className="text-xs text-gray-500">{senderName} • {new Date(ts).toLocaleString()}</div>
                    <div className={`p-2 rounded ${isMine ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border'}`}>
                      {m.text}
                    </div>
                    {m.recipient && String(m.recipient._id) === String(user._id) && !m.read && (
                      <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline" onClick={() => handleMarkRead(m._id)}>Mark as read</div>
                    )}
                  </div>
                </div>
              );
            })
          )} 
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Type a message..." 
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:border-blue-600" 
            autoFocus
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Send
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}