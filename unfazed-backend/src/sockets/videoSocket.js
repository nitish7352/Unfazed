/**
 * Socket.io handler for real-time video session signaling (WebRTC).
 * Rooms are keyed by Session.roomId.
 */

const setupVideoSocket = (io) => {
  // Track participants per room
  const rooms = new Map(); // roomId -> Set of socket IDs

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a video room
    socket.on('join-room', ({ roomId, userId, userName }) => {
      socket.join(roomId);
      socket.roomId  = roomId;
      socket.userId  = userId;
      socket.userName = userName;

      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(socket.id);

      // Notify other participants in room
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        userId,
        userName,
      });

      // Send current room participants to new joiner
      const participants = [];
      rooms.get(roomId).forEach((id) => {
        if (id !== socket.id) {
          const s = io.sockets.sockets.get(id);
          if (s) participants.push({ socketId: id, userId: s.userId, userName: s.userName });
        }
      });
      socket.emit('room-participants', participants);
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ to, offer }) => {
      io.to(to).emit('offer', { from: socket.id, offer });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ to, answer }) => {
      io.to(to).emit('answer', { from: socket.id, answer });
    });

    // ICE candidate exchange
    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    // Chat within the video room
    socket.on('room-message', ({ roomId, message }) => {
      io.to(roomId).emit('room-message', {
        socketId:  socket.id,
        userId:    socket.userId,
        userName:  socket.userName,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // Toggle audio/video state (mute/camera off)
    socket.on('media-state', ({ roomId, audio, video }) => {
      socket.to(roomId).emit('peer-media-state', {
        socketId: socket.id,
        audio,
        video,
      });
    });

    // Leave room explicitly
    socket.on('leave-room', () => {
      handleLeave(socket, rooms, io);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      handleLeave(socket, rooms, io);
    });
  });
};

const handleLeave = (socket, rooms, io) => {
  if (socket.roomId) {
    socket.to(socket.roomId).emit('user-left', {
      socketId: socket.id,
      userId:   socket.userId,
      userName: socket.userName,
    });

    const room = rooms.get(socket.roomId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) rooms.delete(socket.roomId);
    }

    socket.leave(socket.roomId);
    socket.roomId = null;
  }
};

module.exports = setupVideoSocket;
