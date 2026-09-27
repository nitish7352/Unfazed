import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getSummaryAPI } from '../../api/analytics';
import { getUpcomingSessionsAPI } from '../../api/sessions';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import Badge, { statusColor } from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

const StatCard = ({ label, value, sub, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green:  'bg-emerald-50 text-emerald-700',
    amber:  'bg-amber-50 text-amber-700',
    blue:   'bg-blue-50 text-blue-700',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color].split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, upcomingRes] = await Promise.all([
          getSummaryAPI(),
          getUpcomingSessionsAPI(),
        ]);
        setStats(statsRes.data.data);
        setUpcoming(upcomingRes.data.data.sessions);
      } catch { /* handled by interceptor */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {greeting()}, {user?.firstName} 👋
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active clients"
            value={stats.activeClients}
            sub={`${stats.totalClients} total`}
            color="indigo"
          />
          <StatCard
            label="Sessions this month"
            value={stats.sessionsThisMonth}
            sub={`${stats.sessionsThisWeek} this week`}
            color="blue"
          />
          <StatCard
            label="Revenue this month"
            value={`₹${stats.revenueThisMonth.toLocaleString('en-IN')}`}
            sub={`₹${stats.totalRevenue.toLocaleString('en-IN')} total`}
            color="green"
          />
          <StatCard
            label="Upcoming sessions"
            value={stats.upcomingSessions}
            sub={stats.pendingInvoices > 0 ? `${stats.pendingInvoices} pending invoices` : 'All invoices up to date'}
            color="amber"
          />
        </div>
      )}

      {/* Upcoming sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Upcoming sessions (next 7 days)</h3>
          <Link to="/sessions" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-slate-400 text-sm">No upcoming sessions scheduled.</p>
            <Link to="/sessions" className="text-indigo-600 text-sm font-medium mt-2 inline-block hover:underline">
              Schedule a session →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((session) => (
              <li key={session._id}>
                <Link
                  to={`/sessions/${session._id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <Avatar
                    src={session.client?.avatar}
                    name={`${session.client?.firstName} ${session.client?.lastName}`}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {session.client?.firstName} {session.client?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(session.startTime), 'EEE, MMM d · h:mm a')} · {session.duration} min · {session.modality}
                    </p>
                  </div>
                  <Badge label={session.status} color={statusColor(session.status)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
