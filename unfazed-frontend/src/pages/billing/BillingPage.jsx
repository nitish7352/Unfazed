import { useEffect, useState, useCallback } from 'react';
import { isSessionExpired } from '../../utils/apiError';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { getInvoicesAPI, createRazorpayOrderAPI, verifyPaymentAPI } from '../../api/invoices';
import { useToast } from '../../components/common/Toast';
import Badge, { statusColor } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import InvoiceForm from '../../components/billing/InvoiceForm';
import { loadRazorpay } from '../../utils/razorpay';

const BillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('clientId');
  const toast = useToast();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter)   params.status   = statusFilter;
      if (clientIdFilter) params.clientId = clientIdFilter;
      const { data } = await getInvoicesAPI(params);
      setInvoices(data.data);
    } catch (err) { if (!isSessionExpired(err)) toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [statusFilter, clientIdFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

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
        name: 'Unfazed',
        description: `Invoice ${invoice.invoiceNumber}`,
        handler: async (response) => {
          try {
            await verifyPaymentAPI(invoice._id, response);
            toast.success('Payment verified!');
            fetchInvoices();
          } catch (err) { if (!isSessionExpired(err)) toast.error('Payment verification failed'); }
        },
        prefill: {
          email: invoice.client?.email || '',
          name:  `${invoice.client?.firstName || ''} ${invoice.client?.lastName || ''}`,
        },
        theme: { color: '#6366f1' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const totalPaid    = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter((i) => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Billing & Invoices</h2>
          <p className="text-sm text-slate-500">{invoices.length} total</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Create invoice</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total received</p>
          <p className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Pending payment</p>
          <p className="text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center h-48 items-center"><Spinner size="lg" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">No invoices found.</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>Create first invoice</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {inv.client?.firstName} {inv.client?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(inv.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      ₹{inv.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge label={inv.status} color={statusColor(inv.status)} />
                    </td>
                    <td className="px-6 py-4">
                      {['sent', 'overdue', 'draft'].includes(inv.status) && (
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

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create invoice" size="lg">
        <InvoiceForm
          defaultClientId={clientIdFilter}
          onSuccess={() => { setShowForm(false); fetchInvoices(); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
};

export default BillingPage;
