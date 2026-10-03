import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getMyBookingsAPI, updateBookingStatusAPI, createBookingPaymentOrderAPI, verifyBookingPaymentAPI } from '../../api/bookings';
import { getInvoicesAPI } from '../../api/invoices';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { loadRazorpay } from '../../utils/razorpay';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import BookingModal from '../booking/BookingModal';

const ClientDashboardView = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('appointments'); // appointments, therapists, billing
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rebookingTherapist, setRebookingTherapist] = useState(null);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, invoicesRes] = await Promise.all([
        getMyBookingsAPI(),
        getInvoicesAPI({ limit: 50 }),
      ]);
      setBookings(bookingsRes.data.data.bookings || []);
      setInvoices(invoicesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load client dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await updateBookingStatusAPI(bookingId, 'cancelled', 'Cancelled by client');
      toast.success('Appointment cancelled');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handlePayInvoice = async (booking) => {
    setProcessingPaymentId(booking._id);
    try {
      await loadRazorpay();
      const { data } = await createBookingPaymentOrderAPI(booking._id);
      const { orderId, amount, currency, keyId } = data.data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'Unfazed Therapy',
        description: `Session with Dr. ${booking.therapist?.firstName}`,
        handler: async (response) => {
          try {
            await verifyBookingPaymentAPI(booking._id, response);
            toast.success('Payment verified successfully!');
            fetchData();
          } catch (err) {
            toast.error('Payment verification failed.');
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone || '',
        },
        theme: { color: '#4F46E5' },
      });
      rzp.open();
    } catch (err) {
      toast.error('Could not initiate Razorpay payment.');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Extract unique therapists client has previously booked
  const myTherapists = [];
  const therapistIdSet = new Set();
  bookings.forEach((b) => {
    if (b.therapist && !therapistIdSet.has(b.therapist._id)) {
      therapistIdSet.add(b.therapist._id);
      myTherapists.push({
        ...b.therapist,
        lastSessionDate: b.startTime,
        sessionFee: b.fee,
        mode: b.mode,
      });
    }
  });

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.startTime) >= new Date() && b.status !== 'cancelled' && b.status !== 'rejected'
  );
  const pendingInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">Loading your appointments & records…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}, {user?.firstName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Client Portal
          </p>
        </div>
        <Link to="/therapists">
          <Button>+ Book New Appointment</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
            📅
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Upcoming Sessions</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{upcomingBookings.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            ✓
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{bookings.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            💳
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Payments</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{pendingInvoices.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            🩺
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">My Therapists</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{myTherapists.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-6 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>My Appointments</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold">{bookings.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('therapists')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'therapists'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>My Therapists</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold">{myTherapists.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'billing'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Billing & Invoices</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold">{invoices.length}</span>
        </button>
      </div>

      {/* TAB CONTENT 1: My Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto mb-3">
                🗓️
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No appointments yet</h3>
              <p className="text-xs text-slate-500 mb-5">
                Explore verified therapists on Unfazed and schedule your first session.
              </p>
              <Link to="/therapists">
                <Button>Browse Therapists</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const tName = `Dr. ${booking.therapist?.firstName || ''} ${booking.therapist?.lastName || ''}`;
                const isUpcoming = new Date(booking.startTime) >= new Date();
                const canJoin = booking.mode === 'online' && booking.session?.joinLink && booking.status === 'confirmed';

                return (
                  <div
                    key={booking._id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={booking.therapist?.avatar}
                        name={tName}
                        size="md"
                        className="w-12 h-12 rounded-xl ring-2 ring-indigo-50"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{tName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            booking.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : booking.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : booking.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {booking.status}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            booking.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium mt-1">
                          📅 {format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy · h:mm a')}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
                          {booking.sessionType} Therapy · {booking.duration} mins · {booking.mode === 'online' ? 'Online Video' : 'In-Person'} · ₹{booking.fee}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                      {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={processingPaymentId === booking._id}
                          onClick={() => handlePayInvoice(booking)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                        >
                          {processingPaymentId === booking._id ? 'Connecting…' : 'Pay ₹' + booking.fee}
                        </button>
                      )}

                      {canJoin && (
                        <Link
                          to={booking.session.joinLink}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                        >
                          <span>🎥 Join Call</span>
                        </Link>
                      )}

                      {isUpcoming && booking.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking._id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      )}

                      <Link
                        to={`/therapists/${booking.therapist?._id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        Therapist Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: My Therapists */}
      {activeTab === 'therapists' && (
        <div>
          {myTherapists.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs">
              <p className="text-xs text-slate-500">You haven't booked any therapists yet.</p>
              <Link to="/therapists" className="mt-4 inline-block">
                <Button>Discover Therapists</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTherapists.map((t) => (
                <div key={t._id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar
                      src={t.avatar}
                      name={`Dr. ${t.firstName} ${t.lastName}`}
                      size="md"
                      className="w-12 h-12 rounded-xl ring-2 ring-indigo-50"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Dr. {t.firstName} {t.lastName}</h4>
                      <p className="text-xs text-slate-500">{t.email}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">₹{t.sessionFee} / session</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    <Link
                      to={`/therapists/${t._id}`}
                      className="text-center py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => setRebookingTherapist(t)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Book Again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: Billing & Invoices */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs">
              <p className="text-xs text-slate-500">No invoices generated yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Therapist</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3.5 px-4">
                          {inv.therapist ? `Dr. ${inv.therapist.firstName} ${inv.therapist.lastName}` : 'Unfazed'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate">
                          {inv.lineItems?.[0]?.description || 'Therapy Session'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{format(new Date(inv.createdAt), 'MMM d, yyyy')}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">₹{inv.total}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rebooking Modal */}
      {rebookingTherapist && (
        <BookingModal
          isOpen={!!rebookingTherapist}
          onClose={() => {
            setRebookingTherapist(null);
            fetchData();
          }}
          therapist={rebookingTherapist}
        />
      )}
    </div>
  );
};

export default ClientDashboardView;
