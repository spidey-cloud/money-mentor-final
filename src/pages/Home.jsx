import { ArrowRight, Calculator, Flame, HeartPulse, IndianRupee, Quote, Shield, Sparkles, Star, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MotionAccordion } from '../components/MotionAccordion'
import { useReview } from '../context/ReviewContext'
import './Home.css'

const faqItems = [
  {
    question: "What is MoneyMentor and how does it work?",
    answer: "MoneyMentor is an AI-powered personal finance platform built for Indians. It uses a multi-agent AI system where specialized agents for Tax Optimization, FIRE Planning, and Financial Wellness work together to analyze your income, expenses, investments, and goals — delivering a personalized financial roadmap in seconds.",
  },
  {
    question: "Is my financial data safe with MoneyMentor?",
    answer: "Your privacy is our top priority. We never store bank passwords or sensitive credentials. All calculations run securely within your encrypted session, and we never share or sell your data to third parties. Our platform follows industry-standard security and privacy practices.",
  },
  {
    question: "How does the FIRE Planner calculate my retirement number?",
    answer: "The FIRE Planner factors in your current monthly expenses, expected inflation rate, equity and debt return assumptions, and your preferred safe withdrawal rate (like the 4% rule, adjusted for Indian markets). It then generates a month-by-month roadmap showing exactly when you can achieve financial independence.",
  },
  {
    question: "Which tax regime should I choose — Old or New?",
    answer: "That depends on your income and deductions. Our Tax Wizard compares your liability under both regimes side by side using the latest Budget rules. It automatically identifies deductions you may be missing under Section 80C, 80D, NPS (80CCD), and HRA — so you can pick the regime that saves you the most.",
  },
  {
    question: "What does the Money Health Score measure?",
    answer: "The Money Health Score evaluates your financial wellness across 6 key dimensions — savings rate, debt management, emergency fund adequacy, investment diversification, insurance coverage, and retirement readiness. You get an overall score plus specific recommendations to improve each area.",
  },
  {
    question: "Is MoneyMentor completely free to use?",
    answer: "Yes! You can use the Money Health Score, Tax Wizard, and FIRE Planner at no cost. For power users, we offer a Pro Plan with unlimited premium simulations, priority AI processing, advanced analytics, and continuous financial tracking.",
  },
]

const features = [
  {
    icon: HeartPulse,
    title: 'Money Health Score',
    description: 'Get a comprehensive financial wellness score across 6 key dimensions in just 5 minutes.',
    path: '/health-score',
    color: 'emerald',
    stats: '6 Dimensions',
  },
  {
    icon: Calculator,
    title: 'Tax Wizard',
    description: 'Compare old vs new tax regime, find missed deductions, and maximize your tax savings.',
    path: '/tax-wizard',
    color: 'amber',
    stats: 'Save ₹50K+',
  },
  {
    icon: Flame,
    title: 'FIRE Planner',
    description: 'Build a month-by-month financial roadmap to achieve Financial Independence & Retire Early.',
    path: '/fire-planner',
    color: 'rose',
    stats: 'Full Roadmap',
  },
]

const stats = [
  { value: '14 Cr+', label: 'Demat Accounts in India', icon: Users },
  { value: '95%', label: 'Indians Without Financial Plan', icon: TrendingUp },
  { value: '₹25K+', label: 'Yearly Advisor Cost', icon: IndianRupee },
  { value: '100%', label: 'Free AI-Powered Planning', icon: Shield },
]

export default function Home() {
  const { getTopReview } = useReview()
  const topReview = getTopReview()

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero animate-fade-in-up">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>AI-Powered Personal Finance</span>
        </div>
        <h1 className="hero-title">
          Your AI <span className="text-gradient">Money Mentor</span>
        </h1>
        <p className="hero-subtitle">
          Financial planning as accessible as checking WhatsApp. Get personalized insights,
          tax optimization, and a complete roadmap to financial freedom — powered by AI.
        </p>
        <div className="hero-actions">
          <Link to="/health-score" className="btn btn-primary btn-lg">
            Get Started Free
            <ArrowRight size={18} />
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section animate-fade-in-up stagger-2">
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card glass-card">
              <stat.icon size={22} className="stat-icon" />
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-heading animate-fade-in-up stagger-3">
          Everything You Need for <span className="text-gradient">Financial Wellness</span>
        </h2>
        <div className="features-grid">
          {features.map((feature, i) => (
            <Link
              key={i}
              to={feature.path}
              className={`feature-card glass-card animate-fade-in-up stagger-${i + 3}`}
            >
              <div className={`feature-icon-wrap feature-icon-${feature.color}`}>
                <feature.icon size={28} />
              </div>
              <div className="feature-stats-badge">{feature.stats}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-link">
                Try Now <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works animate-fade-in-up stagger-5">
        <h2 className="section-heading">
          How <span className="text-gradient">MoneyMentor</span> Works
        </h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <h4>Answer Questions</h4>
            <p>Quick 5-minute questionnaire about your finances — income, expenses, investments, and goals.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">02</div>
            <h4>AI Analysis</h4>
            <p>Our multi-agent AI system analyzes your data across multiple financial dimensions simultaneously.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">03</div>
            <h4>Get Your Plan</h4>
            <p>Receive personalized scores, tax-saving strategies, and a complete financial roadmap instantly.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section animate-fade-in-up stagger-5" style={{ marginBottom: '80px' }}>
        <h2 className="section-heading">
          Frequently Asked <span className="text-gradient">Questions</span>
        </h2>
        <MotionAccordion items={faqItems} />
      </section>

      {/* Reviews Section */}
      <section className="reviews-section animate-fade-in-up stagger-6">
        <h2 className="section-heading">What Our <span className="text-gradient">Users Say</span></h2>
        {topReview ? (
          <div className="review-display-card glass-card">
            <Quote size={40} className="review-quote-icon" />
            <div className="review-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < topReview.rating ? 'currentColor' : 'none'}
                  strokeOpacity={i < topReview.rating ? 0 : 1}
                  style={{ color: i < topReview.rating ? 'var(--accent-amber)' : 'var(--text-muted)' }}
                />
              ))}
            </div>
            <p className="review-text">"{topReview.comment}"</p>
            <div className="review-author">
              <span className="author-name">{topReview.userName}</span>
              <span className="author-meta">Verified User • {topReview.type}</span>
            </div>
          </div>
        ) : (
          <p className="no-reviews-note">No reviews yet. Be the first to share your experience!</p>
        )}
      </section>
    </div>
  )
}
