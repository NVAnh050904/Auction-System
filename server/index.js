import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
dotenv.config();
import { connectDB } from './connection.js'
import auctionRouter from './routes/auction.js';
import { secureRoute } from './middleware/auth.js';
import userAuthRouter from './routes/userAuth.js';
import userRouter from './routes/user.js';
import contactRouter from "./routes/contact.js";
import adminRouter from './routes/admin.js';

const port = process.env.PORT || 4000;

connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());

// Allow localhost and the LAN origin for development debugging
const allowedOrigins = [process.env.ORIGIN, 'http://localhost:5173', 'http://192.168.1.17:5173'];
console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (e.g., curl, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error('CORS policy: Origin not allowed'));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));


app.get('/', async (req, res) => {
    res.json({ msg: 'Welcome to Online Auction System API' });
});
app.use('/auth', userAuthRouter)
app.use('/user', secureRoute, userRouter)
app.use('/auction', secureRoute, auctionRouter);
app.use('/contact', contactRouter);
app.use('/admin', secureRoute, adminRouter)
app.use('/messages', secureRoute, (await import('./routes/messages.js')).default)
app.use('/chat', secureRoute, (await import('./routes/chat.js')).default)

// Create HTTP server and initialize Socket.IO
import http from 'http';
import { initSocket } from './socket.js';

const server = http.createServer(app);
const io = initSocket(server);

server.listen(port, () => {
    console.log(`Server (with Socket.IO) is running on port ${port}`);
});