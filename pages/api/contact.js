import nodemailer from 'nodemailer'

// Simple in-memory rate limiter: max 3 submissions per IP per 10 minutes
const rateLimitMap = new Map()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip) || { count: 0, firstAt: now }

  if (now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
    // Window expired — reset
    rateLimitMap.set(ip, { count: 1, firstAt: now })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count++
  rateLimitMap.set(ip, entry)
  return false
}

const VALID_SUBJECTS = [
  'General Inquiry',
  'Report Incorrect Information',
  'Suggest a Profile',
  'Technical Issue',
  'Business Partnership',
  'Copyright / DMCA',
  'Other',
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' })
  }

  const { name, email, subject, message, _honeypot } = req.body

  // Honeypot check — bots fill this field, humans don't
  if (_honeypot && _honeypot.trim() !== '') {
    // Silently succeed to fool the bot
    return res.status(200).json({ ok: true })
  }

  // Server-side validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please provide a valid full name.' })
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' })
  }
  if (!subject || !VALID_SUBJECTS.includes(subject)) {
    return res.status(400).json({ error: 'Please select a valid subject.' })
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return res.status(400).json({ error: 'Message must be at least 10 characters.' })
  }
  if (message.trim().length > 5000) {
    return res.status(400).json({ error: 'Message must not exceed 5000 characters.' })
  }

  // Sanitise inputs
  const safeName = name.trim().slice(0, 100)
  const safeEmail = email.trim().toLowerCase().slice(0, 200)
  const safeSubject = subject
  const safeMessage = message.trim().slice(0, 5000)

  // Build email HTML
  const htmlBody = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); padding: 24px 32px;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Spialr — New Contact Form Submission</h1>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 130px; color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Name</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #09090b; font-size: 15px;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Email</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #09090b; font-size: 15px;"><a href="mailto:${safeEmail}" style="color: #e1306c;">${safeEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Subject</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #09090b; font-size: 15px;">${safeSubject}</td>
          </tr>
        </table>
        <div style="margin-top: 24px;">
          <p style="color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Message</p>
          <div style="background: #f4f5f7; border-radius: 8px; padding: 16px 20px; color: #09090b; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${safeMessage}</div>
        </div>
      </div>
      <div style="padding: 16px 32px; background: #f4f5f7; text-align: center; color: #71717a; font-size: 12px;">
        Sent from the Spialr Contact Form — spialr.com
      </div>
    </div>
  `

  // Nodemailer transport — uses env variables (never exposed to client)
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"Spialr Contact Form" <${process.env.SMTP_USER}>`,
      to: 'contact@spialr.com',
      replyTo: safeEmail,
      subject: `[Spialr Contact] ${safeSubject} — from ${safeName}`,
      html: htmlBody,
      text: `Name: ${safeName}\nEmail: ${safeEmail}\nSubject: ${safeSubject}\n\nMessage:\n${safeMessage}`,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Contact form email error:', err)
    return res.status(500).json({ error: 'Failed to send email. Please try again later.' })
  }
}
