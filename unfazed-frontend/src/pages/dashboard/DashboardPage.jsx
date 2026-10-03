import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { getSummaryAPI } from "../../api/analytics";
import { getUpcomingSessionsAPI } from "../../api/sessions";
import { getTherapistBookingsAPI, updateBookingStatusAPI } from "../../api/bookings";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import Avatar from "../../components/common/Avatar";
import Badge, { statusColor } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import ClientDashboardView from "../../components/dashboard/ClientDashboardView";

const PeopleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const CurrencyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const iconColors = {
  indigo: { bg: "bg-[var(--primary-light)]", text: "text-[var(--primary)]" },
  green:  { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber:  { bg: "bg-amber-50", text: "text-amber-600" },
  blue:   { bg: "bg-blue-50", text: "text-blue-600" },
  rose:   { bg: "bg-rose-50", text: "text-rose-600" },
};

const StatCard = ({ label, value, sub, color = "indigo", icon }) => {
  const { bg, text } = iconColors[color] || iconColors.indigo;
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-5 flex items-start gap-4 hover:shadow-[var(--shadow-md)] transition-shadow">
      <div className={`w-11 h-11 rounded-[var(--radius)] flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
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
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRecentTab, setActiveRecentTab] = useState("bookings"); // bookings, clients, invoices

  const loadData = async () => {
    try {
      const [statsRes, upcomingRes, bookingsRes] = await Promise.all([
        getSummaryAPI(),
        getUpcomingSessionsAPI(),
        getTherapistBookingsAPI({ status: "pending" }),
      ]);
      setStats(statsRes.data.data);
      setUpcoming(upcomingRes.data.data.sessions || []);
      setPendingRequests(bookingsRes.data.data.bookings || []);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "client") {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // If user is a client, render the Client Dashboard!
  if (user?.role === "client") {
    return <ClientDashboardView />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleAcceptBooking = async (bookingId) => {
    try {
      await updateBookingStatusAPI(bookingId, "confirmed");
      toast.success("Booking confirmed!");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm booking");
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = window.prompt("Reason for declining this booking request (optional):");
    if (reason === null) return; // user cancelled prompt
    try {
      await updateBookingStatusAPI(bookingId, "rejected", reason);
      toast.success("Booking request declined");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline booking");
    }
  };

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
            {format(new Date(), "EEEE, MMMM d, yyyy")} · Therapist Dashboard
          </p>
        </div>
        <Link to="/sessions">
          <Button>+ Schedule session</Button>
        </Link>
      </div>

      {/* 6 Stats Cards (Requirement 14) */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total Clients"
            value={stats.totalClients || 0}
            sub={`${stats.activeClients || 0} active`}
            color="indigo"
            icon={<PeopleIcon />}
          />
          <StatCard
            label="Today's Appts"
            value={stats.todayAppointments || 0}
            sub="scheduled today"
            color="blue"
            icon={<CalendarIcon />}
          />
          <StatCard
            label="Upcoming Sessions"
            value={stats.upcomingSessions || 0}
            sub={`${stats.sessionsThisWeek || 0} this week`}
            color="green"
            icon={<ClockIcon />}
          />
          <StatCard
            label="Pending Bookings"
            value={stats.pendingBookings || pendingRequests.length || 0}
            sub="Action required"
            color="amber"
            icon={<BellIcon />}
          />
          <StatCard
            label="Pending Payments"
            value={stats.pendingPayments || stats.pendingInvoices || 0}
            sub="Invoices unpaid"
            color="rose"
            icon={<CurrencyIcon />}
          />
          <StatCard
            label="Monthly Revenue"
            value={`₹${(stats.revenueThisMonth || 0).toLocaleString("en-IN")}`}
            sub={`₹${(stats.totalRevenue || 0).toLocaleString("en-IN")} total`}
            color="green"
            icon={<CurrencyIcon />}
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

      {/* SECTION: New Booking Requests (Requirement 6) */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[var(--text-primary)]">
              New Booking Requests
            </h3>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingRequests.length} pending
              </span>
            )}
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            No pending booking requests right now. New client appointments booked online will appear here.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {pendingRequests.map((b) => {
              const clientName = `${b.clientUser?.firstName || b.client?.firstName || "Client"} ${b.clientUser?.lastName || b.client?.lastName || ""}`;
              const clientAvatar = b.clientUser?.avatar || b.client?.avatar;
              const dateStr = format(new Date(b.startTime), "EEE, MMM d, yyyy · h:mm a");

              return (
                <li key={b._id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <Avatar src={clientAvatar} name={clientName} size="md" className="w-12 h-12 rounded-xl" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[var(--text-primary)]">{clientName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {b.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          Payment: {b.paymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        📅 {dateStr}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 capitalize">
                        {b.sessionType} Therapy · {b.mode === "online" ? "Online Video" : "In-Person"} · ₹{b.fee}
                      </p>
                      {b.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 italic">
                          "{b.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions (Requirement 6) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAcceptBooking(b._id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectBooking(b._id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    >
                      Reject
                    </button>
                    {b.client?._id && (
                      <Link
                        to={`/clients/${b.client._id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        View Client
                      </Link>
                    )}
                    {b.session?._id && (
                      <Link
                        to={`/sessions/${b.session._id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        View Appointment
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Upcoming sessions (next 7 days) */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Upcoming sessions (next 7 days)
          </h3>
          <Link to="/sessions" className="text-sm text-[var(--primary)] hover:underline">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">No upcoming sessions</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Schedule a session or confirm incoming bookings.</p>
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
                      {format(new Date(session.startTime), "EEE, MMM d · h:mm a")}{" "}
                      · {session.duration} min · {session.modality}
                    </p>
                  </div>
                  <Badge label={session.status} color={statusColor(session.status)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SECTION: Recent Activity Tabs (Requirement 14: Recent Bookings, Recent Clients, Recent Invoices) */}
      {stats && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-5">
          <div className="flex border-b border-[var(--border)] gap-6 text-sm mb-4">
            <button
              type="button"
              onClick={() => setActiveRecentTab("bookings")}
              className={`pb-2.5 font-semibold transition-colors ${
                activeRecentTab === "bookings"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Recent Bookings ({stats.recentBookings?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveRecentTab("clients")}
              className={`pb-2.5 font-semibold transition-colors ${
                activeRecentTab === "clients"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Recent Clients ({stats.recentClients?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveRecentTab("invoices")}
              className={`pb-2.5 font-semibold transition-colors ${
                activeRecentTab === "invoices"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Recent Invoices ({stats.recentInvoices?.length || 0})
            </button>
          </div>

          {activeRecentTab === "bookings" && (
            <div className="space-y-2">
              {!stats.recentBookings?.length ? (
                <p className="text-xs text-slate-400 p-4 text-center">No bookings recorded yet.</p>
              ) : (
                stats.recentBookings.map((b) => (
                  <div key={b._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {b.clientUser?.firstName || b.client?.firstName} {b.clientUser?.lastName || b.client?.lastName}
                      </span>
                      <span className="text-slate-400 ml-2">
                        {format(new Date(b.startTime), "dd MMM yyyy, h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="capitalize px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                        {b.status}
                      </span>
                      <span className="font-bold text-slate-900">₹{b.fee}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeRecentTab === "clients" && (
            <div className="space-y-2">
              {!stats.recentClients?.length ? (
                <p className="text-xs text-slate-400 p-4 text-center">No clients added yet.</p>
              ) : (
                stats.recentClients.map((c) => (
                  <div key={c._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={c.avatar} name={`${c.firstName} ${c.lastName}`} size="sm" />
                      <div>
                        <Link to={`/clients/${c._id}`} className="font-semibold text-slate-800 hover:text-indigo-600">
                          {c.firstName} {c.lastName}
                        </Link>
                        <p className="text-[11px] text-slate-400">{c.email || "No email"}</p>
                      </div>
                    </div>
                    <Link to={`/clients/${c._id}`} className="text-xs text-indigo-600 font-medium hover:underline">
                      View Profile →
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}

          {activeRecentTab === "invoices" && (
            <div className="space-y-2">
              {!stats.recentInvoices?.length ? (
                <p className="text-xs text-slate-400 p-4 text-center">No invoices created yet.</p>
              ) : (
                stats.recentInvoices.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-xs">
                    <div>
                      <span className="font-mono font-semibold text-slate-800">{inv.invoiceNumber}</span>
                      <span className="text-slate-400 ml-2">
                        {inv.client?.firstName} {inv.client?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">₹{inv.total}</span>
                      <span className={`capitalize px-2 py-0.5 rounded-full font-bold ${
                        inv.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
