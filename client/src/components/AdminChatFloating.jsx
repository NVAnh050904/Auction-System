import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuctions } from '../api/auction.js';
import { getUnreadCount } from '../api/messages.js';
import { useSelector } from 'react-redux';
import PrivateChatModal from './PrivateChatModal.jsx';

export default function AdminChatFloating() {
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [openPrivate, setOpenPrivate] = useState(false);

  const { data: auctions } = useQuery({ queryKey: ['admin:auctions:ended'], queryFn: () => getAuctions({ includeEnded: true }), staleTime: 60 * 1000 });

  const { data: unread } = useQuery({ queryKey: ['messages:unread'], queryFn: () => getUnreadCount(), staleTime: 30 * 1000 });

  if (user?.role !== 'admin') return null;

  const endedWithWinners = (auctions || []).filter(a => a.winner);

  const formatWinner = (w) => {
    if (!w) return '';
    if (typeof w === 'string') return w;
    return w.name || w._id || '';
  }
  const handleOpenConversation = (auction) => {
    console.log('AdminChatFloating: open conversation for', auction._id);
    setSelectedAuction(auction);
    setOpenPrivate(true);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9998]">
        <button
          title="Admin Messages"
          onClick={() => { console.log('AdminChatFloating: clicked'); setOpen(!open); }}
          className="relative bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
        >
          💬
          {unread && unread.unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">{unread.unread}</span>
          )}
        </button>

        {open && (
          <div className="mt-2 w-80 bg-white rounded shadow-lg p-3">
            <h4 className="font-semibold mb-2">Conversations (Ended Auctions)</h4>
            {endedWithWinners.length === 0 ? (
              <div className="text-sm text-gray-500">No ended auctions with winners yet.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {endedWithWinners.map((a) => (
                  <div key={a._id} className="p-2 border rounded">
                    <div className="text-sm font-medium">{a.itemName}</div>
                    <div className="text-xs text-gray-500">Winner: {formatWinner(a.winner)}</div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleOpenConversation(a)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Message Winner</button>
                      <a href={`/auction/${a._id}`} className="text-sm text-gray-600 underline">View</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {openPrivate && selectedAuction && (
        <PrivateChatModal
          open={openPrivate}
          onClose={() => setOpenPrivate(false)}
          recipientId={selectedAuction.winner?._id || selectedAuction.winner}
          recipientName={selectedAuction.winner?.name || ''}
          auctionId={selectedAuction._id}
        />
      )}
    </>
  );
}
