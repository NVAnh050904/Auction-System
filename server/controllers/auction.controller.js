import uploadImage from '../services/cloudinaryService.js';
import Product from '../models/product.js';
import mongoose from "mongoose"
import { connectDB } from '../connection.js'


export const createAuction = async (req, res) => {
    try {
        await connectDB();
        const { itemName, startingPrice, itemDescription, itemCategory, itemStartDate, itemEndDate } = req.body;
        let imageUrl = '';

        if (req.file) {
            try {
                imageUrl = await uploadImage(req.file);
            } catch (error) {
                return res.status(500).json({ message: 'Error uploading image to Cloudinary', error: error.message });
            }
        }

        const start = itemStartDate ? new Date(itemStartDate) : new Date();
        const end = new Date(itemEndDate);
        if (end <= start) {
            return res.status(400).json({ message: 'Auction end date must be after start date' });
        }

        const newAuction = new Product({
            itemName,
            startingPrice,
            currentPrice: startingPrice,
            itemDescription,
            itemCategory,
            itemPhoto: imageUrl,
            itemStartDate: start,
            itemEndDate: end,
            seller: req.user.id,
        });
        await newAuction.save();

        res.status(201).json({ message: 'Auction created successfully', newAuction });
    } catch (error) {
        res.status(500).json({ message: 'Error creating auction', error: error.message });
    }
};

export const showAuction = async (req, res) => {
    try {
        await connectDB();
        const now = new Date();
        const includeEnded = req.query.includeEnded === 'true';

        // By default return auctions that have not yet ended; includeEnded=true returns auctions that HAVE ended
        let filter;
        if (includeEnded) {
            // Only auctions that have ended (not future/active ones)
            filter = { itemEndDate: { $lte: now } };
        } else {
            // Active/future auctions
            filter = { itemEndDate: { $gt: now } };
        }

        const auction = await Product.find(filter)
            .populate("seller", "name")
            .populate("winner", "name")
            .select("itemName itemDescription currentPrice bids itemStartDate itemEndDate itemCategory itemPhoto seller winner isSold")
            .sort({ createdAt: -1 });

        const formatted = auction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidsCount: auction.bids.length,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - now),
            itemCategory: auction.itemCategory,
            sellerName: auction.seller.name,
            itemPhoto: auction.itemPhoto,
            itemStartDate: auction.itemStartDate,
            itemEndDate: auction.itemEndDate,
            hasStarted: new Date(auction.itemStartDate) <= now,
            hasEnded: new Date(auction.itemEndDate) <= now,
            winner: auction.winner ? { _id: auction.winner._id ? String(auction.winner._id) : String(auction.winner), name: auction.winner.name || null } : null,
            isSold: auction.isSold || false
        }));

        res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
}

export const auctionById = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const auction = await Product.findById(id)
            .populate("seller", "name")
            .populate("bids.bidder", "name")
            .populate("winner", "name");

        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        // Sort bids by time (most recent first)
        auction.bids.sort((a, b) => new Date(b.bidTime) - new Date(a.bidTime));

        const now = new Date();
        // If auction has ended and winner not set yet, determine winner lazily
        if (new Date(auction.itemEndDate) < now && !auction.winner) {
            if (auction.bids && auction.bids.length > 0) {
                // highest bid by amount
                let highest = auction.bids[0];
                for (let i = 1; i < auction.bids.length; i++) {
                    if (auction.bids[i].bidAmount > highest.bidAmount) highest = auction.bids[i];
                }

                auction.winner = highest.bidder._id || highest.bidder;
                auction.isSold = true;
                await auction.save();
                await auction.populate('winner', 'name');

                // emit socket event so clients can react
                try {
                    const { getIO } = await import('../socket.js');
                    const io = getIO();
                    if (io) {
                        io.emit('auctionEnded', {
                            auctionId: id,
                            winner: auction.winner,
                            finalPrice: auction.currentPrice,
                            bidsCount: auction.bids.length
                        });
                    }
                } catch (err) {
                    console.error('Error emitting auctionEnded:', err.message);
                }
            } else {
                // No bids - leave winner null and isSold false
                auction.isSold = false;
                await auction.save();
            }
        }

        res.status(200).json(auction);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
}

export const placeBid = async (req, res) => {
    try {
        await connectDB();
        const { bidAmount } = req.body;
        const user = req.user.id;
        const { id } = req.params;

        const product = await Product.findById(id).populate('bids.bidder', "name");
        if (!product) return res.status(404).json({ message: "Auction not found" });

        const now = new Date();
        if (new Date(product.itemStartDate) > now) return res.status(400).json({ message: "Auction has not started yet" });
        if (new Date(product.itemEndDate) < now) return res.status(400).json({ message: "Auction has already ended" });

        const minBid = Math.max(product.currentPrice, product.startingPrice) + 1;
        const maxBid = Math.max(product.currentPrice, product.startingPrice) + 10;
        if (bidAmount < minBid) return res.status(400).json({ message: `Bid must be at least Rs ${minBid}` })
        if (bidAmount > maxBid) return res.status(400).json({ message: `Bid must be at max Rs ${maxBid}` })

        product.bids.push({
            bidder: user,
            bidAmount: bidAmount,
        })

        product.currentPrice = bidAmount;
        await product.save();

        // Emit realtime update to connected clients using Socket.IO
        try {
            const { getIO } = await import('../socket.js');
            const io = getIO();
            if (io) {
                io.to(id).emit('bidPlaced', {
                    auctionId: id,
                    currentPrice: product.currentPrice,
                    bidsCount: product.bids.length,
                    bidder: { _id: user }
                });
                // Also broadcast to a global channel if needed
                io.emit('auctionUpdated', { auctionId: id, currentPrice: product.currentPrice });
            }
        } catch (err) {
            console.error('Error emitting socket event:', err.message);
        }

        res.status(200).json({ message: "Bid placed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error placing bid", error: error.message })
    }
}

export const dashboardData = async (req, res) => {
    try {
        await connectDB();
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        const dateNow = new Date();
        const stats = await Product.aggregate([
            {
                $facet: {
                    totalAuctions: [{ $count: "count" }],
                    userAuctionCount: [{ $match: { seller: userObjectId } }, { $count: "count" }],
                    activeAuctions: [
                        { $match: { itemStartDate: { $lte: dateNow }, itemEndDate: { $gte: dateNow } } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const totalAuctions = stats[0].totalAuctions[0]?.count || 0;
        const userAuctionCount = stats[0].userAuctionCount[0]?.count || 0;
        const activeAuctions = stats[0].activeAuctions[0]?.count || 0;

        // Include auctions that haven't started yet (but not ended)
        const globalAuction = await Product.find({ itemEndDate: { $gt: dateNow } }).populate("seller", "name").sort({ createdAt: -1 }).limit(3);
        const latestAuctions = globalAuction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidsCount: auction.bids.length,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - dateNow),
            itemCategory: auction.itemCategory,
            sellerName: auction.seller.name,
            itemPhoto: auction.itemPhoto,
            itemStartDate: auction.itemStartDate,
            itemEndDate: auction.itemEndDate,
            hasStarted: new Date(auction.itemStartDate) <= dateNow
        }));

        const userAuction = await Product.find({ seller: userObjectId }).populate("seller", "name").sort({ createdAt: -1 }).limit(3);
        const latestUserAuctions = userAuction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidsCount: auction.bids.length,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - dateNow),
            itemCategory: auction.itemCategory,
            sellerName: auction.seller.name,
            itemPhoto: auction.itemPhoto,
            itemStartDate: auction.itemStartDate,
            itemEndDate: auction.itemEndDate
        }));

        return res.status(200).json({ totalAuctions, userAuctionCount, activeAuctions, latestAuctions, latestUserAuctions })

    } catch (error) {
        res.status(500).json({ message: "Error getting dashboard data", error: error.message })
    }
}

export const myAuction = async (req, res) => {
    try {
        await connectDB();
        const auction = await Product.find({ seller: req.user.id })
            .populate("seller", "name")
            .select("itemName itemDescription currentPrice bids itemEndDate itemCategory itemPhoto seller")
            .sort({ createdAt: -1 });
        const formatted = auction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidsCount: auction.bids.length,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
            itemCategory: auction.itemCategory,
            sellerName: auction.seller.name,
            itemPhoto: auction.itemPhoto,
        }));

        res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
}