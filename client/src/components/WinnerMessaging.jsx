import { useEffect, useState } from 'react';
import { getConversations } from '../api/messages.js';
import PrivateChatModal from './PrivateChatModal.jsx';

export default function WinnerMessaging({ auctionId }) {
  const [admins, setAdmins] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const conv = await getConversations(auctionId);
      // filter only admins
      const a = (conv || []).filter(p => p.role === 'admin');
      setAdmins(a);
    })();
  }, [auctionId]);

  if (!admins || admins.length === 0) {
    return <div className="mt-3 text-sm text-gray-500">No admin has contacted you yet. Please wait for admin.</div>;
  }

  return (
    <div className="mt-3">
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Open Messages</button>

      {open && (
        <PrivateChatModal
          open={open}
          onClose={() => setOpen(false)}
          recipientId={admins[0]._id}
          recipientName={admins[0].name}
          auctionId={auctionId}
        />
      )}
    </div>
  );
}