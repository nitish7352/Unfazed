import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { getSummaryAPI } from "../../api/analytics";
import { getUpcomingSessionsAPI } from "../../api/sessions";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/common/Avatar";
import Badge, { statusColor } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";

const PeopleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.75}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.75}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

const CurrencyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.75}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.75}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const iconColors = {
  indigo: { bg: "bg-[var(--primary-light)]", text: "text-[var(--primary)]" },
  green: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
};

const StatCard = ({ label, value, sub, color = "indigo", icon }) => {
  const { bg, text } = iconColors[color] || iconColors.indigo;
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-5 flex items-start gap-4 hover:shadow-[var(--shadow-md)] transition-shadow">
      <div
        className={`w-11 h-11 rounded-[var(--radius)] flex items-center justify-center flex-shrink-0 ${bg} ${text}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
          {value}
        </p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
      </div>
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
      } catch {
        /* handled by interceptor */
      } finally {
        setLoading(false);
      }
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
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {greeting()}, {user?.firstName}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Link to="/sessions">
          <Button>+ Schedule session</Button>
        </Link>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active clients"
            value={stats.activeClients}
            sub={`${stats.totalClients} total`}
            color="indigo"
            icon={<PeopleIcon />}
          />
          <StatCard
            label="Sessions this month"
            value={stats.sessionsThisMonth}
            sub={`${stats.sessionsThisWeek} this week`}
            color="blue"
            icon={<CalendarIcon />}
          />
          <StatCard
            label="Revenue this month"
            value={`₹${stats.revenueThisMonth.toLocaleString("en-IN")}`}
            sub={`₹${stats.totalRevenue.toLocaleString("en-IN")} total`}
            color="green"
            icon={<CurrencyIcon />}
          />
          <StatCard
            label="Upcoming sessions"
            value={stats.upcomingSessions}
            sub={
              stats.pendingInvoices > 0
                ? `${stats.pendingInvoices} pending invoices`
                : "All invoices up to date"
            }
            color="amber"
            icon={<ClockIcon />}
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/clients">
          <Button variant="outline" size="sm">
            Add client
          </Button>
        </Link>
        <Link to="/sessions">
          <Button variant="outline" size="sm">
            Schedule session
          </Button>
        </Link>
        <Link to="/billing">
          <Button variant="outline" size="sm">
            Create invoice
          </Button>
        </Link>
        <Link to="/analytics">
          <Button variant="outline" size="sm">
            View analytics
          </Button>
        </Link>
      </div>

      {/* Upcoming sessions */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Upcoming sessions (next 7 days)
          </h3>
          <Link
            to="/sessions"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 text-[var(--text-muted)] mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No upcoming sessions
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Schedule a session to see it here.
            </p>
            <Link to="/sessions" className="mt-4">
              <Button size="sm">Schedule a session</Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {upcoming.map((session) => (
              <li key={session._id}>
                <Link
                  to={`/sessions/${session._id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <Avatar
                    src={session.client?.avatar}
                    name={`${session.client?.firstName} ${session.client?.lastName}`}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {session.client?.firstName} {session.client?.lastName}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {format(
                        new Date(session.startTime),
                        "EEE, MMM d · h:mm a",
                      )}{" "}
                      · {session.duration} min · {session.modality}
                    </p>
                  </div>
                  <Badge
                    label={session.status}
                    color={statusColor(session.status)}
                  />
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
