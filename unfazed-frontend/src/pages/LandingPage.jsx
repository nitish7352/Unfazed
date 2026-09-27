import { Link } from 'react-router-dom';

const features = [
  { icon: '👥', title: 'Client Management',    desc: 'Organised profiles, intake forms, and complete session history for every client.' },
  { icon: '📅', title: 'Smart Scheduling',     desc: 'Calendar view, recurring sessions, availability slots, and automatic reminders.' },
  { icon: '📝', title: 'Clinical Notes',       desc: 'SOAP, DAP, and free-form notes with TipTap rich text. Sign & lock when complete.' },
  { icon: '💳', title: 'Billing & Invoices',   desc: 'Create invoices, collect payments via Razorpay, and export PDFs in one click.' },
  { icon: '🎥', title: 'Video Sessions',       desc: 'Secure WebRTC video calls built right in — no third-party app needed.' },
  { icon: '📊', title: 'Analytics',            desc: 'Revenue trends, session frequency, and client growth charts at a glance.' },
];

const plans = [
  { name: 'Free',       price: '₹0',     period: 'forever',   clients: '5 clients',    cta: 'Get started free', highlight: false },
  { name: 'Basic',      price: '₹999',   period: 'per month', clients: '20 clients',   cta: 'Start free trial',  highlight: false },
  { name: 'Pro',        price: '₹2,499', period: 'per month', clients: '100 clients',  cta: 'Start free trial',  highlight: true  },
  { name: 'Enterprise', price: '₹5,999', period: 'per month', clients: 'Unlimited',    cta: 'Contact us',        highlight: false },
];

const LandingPage = () => (
  <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

    {/* ── Navbar ── */}
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="font-bold text-lg text-indigo-600 tracking-tight">Unfazed</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#pricing"  className="hover:text-indigo-600 transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link to="/register"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            Get started free
          </Link>
        </div>
      </div>
    </header>

    {/* ── Hero ── */}
    <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold mb-6 border border-indigo-100">
        ✨ Purpose-built for therapists in India
      </div>
      <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
        Your practice,<br />
        <span className="text-indigo-600">completely unfazed.</span>
      </h1>
      <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
        Manage clients, sessions, clinical notes, and billing — all in one beautifully simple platform.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/register"
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base transition-colors shadow-lg shadow-indigo-200">
          Start for free →
        </Link>
        <Link to="/login"
          className="px-8 py-3.5 border-2 border-slate-200 hover:border-indigo-200 text-slate-700 font-semibold rounded-xl text-base transition-colors bg-white">
          Sign in to dashboard
        </Link>
      </div>
      <p className="text-xs text-slate-400 mt-4">No credit card required · Free plan always available</p>

      {/* Mock dashboard */}
      <div className="mt-14 rounded-2xl border border-slate-200 shadow-2xl shadow-slate-100 overflow-hidden text-left">
        <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 border-b border-slate-200">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs text-slate-400 font-mono">unfazed-seven.vercel.app/dashboard</span>
        </div>
        <div className="bg-slate-50 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              ['Active Clients','24','text-indigo-600'],
              ['Sessions / Month','38','text-blue-600'],
              ['Revenue / Month','₹48,500','text-emerald-600'],
              ['Upcoming','6','text-amber-600'],
            ].map(([l,v,c]) => (
              <div key={l} className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-400">{l}</p>
                <p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Upcoming sessions</span>
              <span className="text-xs text-indigo-600 cursor-pointer">View all →</span>
            </div>
            {[
              ['PS','Priya S.','Today · 3:00 PM · Video','bg-indigo-100 text-indigo-700'],
              ['RM','Rahul M.','Tomorrow · 10:00 AM · In-person','bg-blue-100 text-blue-700'],
              ['AK','Anita K.','Thu · 2:30 PM · Video','bg-emerald-100 text-emerald-700'],
            ].map(([init,name,time,badge]) => (
              <div key={name} className="flex items-center justify-between py-2.5 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${badge} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {init}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{name}</p>
                    <p className="text-xs text-slate-400">{time}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">Scheduled</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── Social proof ── */}
    <section className="border-y border-slate-100 py-10 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          {[['500+','Sessions tracked'],['50+','Therapists onboarded'],['₹10L+','Invoices processed']].map(([n,l]) => (
            <div key={l}>
              <p className="text-3xl font-extrabold text-indigo-600">{n}</p>
              <p className="text-sm text-slate-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Features ── */}
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Everything in one place</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">Not a generic tool — built specifically for therapy practices.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-default">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-900 text-base mb-1.5">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Pricing ── */}
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Simple, honest pricing</h2>
          <p className="text-slate-500 text-lg">Start free. Upgrade when you grow.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`rounded-2xl p-6 flex flex-col border-2 transition-all
                ${plan.highlight
                  ? 'border-indigo-500 bg-indigo-600 shadow-xl shadow-indigo-200'
                  : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
              {plan.highlight && (
                <span className="text-[10px] font-bold bg-white/25 text-white rounded-full px-2 py-0.5 self-start mb-3 uppercase tracking-wider">
                  Most popular
                </span>
              )}
              <h3 className={`font-bold text-lg ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
              <div className="mt-2 mb-1">
                <span className={`text-3xl font-extrabold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                <span className={`text-xs ml-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>/{plan.period}</span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{plan.clients}</p>
              <Link to="/register"
                className={`mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition-colors
                  ${plan.highlight
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="bg-indigo-600 py-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to simplify your practice?</h2>
        <p className="text-indigo-200 text-lg mb-8">Join therapists running their entire practice from one place.</p>
        <Link to="/register"
          className="inline-block px-8 py-3.5 bg-white text-indigo-600 font-bold rounded-xl text-base hover:bg-indigo-50 transition-colors shadow-lg">
          Create your free account →
        </Link>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer className="bg-slate-900 text-slate-400 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">U</span>
            </div>
            <span className="font-bold text-white">Unfazed</span>
          </div>
          <p className="text-sm">Therapy practice management · Made in India 🇮🇳</p>
          <div className="flex gap-5 text-sm">
            <Link to="/login"    className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-6 pt-5 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Unfazed. Built with ❤️ for therapists.
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
