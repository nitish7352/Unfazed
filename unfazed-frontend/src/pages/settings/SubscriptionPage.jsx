import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../api/axios';

const PLAN_DETAILS = {
  free:       { label: 'Free',       color: 'text-slate-600', bg: 'bg-slate-50',  price: '₹0',     clients: 5,    features: ['5 clients', 'Session scheduling', 'Basic notes'] },
  basic:      { label: 'Basic',      color: 'text-blue-600',  bg: 'bg-blue-50',   price: '₹999',   clients: 20,   features: ['20 clients', 'Invoice & billing', 'Email reminders', 'CSV exports'] },
  pro:        { label: 'Pro',        color: 'text-indigo-600',bg: 'bg-indigo-50', price: '₹2,499', clients: 100,  features: ['100 clients', 'Everything in Basic', 'Analytics dashboard', 'PDF exports', 'Recurring sessions'] },
  enterprise: { label: 'Enterprise', color: 'text-purple-600',bg: 'bg-purple-50', price: '₹5,999', clients: '∞', features: ['Unlimited clients', 'Everything in Pro', 'Priority support', 'Custom integrations'] },
};

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [subData, setSubData]   = useState(null);
  const toast = useToast();

  const sub = user?.subscription || {};

  useEffect(() => {
    api.get('/subscription')
      .then(({ data }) => setSubData(data.data.subscription))
      .catch(() => {});
  }, []);

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      const { data } = await api.post('/subscription/order', { plan });
      const { orderId, amount, currency, keyId } = data.data;

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not loaded. Add script to index.html.');
        return;
      }

      const rzp = new window.Razorpay({
        key:      keyId,
        amount,
        currency,
        order_id: orderId,
        name:     'Unfazed',
        description: `${PLAN_DETAILS[plan]?.label} Plan — Monthly`,
        handler: async (response) => {
          try {
            await api.post('/subscription/verify', { ...response, plan });
            await refreshUser();
            toast.success(`${PLAN_DETAILS[plan]?.label} plan activated! 🎉`);
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { email: user?.email, name: `${user?.firstName} ${user?.lastName}` },
        theme:  { color: '#6366f1' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You\'ll keep access until the end of the billing period.')) return;
    try {
      await api.post('/subscription/cancel');
      await refreshUser();
      toast.success('Subscription cancelled');
    } catch { toast.error('Failed to cancel subscription'); }
  };

  const currentPlan = subData?.plan || sub.plan || 'free';
  const currentStatus = subData?.status || sub.status || 'trial';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Subscription</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your plan and billing</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-slate-500">Current plan</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-2xl font-bold capitalize ${PLAN_DETAILS[currentPlan]?.color}`}>
                {PLAN_DETAILS[currentPlan]?.label || currentPlan}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize
                ${currentStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {currentStatus}
              </span>
            </div>
            {subData?.endDate && (
              <p className="text-xs text-slate-400 mt-1">
                Renews {format(new Date(subData.endDate), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          {currentPlan !== 'free' && currentStatus === 'active' && (
            <Button variant="ghost" size="sm" className="text-red-500" onClick={handleCancel}>
              Cancel subscription
            </Button>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PLAN_DETAILS).map(([planKey, plan]) => {
          const isCurrent = planKey === currentPlan;
          return (
            <div
              key={planKey}
              className={`bg-white rounded-xl border-2 p-5 flex flex-col transition-all
                ${isCurrent ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mb-3 ${plan.bg} ${plan.color}`}>
                {plan.label}
              </div>
              <p className="text-2xl font-bold text-slate-900">{plan.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <div className="text-center text-sm font-medium text-indigo-600 py-1.5">Current plan</div>
                ) : planKey === 'free' ? (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Downgrade
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    loading={loading}
                    onClick={() => handleUpgrade(planKey)}
                  >
                    Upgrade to {plan.label}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPage;
