import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";
import Avatar from "../common/Avatar";

const Topbar = ({ onToggleSidebar, title = "" }) => {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] flex items-center px-4 gap-4 shadow-[var(--shadow-sm)]">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
        className="p-2 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-base font-semibold text-[var(--text-primary)]">
        {title}
      </h1>

      {/* Notifications bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifs((s) => !s)}
          aria-label={`Notifications (${unreadCount} unread)`}
          aria-expanded={showNotifs}
          className="relative p-2 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--error)] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {showNotifs && (
          <div className="absolute right-0 mt-2 w-80 bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border)] z-50 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="font-semibold text-[var(--text-primary)]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && markRead(n._id)}
                    className={`px-4 py-3 border-b border-[var(--border)] cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-[var(--primary-light)]" : ""}`}
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {n.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {format(new Date(n.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-[var(--border)]">
              <Link
                to="/notifications"
                onClick={() => setShowNotifs(false)}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                View all notifications
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      <Avatar
        src={user?.avatar}
        name={`${user?.firstName || ""} ${user?.lastName || ""}`}
        size="sm"
        className="cursor-pointer"
      />
    </header>
  );
};

export default Topbar;
