import { useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { Mail, Clock, Send, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Report Incorrect Information',
  'Suggest a Profile',
  'Technical Issue',
  'Business Partnership',
  'Copyright / DMCA',
  'Other',
]

const FAQ_ITEMS = [
  {
    q: 'How do I report incorrect information?',
    a: 'Use the contact form above and select "Report Incorrect Information" as the subject. Please include the profile name and the specific data that appears incorrect. Our team reviews reports promptly.',
  },
  {
    q: 'How do I suggest a new profile?',
    a: 'Select "Suggest a Profile" in the subject dropdown and tell us the creator\'s name, Instagram handle, and why you think they should be featured. We regularly review suggestions.',
  },
  {
    q: 'How often is information updated?',
    a: 'Profile statistics are updated periodically to reflect the latest publicly available data. Update frequency may vary by profile and data availability.',
  },
  {
    q: 'Is Spialr affiliated with Instagram or Meta?',
    a: 'No. Spialr is an independent website and is not affiliated with, endorsed by, or connected to Instagram, Meta, or any of their subsidiaries. All data shown is publicly available.',
  },
]

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '0',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '20px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text)',
          lineHeight: 1.4,
        }}
      >
        <span>{item.q}</span>
        <span style={{ flexShrink: 0, color: 'var(--accent)' }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <div
          style={{
            paddingBottom: 20,
            fontSize: 14,
            color: 'var(--text-dim)',
            lineHeight: 1.75,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {item.a}
        </div>
      )}
    </div>
  )
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const honeypotRef = useRef(null)
  const lastSubmitRef = useRef(0)

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Please enter your full name.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.'
    if (!form.subject) e.subject = 'Please select a subject.'
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Message must be at least 10 characters.'
    if (form.message.trim().length > 5000) e.message = 'Message must not exceed 5000 characters.'
    return e
  }

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side rate limit (extra safety)
    const now = Date.now()
    if (now - lastSubmitRef.current < 10000) {
      setStatus('error')
      setErrorMessage('Please wait a few seconds before submitting again.')
      return
    }

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setStatus('sending')
    setErrorMessage('')
    lastSubmitRef.current = now

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          _honeypot: honeypotRef.current?.value || '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Unknown error')
      }

      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong.')
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: `1px solid ${hasError ? '#dc2743' : 'var(--border)'}`,
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  })

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    marginBottom: 6,
  }

  const errorStyle = {
    color: '#dc2743',
    fontSize: 12,
    marginTop: 5,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  const CONTACT_EMAIL = 'contact@spialr.com'

  return (
    <>
      <Head>
        <title>Contact Spialr | Support &amp; Business Inquiries</title>
        <meta name="description" content="Contact Spialr for support, profile suggestions, business inquiries, reporting incorrect information, copyright requests and technical assistance." />
        <link rel="canonical" href="https://www.spialr.com/contact" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.spialr.com/contact" />
        <meta property="og:title" content="Contact Spialr | Support & Business Inquiries" />
        <meta property="og:description" content="Contact Spialr for support, profile suggestions, business inquiries, reporting incorrect information, copyright requests and technical assistance." />
        <meta property="og:site_name" content="Spialr" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Contact Spialr | Support & Business Inquiries" />
        <meta name="twitter:description" content="Contact Spialr for support, profile suggestions, business inquiries, reporting incorrect information, copyright requests and technical assistance." />

        {/* JSON-LD ContactPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ContactPage',
              name: 'Contact Spialr',
              description: 'Contact Spialr for support, profile suggestions, business inquiries, and more.',
              url: 'https://www.spialr.com/contact',
              mainEntity: {
                '@type': 'Organization',
                name: 'Spialr',
                url: 'https://www.spialr.com',
                contactPoint: {
                  '@type': 'ContactPoint',
                  email: CONTACT_EMAIL,
                  contactType: 'customer support',
                  availableLanguage: 'English',
                },
              },
            }),
          }}
        />

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .contact-input:focus {
            border-color: var(--text) !important;
            box-shadow: 0 0 0 1px var(--text);
          }
          .contact-input::placeholder {
            color: var(--text-muted);
            opacity: 0.7;
          }
          .faq-card .card:hover {
            transform: none !important;
          }
          /* Outer two-column layout */
          .contact-outer-grid {
            max-width: 1040px;
            margin: 0 auto;
            padding: 48px 20px 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
            gap: 32px;
            align-items: start;
          }
          /* Inner form two-column layout (name + email side by side) */
          .contact-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px 20px;
          }
          .form-col-half { grid-column: span 1; }
          .form-col-full { grid-column: 1 / -1; }
          /* On mobile: stack everything to single column */
          @media (max-width: 700px) {
            .contact-outer-grid {
              grid-template-columns: 1fr;
              padding: 28px 16px 0;
              gap: 20px;
            }
            .contact-form-grid {
              grid-template-columns: 1fr;
            }
            .form-col-half,
            .form-col-full {
              grid-column: 1 !important;
            }
          }
        `}</style>
      </Head>

      <Navbar />

      <main style={{ background: 'var(--surface)', minHeight: '100vh', paddingBottom: 80 }}>
        {/* Hero */}
        <section
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '80px 24px 60px',
            animation: 'fadeInUp 0.5s ease',
          }}
        >
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                marginBottom: 16,
                lineHeight: 1.15,
              }}
            >
              Contact Us
            </h1>
            <p
              style={{
                color: 'var(--text-dim)',
                fontSize: 'clamp(15px, 2vw, 17px)',
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              We&apos;d love to hear from you. Whether you have feedback, found incorrect information,
              want to suggest a profile, report a technical issue, discuss a business opportunity,
              or have copyright concerns — we&apos;re here to help.
            </p>
          </div>
        </section>

        <div className="contact-outer-grid">
          {/* LEFT — Contact Info Card */}
          <aside>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '32px 28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                animation: 'fadeInUp 0.5s ease 0.1s both',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 24,
                  color: 'var(--text)',
                }}
              >
                Get in Touch
              </h2>

              {/* Email card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '20px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mail size={18} color="var(--text-muted)" strokeWidth={1.8} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>
                    Email Address
                  </div>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    style={{
                      color: 'var(--accent)',
                      fontWeight: 700,
                      fontSize: 15,
                      wordBreak: 'break-all',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {CONTACT_EMAIL}
                    <ExternalLink size={12} strokeWidth={2} />
                  </a>
                </div>
              </div>

              {/* Response time */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  background: 'var(--surface2)',
                  borderRadius: 10,
                  marginBottom: 28,
                }}
              >
                <Clock size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    We usually respond within 24–48 hours.
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Please include enough details so we can assist you as quickly as possible.
                  </div>
                </div>
              </div>

              {/* Divider */}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 24 }} />

              {/* Quick links */}
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Quick Links
              </div>
              <nav aria-label="Footer quick links" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms', label: 'Terms & Conditions' },
                  { href: '/disclaimer', label: 'Disclaimer' },
                  { href: '/about', label: 'About Spialr' },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      fontSize: 13,
                      color: 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 0',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
                  >
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* RIGHT — Contact Form */}
          <div style={{ animation: 'fadeInUp 0.5s ease 0.15s both' }}>
            {status === 'success' ? (
              <div
                role="alert"
                style={{
                  border: '1px solid #16a34a',
                  borderRadius: 12,
                  padding: '48px 40px',
                  textAlign: 'center',
                  background: 'rgba(22, 163, 74, 0.04)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  animation: 'fadeInUp 0.4s ease',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(22, 163, 74, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <CheckCircle size={32} color="#16a34a" strokeWidth={1.8} />
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#16a34a',
                    marginBottom: 10,
                  }}
                >
                  Thank you for contacting Spialr.
                </h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.7, marginBottom: 6 }}>
                  Your message has been sent successfully.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  We usually reply within 24–48 hours.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="btn btn-primary"
                  style={{ marginTop: 28 }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 'clamp(24px, 4vw, 40px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: 'var(--text)',
                  }}
                >
                  Send Us a Message
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
                  All fields are required unless stated otherwise.
                </p>

                <form onSubmit={handleSubmit} noValidate aria-label="Contact form">
                  {/* Honeypot — hidden from humans, visible to bots */}
                  <input
                    ref={honeypotRef}
                    type="text"
                    name="_honeypot"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ display: 'none' }}
                  />

                  <div className="contact-form-grid">
                    {/* Full Name */}
                    <div className="form-col-half">
                      <label htmlFor="contact-name" style={labelStyle}>Full Name</label>
                      <input
                        id="contact-name"
                        className="contact-input"
                        type="text"
                        autoComplete="name"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={handleChange('name')}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        style={inputStyle(!!errors.name)}
                      />
                      {errors.name && (
                        <div id="name-error" role="alert" style={errorStyle}>
                          <AlertCircle size={12} /> {errors.name}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="form-col-half">
                      <label htmlFor="contact-email" style={labelStyle}>Email Address</label>
                      <input
                        id="contact-email"
                        className="contact-input"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={handleChange('email')}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        style={inputStyle(!!errors.email)}
                      />
                      {errors.email && (
                        <div id="email-error" role="alert" style={errorStyle}>
                          <AlertCircle size={12} /> {errors.email}
                        </div>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="form-col-full">
                      <label htmlFor="contact-subject" style={labelStyle}>Subject</label>
                      <select
                        id="contact-subject"
                        className="contact-input"
                        value={form.subject}
                        onChange={handleChange('subject')}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.subject}
                        aria-describedby={errors.subject ? 'subject-error' : undefined}
                        style={{
                          ...inputStyle(!!errors.subject),
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 14px center',
                          paddingRight: 40,
                        }}
                      >
                        <option value="" disabled>Select a subject…</option>
                        {SUBJECT_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {errors.subject && (
                        <div id="subject-error" role="alert" style={errorStyle}>
                          <AlertCircle size={12} /> {errors.subject}
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div className="form-col-full">
                      <label htmlFor="contact-message" style={labelStyle}>Message</label>
                      <textarea
                        id="contact-message"
                        className="contact-input"
                        placeholder="Please describe your inquiry in detail. The more context you provide, the faster we can assist you."
                        value={form.message}
                        onChange={handleChange('message')}
                        rows={6}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'message-error' : undefined}
                        style={{
                          ...inputStyle(!!errors.message),
                          resize: 'vertical',
                          minHeight: 140,
                          lineHeight: 1.65,
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        {errors.message ? (
                          <div id="message-error" role="alert" style={errorStyle}>
                            <AlertCircle size={12} /> {errors.message}
                          </div>
                        ) : <span />}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {form.message.length}/5000
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error message */}
                  {status === 'error' && (
                    <div
                      role="alert"
                      style={{
                        marginTop: 20,
                        padding: '14px 16px',
                        borderRadius: 10,
                        background: 'rgba(220, 39, 67, 0.06)',
                        border: '1px solid rgba(220, 39, 67, 0.25)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <AlertCircle size={16} color="#dc2743" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#dc2743', marginBottom: 2 }}>
                          We couldn&apos;t send your message.
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                          {errorMessage || 'Please try again later or email us directly at'}{' '}
                          {!errorMessage && (
                            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>
                              {CONTACT_EMAIL}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    id="contact-submit-btn"
                    className="btn btn-primary"
                    disabled={status === 'sending'}
                    aria-disabled={status === 'sending'}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: 24,
                      fontSize: 15,
                      padding: '14px 24px',
                      borderRadius: 8,
                      opacity: status === 'sending' ? 0.75 : 1,
                      cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {status === 'sending' ? (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send size={16} strokeWidth={2} />
                        Send Message
                      </>
                    )}
                  </button>

                  {/* Privacy notice */}
                  <p
                    style={{
                      marginTop: 16,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      lineHeight: 1.6,
                    }}
                  >
                    We only use the information you submit to respond to your inquiry.
                    We do not sell or share your personal information.{' '}
                    <Link href="/privacy" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      Privacy Policy
                    </Link>
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <section
          style={{
            maxWidth: 760,
            margin: '56px auto 0',
            padding: '0 20px',
            animation: 'fadeInUp 0.5s ease 0.2s both',
          }}
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 3vw, 26px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text)',
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            Frequently Asked Questions
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Quick answers to the most common questions.
          </p>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '8px 28px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            className="faq-card"
          >
            {FAQ_ITEMS.map((item, idx) => (
              <FAQItem key={idx} item={item} />
            ))}
          </div>
        </section>

        {/* Bottom footer links */}
        <footer
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}
          aria-label="Page footer"
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px 24px',
              padding: '0 20px',
              marginBottom: 14,
            }}
          >
            {[
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms', label: 'Terms & Conditions' },
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{ fontSize: 13, color: 'var(--text-muted)', transition: 'color 0.2s ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Spialr. All rights reserved. Independent website — not affiliated with Instagram or Meta.
          </p>
        </footer>
      </main>

    </>
  )
}
