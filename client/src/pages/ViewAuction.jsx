import { useRef, useEffect, useState } from "react";
import socket from '../utils/socket.js';
import PrivateChatModal from '../components/PrivateChatModal.jsx';
import { useParams, Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { placeBid, viewAuction } from "../api/auction.js";
import { useSelector } from "react-redux";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { formatDuration } from "../utils/formatTime.js";

export const ViewAuction = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const inputRef = useRef();
  const [showChat, setShowChat] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["viewAuctions", id],
    queryFn: () => viewAuction(id),
    staleTime: 30 * 1000,
    placeholderData: () => undefined,
  });

  // Realtime updates via Socket.IO
  useEffect(() => {
    if (!id) return;
    socket.emit('joinAuction', id);

    const handler = (payload) => {
      if (payload && payload.auctionId === id) {
        // Refresh the query to get latest data
        queryClient.invalidateQueries({ queryKey: ["viewAuctions", id] });
        queryClient.invalidateQueries({ queryKey: ["allAuction"] });
      }
    };

    socket.on('bidPlaced', handler);

    return () => {
      socket.emit('leaveAuction', id);
      socket.off('bidPlaced', handler);
    };
  }, [id]);

  const placeBidMutate = useMutation({
    mutationFn: ({ bidAmount, id }) => placeBid({ bidAmount, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (error) => {
      console.log("Error: ", error.message);
    },
  });

  if (isLoading) return <LoadingScreen />;

  const handleBidSubmit = (e) => {
    e.preventDefault();
    let bidAmount = e.target.bidAmount.value.trim();
    placeBidMutate.mutate({ bidAmount, id });

    // optimistic UI: we can locally update UI while server confirms
    // but authoritative update will come via socket event
  };

  const now = new Date();
  const startsInMs = Math.max(0, new Date(data.itemStartDate) - now);
  const timeLeftMs = Math.max(0, new Date(data.itemEndDate) - now);
  const hasStarted = startsInMs <= 0;
  const hasNotEnded = timeLeftMs > 0;
  const isActive = hasStarted && hasNotEnded;
  const startsLabel = `Starts in ${formatDuration(startsInMs)}`;
  const endLabel = formatDuration(timeLeftMs);

  const formatWinner = (w) => {
    if (!w) return '';
    if (typeof w === 'string') return w;
    return w.name || w._id || '';
  };

  const isWinnerUser = () => {
    if (!data.winner || !user?._id) return false;
    if (typeof data.winner === 'string') return String(user._id) === String(data.winner);
    return String(user._id) === String(data.winner._id);
  };

  return (
    <div className="min-h-screen bg-gray-50  mx-auto container">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4 grid grid-cols-1 place-items-center content-start">
            <div className="max-w-xl aspect-square bg-white rounded-md shadow-md border border-gray-200 overflow-hidden flex items-center justify-center">
              <img
                src={data.itemPhoto || "https://picsum.photos/601"}
                alt={data.itemName}
                className="h-full w-full object-fill"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                  {data.itemCategory}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                    isActive
                      ? "bg-green-100 text-green-800"
                      : hasStarted
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {isActive ? "Active" : (hasStarted ? "Ended" : startsLabel) }
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {data.itemName}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {data.itemDescription}
              </p>
            </div>

            {/* Pricing Info */}
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Starting Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${data.startingPrice}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${data.currentPrice}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Bids</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.bids.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Left</p>
                  <p
                    className={`text-lg font-semibold ${
                      isActive ? "text-red-600" : (hasStarted ? "text-gray-500" : "text-yellow-600")
                    }`}
                  >
                    {isActive ? endLabel : (hasStarted ? "Ended" : startsLabel) }
                  </p>
                </div>
              </div>
            </div>

            {/* Bid Form */}
            {data.seller._id !== user?._id && isActive && (
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Place Your Bid</h3>
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="bidAmount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Bid Amount (minimum: ${data.currentPrice + 1} maximum: ${data.currentPrice + 10})
                    </label>
                    <input
                      type="number"
                      name="bidAmount"
                      id="bidAmount"
                      ref={inputRef}
                      min={data.currentPrice + 1}
                      max={data.currentPrice + 10}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your bid amount"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Place Bid
                  </button>
                </form>
              </div>
            )} 


            {/* Seller Info */}
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
              <p className="text-gray-900 font-medium">{data.seller.name}</p>
            </div>

            {/* Winner Info (shown after auction ends) */}
            {!isActive && (data.winner || data.bids.length === 0) && (
              <div className="bg-white p-6 rounded-md shadow-md border border-gray-200 mt-4">
                <h3 className="text-lg font-semibold mb-3">Auction Result</h3>
                {data.winner ? (
                  <div>
                    <p className="text-sm text-gray-500">Winner</p>
                    <p className="text-gray-900 font-medium">{formatWinner(data.winner)}</p>
                    <p className="text-sm text-gray-500">Final Price</p>
                    <p className="text-gray-900 font-medium">${data.currentPrice}</p>

                    {/* If current user is the winner, show messaging UI to reply to admin(s) */}
                    {isWinnerUser() && (
                      <WinnerMessaging auctionId={data._id} />
                    )}

                    {/* Admin can message the winner from the details page */}
                    {user?.role === 'admin' && (
                      <div className="mt-3">
                        <button onClick={() => { console.log('ViewAuction: admin clicked Message Winner', data._id, data.winner); setShowChat(true); }} className="bg-blue-600 text-white px-3 py-1 rounded">Message Winner</button>
                        {showChat && <div className="text-sm text-gray-500 mt-2">Opening chat...</div>}
                      </div>
                    )}

                    {showChat && (data.winner?._id || data.winner) && (
                      <PrivateChatModal
                        open={showChat}
                        onClose={() => setShowChat(false)}
                        recipientId={data.winner?._id || data.winner}
                        recipientName={data.winner?.name || ''}
                        auctionId={data._id}
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700">No winner — no bids were placed for this auction.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bid History */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bid History</h2>
          <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
            {data.bids.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No bids yet. Be the first to bid!
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {data.bids.map((bid, index) => (
                  <div
                    key={index}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {bid.bidder?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(bid.bidTime).toLocaleDateString()} at{" "}
                        {new Date(bid.bidTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        ${bid.bidAmount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
