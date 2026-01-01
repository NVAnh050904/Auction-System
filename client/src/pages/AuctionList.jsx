import { useState } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery } from "@tanstack/react-query";
import { getAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";

export const AuctionList = () => {
  const [filter, setFilter] = useState("all");
  const [showEnded, setShowEnded] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["allAuction", { includeEnded: showEnded }],
    queryFn: () => getAuctions({ includeEnded: showEnded }),
    staleTime: 30 * 1000,
  });

  if (isLoading) return <LoadingScreen />;

  const categories = [
    "all",
    ...new Set(data?.map((auction) => auction.itemCategory)),
  ];
  const filteredAuctions =
    filter === "all"
      ? data
      : data?.filter((auction) => auction.itemCategory === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === category
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {filter === "all" ? "All Auctions" : `${filter} Auctions`}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredAuctions.length} items)
            </span>
          </h2>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Show ended</label>
            <input
              type="checkbox"
              checked={showEnded}
              onChange={(e) => setShowEnded(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        </div>

        {filteredAuctions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No auctions found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 place-items-center gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
