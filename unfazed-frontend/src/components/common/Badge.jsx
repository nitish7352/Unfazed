const colorMap = {
  green:  'bg-emerald-100 text-emerald-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-indigo-100 text-indigo-700',
  gray:   'bg-slate-100 text-slate-600',
  orange: 'bg-orange-100 text-orange-700',
};

// Map domain values to colors
export const statusColor = (status) => {
  const map = {
    active: 'green', scheduled: 'blue', confirmed: 'blue',
    completed: 'green', cancelled: 'red', no_show: 'red',
    in_progress: 'purple', discharged: 'gray', waitlist: 'yellow',
    on_hold: 'yellow', rescheduled: 'orange',
    paid: 'green', pending: 'yellow', overdue: 'red',
    draft: 'gray', sent: 'blue', partially_paid: 'orange',
  };
  return map[status] || 'gray';
};

const Badge = ({ label, color = 'gray', className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || colorMap.gray} ${className}`}>
    {label}
  </span>
);

export default Badge;
