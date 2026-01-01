import express from 'express';
import { createMessage, getMessages, markRead, getConversations, getUnreadCount, getMyConversations } from '../controllers/message.controller.js';
import { secureRoute } from '../middleware/auth.js';

const router = express.Router();

// Specific routes first (to avoid matching /:id patterns)
router.get('/unread-count', secureRoute, getUnreadCount);
router.get('/my-conversations', secureRoute, getMyConversations);
router.get('/conversations', secureRoute, getConversations);

// Generic routes after specific ones
router.get('/', secureRoute, getMessages);
router.post('/', secureRoute, createMessage);
router.patch('/:id/read', secureRoute, markRead);

export default router;