import ChatMessage from '../models/ChatMessage.js';
import User from '../models/user.js';
import { connectDB } from '../connection.js';

// Lưu tin nhắn vào database
export const saveMessage = async (data) => {
  try {
    const { roomId, userId, userName, userRole, text } = data;
    let finalUserName = userName;

    // ensure DB connected before any user lookup
    try { await connectDB(); } catch (e) { /* connection handled upstream */ }

    // sanitize incoming userId/userName and if userName not provided, try to fetch from users collection
    if (userId && typeof userId !== 'string') userId = String(userId);
    if (finalUserName === 'undefined') finalUserName = null;
    if ((!finalUserName || finalUserName === 'undefined') && userId) {
      try {
        const u = await User.findById(userId).lean();
        if (u && u.name) finalUserName = u.name;
      } catch (err) {
        console.warn('saveMessage: failed to lookup user name for', userId, err.message);
      }
    }

    const message = new ChatMessage({
      roomId,
      userId: userId ? String(userId) : null,
      userName: finalUserName || null,
      userRole,
      text,
      createdAt: new Date()
    });
    
    const savedMessage = await message.save();
    console.log(`✅ Message saved to DB: room=${roomId}, user=${finalUserName}, msg=${text.slice(0, 50)}`);
    
    return {
      id: savedMessage._id,
      roomId: savedMessage.roomId,
      userId: savedMessage.userId,
      userName: savedMessage.userName,
      userRole: savedMessage.userRole,
      text: savedMessage.text,
      timestamp: savedMessage.createdAt
    };
  } catch (error) {
    console.error('❌ Error saving message:', error);
    throw error;
  }
};

// Lấy tin nhắn theo roomId (lịch sử)
export const getMessagesByRoom = async (roomId, limit = 50) => {
  try {
    const messages = await ChatMessage.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
    
    return messages.map(msg => ({
      id: msg._id,
      roomId: msg.roomId,
      userId: msg.userId,
      userName: msg.userName,
      userRole: msg.userRole,
      text: msg.text,
      timestamp: msg.createdAt
    }));
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    throw error;
  }
};

// Xóa tin nhắn cũ (optional - cleanup)
export const deleteOldMessages = async (daysOld = 30) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);
    
    const result = await ChatMessage.deleteMany({
      createdAt: { $lt: date }
    });
    
    console.log(`✅ Deleted ${result.deletedCount} old messages`);
    return result;
  } catch (error) {
    console.error('❌ Error deleting messages:', error);
    throw error;
  }
};
