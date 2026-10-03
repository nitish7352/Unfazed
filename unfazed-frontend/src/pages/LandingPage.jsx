import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTherapistsAPI } from "../api/therapists";
import TherapistCard from "../components/therapist/TherapistCard";
import BookingModal from "../components/booking/BookingModal";
import Spinner from "../components/common/Spinner";

const features = [
  {
    icon: "🗓️",
    title: "Smart Scheduling",
    desc: "Book, reschedule, and manage appointments with calendar sync and automated reminders.",
  },
  {
    icon: "📋",
    title: "Clinical Notes",
    desc: "SOAP, DAP, and free-form notes with digital signatures. Private or shared with clients.",
  },
  {
    icon: "💳",
    title: "Billing & Invoices",
    desc: "Generate invoices and collect payments via Razorpay — UPI, card, net banking.",
  },
  {
    icon: "🎥",
    title: "Video Sessions",
    desc: "Secure built-in video calls. No third-party app needed. Join from any device.",
  },
  {
    icon: "💬",
    title: "Real-time Chat",
    desc: "Stay connected between sessions with encrypted in-app messaging.",
  },
  {
    icon: "📊",
    title: "Practice Analytics",
    desc: "Revenue, session trends, client growth, and no-show rates at a glance.",
  },
];

const stats = [
  { n: "500+", l: "Verified Therapists" },
  { n: "50,000+", l: "Sessions Completed" },
  { n: "4.9 ★", l: "Average Rating" },
  { n: "2023", l: "Founded in India" },
];

const Stars = () => (
  <div className="flex gap-0.5" aria-label="5 out of 5 stars">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        className="w-3.5 h-3.5 text-amber-400 fill-current"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [therapistsList, setTherapistsList] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);
  const [selectedTherapistForBooking, setSelectedTherapistForBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');

  useEffect(() => {
    const loadTherapists = async () => {
      setLoadingTherapists(true);
      try {
        const { data } = await getTherapistsAPI({
          search: searchQuery || undefined,
          specialization: selectedSpec || undefined,
        });
        setTherapistsList(data.data.therapists || []);
      } catch (err) {
        console.error('Failed to load therapists', err);
        setTherapistsList([]);
      } finally {
        setLoadingTherapists(false);
      }
    };
    loadTherapists();
  }, [searchQuery, selectedSpec]);

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "#F8FAFC",
      }}
    >
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="font-bold text-lg text-slate-900">Unfazed</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {[
              ["#therapists", "Therapists"],
              ["#features", "Features"],
              ["#pricing", "Pricing"],
            ].map(([h, l]) => (
              <a
                key={h}
                href={h}
                className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {l}
              </a>
            ))}
            <Link
              to="/about"
              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Get started free
            </Link>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
            {[
              ["#therapists", "Therapists"],
              ["#features", "Features"],
              ["#pricing", "Pricing"],
            ].map(([h, l]) => (
              <a
                key={h}
                href={h}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {l}
              </a>
            ))}
            <Link
              to="/about"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              About
            </Link>
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Contact
            </Link>
            <Link
              to="/join-as-therapist"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Join as Therapist
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-white pt-16 pb-20 overflow-hidden">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, #ede9fe 0%, transparent 50%), radial-gradient(circle at 20% 80%, #dbeafe 0%, transparent 50%)",
            opacity: 0.6,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              India's most trusted mental wellness platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Mental health care
              <br />
              <span className="text-indigo-600">made simple & safe</span>
            </h1>

            <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
              Connect with India's top certified therapists. Book a session,
              manage your wellness journey, and heal — from anywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <a
                href="#therapists"
                className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-100"
              >
                Find a therapist
              </a>
              <Link
                to="/register"
                className="px-7 py-3.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Start for free →
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                "✓ 100% RCI-verified therapists",
                "✓ End-to-end encrypted sessions",
                "✓ No credit card required",
              ].map((t) => (
                <span key={t} className="text-sm text-slate-500 font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            {stats.map(({ n, l }) => (
              <div key={l} className="bg-white px-6 py-5 text-center">
                <p className="text-2xl font-extrabold text-indigo-600">{n}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <div className="bg-slate-50 border-y border-slate-100 py-5">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs text-slate-400 uppercase tracking-widest font-medium mb-4">
            Featured in
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["YourStory", "Inc42", "The Hindu", "NDTV", "Times of India"].map(
              (n) => (
                <span key={n} className="text-sm font-bold text-slate-300">
                  {n}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      {/* ── Therapists: "Find the right therapist for you" ── */}
      <section id="therapists" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mb-4">
              ✓ Verified & RCI-licensed Therapists
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              Find the right therapist for you
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Connect with qualified therapists and book a session that fits your schedule.
            </p>
          </div>

          {/* Quick Search & Filter Bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by therapist name or topic (e.g. Anxiety, Stress)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="py-2 px-3 text-xs rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none"
              >
                <option value="">All Specializations</option>
                <option value="Anxiety">Anxiety</option>
                <option value="Depression">Depression</option>
                <option value="CBT">CBT</option>
                <option value="Relationship">Relationships</option>
                <option value="Stress">Stress Management</option>
              </select>
            </div>
          </div>

          {/* Dynamic Therapist Cards */}
          {loadingTherapists ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner size="md" />
              <p className="text-xs text-slate-500">Loading verified therapists…</p>
            </div>
          ) : therapistsList.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-12 text-center max-w-md mx-auto">
              <div className="text-3xl mb-3">🌿</div>
              <p className="text-sm font-semibold text-slate-700">
                Therapists are joining Unfazed. Check back soon.
              </p>
              <Link
                to="/join-as-therapist"
                className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Join as a Therapist
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {therapistsList.slice(0, 6).map((t) => (
                <TherapistCard
                  key={t._id}
                  therapist={t}
                  onBook={(therapist) => setSelectedTherapistForBooking(therapist)}
                />
              ))}
            </div>
          )}

          {/* View All Therapists CTA */}
          <div className="mt-12 text-center">
            <Link
              to="/therapists"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl shadow-sm transition-all"
            >
              <span>View All Therapists</span>
              <span>→</span>
            </Link>
          </div>

          {/* How it works */}
          <div className="mt-16 bg-slate-50 border border-slate-100 rounded-2xl p-8 md:p-10">
            <h3 className="text-lg font-bold text-slate-900 text-center mb-8">
              How it works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  n: "1",
                  emoji: "🔍",
                  t: "Browse",
                  d: "Explore therapist profiles and specialties",
                },
                {
                  n: "2",
                  emoji: "📅",
                  t: "Book",
                  d: "Pick a date and time that works for you",
                },
                {
                  n: "3",
                  emoji: "💳",
                  t: "Pay securely",
                  d: "UPI, cards, net banking via Razorpay",
                },
                {
                  n: "4",
                  emoji: "🎥",
                  t: "Start healing",
                  d: "Join your video session from anywhere",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg mb-3 shadow-sm">
                    {s.emoji}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">
                    {s.t}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Everything therapists need
            </h2>
            <p className="text-slate-500">
              Purpose-built for therapy practices in India. Not a generic admin
              tool.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-sm hover:border-indigo-100 transition-all"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 text-sm mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            Loved by therapists across India
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                t: "Unfazed has transformed how I manage my practice. Notes, billing, and video sessions all in one place.",
                n: "Dr. Meera S.",
                r: "Clinical Psychologist, Mumbai",
              },
              {
                t: "The scheduling system eliminated all the back-and-forth. My clients love the seamless booking experience.",
                n: "Dr. Arjun P.",
                r: "Therapist, Bangalore",
              },
              {
                t: "Finally a platform built for Indian therapists. Razorpay, INR billing, and a clean dashboard I love.",
                n: "Ms. Divya R.",
                r: "Counseling Psychologist, Delhi",
              },
            ].map((t) => (
              <div
                key={t.n}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-6"
              >
                <Stars />
                <p className="text-slate-600 text-sm leading-relaxed mt-3 mb-4">
                  "{t.t}"
                </p>
                <div className="pt-3 border-t border-slate-100">
                  <p className="font-semibold text-slate-900 text-sm">{t.n}</p>
                  <p className="text-xs text-slate-400">{t.r}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Simple, honest pricing
            </h2>
            <p className="text-slate-500">
              Start free. Upgrade when you grow. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Free",
                price: "₹0",
                period: "forever",
                clients: "5 clients",
                cta: "Get started free",
                featured: false,
              },
              {
                name: "Basic",
                price: "₹999",
                period: "/mo",
                clients: "20 clients",
                cta: "Start free trial",
                featured: false,
              },
              {
                name: "Pro",
                price: "₹2,499",
                period: "/mo",
                clients: "100 clients",
                cta: "Start free trial",
                featured: true,
              },
              {
                name: "Enterprise",
                price: "₹5,999",
                period: "/mo",
                clients: "Unlimited",
                cta: "Contact us",
                featured: false,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 flex flex-col border-2 transition-all relative
                ${
                  p.featured
                    ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100"
                    : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Most popular
                  </span>
                )}
                <h3
                  className={`font-bold text-base mb-2 ${p.featured ? "text-white" : "text-slate-900"}`}
                >
                  {p.name}
                </h3>
                <div className="mb-1">
                  <span
                    className={`text-3xl font-extrabold ${p.featured ? "text-white" : "text-slate-900"}`}
                  >
                    {p.price}
                  </span>
                  <span
                    className={`text-xs ml-1 ${p.featured ? "text-indigo-200" : "text-slate-400"}`}
                  >
                    {p.period}
                  </span>
                </div>
                <p
                  className={`text-sm mb-6 ${p.featured ? "text-indigo-200" : "text-slate-400"}`}
                >
                  {p.clients}
                </p>
                <Link
                  to="/register"
                  className={`mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors
                    ${
                      p.featured
                        ? "bg-white text-indigo-600 hover:bg-indigo-50"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start your wellness journey?
          </h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            Join thousands of people finding clarity and healing with Unfazed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Create free account →
            </Link>
            <Link
              to="/join-as-therapist"
              className="px-8 py-3.5 border-2 border-indigo-400 text-white font-semibold rounded-xl hover:border-white hover:bg-indigo-700 transition-colors"
            >
              Join as therapist
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">U</span>
                </div>
                <span className="font-bold text-white">Unfazed</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                India's trusted mental wellness platform, connecting people with
                certified therapists.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="#therapists"
                    className="hover:text-white transition-colors"
                  >
                    Therapists
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/join-as-therapist"
                    className="hover:text-white transition-colors"
                  >
                    Join as Therapist
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">
                Specialities
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  "Anxiety & Depression",
                  "CBT Therapy",
                  "Trauma Recovery",
                  "Child Psychology",
                  "Couples Therapy",
                ].map((s) => (
                  <li key={s} className="text-slate-400">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Unfazed · Made with ❤️ in India 🇮🇳
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/login" className="hover:text-white transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="hover:text-white transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>

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

export default LandingPage;
