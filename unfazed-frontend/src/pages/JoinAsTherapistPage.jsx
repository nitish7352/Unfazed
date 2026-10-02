import { useState } from 'react';
import { Link } from 'react-router-dom';

const benefits = [
  { icon: '💰', title: 'Earn More',            desc: 'Set your own rates and get paid directly to your bank account via Razorpay — no hidden deductions.' },
  { icon: '📅', title: 'Flexible Schedule',    desc: 'Work from anywhere. Set your own availability and take sessions at times that suit you.' },
  { icon: '🎥', title: 'Built-in Video Calls', desc: 'No need for third-party apps. Secure WebRTC video sessions are built right into the platform.' },
  { icon: '📝', title: 'Clinical Notes',       desc: 'SOAP, DAP, and free-form notes with digital signatures. Everything organised in one place.' },
  { icon: '💬', title: 'Client Chat',          desc: 'Stay connected with clients between sessions through our secure in-app messaging system.' },
  { icon: '📊', title: 'Practice Analytics',   desc: 'Track your revenue, session count, client growth, and no-show rate with beautiful charts.' },
];

const steps = [
  { n: '01', title: 'Apply online',         desc: 'Fill in the form below with your credentials, specialties, and experience.' },
  { n: '02', title: 'Verification',         desc: 'Our team reviews your RCI license and qualifications within 2–3 business days.' },
  { n: '03', title: 'Profile setup',        desc: 'Complete your therapist profile — photo, bio, specialties, availability, and rates.' },
  { n: '04', title: 'Start seeing clients', desc: 'Go live and start receiving bookings. We handle payments, scheduling, and reminders.' },
];

const specialties = [
  'CBT', 'DBT', 'ACT', 'EMDR', 'Psychoanalysis',
  'Child Psychology', 'Adolescent Therapy', 'Couples Therapy',
  'Family Therapy', 'Trauma Recovery', 'Anxiety & Depression',
  'ADHD', 'OCD', 'PTSD', 'Grief Counselling',
  'Career Counselling', 'Life Coaching', 'Mindfulness',
];

const JoinAsTherapistPage = () => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    licenseType: '', licenseNumber: '', experience: '',
    specialties: [], bio: '', city: '', sessionRate: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // multi-step form: 1 = personal, 2 = credentials, 3 = practice

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleSpecialty = (s) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — replace with real API call when ready
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1400);
  };

  const inputCls = 'px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full';
  const labelCls = 'text-sm font-medium text-slate-700';

  return (
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
            <Link to="/about"             className="hover:text-indigo-600 transition-colors">About</Link>
            <Link to="/contact"           className="hover:text-indigo-600 transition-colors">Contact</Link>
            <Link to="/join-as-therapist" className="text-indigo-600 font-semibold">Join as Therapist</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5">Sign in</Link>
            <Link to="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16 pb-12">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full opacity-30 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-5 border border-indigo-100">
            🧑‍⚕️ For Therapists & Psychologists
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Grow your practice<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              with Unfazed
            </span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-6">
            Join 500+ certified therapists who use Unfazed to manage their clients, notes, billing, and video sessions — all in one beautifully simple platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
            {['✅ Free to join', '✅ RCI license required', '✅ Verified badge', '✅ Set your own rates'].map((t) => (
              <span key={t} className="bg-white border border-slate-200 px-3 py-1.5 rounded-full font-medium">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Why therapists love Unfazed</h2>
            <p className="text-slate-500">Everything you need to run a modern therapy practice.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-semibold text-slate-900 text-base mb-2">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-14 bg-indigo-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">How to join</h2>
            <p className="text-slate-500">Simple onboarding — be live in under 48 hours.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-extrabold mx-auto mb-4 shadow-lg">
                  {s.n}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ── */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Apply to join</h2>
            <p className="text-slate-500">Fill in your details and our team will review your application.</p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-emerald-800 mb-2">Application received!</h3>
              <p className="text-emerald-700 leading-relaxed mb-2">
                Thank you, <strong>{form.firstName}</strong>! We've received your application and will review it within <strong>2–3 business days</strong>.
              </p>
              <p className="text-emerald-600 text-sm mb-6">
                We'll send next steps to <strong>{form.email}</strong>.
              </p>
              <Link to="/" className="inline-block px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-colors ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                    <p className={`text-xs mt-1 font-medium ${step === s ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {s === 1 ? 'Personal' : s === 2 ? 'Credentials' : 'Practice'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Step 1 — Personal info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Personal information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>First name *</label>
                      <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required placeholder="Dr. / Ms. / Mr." className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>Last name *</label>
                      <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required className={inputCls} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Email address *</label>
                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="your@email.com" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Phone number *</label>
                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required placeholder="+91 XXXXX XXXXX" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>City *</label>
                    <input value={form.city} onChange={(e) => update('city', e.target.value)} required placeholder="e.g. Delhi, Mumbai, Bangalore" className={inputCls} />
                  </div>
                  <button type="button" onClick={() => setStep(2)}
                    disabled={!form.firstName || !form.lastName || !form.email || !form.phone || !form.city}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 2 — Credentials */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Professional credentials</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>License type *</label>
                    <select value={form.licenseType} onChange={(e) => update('licenseType', e.target.value)} required className={inputCls}>
                      <option value="">Select…</option>
                      <option>RCI Licensed Psychologist</option>
                      <option>Clinical Psychologist</option>
                      <option>Counselling Psychologist</option>
                      <option>Psychiatrist (MBBS + MD)</option>
                      <option>Certified Therapist / Coach</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>License / Registration number *</label>
                    <input value={form.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)} required placeholder="e.g. A-12345" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Years of experience *</label>
                    <select value={form.experience} onChange={(e) => update('experience', e.target.value)} required className={inputCls}>
                      <option value="">Select…</option>
                      <option>1–3 years</option>
                      <option>3–5 years</option>
                      <option>5–10 years</option>
                      <option>10–20 years</option>
                      <option>20+ years</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Specialties (select all that apply)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {specialties.map((s) => (
                        <button key={s} type="button"
                          onClick={() => toggleSpecialty(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            form.specialties.includes(s)
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-300'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors">
                      ← Back
                    </button>
                    <button type="button" onClick={() => setStep(3)}
                      disabled={!form.licenseType || !form.licenseNumber || !form.experience}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Practice details */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Practice details</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Session rate (₹ per hour) *</label>
                    <input type="number" min="0" value={form.sessionRate} onChange={(e) => update('sessionRate', e.target.value)} required placeholder="e.g. 1500" className={inputCls} />
                    <p className="text-xs text-slate-400">You can change this any time from your dashboard.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Short bio *</label>
                    <textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} required
                      rows={4} placeholder="Describe your approach, specialties, and what clients can expect from sessions with you…"
                      className={`${inputCls} resize-none`} />
                    <p className="text-xs text-slate-400">This will be shown on your public profile. Min 100 characters.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <strong>📋 Documents required:</strong> RCI license certificate, government photo ID, and a passport-size photo. Our team will request these after initial review.
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)}
                      className="flex-1 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors">
                      ← Back
                    </button>
                    <button type="submit"
                      disabled={loading || !form.sessionRate || !form.bio}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting…
                        </>
                      ) : 'Submit application →'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Already trusted by India's top therapists</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { text: 'Unfazed has transformed my practice. I went from managing 3 spreadsheets to one clean dashboard.', name: 'Dr. Meera S.', city: 'Mumbai' },
              { text: 'The billing and video sessions together in one place saves me at least 5 hours a week.', name: 'Dr. Arjun P.', city: 'Bangalore' },
              { text: 'The clinical notes feature with SOAP format is exactly what I needed. Signing and locking is brilliant.', name: 'Ms. Divya R.', city: 'Delhi' },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-5 border border-slate-200 text-left">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map((i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">"{t.text}"</p>
                <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                <p className="text-xs text-slate-400">{t.city}</p>
              </div>
            ))}
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
};

export default JoinAsTherapistPage;
