import { useState } from 'react';
import { Link } from 'react-router-dom';

const contactMethods = [
  {
    icon: '📧',
    title: 'Email Us',
    desc: 'For general enquiries and support',
    value: 'nkaky10@gmail.com',
    link: 'mailto:nkaky10@gmail.com',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  {
    icon: '📞',
    title: 'Call Us',
    desc: 'Mon–Sat, 9 AM – 7 PM IST',
    value: '+91 7352097919',
    link: 'tel:+917352097919',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    icon: '💬',
    title: 'WhatsApp',
    desc: 'Quick support on WhatsApp',
    value: 'Chat with us',
    link: 'https://wa.me/917352097919',
    color: 'bg-green-50 text-green-700 border-green-100',
  },
  {
    icon: '📍',
    title: 'Office',
    desc: 'Headquarters',
    value: 'Chhapra, Bihar, India',
    link: null,
    color: 'bg-purple-50 text-purple-700 border-purple-100',
  },
];

const faqs = [
  {
    q: 'How do I book a session?',
    a: 'Click "Get started free", create your account, browse therapists, and book a slot that works for you. Payment is collected securely via Razorpay.',
  },
  {
    q: 'Are all therapists on Unfazed verified?',
    a: 'Yes. Every therapist is RCI-licensed and goes through a background verification process before being listed on our platform.',
  },
  {
    q: 'Is my information kept confidential?',
    a: 'Absolutely. All sessions and personal data are fully encrypted. We never share your information with any third party.',
  },
  {
    q: 'What if I need to cancel or reschedule?',
    a: 'You can cancel or reschedule up to 24 hours before your session at no charge. Late cancellations may be subject to a fee.',
  },
  {
    q: 'How do I join as a therapist?',
    a: 'Visit our "Join as Therapist" page, fill in your details and credentials, and our team will review your application within 2–3 business days.',
  },
  {
    q: 'Which payment methods are accepted?',
    a: 'We accept UPI, debit/credit cards, net banking, and wallets — all powered by Razorpay.',
  },
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = `[Unfazed] ${form.subject}`;
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Topic: ${form.subject}`,
      "",
      form.message,
    ].join("\n");
    window.location.href = `mailto:nkaky10@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

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
            <Link to="/contact"           className="text-indigo-600 font-semibold">Contact</Link>
            <Link to="/join-as-therapist" className="hover:text-indigo-600 transition-colors">Join as Therapist</Link>
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
            💬 We're here to help
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Get in touch with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Unfazed
            </span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Have a question, a suggestion, or just want to say hello? We respond to every message within 24 hours.
          </p>
        </div>
      </section>

      {/* ── Contact Methods ── */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactMethods.map((c) => (
              <div key={c.title} className={`rounded-2xl border p-5 ${c.color} hover:shadow-md transition-all`}>
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-semibold text-base mb-1">{c.title}</h3>
                <p className="text-xs opacity-70 mb-2">{c.desc}</p>
                {c.link ? (
                  <a href={c.link} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline break-all">{c.value}</a>
                ) : (
                  <p className="text-sm font-semibold">{c.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form + FAQ ── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Send us a message</h2>
              <p className="text-slate-500 text-sm mb-6">We'll get back to you within 24 hours on business days.</p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-lg font-bold text-emerald-800 mb-2">Your email draft is ready</h3>
                  <p className="text-emerald-700 text-sm mb-4">
                    Your email app should open with the message addressed to nkaky10@gmail.com. Send it from your email app to reach us.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Full name <span className="text-red-500">*</span></label>
                      <input
                        name="name" value={form.name} onChange={handleChange} required
                        placeholder="Your name"
                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Email address <span className="text-red-500">*</span></label>
                      <input
                        name="email" type="email" value={form.email} onChange={handleChange} required
                        placeholder="you@email.com"
                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Subject <span className="text-red-500">*</span></label>
                    <select
                      name="subject" value={form.subject} onChange={handleChange} required
                      className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Select a subject…</option>
                      <option value="booking">Session booking help</option>
                      <option value="therapist">Therapist enquiry</option>
                      <option value="billing">Billing / payment issue</option>
                      <option value="technical">Technical support</option>
                      <option value="join">Joining as a therapist</option>
                      <option value="feedback">Feedback / suggestion</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Message <span className="text-red-500">*</span></label>
                    <textarea
                      name="message" value={form.message} onChange={handleChange} required
                      rows={5} placeholder="Tell us how we can help…"
                      className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Open email app →
                  </button>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Frequently asked questions</h2>
              <p className="text-slate-500 text-sm mb-6">Quick answers to the questions we hear most often.</p>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-900 pr-4">{faq.q}</span>
                      <span className={`text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Map / Location ── */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Find us</h2>
          <p className="text-slate-500 mb-6">We're based in Chhapra, Bihar — but we serve therapists and clients all across India.</p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-10 flex flex-col items-center gap-3">
            <span className="text-5xl">📍</span>
            <p className="font-bold text-slate-900 text-lg">Unfazed HQ</p>
            <p className="text-slate-500">Chhapra, Bihar – 841224, India</p>
            <a
              href="https://maps.google.com/?q=Chhapra,Bihar,India"
              target="_blank" rel="noopener noreferrer"
              className="mt-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Open in Google Maps →
            </a>
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

export default ContactPage;
