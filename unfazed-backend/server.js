// Load .env only in development — Render injects env vars directly, no .env file needed
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const http   = require('http');
const { Server } = require('socket.io');
const app    = require('./app');
const connectDB = require('./src/config/db');
const setupVideoSocket = require('./src/sockets/videoSocket');
const setupChatSocket  = require('./src/sockets/chatSocket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => cb(null, true), // allow all — CORS handled by app.js
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Main namespace: user notification rooms ──────────────────────────────────
// Clients emit  { event: 'join_user', userId }  to subscribe to their personal
// notification room ("user:<id>"). The notificationService emits to this room.
io.on('connection', (socket) => {
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[Socket] user ${userId} joined room user:${userId}`);
    }
  });
  socket.on('leave_user', (userId) => {
    if (userId) socket.leave(`user:${userId}`);
  });
});

setupVideoSocket(io);
setupChatSocket(io);
app.set('io', io);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Unfazed server running on port ${PORT} (${process.env.NODE_ENV})`);
  });
};

start();
