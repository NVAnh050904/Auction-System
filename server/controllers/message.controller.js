import Message from '../models/message.js';
import { connectDB } from '../connection.js';

export const createMessage = async (req, res) => {
  try {
    await connectDB();
    const { auction, recipientId, text } = req.body;
    const sender = req.user && (req.user.id || req.user._id);

    console.log('createMessage: user=', req.user ? { id: req.user.id, role: req.user.role } : null, 'body=', { auction, recipientId, text: text ? text.slice(0,50) : text });

    if (!recipientId || !text) {
      console.warn('createMessage: missing recipientId or text');
      return res.status(400).json({ message: 'recipientId and text are required' });
    }

    // Allow any user/role to message any other user/role (no restrictions)
    const newMsg = new Message({ auction: auction || null, sender, recipient: recipientId, text });
    await newMsg.save();
    await newMsg.populate('sender', 'name role');
    await newMsg.populate('recipient', 'name role');
    console.log('createMessage: saved message id=', newMsg._id);

    // Emit via Socket.IO to recipient (and sender) rooms
    try {
      const { getIO } = await import('../socket.js');
      const io = getIO();
      if (io) {
        io.to(`private:${recipientId}`).emit('privateMessage', { message: newMsg });
        io.to(`private:${sender}`).emit('privateMessage', { message: newMsg });
      }
    } catch (err) {
      console.error('Error emitting privateMessage:', err.message);
    }

    res.status(201).json(newMsg);
  } catch (error) {
    res.status(500).json({ message: 'Error creating message', error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    await connectDB();
    const userId = req.user.id;
    const { auctionId, withUserId } = req.query;

    if (!withUserId) return res.status(400).json({ message: 'withUserId is required' });

    const filter = {
      auction: auctionId || undefined,
      $or: [
        { sender: userId, recipient: withUserId },
        { sender: withUserId, recipient: userId }
      ]
    };

    // remove undefined keys
    Object.keys(filter).forEach(k => filter[k] === undefined && delete filter[k]);

    const msgs = await Message.find(filter).populate('sender', 'name role').populate('recipient', 'name role').sort({ createdAt: 1 });

    res.status(200).json(msgs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    await connectDB();
    const userId = req.user.id;
    const { auctionId } = req.query;
    if (!auctionId) return res.status(400).json({ message: 'auctionId is required' });

    const msgs = await Message.find({ auction: auctionId, $or: [{ sender: userId }, { recipient: userId }] })
      .populate('sender', 'name role')
      .populate('recipient', 'name role');

    const participants = {};
    msgs.forEach(m => {
      const other = String(m.sender._id) === String(userId) ? m.recipient : m.sender;
      participants[other._id] = { _id: other._id, name: other.name, role: other.role };
    });

    res.status(200).json(Object.values(participants));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    await connectDB();
    const userId = req.user.id;

    const msgs = await Message.find({ $or: [{ sender: userId }, { recipient: userId }] })
      .populate('sender', 'name role')
      .populate('recipient', 'name role')
      .populate('auction', 'itemName');

    const convMap = {};
    msgs.forEach(m => {
      const auctionId = m.auction ? String(m.auction._id) : 'general';
      const other = String(m.sender._id) === String(userId) ? m.recipient : m.sender;
      const key = `${auctionId}:${other._id}`;
      if (!convMap[key]) {
        convMap[key] = {
          auction: m.auction ? { _id: m.auction._id, itemName: m.auction.itemName } : null,
          other: { _id: other._id, name: other.name, role: other.role },
          lastMessage: m.text,
          lastAt: m.createdAt,
        };
      } else {
        // pick latest
        if (new Date(m.createdAt) > new Date(convMap[key].lastAt)) {
          convMap[key].lastMessage = m.text;
          convMap[key].lastAt = m.createdAt;
        }
      }
    });

    res.status(200).json(Object.values(convMap));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching my conversations', error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    await connectDB();
    const userId = req.user.id;
    const count = await Message.countDocuments({ recipient: userId, read: false });
    res.status(200).json({ unread: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

export const markRead = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const userId = req.user.id;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    // only recipient can mark as read (or admin)
    if (String(msg.recipient) !== String(userId) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed' });

    msg.read = true;
    await msg.save();

    // emit read receipt
    try {
      const { getIO } = await import('../socket.js');
      const io = getIO();
      if (io) {
        io.to(`private:${msg.sender}`).emit('messageRead', { messageId: id, reader: userId });
        io.to(`private:${msg.recipient}`).emit('messageRead', { messageId: id, reader: userId });
      }
    } catch (err) {
      console.error('Error emitting messageRead:', err.message);
    }

    res.status(200).json({ message: 'Marked read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking read', error: error.message });
  }
};