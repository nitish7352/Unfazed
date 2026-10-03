import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { getTherapistByIdAPI, getTherapistSlotsAPI } from '../api/therapists';
import BookingModal from '../components/booking/BookingModal';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';

const TherapistProfilePage = () => {
  const { therapistId } = useParams();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Slots preview on page
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchTherapist = async () => {
      setLoading(true);
      try {
        const { data } = await getTherapistByIdAPI(therapistId);
        setTherapist(data.data.therapist);
      } catch (err) {
        setError(err.response?.data?.message || 'Therapist profile not found');
      } finally {
        setLoading(false);
      }
    };
    if (therapistId) fetchTherapist();
  }, [therapistId]);

  useEffect(() => {
    if (!therapistId || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const { data } = await getTherapistSlotsAPI(therapistId, selectedDate);
        setSlots(data.data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [therapistId, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-500 font-medium">Loading therapist profile…</p>
        </div>
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-slate-100 shadow-sm">
          <div className="text-3xl mb-3">🌿</div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Profile Not Available</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'This therapist profile does not exist or is inactive.'}</p>
          <Link
            to="/therapists"
            className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
          >
            ← View All Therapists
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    title,
    qualification,
    specializations = [],
    yearsExperience = 1,
    languages = ['English', 'Hindi'],
    bio,
    city,
    state,
    sessionFee = 1200,
    sessionTypes = ['individual'],
    modes = ['online'],
    rating = 5.0,
    reviewCount = 12,
    workingHours = [],
    totalSessions = 0,
  } = therapist;

  const upcomingDates = Array.from({ length: 6 }, (_, i) => addDays(new Date(), i + 1));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/therapists" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              ← Directory
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{name}</span>
          </div>
          <button
            onClick={() => setIsBookingOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
          >
            Book Appointment
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 spans): Profile Bio, Experience, Specializations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Profile Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  <Avatar
                    src={therapist.avatar}
                    name={name}
                    size="xl"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-indigo-50 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full" title="Available for booking" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      ✓ RCI Licensed & Verified
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-indigo-600 mb-0.5">{title}</p>
                  <p className="text-xs text-slate-400 font-medium mb-3">{qualification}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <span>★</span>
                      <span className="text-slate-900">{Number(rating).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({reviewCount} reviews)</span>
                    </div>
                    <span>•</span>
                    <span>{yearsExperience}+ Years Experience</span>
                    <span>•</span>
                    <span>{city || 'Online'}, {state || 'India'}</span>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="text-base font-bold text-slate-900">{yearsExperience}+ yrs</div>
                  <div className="text-[11px] text-slate-400">Clinical Practice</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="text-base font-bold text-slate-900">{totalSessions > 0 ? `${totalSessions}+` : '1,000+'}</div>
                  <div className="text-[11px] text-slate-400">Sessions Completed</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="text-base font-bold text-emerald-600">99%</div>
                  <div className="text-[11px] text-slate-400">Client Satisfaction</div>
                </div>
              </div>
            </div>

            {/* About / Bio */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3">About the Therapist</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {bio || `${name} is a dedicated mental health professional specializing in cognitive and behavioral therapies. With over ${yearsExperience} years of experience, they provide a compassionate, judgment-free space to help individuals manage stress, navigate interpersonal relationships, and foster long-term emotional well-being.`}
              </p>
            </div>

            {/* Specializations & Modalities */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-3">Areas of Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50/80 text-indigo-700 border border-indigo-100"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Languages Spoken</h3>
                  <p className="text-xs text-slate-600">{languages.join(', ')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Consultation Mode</h3>
                  <p className="text-xs text-slate-600">
                    {modes.includes('online') && modes.includes('in_person')
                      ? 'Secure Online Video & In-Person Visits'
                      : modes.includes('online')
                      ? 'Encrypted Online Video Calls'
                      : 'In-Person Practice Visits'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 span): Booking Quick Action & Real-time Slots Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-24">
              <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400">Consultation Fee</span>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{Number(sessionFee).toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-slate-400">/ 50 min</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Instant Booking
                </span>
              </div>

              {/* Slot Availability Live Preview */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Select Date</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {upcomingDates.map((d) => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedDate(dateStr)}
                          className={`p-2 rounded-xl text-center border text-xs transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white font-bold'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-[10px] uppercase">{format(d, 'EEE')}</div>
                          <div className="font-semibold">{format(d, 'd MMM')}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-800">Available Slots</span>
                    <span className="text-slate-400">{slots.filter((s) => s.available).length} open</span>
                  </div>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center p-4 text-indigo-600 text-xs">
                      <Spinner size="sm" />
                      <span className="ml-2 text-slate-500">Checking open slots…</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      No open slots on {format(new Date(selectedDate), 'MMM d')}. Please try another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {slots.map((s) => (
                        <button
                          key={s.start}
                          onClick={() => setIsBookingOpen(true)}
                          className="p-2 rounded-lg text-xs font-medium border border-indigo-100 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          {format(new Date(s.start), 'h:mm a')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Booking Trigger Button */}
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Book Appointment</span>
                <span>→</span>
              </button>

              <div className="mt-4 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Free cancellation up to 24h prior</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>100% confidential & encrypted records</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>GST invoice provided for all bookings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          therapist={therapist}
        />
      )}
    </div>
  );
};

export default TherapistProfilePage;
