import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      duration,
    );
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning"),
  };

  const icons = {
    success: <span style={{ color: "var(--success)" }}>✓</span>,
    error: <span style={{ color: "var(--error)" }}>✕</span>,
    info: <span style={{ color: "var(--primary)" }}>ℹ</span>,
    warning: <span style={{ color: "var(--warning)" }}>⚠</span>,
  };

  const borderColors = {
    success: "border-l-[var(--success)]",
    error: "border-l-[var(--error)]",
    info: "border-l-[var(--primary)]",
    warning: "border-l-[var(--warning)]",
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-[360px] w-full"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-3 px-4 py-3 rounded-[var(--radius)] border border-[var(--border)] border-l-4 ${borderColors[t.type]} bg-[var(--surface)] shadow-[var(--shadow-md)] text-sm animate-slide-up`}
          >
            <span className="w-5 h-5 flex-shrink-0 mt-0.5 font-bold text-sm flex items-center justify-center">
              {icons[t.type]}
            </span>
            <span className="flex-1 text-[var(--text-primary)]">
              {t.message}
            </span>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="flex-shrink-0 ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
