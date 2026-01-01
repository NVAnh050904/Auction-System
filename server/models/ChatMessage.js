import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  roomId: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3], // Rooms: 0=General, 1=Room1, 2=Room2, 3=Room3
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient room queries
chatMessageSchema.index({ roomId: 1, createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
