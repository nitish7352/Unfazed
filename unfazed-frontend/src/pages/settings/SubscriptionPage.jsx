import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import Button from "../../components/common/Button";
import {
  getSubscriptionAPI,
  createSubscriptionOrderAPI,
  verifySubscriptionAPI,
  cancelSubscriptionAPI,
} from "../../api/subscription";
import { isSessionExpired } from "../../utils/apiError";

const PLAN_DETAILS = {
  free: {
    label: "Free",
    color: "text-slate-600",
    bg: "bg-slate-50",
    price: "₹0",
    features: ["5 clients", "Session scheduling", "Basic notes"],
  },
  basic: {
    label: "Basic",
    color: "text-blue-600",
    bg: "bg-blue-50",
    price: "₹999",
    features: [
      "20 clients",
      "Invoice & billing",
      "Email reminders",
      "CSV exports",
    ],
  },
  pro: {
    label: "Pro",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    price: "₹2,499",
    features: [
      "100 clients",
      "Everything in Basic",
      "Analytics dashboard",
      "PDF exports",
      "Recurring sessions",
    ],
  },
  enterprise: {
    label: "Enterprise",
    color: "text-purple-600",
    bg: "bg-purple-50",
    price: "₹5,999",
    features: [
      "Unlimited clients",
      "Everything in Pro",
      "Priority support",
      "Custom integrations",
    ],
  },
};

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [subData, setSubData] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Store the Razorpay instance so we can call open() on it after the order is ready
  const rzpRef = useRef(null);

  const sub = user?.subscription || {};

  useEffect(() => {
    getSubscriptionAPI()
      .then(({ data }) => setSubData(data.data.subscription))
      .catch(() => {});
  }, []);

  const handleUpgrade = async (plan) => {
    console.log("[Razorpay] Step 1 — button clicked, plan:", plan);

    if (!window.Razorpay) {
      console.error("[Razorpay] window.Razorpay is NOT available");
      toast.error("Payment gateway not available. Please refresh the page.");
      return;
    }
    console.log("[Razorpay] Step 2 — window.Razorpay exists ✅");

    setLoadingPlan(plan);

    let orderData;
    try {
      console.log("[Razorpay] Step 3 — calling /subscription/order...");
      const { data } = await createSubscriptionOrderAPI(plan);
      orderData = data.data;
      console.log("[Razorpay] Step 4 — order created ✅", orderData);
    } catch (err) {
      console.error(
        "[Razorpay] Step 3 FAILED:",
        err?.response?.status,
        err?.response?.data || err?.message || err,
      );
      setLoadingPlan(null);
      if (!isSessionExpired(err)) {
        toast.error(
          err.response?.data?.message || "Failed to create payment order",
        );
      } else {
        toast.error("Your session has expired. Please log in again.");
      }
      return;
    }

    console.log("[Razorpay] Step 5 — creating Razorpay instance...");
    // Build Razorpay instance with the fresh order data
    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: "Unfazed",
      description: `${PLAN_DETAILS[plan]?.label} Plan — Monthly`,
      modal: {
        ondismiss: () => {
          console.log("[Razorpay] Modal dismissed by user");
          setCheckoutOpen(false);
          setLoadingPlan(null);
        },
      },
      handler: async (response) => {
        setCheckoutOpen(false);
        setLoadingPlan(null);
        try {
          const { data: verification } = await verifySubscriptionAPI({
            ...response,
            plan,
          });
          setSubData(verification.data.subscription);
          await refreshUser();
          toast.success(`${PLAN_DETAILS[plan]?.label} plan activated! 🎉`);
        } catch (err) {
          if (!isSessionExpired(err)) {
            toast.error(
              err.response?.data?.message || "Payment verification failed",
            );
          }
        }
      },
      prefill: {
        email: user?.email || "",
        name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      },
      theme: { color: "#6366f1" },
    });

    rzpRef.current = rzp;
    setLoadingPlan(null);
    setCheckoutOpen(true);
    console.log("[Razorpay] Step 6 — calling rzp.open() now...");
    rzp.open();
    console.log("[Razorpay] Step 7 — rzp.open() called ✅");
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        "Cancel your subscription? You'll keep access until the end of the billing period.",
      )
    )
      return;
    try {
      const { data: cancellation } = await cancelSubscriptionAPI();
      setSubData(cancellation.data.subscription);
      await refreshUser();
      toast.success("Subscription cancelled");
    } catch (err) {
      if (!isSessionExpired(err)) {
        toast.error(
          err.response?.data?.message || "Failed to cancel subscription",
        );
      }
    }
  };

  const currentPlan = subData?.plan || sub.plan || "free";
  const currentStatus = subData?.status || sub.status || "trial";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Subscription
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your plan and billing
        </p>
      </div>

      {/* Checkout open banner */}
      {checkoutOpen && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-[var(--primary-light)] border border-indigo-200 rounded-[var(--radius-lg)] text-sm text-[var(--primary)]">
          <span className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Razorpay checkout is open — complete or close it to continue.
        </div>
      )}

      {/* Current plan */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Current plan</p>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`text-2xl font-bold capitalize ${PLAN_DETAILS[currentPlan]?.color}`}
              >
                {PLAN_DETAILS[currentPlan]?.label || currentPlan}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ring-1 ring-inset
                ${currentStatus === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}
              >
                {currentStatus}
              </span>
            </div>
            {subData?.endDate && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Renews {format(new Date(subData.endDate), "MMM d, yyyy")}
              </p>
            )}
          </div>
          {currentPlan !== "free" && currentStatus === "active" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500"
              onClick={handleCancel}
            >
              Cancel subscription
            </Button>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PLAN_DETAILS).map(([planKey, plan]) => {
          const isCurrent = planKey === currentPlan;
          const isLoading = loadingPlan === planKey;
          const isDisabled =
            checkoutOpen || (loadingPlan !== null && !isLoading);

          return (
            <div
              key={planKey}
              className={`bg-[var(--surface)] rounded-[var(--radius-xl)] border-2 p-6 flex flex-col transition-all duration-200
                ${isCurrent ? "border-[var(--primary)] shadow-[var(--shadow-md)]" : "border-[var(--border)] hover:border-indigo-300 hover:shadow-[var(--shadow-sm)]"}`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full self-start mb-3 ${plan.bg} ${plan.color}`}
              >
                {plan.label}
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {plan.price}
                <span className="text-sm font-normal text-[var(--text-muted)]">
                  /mo
                </span>
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                  >
                    <span className="text-[var(--success)] flex-shrink-0 mt-0.5">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <div className="text-center text-sm font-semibold text-[var(--primary)] py-2 bg-[var(--primary-light)] rounded-[var(--radius-sm)]">
                    Current plan
                  </div>
                ) : planKey === "free" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Downgrade
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    loading={isLoading}
                    disabled={isDisabled}
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
