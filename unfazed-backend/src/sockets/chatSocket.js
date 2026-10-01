/**
 * Chat Socket Handler — Module 6
 * Real-time in-app chat between therapist and client using Socket.io.
 * Rooms: "chat:<therapistId>:<clientId>"
 */
const mongoose = require("mongoose");

// In-memory message store (replace with MongoDB collection for persistence)
const messageHistory = new Map(); // roomId -> messages[]

function setupChatSocket(io) {
  // Namespace: /chat
  const chat = io.of("/chat");

  chat.on("connection", (socket) => {
    console.log(`[Chat] Socket connected: ${socket.id}`);

    // ── Join a chat room ────────────────────────────────────────────────
    socket.on("join_chat", ({ therapistId, clientId, userId }) => {
      if (!therapistId || !clientId) return;

      const roomId = `chat:${therapistId}:${clientId}`;
      socket.join(roomId);
      socket.roomId   = roomId;
      socket.userId   = userId;
      socket.userType = String(userId) === String(therapistId) ? "therapist" : "client";

      // Send last 50 messages to the joining user
      const history = (messageHistory.get(roomId) || []).slice(-50);
      socket.emit("chat_history", history);

      socket.to(roomId).emit("user_joined", {
        userId,
        userType: socket.userType,
        timestamp: new Date().toISOString(),
      });

      console.log(`[Chat] ${socket.userType} ${userId} joined room ${roomId}`);
    });

    // ── Send message ────────────────────────────────────────────────────
    socket.on("send_message", ({ text, attachmentUrl }) => {
      if (!socket.roomId || !text?.trim()) return;

      const msg = {
        id:            new mongoose.Types.ObjectId().toString(),
        roomId:        socket.roomId,
        senderId:      socket.userId,
        senderType:    socket.userType,
        text:          text.trim(),
        attachmentUrl: attachmentUrl || null,
        timestamp:     new Date().toISOString(),
        readBy:        [socket.userId],
      };

      // Store in history
      if (!messageHistory.has(socket.roomId)) messageHistory.set(socket.roomId, []);
      messageHistory.get(socket.roomId).push(msg);

      // Emit to all in room (including sender for confirmation)
      chat.to(socket.roomId).emit("new_message", msg);
    });

    // ── Typing indicator ────────────────────────────────────────────────
    socket.on("typing_start", () => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit("typing", { userId: socket.userId, typing: true });
    });

    socket.on("typing_stop", () => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit("typing", { userId: socket.userId, typing: false });
    });

    // ── Read receipts ────────────────────────────────────────────────────
    socket.on("mark_read", ({ messageId }) => {
      if (!socket.roomId) return;
      const history = messageHistory.get(socket.roomId) || [];
      const msg = history.find((m) => m.id === messageId);
      if (msg && !msg.readBy.includes(socket.userId)) {
        msg.readBy.push(socket.userId);
        chat.to(socket.roomId).emit("message_read", { messageId, readBy: msg.readBy });
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit("user_left", {
          userId:    socket.userId,
          userType:  socket.userType,
          timestamp: new Date().toISOString(),
        });
      }
      console.log(`[Chat] Socket disconnected: ${socket.id}`);
    });
  });

  return chat;
}

module.exports = setupChatSocket;