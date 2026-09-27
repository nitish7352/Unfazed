import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getSummaryAPI, getRevenueAPI, getClientsChartAPI } from '../../api/analytics';
import Spinner from '../../components/common/Spinner';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [clientData, setClientData]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, c] = await Promise.all([
          getSummaryAPI(),
          getRevenueAPI(),
          getClientsChartAPI(),
        ]);
        setSummary(s.data.data);

        // Format revenue chart
        const formattedRevenue = r.data.data.map((d) => ({
          name:    `${months[d._id.month - 1]} ${d._id.year}`,
          revenue: d.revenue,
          count:   d.count,
        }));
        setRevenueData(formattedRevenue);

        const formattedClients = c.data.data.map((d) => ({
          name:  `${months[d._id.month - 1]} ${d._id.year}`,
          count: d.count,
        }));
        setClientData(formattedClients);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center h-64 items-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Analytics</h2>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total clients',      value: summary.totalClients },
            { label: 'Active clients',     value: summary.activeClients },
            { label: 'Sessions this month',value: summary.sessionsThisMonth },
            { label: 'Revenue this month', value: `₹${summary.revenueThisMonth.toLocaleString('en-IN')}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Revenue (last 12 months)</h3>
        {revenueData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No revenue data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
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

      {/* Client growth chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">New clients (last 6 months)</h3>
        {clientData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No client data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={clientData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="New clients" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
