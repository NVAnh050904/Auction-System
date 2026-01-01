import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.ObjectId, ref: 'Product', required: false },
  sender: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;