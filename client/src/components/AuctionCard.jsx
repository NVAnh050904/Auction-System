import { Link } from "react-router";
import { useEffect, useState } from 'react';
import socket from '../utils/socket.js';
import { formatDuration } from '../utils/formatTime.js';
import { useSelector } from 'react-redux';
import PrivateChatModal from './PrivateChatModal.jsx';

export default function AuctionCard({ auction }) {
  const [currentPrice, setCurrentPrice] = useState(auction.currentPrice || auction.startingPrice);
  const [bidsCount, setBidsCount] = useState(auction.bidsCount || 0);
  const [hasEnded, setHasEnded] = useState(!auction.timeLeft || auction.timeLeft <= 0);
  const [winnerName, setWinnerName] = useState(auction.winner?.name || null);

  useEffect(() => {
    // Join auction room to receive updates
    socket.emit('joinAuction', auction._id);

    const handler = (payload) => {
      if (payload && payload.auctionId === auction._id) {
        if (payload.currentPrice !== undefined) setCurrentPrice(payload.currentPrice);
        if (payload.bidsCount !== undefined) setBidsCount(payload.bidsCount);
      }
    };

    const endedHandler = (payload) => {
      if (payload && payload.auctionId === auction._id) {
        // mark as ended and optionally show winner
        if (payload.winner) {
          setWinnerName(payload.winner.name || payload.winner);
        }
        setHasEnded(true);
      }
    };

    socket.on('bidPlaced', handler);
    socket.on('auctionEnded', endedHandler);

    return () => {
      socket.emit('leaveAuction', auction._id);
      socket.off('bidPlaced', handler);
      socket.off('auctionEnded', endedHandler);
    };
  }, [auction._id]);

  const now = new Date();
  const startsInMs = auction.itemStartDate ? Math.max(0, new Date(auction.itemStartDate) - now) : null;
  const timeLeftMs = auction.timeLeft || 0;

  let timeLabel;
  if (startsInMs && startsInMs > 0) {
    timeLabel = `Starts in ${formatDuration(startsInMs)}`;
  } else if (timeLeftMs > 0) {
    timeLabel = formatDuration(timeLeftMs);
  } else {
    timeLabel = "Ended";
  }

  const { user } = useSelector((state) => state.auth);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div className="relative h-48 overflow-hidden">
        <img
          src={auction.itemPhoto || "https://picsum.photos/300"}
          alt={auction.itemName}
          className="object-contain aspect-[4/3] w-96"
        />
        <div className="absolute top-2 right-2 bg-blue-200 px-2 py-1 rounded-md text-xs font-medium">
          {auction.itemCategory}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 text-gray-900">
          {auction.itemName}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {auction.itemDescription}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Current Price:</span>
            <span className="font-semibold text-lg text-green-600">
              ${currentPrice}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Bids:</span>
            <span className="text-sm font-medium">{bidsCount}</span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Time Left:</span>
              <span className="text-sm font-medium text-red-600">
                {timeLabel}
              </span>
            </div>
            {hasEnded && winnerName && (
              <div className="text-sm text-gray-700">Winner: <span className="font-medium">{winnerName}</span></div>
            )}
            {hasEnded && !winnerName && (
              <div className="text-sm text-gray-500">No winner (no bids)</div>
            )}
            {/* Admin can message winner (if ended and winner exists) */}
            {user?.role === 'admin' && hasEnded && winnerName && (
              <div className="mt-2">
                <button onClick={() => { console.log('AuctionCard: admin clicked Message Winner', auction._id, auction.winner); setShowChat(true); }} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Message Winner</button>
                {showChat && <div className="text-sm text-gray-500 mt-2">Opening chat...</div>}
              </div>
            )}
          </div>

          {showChat && (auction.winner?._id || auction.winner) && (
            <PrivateChatModal
              open={showChat}
              onClose={() => setShowChat(false)}
              recipientId={auction.winner?._id || auction.winner}
              recipientName={winnerName || auction.winner?.name}
              auctionId={auction._id}
            />
          )}
        </div>

        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500 mb-3">
            Seller: {auction?.sellerName || auction?.seller?.name}
          </p>
          <Link to={`/auction/${auction._id}`}>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
