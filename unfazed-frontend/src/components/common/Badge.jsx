const colorMap = {
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  yellow: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  purple:
    "bg-[var(--primary-light)] text-[var(--primary)] ring-1 ring-inset ring-indigo-200",
  gray: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  orange: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
};

// Map domain values to colors
export const statusColor = (status) => {
  const map = {
    active: "green",
    scheduled: "blue",
    confirmed: "blue",
    completed: "green",
    cancelled: "red",
    no_show: "red",
    in_progress: "purple",
    discharged: "gray",
    waitlist: "yellow",
    on_hold: "yellow",
    rescheduled: "orange",
    paid: "green",
    pending: "yellow",
    overdue: "red",
    draft: "gray",
    sent: "blue",
    partially_paid: "orange",
    trial: "yellow",
  };
  return map[status] || "gray";
};

const Badge = ({ label, color = "gray", className = "" }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || colorMap.gray} ${className}`}
  >
    {label}
  </span>
);

export default Badge;
