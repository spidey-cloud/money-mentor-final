import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
import nodemailer from 'nodemailer'
import { orchestrate } from './agents/orchestrator.js'
import { initGemini } from './utils/gemini.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ──

// Restrict CORS to the configured origin. Falls back to localhost in dev.
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: allowedOrigin }))
app.use(express.json({ limit: '1mb' }))

// Rate limiter for AI endpoints: 10 requests per IP per minute.
const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
})

// Stricter limiter for the contact form: 3 per IP per 10 minutes.
const contactLimiter = rateLimit({
  windowMs: 10 * 60_000,
  max: 3,
  message: { error: 'Too many contact submissions. Please wait before trying again.' },
})

// Initialize Gemini
initGemini(process.env.GEMINI_API_KEY)

// ── API Routes ──

// Health Score Analysis
app.post('/api/health-score', aiLimiter, async (req, res) => {
  try {
    const { answers, scores } = req.body
    if (!answers || !scores) {
      return res.status(400).json({ error: 'Missing answers or scores' })
    }
    const result = await orchestrate('health-score', { answers, scores })
    res.json(result)
  } catch (err) {
    console.error('Health Score error:', err.message)
    res.status(500).json({ error: 'Analysis failed', insights: '' })
  }
})

// Tax Wizard Analysis
app.post('/api/tax-wizard', aiLimiter, async (req, res) => {
  try {
    const { salary, deductions, results } = req.body
    if (!results) {
      return res.status(400).json({ error: 'Missing tax results' })
    }
    // Sanitize numeric fields before they reach the AI prompt.
    const safeResults = {
      ...results,
      grossIncome: Math.round(Math.abs(Number(results.grossIncome) || 0)),
      oldRegime: sanitizeTaxRegime(results.oldRegime),
      newRegime: sanitizeTaxRegime(results.newRegime),
      savings: Math.round(Math.abs(Number(results.savings) || 0)),
    }
    const result = await orchestrate('tax-wizard', { salary, deductions, results: safeResults })
    res.json(result)
  } catch (err) {
    console.error('Tax Wizard error:', err.message)
    res.status(500).json({ error: 'Analysis failed', insights: '' })
  }
})

// FIRE Planner
app.post('/api/fire-planner', aiLimiter, async (req, res) => {
  try {
    const { plan, ...data } = req.body
    if (!plan) {
      return res.status(400).json({ error: 'Missing FIRE plan data' })
    }
    // Sanitize plan figures before they reach the AI prompt.
    const safePlan = {
      ...plan,
      fireNumber: Math.round(Math.abs(Number(plan.fireNumber) || 0)),
      requiredSIP: Math.round(Math.abs(Number(plan.requiredSIP) || 0)),
      yearsToRetire: Math.min(Math.max(Number(plan.yearsToRetire) || 1, 1), 60),
      gap: Math.round(Number(plan.gap) || 0),
    }
    const result = await orchestrate('fire-planner', { ...data, plan: safePlan })
    res.json(result)
  } catch (err) {
    console.error('FIRE Planner error:', err.message)
    res.status(500).json({ error: 'Planning failed', insights: '' })
  }
})

// Contact Form Submission
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured')
    }

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      replyTo: email,
      subject: `New Contact: ${subject}`,
      text: `From: ${name} (${email})\nSubject: ${subject}\n\n${message}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
          <h2 style="color: #2563eb;">New Message from AI Money Mentor</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('📧 Message sent. ID:', info.messageId)
    res.json({ success: true, message: 'Message delivered' })
  } catch (err) {
    console.error('Contact form error:', err.message)
    res.status(500).json({ error: 'Failed to deliver email.' })
  }
})

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Helpers ──

function sanitizeTaxRegime(regime) {
  if (!regime || typeof regime !== 'object') return {}
  return {
    total: Math.round(Math.abs(Number(regime.total) || 0)),
    tax: Math.round(Math.abs(Number(regime.tax) || 0)),
    cess: Math.round(Math.abs(Number(regime.cess) || 0)),
    taxableIncome: Math.round(Math.abs(Number(regime.taxableIncome) || 0)),
    deductions: Math.round(Math.abs(Number(regime.deductions) || 0)),
  }
}

// ── Nodemailer ──
// Remove debug/logger in production to prevent credential leakage in logs.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  ...(process.env.NODE_ENV !== 'production' && { debug: true, logger: true }),
})

transporter.verify((error) => {
  if (error) {
    // Log the error code only — never the full message, which can include credentials.
    console.error('❌ Nodemailer error. Code:', error.code)
    console.log('💡 Check EMAIL_USER and EMAIL_PASS in your .env file.')
  } else {
    console.log('✅ Nodemailer ready.')
  }
})

// ── Export / Start ──

export default app

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║    🤖 AI Money Mentor — Backend Server   ║
    ║    Running on http://localhost:${PORT}      ║
    ║    Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  Not configured'}       ║
    ╚══════════════════════════════════════════╝
    `)
  })
}
