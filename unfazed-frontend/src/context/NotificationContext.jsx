import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { io } from "socket.io-client";
import {
  getNotificationsAPI,
  markAsReadAPI,
  markAllAsReadAPI,
} from "../api/notifications";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // ── Fetch notifications from REST ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getNotificationsAPI({ limit: 20 });
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch {
      /* silent */
    }
  }, [user]);

  // Initial fetch + 60 s polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Socket.io — real-time notifications ───────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Join personal notification room
      socket.emit("join_user", user._id);
    });

    // Server fires this when notificationService creates a notification for us
    socket.on("notification", (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socket.emit("leave_user", user._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  // ── Mark read ─────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    try {
      await markAsReadAPI(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* silent */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllAsReadAPI();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 20));
    if (!notification.isRead) setUnreadCount((c) => c + 1);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markRead,
        markAllRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
export default NotificationContext;
