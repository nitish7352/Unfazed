import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * useChat — manages a Socket.io /chat namespace connection for one room.
 *
 * @param {string} therapistId
 * @param {string} clientId
 * @param {string} userId        — current user's ID (therapist or client)
 */
export const useChat = (therapistId, clientId, userId) => {
  const [messages, setMessages]     = useState([]);
  const [connected, setConnected]   = useState(false);
  const [typingUser, setTypingUser] = useState(null); // userId of who is typing
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (!therapistId || !clientId || !userId) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_chat', { therapistId, clientId, userId });
    });

    socket.on('disconnect', () => setConnected(false));

    // Receive full history on join
    socket.on('chat_history', (history) => {
      setMessages(history);
    });

    // New real-time message
    socket.on('new_message', (msg) => {
      setMessages((prev) => {
        // Avoid duplicates (sender gets it back as confirmation)
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    // Typing indicator
    socket.on('typing', ({ userId: uid, typing }) => {
      if (uid === userId) return; // ignore own typing echo
      setTypingUser(typing ? uid : null);
    });

    // Read receipt
    socket.on('message_read', ({ messageId, readBy }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, readBy: [...new Set([...(m.readBy || []), readBy])] }
            : m
        )
      );
    });

    socket.on('message_error', ({ error }) => {
      console.error('[Chat] message error:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [therapistId, clientId, userId]);

  const sendMessage = useCallback((text) => {
    if (!socketRef.current || !text.trim()) return;
    socketRef.current.emit('send_message', { text: text.trim() });
  }, []);

  const sendTypingStart = useCallback(() => {
    socketRef.current?.emit('typing_start');
    // Auto-stop after 3 s of no keypresses
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop');
    }, 3000);
  }, []);

  const sendTypingStop = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    socketRef.current?.emit('typing_stop');
  }, []);

  const markRead = useCallback((messageId) => {
    socketRef.current?.emit('mark_read', { messageId });
  }, []);

  return { messages, connected, typingUser, sendMessage, sendTypingStart, sendTypingStop, markRead };
};
