/**
 * Chat Socket Handler — Module 6
 * Real-time in-app chat between therapist and client using Socket.io.
 * Messages are persisted to MongoDB (ChatMessage model).
 * Room naming: "chat:<therapistId>:<clientId>"
 */
const ChatMessage = require('../models/ChatMessage');

function setupChatSocket(io) {
  const chat = io.of('/chat');

  chat.on('connection', (socket) => {
    console.log(`[Chat] connected: ${socket.id}`);

    // ── Join room ──────────────────────────────────────────────────────
    socket.on('join_chat', async ({ therapistId, clientId, userId }) => {
      if (!therapistId || !clientId) return;

      const roomId = `chat:${therapistId}:${clientId}`;
      socket.join(roomId);
      socket.roomId      = roomId;
      socket.userId      = userId;
      socket.therapistId = therapistId;
      socket.clientId    = clientId;
      socket.userType    = String(userId) === String(therapistId) ? 'therapist' : 'client';

      // Send last 50 persisted messages
      try {
        const history = await ChatMessage.find({ therapist: therapistId, client: clientId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit('chat_history', history.reverse());
      } catch (err) {
        console.error('[Chat] history load error:', err.message);
        socket.emit('chat_history', []);
      }

      socket.to(roomId).emit('user_joined', {
        userId,
        userType:  socket.userType,
        timestamp: new Date().toISOString(),
      });

      console.log(`[Chat] ${socket.userType} ${userId} joined ${roomId}`);
    });

    // ── Send message ────────────────────────────────────────────────────
    socket.on('send_message', async ({ text, attachmentUrl }) => {
      if (!socket.roomId || !text?.trim()) return;

      try {
        const msg = await ChatMessage.create({
          therapist:     socket.therapistId,
          client:        socket.clientId,
          senderId:      socket.userId,
          senderType:    socket.userType,
          text:          text.trim(),
          attachmentUrl: attachmentUrl || null,
          readBy:        [socket.userId],
        });

        // Emit to everyone in the room (including sender — confirms delivery)
        chat.to(socket.roomId).emit('new_message', msg.toObject());
      } catch (err) {
        console.error('[Chat] save error:', err.message);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // ── Typing indicators ───────────────────────────────────────────────
    socket.on('typing_start', () => {
      if (socket.roomId)
        socket.to(socket.roomId).emit('typing', { userId: socket.userId, typing: true });
    });

    socket.on('typing_stop', () => {
      if (socket.roomId)
        socket.to(socket.roomId).emit('typing', { userId: socket.userId, typing: false });
    });

    // ── Read receipt ────────────────────────────────────────────────────
    socket.on('mark_read', async ({ messageId }) => {
      if (!socket.roomId) return;
      try {
        await ChatMessage.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: socket.userId },
        });
        chat.to(socket.roomId).emit('message_read', {
          messageId,
          readBy: socket.userId,
        });
      } catch { /* non-fatal */ }
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user_left', {
          userId:    socket.userId,
          userType:  socket.userType,
          timestamp: new Date().toISOString(),
        });
      }
      console.log(`[Chat] disconnected: ${socket.id}`);
    });
  });

  return chat;
}

module.exports = setupChatSocket;
