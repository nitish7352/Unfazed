import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/clients", label: "Clients", icon: "👥" },
  { to: "/sessions", label: "Sessions", icon: "📋" },
  { to: "/sessions/calendar", label: "Calendar", icon: "📅" },
  { to: "/notes", label: "Notes", icon: "📝" },
  { to: "/billing", label: "Billing", icon: "💳" },
  { to: "/analytics", label: "Analytics", icon: "📊" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

const Sidebar = ({ collapsed = false }) => {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`
        flex flex-col h-full bg-white border-r border-slate-200
        transition-all duration-200 overflow-hidden
        ${collapsed ? "w-16" : "w-64"}
      `}
      aria-label="Main navigation"
    >
      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200 flex-shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm" aria-hidden="true">
            U
          </span>
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-indigo-600 tracking-tight">
            Unfazed
          </span>
        )}
      </div>

      {/* ── Nav items ──────────────────────────────────────────────────── */}
      <nav
        className="flex-1 px-2 py-4 overflow-y-auto"
        aria-label="App navigation"
      >
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={
                  item.to === "/sessions"
                } /* prevent /sessions matching /sessions/calendar */
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                   transition-colors select-none
                   ${
                     isActive
                       ? "bg-indigo-50 text-indigo-700"
                       : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                   }
                   ${collapsed ? "justify-center" : ""}`
                }
                title={collapsed ? item.label : undefined}
              >
                <span
                  className="text-base flex-shrink-0 leading-none"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── User footer ────────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-slate-200 flex-shrink-0">
        <div
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
        >
          <Avatar
            src={user?.avatar}
            name={`${user?.firstName || ""} ${user?.lastName || ""}`}
            size="sm"
          />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
