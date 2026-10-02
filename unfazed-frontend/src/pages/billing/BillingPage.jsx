import { useEffect, useState, useCallback } from "react";
import { isSessionExpired } from "../../utils/apiError";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  getInvoicesAPI,
  createRazorpayOrderAPI,
  verifyPaymentAPI,
} from "../../api/invoices";
import { useToast } from "../../components/common/Toast";
import Badge, { statusColor } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import InvoiceForm from "../../components/billing/InvoiceForm";
import { loadRazorpay } from "../../utils/razorpay";

const BillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get("clientId");
  const toast = useToast();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (clientIdFilter) params.clientId = clientIdFilter;
      const { data } = await getInvoicesAPI(params);
      setInvoices(data.data);
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, clientIdFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleRazorpayPayment = async (invoice) => {
    try {
      await loadRazorpay();
      const { data } = await createRazorpayOrderAPI(invoice._id);
      const { orderId, amount, currency, keyId } = data.data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "Unfazed",
        description: `Invoice ${invoice.invoiceNumber}`,
        handler: async (response) => {
          try {
            await verifyPaymentAPI(invoice._id, response);
            toast.success("Payment verified!");
            fetchInvoices();
          } catch (err) {
            if (!isSessionExpired(err))
              toast.error("Payment verification failed");
          }
        },
        prefill: {
          email: invoice.client?.email || "",
          name: `${invoice.client?.firstName || ""} ${invoice.client?.lastName || ""}`,
        },
        theme: { color: "#4F46E5" },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    }
  };

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total, 0);
  const totalPending = invoices
    .filter((i) => ["sent", "overdue"].includes(i.status))
    .reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Billing &amp; Invoices
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {invoices.length} total
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Create invoice</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-[var(--radius)] flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Total received
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{totalPaid.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-[var(--radius)] flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Pending payment
            </p>
            <p className="text-2xl font-bold text-amber-600">
              ₹{totalPending.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white text-[var(--text-primary)] appearance-none"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center h-48 items-center">
            <Spinner size="lg" />
          </div>
        ) : invoices.length === 0 ? (
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
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No invoices yet
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs">
              Create your first invoice to start tracking payments.
            </p>
            <Button className="mt-5" onClick={() => setShowForm(true)}>
              Create first invoice
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono font-medium text-[var(--primary)]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                      {inv.client?.firstName} {inv.client?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {format(new Date(inv.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                      ₹{inv.total.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        label={inv.status}
                        color={statusColor(inv.status)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {["sent", "overdue", "draft"].includes(inv.status) && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRazorpayPayment(inv)}
                        >
                          Pay now
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Create invoice"
        size="lg"
      >
        <InvoiceForm
          defaultClientId={clientIdFilter}
          onSuccess={() => {
            setShowForm(false);
            fetchInvoices();
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
};

export default BillingPage;
