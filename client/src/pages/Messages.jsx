import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyConversations } from '../api/messages.js';
import PrivateChatModal from '../components/PrivateChatModal.jsx';

export default function MessagesPage() {
  const { data: convs, isLoading, isError, error } = useQuery({ 
    queryKey: ['my:conversations'], 
    queryFn: () => getMyConversations(), 
    staleTime: 30 * 1000 
  });
  const [selected, setSelected] = useState(null);

  // Debug logs
  console.log('MessagesPage: convs=', convs, 'loading=', isLoading, 'error=', error);

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded p-6 shadow">Loading conversations...</div>
    </div>
  );

  if (isError || error) return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded p-6 shadow">
        <p className="text-red-600">Error: {error?.message || 'Failed to load conversations'}</p>
      </div>
    </div>
  );

  if (!convs || convs.length === 0) return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded p-6 shadow">
        <p className="text-gray-500 mb-4">No conversations yet. Start a new conversation!</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-md shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Messages</h2>
        <div className="space-y-3">
          {convs.map((c, idx) => (
            <div key={idx} className="p-3 border rounded flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex-1">
                <div className="font-medium">{c.auction?.itemName || 'General Chat'}</div>
                <div className="text-sm text-gray-500">With: {c.other?.name || c.other?._id || 'Unknown'}</div>
                <div className="text-xs text-gray-400 truncate">{c.lastMessage || 'No message yet'}</div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button 
                  onClick={() => setSelected(c)} 
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 whitespace-nowrap"
                >
                  Open
                </button>
                {c.auction && (
                  <a 
                    href={`/auction/${c.auction._id}`} 
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-gray-600 underline hover:text-gray-800"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <PrivateChatModal
          open={!!selected}
          onClose={() => setSelected(null)}
          recipientId={selected.other._id}
          recipientName={selected.other.name}
          auctionId={selected.auction?._id}
        />
      )}
    </div>
  );
}