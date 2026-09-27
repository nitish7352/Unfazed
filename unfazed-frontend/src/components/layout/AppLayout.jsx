import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/sessions/calendar": "Calendar",
  "/sessions": "Sessions",
  "/notes": "Session Notes",
  "/billing": "Billing & Invoices",
  "/analytics": "Analytics",
  "/settings/subscription": "Subscription",
  "/settings": "Settings",
};

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      location.pathname.startsWith(path),
    )?.[1] || "Unfazed";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          title={title}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
