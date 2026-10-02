import { useState } from "react";
import { Link } from "react-router-dom";

/* ── Data ───────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: "👥",
    title: "Client Management",
    desc: "Organised profiles, intake forms, and complete session history for every client.",
  },
  {
    icon: "📅",
    title: "Smart Scheduling",
    desc: "Calendar view, recurring sessions, availability slots, and automatic reminders.",
  },
  {
    icon: "📝",
    title: "Clinical Notes",
    desc: "SOAP, DAP, and free-form notes with rich text. Sign & lock when complete.",
  },
  {
    icon: "💳",
    title: "Billing & Invoices",
    desc: "Create invoices, collect payments via Razorpay, and export PDFs in one click.",
  },
  {
    icon: "🎥",
    title: "Video Sessions",
    desc: "Secure WebRTC video calls built right in — no third-party app needed.",
  },
  {
    icon: "💬",
    title: "Real-time Chat",
    desc: "Communicate with clients securely through built-in encrypted messaging.",
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    clients: "5 clients",
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Basic",
    price: "₹999",
    period: "per month",
    clients: "20 clients",
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹2,499",
    period: "per month",
    clients: "100 clients",
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "₹5,999",
    period: "per month",
    clients: "Unlimited",
    cta: "Contact us",
    highlight: false,
  },
];

const therapists = [
  {
    name: "Dr. Pankaja",
    title: "Head, Mental Wellness Centre · Gurgaon",
    exp: "15+ years · ~1,00,000 sessions",
    specialties: ["CBT", "Trauma Recovery", "Life Coaching"],
    bio: "Widely recognised as a leading psychologist and psychotherapist. Specialises in Cognitive Behavioral Therapy, trauma recovery, and life coaching with an empathetic, evidence-based approach.",
    rating: 5,
    sessions: 1000,
    initials: "PK",
    color: "bg-violet-100 text-violet-700",
    badge: "Top Rated",
    badgeColor: "bg-violet-600",
  },
  {
    name: "Dr. (Prof) R. K. Suri",
    title: "Mentor Director, TalktoAngel · Delhi/NCR",
    exp: "40+ years clinical experience",
    specialties: ["Executive Coaching", "Clinical Psychology", "Complex Cases"],
    bio: "Formally ranked as a top clinical psychologist. Head of Psychowellness Center, specialising in advanced therapeutic interventions, executive coaching, and complex clinical cases.",
    rating: 5,
    sessions: 2000,
    initials: "RS",
    color: "bg-blue-100 text-blue-700",
    badge: "Expert",
    badgeColor: "bg-blue-600",
  },
  {
    name: "Dr. Shraboni Nandi",
    title: "Senior Psychologist · Delhi & Gurgaon",
    exp: "20+ years · RCI Licensed · PhD",
    specialties: [
      "CBT",
      "Relationship Counseling",
      "Child Psychology",
      "Trauma",
    ],
    bio: "A recognised expert in CBT, relationship counselling, child psychology, and trauma recovery. Known for personalised mental wellness support and long-term emotional healing strategies.",
    rating: 5,
    sessions: 1500,
    initials: "SN",
    color: "bg-emerald-100 text-emerald-700",
    badge: "PhD",
    badgeColor: "bg-emerald-600",
  },
  {
    name: "Ms. Gunjan Bhatia",
    title: "Child & Adult Psychologist · Delhi / Online",
    exp: "5+ years",
    specialties: [
      "Child Psychology",
      "ADHD",
      "Behavioral Therapy",
      "Parenting",
    ],
    bio: "Certified child and adult psychologist, highly trusted for parenting guidance and anxiety management. Known for compassionate, practical psychological support for diverse age groups.",
    rating: 5,
    sessions: 500,
    initials: "GB",
    color: "bg-amber-100 text-amber-700",
    badge: "Certified",
    badgeColor: "bg-amber-600",
  },
  {
    name: "Mrs. Ritika Dhall",
    title: "Counseling Psychologist · Online",
    exp: "Seasoned practitioner",
    specialties: [
      "Anxiety & Depression",
      "Couples Therapy",
      "PTSD",
      "Mindfulness",
    ],
    bio: "Specialises in anxiety, depression, couples therapy, and PTSD. Utilises CBT, mindfulness, and Acceptance & Commitment Therapy (ACT) to transform challenges through structured frameworks.",
    rating: 5,
    sessions: 800,
    initials: "RD",
    color: "bg-rose-100 text-rose-700",
    badge: "ACT",
    badgeColor: "bg-rose-600",
  },
];

const testimonials = [
  {
    text: "Unfazed has completely transformed how I manage my practice. The clinical notes and billing in one place saves me hours every week.",
    name: "Dr. Meera S.",
    role: "Clinical Psychologist, Mumbai",
  },
  {
    text: "The video sessions feature means I can see clients from anywhere. The scheduling system has eliminated all the back-and-forth over appointments.",
    name: "Dr. Arjun P.",
    role: "Therapist, Bangalore",
  },
  {
    text: "Finally a platform made for Indian therapists. Razorpay integration, INR billing, and a clean dashboard — exactly what I needed.",
    name: "Ms. Divya R.",
    role: "Counseling Psychologist, Delhi",
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const Stars = ({ count = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <svg
        key={i}
        className="w-4 h-4 text-amber-400 fill-current"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

/* ── Page ─────────────────────────────────────────────────────────────────── */
const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
  <div
    className="min-h-screen bg-white text-slate-900"
    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
  >
    {/* ── Navbar ──────────────────────────────────────────────────────── */}
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="font-bold text-xl text-indigo-600 tracking-tight">
            Unfazed
          </span>
        </div>
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-500">
          <a
            href="#therapists"
            className="hover:text-indigo-600 transition-colors"
          >
            Our Therapists
          </a>
          <a
            href="#features"
            className="hover:text-indigo-600 transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="hover:text-indigo-600 transition-colors"
          >
            Pricing
          </a>
          <Link to="/about" className="hover:text-indigo-600 transition-colors">
            About
          </Link>
          <Link
            to="/contact"
            className="hover:text-indigo-600 transition-colors"
          >
            Contact
          </Link>
          <Link
            to="/join-as-therapist"
            className="hover:text-indigo-600 transition-colors"
          >
            Join as Therapist
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            Get started free
          </Link>
          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          className="lg:hidden border-t border-slate-100 bg-white px-6 py-3 shadow-lg"
        >
          <div className="mx-auto flex max-w-6xl flex-col text-sm font-medium text-slate-600">
            <a href="#therapists" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 hover:bg-indigo-50 hover:text-indigo-700">Our Therapists</a>
            <a href="#features" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 hover:bg-indigo-50 hover:text-indigo-700">Features</a>
            <a href="#pricing" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 hover:bg-indigo-50 hover:text-indigo-700">Pricing</a>
            <Link to="/about" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 hover:bg-indigo-50 hover:text-indigo-700">About</Link>
            <Link to="/contact" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 hover:bg-indigo-50 hover:text-indigo-700">Contact</Link>
            <Link to="/join-as-therapist" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 hover:bg-indigo-50 hover:text-indigo-700">Join as Therapist</Link>
          </div>
        </nav>
      )}
    </header>

    {/* ── Hero ─────────────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-6 border border-indigo-100">
          🧠 India's trusted mental wellness platform
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
          Your mental health
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            deserves the best.
          </span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect with India's top certified therapists and psychologists. Book
          a session, manage your wellness journey, and heal — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#therapists"
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base transition-colors shadow-lg shadow-indigo-200"
          >
            Find your therapist →
          </a>
          <Link
            to="/register"
            className="px-8 py-3.5 border-2 border-slate-200 hover:border-indigo-200 text-slate-700 font-semibold rounded-xl text-base transition-colors bg-white"
          >
            Start for free
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Trusted by 500+ therapists · Safe & confidential
        </p>

        {/* Stats bar */}
        <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            ["500+", "Therapists"],
            ["50,000+", "Sessions"],
            ["4.9★", "Avg. Rating"],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-extrabold text-indigo-600">{n}</p>
              <p className="text-xs text-slate-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Trust bar ────────────────────────────────────────────────────── */}
    <section className="border-y border-slate-100 py-6 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <p className="text-center text-xs text-slate-400 font-medium uppercase tracking-widest mb-4">
          As seen in
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {["YourStory", "Inc42", "The Hindu", "NDTV", "Times of India"].map(
            (name) => (
              <span key={name} className="text-slate-400 font-bold text-sm">
                {name}
              </span>
            ),
          )}
        </div>
      </div>
    </section>

    {/* ── Therapists ───────────────────────────────────────────────────── */}
    <section
      id="therapists"
      className="py-24 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold mb-4 border border-purple-100">
            ✓ Verified & Licensed Professionals
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Meet our expert therapists
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Handpicked, RCI-licensed psychologists and certified therapists with
            proven track records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {therapists.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all group flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${t.color} flex items-center justify-center text-lg font-bold flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base">
                      {t.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold text-white ${t.badgeColor} px-2 py-0.5 rounded-full`}
                    >
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {t.title}
                  </p>
                </div>
              </div>

              {/* Rating & sessions */}
              <div className="flex items-center gap-3 mb-3">
                <Stars />
                <span className="text-xs text-slate-500">
                  {t.sessions}+ sessions
                </span>
              </div>

              {/* Experience */}
              <p className="text-xs font-medium text-indigo-600 mb-2">
                🎓 {t.exp}
              </p>

              {/* Bio */}
              <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                {t.bio}
              </p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {t.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link
                to="/register"
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all group-hover:bg-indigo-600 group-hover:text-white"
              >
                Book a session →
              </Link>
            </div>
          ))}

          {/* "More therapists" card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl border border-indigo-500 p-6 flex flex-col items-center justify-center text-center text-white">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl mb-4">
              🔍
            </div>
            <h3 className="font-bold text-lg mb-2">500+ Therapists</h3>
            <p className="text-indigo-200 text-sm mb-5 leading-relaxed">
              Find the right match for your specific needs from our growing
              network of certified professionals.
            </p>
            <Link
              to="/register"
              className="px-5 py-2 bg-white text-indigo-600 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors"
            >
              Explore all →
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 bg-indigo-50 rounded-3xl p-8 border border-indigo-100">
          <h3 className="text-xl font-bold text-slate-900 text-center mb-8">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: "🔍",
                title: "Browse therapists",
                desc: "Explore profiles, specialties, and availability",
              },
              {
                step: "2",
                icon: "📅",
                title: "Book a session",
                desc: "Pick a date and time that works for you",
              },
              {
                step: "3",
                icon: "💳",
                title: "Secure payment",
                desc: "Pay safely via Razorpay — UPI, card, netbanking",
              },
              {
                step: "4",
                icon: "🎥",
                title: "Start healing",
                desc: "Join your video session from anywhere",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl mb-3 shadow-md">
                  {s.icon}
                </div>
                <p className="font-semibold text-slate-900 text-sm mb-1">
                  {s.title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── Features ─────────────────────────────────────────────────────── */}
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Everything therapists need
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Not a generic tool — built specifically for therapy practices in
            India.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-default"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-900 text-base mb-1.5">
                {f.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Testimonials ─────────────────────────────────────────────────── */}
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-10">
          Loved by therapists across India
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <Stars />
              <p className="text-slate-600 text-sm leading-relaxed mt-3 mb-4">
                "{t.text}"
              </p>
              <div className="border-t border-slate-100 pt-3">
                <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Pricing ──────────────────────────────────────────────────────── */}
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Simple, honest pricing
          </h2>
          <p className="text-slate-500 text-lg">
            Start free. Upgrade when you grow.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 flex flex-col border-2 transition-all
                ${
                  plan.highlight
                    ? "border-indigo-500 bg-gradient-to-b from-indigo-600 to-indigo-700 shadow-xl shadow-indigo-200"
                    : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md"
                }`}
            >
              {plan.highlight && (
                <span className="text-[10px] font-bold bg-white/25 text-white rounded-full px-2 py-0.5 self-start mb-3 uppercase tracking-wider">
                  Most popular
                </span>
              )}
              <h3
                className={`font-bold text-lg ${plan.highlight ? "text-white" : "text-slate-900"}`}
              >
                {plan.name}
              </h3>
              <div className="mt-2 mb-1">
                <span
                  className={`text-3xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-xs ml-1 ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}
                >
                  /{plan.period}
                </span>
              </div>
              <p
                className={`text-sm mb-6 ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}
              >
                {plan.clients}
              </p>
              <Link
                to="/register"
                className={`mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors
                  ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ──────────────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
      <div className="relative max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to start your wellness journey?
        </h2>
        <p className="text-indigo-200 text-lg mb-8">
          Join thousands of people finding clarity, healing, and growth with
          Unfazed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="inline-block px-8 py-3.5 bg-white text-indigo-600 font-bold rounded-xl text-base hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Create free account →
          </Link>
          <a
            href="#therapists"
            className="inline-block px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-xl text-base hover:border-white transition-colors"
          >
            Browse therapists
          </a>
        </div>
      </div>
    </section>

    {/* ── Footer ───────────────────────────────────────────────────────── */}
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">U</span>
              </div>
              <span className="font-bold text-white text-lg">Unfazed</span>
            </div>
            <p className="text-sm leading-relaxed">
              India's trusted mental wellness platform, connecting people with
              certified therapists.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#therapists"
                  className="hover:text-white transition-colors"
                >
                  Our Therapists
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
            <h4 className="font-semibold text-white text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
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
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">
              For Therapists
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/join-as-therapist"
                  className="hover:text-white transition-colors"
                >
                  Join as Therapist
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  Therapist Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-white transition-colors"
                >
                  Create Account
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">
              Specialities
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                "Anxiety & Depression",
                "CBT Therapy",
                "Trauma Recovery",
                "Child Psychology",
                "Couples Therapy",
              ].map((s) => (
                <li
                  key={s}
                  className="hover:text-white transition-colors cursor-default"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm">
            Therapy practice management · Made in India 🇮🇳
          </p>
          <div className="flex flex-wrap gap-5 text-sm">
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link
              to="/join-as-therapist"
              className="hover:text-white transition-colors"
            >
              Join as Therapist
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register" className="hover:text-white transition-colors">
              Register
            </Link>
          </div>
        </div>
        <div className="text-center text-xs text-slate-600 mt-4">
          © {new Date().getFullYear()} Unfazed. Built with ❤️ for mental
          wellness.
        </div>
      </div>
    </footer>
  </div>
  );
};

export default LandingPage;
