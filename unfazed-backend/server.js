require('dotenv').config();
const http   = require('http');
const { Server } = require('socket.io');
const app    = require('./app');
const connectDB = require('./src/config/db');
const setupVideoSocket = require('./src/sockets/videoSocket');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Setup socket namespaces / events
setupVideoSocket(io);

// Make io available to controllers via app locals
app.set('io', io);

// Connect to MongoDB, then start server
const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Unfazed server running on port ${PORT} (${process.env.NODE_ENV})`);
  });
};

start();
