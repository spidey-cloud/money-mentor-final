import { CheckCircle2, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCredits } from '../context/CreditContext'
import { PLANS } from '../lib/plans'
import './Pricing.css'

export default function Pricing() {
  const { isSubscribed, simulateSubscription } = useCredits()
  const navigate = useNavigate()

  return (
    <div className="pricing-page animate-fade-in">
      <div className="pricing-header">
        <h1 className="page-title">
          <Sparkles className="title-icon text-amber" /> Unlock Financial Freedom
        </h1>
        <p className="page-subtitle">
          Get unlimited access to AI-powered personalized financial planning.
        </p>
      </div>

      {isSubscribed ? (
        <div className="glass-card subscribed-banner animate-scale-in">
          <div className="subscribed-icon">
            <CheckCircle2 size={48} className="text-emerald" />
          </div>
          <h2>You are a Premium Member!</h2>
          <p>Thank you for subscribing. You have unlimited access to all AI agents.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="pricing-plans">
          {/* Monthly Plan */}
          <div className="plan-card glass-card">
            <div className="plan-title">{PLANS.monthly.label}</div>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">{PLANS.monthly.price.toLocaleString('en-IN')}</span>
              <span className="period">{PLANS.monthly.period}</span>
            </div>
            <p className="plan-description">{PLANS.monthly.description}</p>
            <ul className="plan-features">
              {PLANS.monthly.features.map(f => (
                <li key={f.text} className={f.included ? '' : 'text-slate-400'}>
                  {f.included ? <CheckCircle2 size={16} /> : <X size={16} />} {f.text}
                </li>
              ))}
            </ul>
            <button className="btn btn-secondary mt-auto" onClick={simulateSubscription}>Subscribe Monthly</button>
          </div>

          {/* Yearly Plan */}
          <div className="plan-card glass-card plan-popular">
            <div className="popular-badge"><Sparkles size={14} /> Best Value</div>
            <div className="plan-title text-amber">{PLANS.yearly.label}</div>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">{PLANS.yearly.price.toLocaleString('en-IN')}</span>
              <span className="period">{PLANS.yearly.period}</span>
            </div>
            <p className="plan-savings">Save ₹{PLANS.yearly.savings} / year</p>
            <ul className="plan-features">
              {PLANS.yearly.features.map(f => (
                <li key={f.text} className={f.included ? '' : 'text-slate-400'}>
                  {f.included
                    ? <CheckCircle2 size={16} className="text-amber" />
                    : <X size={16} />} {f.text}
                </li>
              ))}
            </ul>
            <button className="btn btn-primary mt-auto" onClick={simulateSubscription}>Upgrade to Pro</button>
          </div>
        </div>
      )}

      <div className="pricing-faq mt-8">
        <p className="text-slate-400 text-sm text-center">
          Payment is simulated for this hackathon demo. No real transactions will occur.<br />
          Mock secured by Razorpay.
        </p>
      </div>
    </div>
  )
}
