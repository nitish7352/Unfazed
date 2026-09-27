import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getNotificationsAPI, markAsReadAPI, markAllAsReadAPI } from '../api/notifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getNotificationsAPI({ limit: 10 });
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch { /* silent fail */ }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    await markAsReadAPI(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllAsReadAPI();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 20));
    if (!notification.isRead) setUnreadCount((c) => c + 1);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      fetchNotifications, markRead, markAllRead, addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
export default NotificationContext;
