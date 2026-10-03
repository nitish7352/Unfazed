import { Link } from 'react-router-dom';

const team = [
  {
    name: 'Nitish Kumar',
    role: 'Co-Founder & CEO',
    bio: 'Entrepreneurship and finance enthusiast. Founded Unfazed in 2023 after witnessing the mental health challenges of friends and family. Passionate about making therapy accessible to every Indian.',
    initials: 'AA',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    name: 'Wajid',
    role: 'Co-Founder & COO',
    bio: 'Co-founded Unfazed in May 2023. Drives operations and therapist partnerships. Committed to building a platform where every person feels safe seeking help.',
    initials: 'JK',
    color: 'bg-purple-100 text-purple-700',
  },
];

const values = [
  { icon: '🧠', title: 'Mental Wellness First',     desc: 'Every decision we make puts the mental health of our users at the centre.' },
  { icon: '🔒', title: 'Privacy & Confidentiality', desc: 'All sessions and data are fully encrypted. What you share stays between you and your therapist.' },
  { icon: '✅', title: 'Verified Professionals',    desc: 'Every therapist on Unfazed is RCI-licensed and background-verified before joining.' },
  { icon: '💛', title: 'Compassion Without Judgment', desc: 'We believe every person deserves empathy, dignity, and a safe space to heal.' },
  { icon: '🇮🇳', title: 'Built for India',           desc: 'Designed for Indian therapists and clients — INR billing, regional languages, and local context.' },
  { icon: '🚀', title: 'Constant Innovation',        desc: 'We keep improving the platform based on therapist and client feedback every week.' },
];

const milestones = [
  { year: '2023', event: 'Unfazed founded in Kanpur by Aman Agarwal & Jasneet Kaur' },
  { year: '2023', event: 'First 10 therapists onboarded · 100 sessions completed' },
  { year: '2024', event: '500+ sessions · Razorpay integration · Video sessions launched' },
  { year: '2024', event: 'Featured on YourStory · 50+ certified therapists' },
  { year: '2025', event: 'Clinical notes, billing & analytics launched for therapist dashboard' },
  { year: '2026', event: '1,00,000+ sessions milestone · Real-time chat · Module 6 live' },
];

const AboutPage = () => (
  <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

    {/* ── Navbar ── */}
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="font-bold text-xl text-indigo-600">Unfazed</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <Link to="/"                  className="hover:text-indigo-600 transition-colors">Home</Link>
          <Link to="/about"             className="text-indigo-600 font-semibold">About</Link>
          <Link to="/contact"           className="hover:text-indigo-600 transition-colors">Contact</Link>
          <Link to="/join-as-therapist" className="hover:text-indigo-600 transition-colors">Join as Therapist</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login"    className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5">Sign in</Link>
          <Link to="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">Get started</Link>
        </div>
      </div>
    </header>

    {/* ── Hero ── */}
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-16">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full opacity-30 blur-3xl pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-5 border border-indigo-100">
          🧠 Our Story
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
          Making mental health care<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            accessible to every Indian
          </span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Unfazed was born from a simple belief — that everyone deserves access to quality mental health support,
          without stigma, without barriers, and without confusion.
        </p>
      </div>
    </section>

    {/* ── Mission ── */}
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-4">
              We started Unfazed in May 2023 in Kanpur, after seeing how difficult it was for people
              to find trusted, affordable, and accessible mental health support in India.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Today, Unfazed connects clients with certified psychologists and therapists across India —
              through video sessions, real-time chat, and a beautifully simple practice management platform
              that helps therapists focus on what matters most: their clients.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We are India's fastest-growing mental health platform, trusted by therapists and clients alike
              for our empathetic, evidence-based approach to wellness.
            </p>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: '2023',    l: 'Founded',             c: 'bg-indigo-50 text-indigo-700' },
              { n: '500+',    l: 'Therapists',           c: 'bg-purple-50 text-purple-700' },
              { n: '50,000+', l: 'Sessions Completed',   c: 'bg-emerald-50 text-emerald-700' },
              { n: '4.9 ★',   l: 'Average Rating',       c: 'bg-amber-50 text-amber-700' },
              { n: '100%',    l: 'RCI Verified',          c: 'bg-blue-50 text-blue-700' },
              { n: '₹0',     l: 'Free to Get Started',   c: 'bg-rose-50 text-rose-700' },
            ].map(({ n, l, c }) => (
              <div key={l} className={`rounded-2xl p-5 ${c} border border-white`}>
                <p className="text-2xl font-extrabold">{n}</p>
                <p className="text-sm font-medium mt-1 opacity-80">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── Values ── */}
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">What we stand for</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">Our values guide every feature we build and every therapist we onboard.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">{v.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Team ── */}
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Meet the founders</h2>
          <p className="text-slate-500 text-lg">The people building Unfazed for you.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {team.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all text-center max-w-sm">
              <div className={`w-20 h-20 rounded-full ${t.color} flex items-center justify-center text-2xl font-bold mx-auto mb-4`}>
                {t.initials}
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{t.name}</h3>
              <p className="text-indigo-600 text-sm font-medium mb-3">{t.role}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{t.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Timeline ── */}
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Our journey</h2>
          <p className="text-slate-500">From a small idea in Kanpur to India's fastest-growing mental health platform.</p>
        </div>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-indigo-100" />
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 shadow-md">
                  {m.year.slice(2)}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1 hover:border-indigo-200 transition-colors">
                  <p className="text-xs font-bold text-indigo-600 mb-1">{m.year}</p>
                  <p className="text-sm text-slate-700 font-medium">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Join the Unfazed family</h2>
        <p className="text-indigo-200 text-lg mb-8">Whether you're seeking help or offering it — we'd love to have you.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register"          className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">Book a session →</Link>
          <Link to="/join-as-therapist" className="px-6 py-3 border-2 border-white/40 text-white font-semibold rounded-xl hover:border-white transition-colors">Join as therapist</Link>
        </div>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer className="bg-slate-900 text-slate-400 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">U</span>
          </div>
          <span className="font-bold text-white">Unfazed</span>
        </Link>
        <div className="flex gap-6 text-sm">
          <Link to="/"                  className="hover:text-white transition-colors">Home</Link>
          <Link to="/about"             className="hover:text-white transition-colors">About</Link>
          <Link to="/contact"           className="hover:text-white transition-colors">Contact</Link>
          <Link to="/join-as-therapist" className="hover:text-white transition-colors">Join as Therapist</Link>
          <Link to="/login"             className="hover:text-white transition-colors">Login</Link>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} Unfazed · Made in India 🇮🇳</p>
      </div>
    </footer>
  </div>
);

export default AboutPage;
