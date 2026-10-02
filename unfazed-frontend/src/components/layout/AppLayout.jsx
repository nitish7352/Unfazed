import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/sessions/calendar": "Calendar",
  "/sessions": "Sessions",
  "/notes": "Session Notes",
  "/chat": "Chat",
  "/billing": "Billing & Invoices",
  "/analytics": "Analytics",
  "/settings/subscription": "Subscription",
  "/settings": "Settings",
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const title =
    Object.entries(pageTitles).find(([path]) =>
      location.pathname.startsWith(path),
    )?.[1] || "Unfazed";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* ── Mobile overlay backdrop ─────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar — fixed on mobile, static on desktop ────────────────────── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 flex-shrink-0 lg:static lg:z-auto
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar
          onToggleSidebar={() => {
            // Mobile: show/hide overlay; Desktop: collapse/expand
            if (window.innerWidth < 1024) {
              setSidebarOpen((o) => !o);
            } else {
              setSidebarCollapsed((c) => !c);
            }
          }}
          title={title}
        />
        <main className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
