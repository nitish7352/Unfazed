import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getSummaryAPI,
  getRevenueAPI,
  getClientsChartAPI,
  getNoShowChartAPI,
  getUpgradePromptsAPI,
} from "../../api/analytics";
import Spinner from "../../components/common/Spinner";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* ── Stat card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, color = "indigo", locked = false }) => {
  const colors = {
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-500",
    blue: "text-blue-600",
  };
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 relative ${locked ? "opacity-60" : ""}`}
    >
      {locked && (
        <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
          🔒 Upgrade
        </span>
      )}
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]}`}>
        {locked ? "—" : value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
};

/* ── Upgrade prompt card ───────────────────────────────────────────────── */
const UpgradeCard = ({ feature }) => (
  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
    <span className="text-lg flex-shrink-0">🔒</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-amber-900">{feature.label}</p>
      <p className="text-xs text-amber-700 mt-0.5">{feature.upgradeLabel}</p>
      {feature.upgradeRequired && (
        <p className="text-xs text-amber-600 mt-0.5 font-medium capitalize">
          Requires {feature.upgradeRequired} plan
        </p>
      )}
    </div>
  </div>
);

/* ── Main ──────────────────────────────────────────────────────────────── */
const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [clientData, setClientData] = useState([]);
  const [noShowData, setNoShowData] = useState([]);
  const [upgradePrompts, setUpgradePrompts] = useState({
    locked: [],
    plan: "free",
  });
  const [loading, setLoading] = useState(true);
  const [revenueBlocked, setRevenueBlocked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Summary + no-show + upgrade prompts always available
        const [s, c, ns, up] = await Promise.all([
          getSummaryAPI(),
          getClientsChartAPI(),
          getNoShowChartAPI(),
          getUpgradePromptsAPI(),
        ]);

        setSummary(s.data.data);
        setClientData(
          c.data.data.map((d) => ({
            name: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
            count: d.count,
          })),
        );
        setNoShowData(
          ns.data.data.map((d) => ({
            name: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
            rate: d.rate,
            noShows: d.noShows,
            total: d.total,
          })),
        );
        setUpgradePrompts(up.data.data);

        // Revenue chart — may be 403 if plan doesn't have analytics_depth
        try {
          const r = await getRevenueAPI();
          setRevenueData(
            r.data.data.map((d) => ({
              name: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
              revenue: d.revenue,
              count: d.count,
            })),
          );
        } catch (err) {
          if (err?.response?.status === 403) setRevenueBlocked(true);
        }
      } catch {
        /* handled by global interceptor */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center h-64 items-center">
        <Spinner size="lg" />
      </div>
    );

  const noShowRate = summary?.noShowRate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
        {upgradePrompts.plan === "free" && (
          <Link
            to="/settings/subscription"
            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Upgrade plan →
          </Link>
        )}
      </div>

      {/* ── Summary stats ── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total clients"
            value={summary.totalClients}
            color="indigo"
          />
          <StatCard
            label="Active clients"
            value={summary.activeClients}
            color="blue"
          />
          <StatCard
            label="Sessions this month"
            value={summary.sessionsThisMonth}
            color="emerald"
          />
          <StatCard
            label="Revenue this month"
            value={`₹${summary.revenueThisMonth.toLocaleString("en-IN")}`}
            color="emerald"
          />
          {/* No-show rate — Module 7 */}
          <StatCard
            label="No-show rate (this month)"
            value={noShowRate !== null ? `${noShowRate}%` : "0%"}
            sub={`${summary.noShowSessions} no-shows`}
            color={
              noShowRate > 20 ? "red" : noShowRate > 10 ? "amber" : "emerald"
            }
          />
          <StatCard
            label="Upcoming sessions"
            value={summary.upcomingSessions}
            color="blue"
          />
          <StatCard
            label="Pending invoices"
            value={summary.pendingInvoices}
            color="amber"
          />
          <StatCard
            label="Total revenue"
            value={`₹${summary.totalRevenue.toLocaleString("en-IN")}`}
            color="indigo"
          />
        </div>
      )}

      {/* ── Revenue chart (gated) ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">
            Revenue (last 12 months)
          </h3>
          {revenueBlocked && (
            <Link
              to="/settings/subscription"
              className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium hover:bg-amber-200 transition-colors"
            >
              🔒 Upgrade to unlock
            </Link>
          )}
        </div>
        {revenueBlocked ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="text-4xl">📊</span>
            <p className="font-medium text-slate-700">
              Revenue charts are available on Basic plan and above
            </p>
            <Link
              to="/settings/subscription"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Upgrade now →
            </Link>
          </div>
        ) : revenueData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No revenue data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={revenueData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── No-show rate chart — Module 7 ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">
          No-show rate (last 6 months)
        </h3>
        {noShowData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No no-show data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={noShowData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip formatter={(v) => [`${v}%`, "No-show rate"]} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Client growth chart ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">
          New clients (last 6 months)
        </h3>
        {clientData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No client data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={clientData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                name="New clients"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Upgrade prompts — Module 7 ── */}
      {upgradePrompts.locked.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                Unlock more features
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {upgradePrompts.locked.length} feature
                {upgradePrompts.locked.length > 1 ? "s" : ""} available on
                higher plans
              </p>
            </div>
            <Link
              to="/settings/subscription"
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View plans →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upgradePrompts.locked.map((f) => (
              <UpgradeCard key={f.key} feature={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
