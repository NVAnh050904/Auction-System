import express from 'express';
import { getMessagesByRoom } from '../controllers/chat.controller.js';

const router = express.Router();

// Lấy tin nhắn theo roomId
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const roomIdNum = parseInt(roomId);
    
    if (![0, 1, 2, 3].includes(roomIdNum)) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }
    
    const messages = await getMessagesByRoom(roomIdNum);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
