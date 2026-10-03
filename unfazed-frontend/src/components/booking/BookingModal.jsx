import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { getTherapistSlotsAPI } from '../../api/therapists';
import { createBookingAPI, createBookingPaymentOrderAPI, verifyBookingPaymentAPI } from '../../api/bookings';
import { loadRazorpay } from '../../utils/razorpay';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';

const BookingModal = ({ isOpen, onClose, therapist }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessionType, setSessionType] = useState('individual');
  const [mode, setMode] = useState('online');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [payingRazorpay, setPayingRazorpay] = useState(false);

  // Available session types
  const sessionTypes = therapist?.sessionTypes?.length
    ? therapist.sessionTypes
    : ['individual', 'couples', 'family', 'consultation'];

  // Fetch slots whenever therapist or selectedDate changes
  useEffect(() => {
    if (!isOpen || !therapist?._id || !selectedDate) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const { data } = await getTherapistSlotsAPI(
          therapist._id,
          selectedDate,
          therapist.defaultSessionDuration || 50
        );
        if (isMounted) {
          setSlots(data.data.slots || []);
        }
      } catch (err) {
        if (isMounted) setSlots([]);
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => { isMounted = false; };
  }, [isOpen, therapist?._id, selectedDate]);

  if (!isOpen || !therapist) return null;

  const therapistName = therapist.name || `Dr. ${therapist.firstName} ${therapist.lastName}`;
  const fee = therapist.sessionFee || therapist.defaultSessionRate || 1200;

  // Next 7 days for quick date selection
  const upcomingDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1));

  const handleConfirmBooking = async (payImmediately = false) => {
    if (!user) return;
    if (!selectedSlot) {
      toast.error('Please select an available appointment time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        therapistId: therapist._id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.start,
        duration: therapist.defaultSessionDuration || 50,
        sessionType,
        mode,
        notes: message,
      };

      const { data } = await createBookingAPI(payload);
      const bookingData = data.data.booking;
      const invoiceData = data.data.invoice;

      if (payImmediately) {
        // Trigger Razorpay payment flow
        setPayingRazorpay(true);
        try {
          await loadRazorpay();
          const orderRes = await createBookingPaymentOrderAPI(bookingData._id);
          const { orderId, amount, currency, keyId } = orderRes.data.data;

          const rzp = new window.Razorpay({
            key: keyId,
            amount,
            currency,
            order_id: orderId,
            name: 'Unfazed Therapy',
            description: `Session with ${therapistName}`,
            handler: async (response) => {
              try {
                const verifyRes = await verifyBookingPaymentAPI(bookingData._id, response);
                toast.success('Payment completed & booking confirmed!');
                setConfirmedBooking({
                  ...bookingData,
                  paymentStatus: 'paid',
                  status: 'confirmed',
                  invoice: verifyRes.data.data.invoice || invoiceData,
                });
                setStep(5);
              } catch (err) {
                toast.error('Payment verification failed.');
                setConfirmedBooking({ ...bookingData, invoice: invoiceData });
                setStep(5);
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
          toast.error('Unable to initiate Razorpay checkout.');
          setConfirmedBooking({ ...bookingData, invoice: invoiceData });
          setStep(5);
        } finally {
          setPayingRazorpay(false);
        }
      } else {
        setConfirmedBooking({ ...bookingData, invoice: invoiceData });
        setStep(5);
        toast.success('Appointment booked successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment. Please try another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Therapist', 'Date & Time', 'Details', 'Payment', 'Confirmation'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
            <p className="text-xs text-slate-500">Fast, confidential, and secure</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 5-Step Progress Indicator */}
        <div className="px-6 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between">
            {stepLabels.map((lbl, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isDone = step > stepNum;
              return (
                <div key={lbl} className="flex items-center gap-1.5 text-xs">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span
                    className={`hidden sm:inline font-medium ${
                      isActive ? 'text-indigo-600' : isDone ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {lbl}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: Therapist Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <Avatar
                  src={therapist.avatar}
                  name={therapistName}
                  size="lg"
                  className="w-16 h-16 rounded-2xl ring-2 ring-indigo-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{therapistName}</h3>
                  <p className="text-xs text-indigo-600 font-medium">{therapist.title || 'Clinical Psychologist'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{therapist.qualification || 'M.Phil Clinical Psychology'}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="text-amber-500 font-bold">★ {therapist.rating || '5.0'}</span>
                    <span>•</span>
                    <span>₹{fee} / session</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Session Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {sessionTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSessionType(t)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium capitalize transition-all ${
                        sessionType === t
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {t} Therapy
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('online')}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      mode === 'online'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    🎥 Online Video Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('in_person')}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      mode === 'in_person'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    📍 In-Person Clinic
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                >
                  Continue to Date & Time →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Date & Time Picker */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Choose Date</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
                  {upcomingDates.map((d) => {
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-sm'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="text-[10px] uppercase">{format(d, 'EEE')}</div>
                        <div className="text-sm font-semibold mt-0.5">{format(d, 'd')}</div>
                        <div className="text-[9px]">{format(d, 'MMM')}</div>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">Available Time Slots</label>
                  <span className="text-[11px] text-slate-400">
                    {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="flex items-center justify-center p-8 text-indigo-600">
                    <Spinner size="md" />
                    <span className="text-xs ml-2 text-slate-500">Checking therapist availability…</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-amber-50/70 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800">No open slots on this date</p>
                    <p className="text-[11px] text-amber-600 mt-1">Please select another date above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.start === slot.start;
                      const timeStr = format(new Date(slot.start), 'h:mm a');
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-md'
                              : slot.available
                              ? 'border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40 bg-white'
                              : 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                >
                  Continue to Details →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Client Details & Reason */}
          {step === 3 && (
            <div className="space-y-5">
              {!user ? (
                /* AUTH REQUIRED GUARD */
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl">
                    🔒
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Account Required to Book</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Please log in or create a client account to confirm your appointment.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      to="/login"
                      state={{ redirect: `/therapists/${therapist._id}` }}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Log in
                    </Link>
                    <Link
                      to={`/register?role=client`}
                      state={{ redirect: `/therapists/${therapist._id}` }}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    >
                      Create Client Account
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <p className="font-semibold text-slate-800">Booking as:</p>
                    <p className="text-slate-600">{user.firstName} {user.lastName} ({user.email})</p>
                    {user.phone && <p className="text-slate-500">Phone: {user.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Reason for visit or message for therapist (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="e.g. Dealing with work stress, seeking guidance on anxiety management..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  ← Back
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                  >
                    Review & Confirm →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Booking Summary & Payment */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-slate-400">Therapist:</span>
                  <span className="font-semibold text-slate-800">{therapistName}</span>

                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">{format(new Date(selectedDate), 'dd MMMM yyyy')}</span>

                  <span className="text-slate-400">Time:</span>
                  <span className="font-semibold text-indigo-600">
                    {selectedSlot ? format(new Date(selectedSlot.start), 'hh:mm a') : ''}
                  </span>

                  <span className="text-slate-400">Session Type:</span>
                  <span className="font-semibold text-slate-800 capitalize">{sessionType} Therapy</span>

                  <span className="text-slate-400">Mode:</span>
                  <span className="font-semibold text-slate-800 capitalize">{mode === 'online' ? 'Online Video' : 'In-Person'}</span>

                  <span className="text-slate-400">Session Fee:</span>
                  <span className="font-extrabold text-base text-slate-900">₹{fee}</span>
                </div>
              </div>

              {/* Payment Note */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800">
                💳 Secure Razorpay checkout available. You can pay online now or receive an invoice to pay later.
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 text-center"
                >
                  ← Back
                </button>
                <div className="flex-1 flex gap-2">
                  <button
                    type="button"
                    disabled={submitting || payingRazorpay}
                    onClick={() => handleConfirmBooking(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {submitting ? 'Booking…' : 'Book & Pay Later'}
                  </button>
                  <button
                    type="button"
                    disabled={submitting || payingRazorpay}
                    onClick={() => handleConfirmBooking(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-colors"
                  >
                    {payingRazorpay ? 'Processing…' : 'Pay Now with Razorpay'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Booking Confirmation */}
          {step === 5 && confirmedBooking && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl animate-bounce">
                ✓
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Appointment Booked Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  A confirmation notification and invoice have been prepared for your session.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Therapist:</span>
                  <span className="font-semibold text-slate-800">{therapistName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="font-semibold text-indigo-600">
                    {format(new Date(confirmedBooking.startTime), 'dd MMM yyyy, h:mm a')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session Type:</span>
                  <span className="font-semibold text-slate-800 capitalize">{confirmedBooking.sessionType} Therapy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-bold text-slate-900">₹{confirmedBooking.fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Booking ID:</span>
                  <span className="font-mono text-slate-600">{confirmedBooking._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {confirmedBooking.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment:</span>
                  <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    confirmedBooking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {confirmedBooking.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard');
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard#invoices');
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  View Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
