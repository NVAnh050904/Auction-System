#!/usr/bin/env node
import { connectDB } from '../connection.js';
import ChatMessage from '../models/ChatMessage.js';

async function main() {
  await connectDB();

  // Find messages with empty or malformed userId / userName
  const filter = {
    $or: [
      { userId: '' },
      { userId: { $exists: false } },
      { userName: '' },
      { userName: 'undefined' }
    ]
  };

  const bad = await ChatMessage.find(filter).lean();
  console.log(`Found ${bad.length} messages with empty/malformed user fields.`);
  if (bad.length === 0) {
    console.log('No fixes necessary.');
    process.exit(0);
  }

  const operations = bad.map(d => {
    const update = {};
    if (!d.userId || d.userId === '') update.userId = null;
    if (!d.userName || d.userName === '' || d.userName === 'undefined') update.userName = null;
    return {
      updateOne: {
        filter: { _id: d._id },
        update: { $set: update }
      }
    };
  });

  const res = await ChatMessage.bulkWrite(operations);
  console.log('Bulk write result:', res);
  console.log('Done — please restart the server and re-test the chat UI.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fix script error:', err);
  process.exit(1);
});
