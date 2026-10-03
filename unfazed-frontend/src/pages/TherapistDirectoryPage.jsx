import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTherapistsAPI } from '../api/therapists';
import TherapistCard from '../components/therapist/TherapistCard';
import BookingModal from '../components/booking/BookingModal';
import Spinner from '../components/common/Spinner';

const TherapistDirectoryPage = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTherapistForBooking, setSelectedTherapistForBooking] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [mode, setMode] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [language, setLanguage] = useState('');

  const fetchTherapists = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (specialization) params.specialization = specialization;
      if (mode) params.mode = mode;
      if (sessionType) params.sessionType = sessionType;
      if (language) params.language = language;

      if (priceRange === 'under_1000') {
        params.maxPrice = 1000;
      } else if (priceRange === '1000_1500') {
        params.minPrice = 1000;
        params.maxPrice = 1500;
      } else if (priceRange === '1500_2500') {
        params.minPrice = 1500;
        params.maxPrice = 2500;
      } else if (priceRange === 'above_2500') {
        params.minPrice = 2500;
      }

      const { data } = await getTherapistsAPI(params);
      setTherapists(data.data.therapists || []);
    } catch (err) {
      console.error('Failed to load therapists', err);
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, [specialization, mode, sessionType, priceRange, language]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTherapists();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSpecialization('');
    setMode('');
    setSessionType('');
    setPriceRange('');
    setLanguage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              U
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">Unfazed</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600"
            >
              Sign in
            </Link>
            <Link
              to="/register?role=client"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              Client Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-3">
            Verified Therapists & Counselors
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Find the right therapist for you
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            Connect with qualified therapists and book a session that fits your schedule.
          </p>
        </div>

        {/* Search & Filters Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Search Input Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by therapist name, expertise, or keywords…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Search
              </button>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Specialization</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-slate-700 bg-white"
                >
                  <option value="">All Specializations</option>
                  <option value="Anxiety">Anxiety</option>
                  <option value="Depression">Depression</option>
                  <option value="CBT">CBT</option>
                  <option value="Trauma">Trauma & PTSD</option>
                  <option value="Relationship">Relationships</option>
                  <option value="Child">Child & Adolescent</option>
                  <option value="Stress">Stress Management</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-slate-700 bg-white"
                >
                  <option value="">All Modes</option>
                  <option value="online">Online Video</option>
                  <option value="in_person">In-Person</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Session Type</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-slate-700 bg-white"
                >
                  <option value="">All Types</option>
                  <option value="individual">Individual</option>
                  <option value="couples">Couples</option>
                  <option value="family">Family</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-slate-700 bg-white"
                >
                  <option value="">All Prices</option>
                  <option value="under_1000">Under ₹1,000</option>
                  <option value="1000_1500">₹1,000 - ₹1,500</option>
                  <option value="1500_2500">₹1,500 - ₹2,500</option>
                  <option value="above_2500">Above ₹2,500</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-slate-700 bg-white"
                >
                  <option value="">All Languages</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Bengali">Bengali</option>
                </select>
              </div>
            </div>

            {(search || specialization || mode || sessionType || priceRange || language) && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Filters applied
                </span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Therapists Grid / Loading / Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner size="lg" />
            <p className="text-xs text-slate-500">Loading verified therapists…</p>
          </div>
        ) : therapists.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto mb-4">
              🌿
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Therapists are joining Unfazed</h3>
            <p className="text-xs text-slate-500 mb-6">
              Check back soon or broaden your search criteria to find available mental health professionals.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {therapists.map((therapist) => (
              <TherapistCard
                key={therapist._id}
                therapist={therapist}
                onBook={(t) => setSelectedTherapistForBooking(t)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedTherapistForBooking && (
        <BookingModal
          isOpen={!!selectedTherapistForBooking}
          onClose={() => setSelectedTherapistForBooking(null)}
          therapist={selectedTherapistForBooking}
        />
      )}
    </div>
  );
};

export default TherapistDirectoryPage;
