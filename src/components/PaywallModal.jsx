import { CheckCircle2, Lock, Sparkles, X } from 'lucide-react'
import { useCredits } from '../context/CreditContext'
import { PLANS } from '../lib/plans'
import './PaywallModal.css'

export default function PaywallModal() {
  const { showPaywall, setShowPaywall, simulateSubscription } = useCredits()

  if (!showPaywall) return null

  return (
    <div className="paywall-overlay animate-fade-in">
      <div className="paywall-card glass-card animate-scale-in">
        <button className="paywall-close" onClick={() => setShowPaywall(false)}>
          <X size={20} />
        </button>

        <div className="paywall-header">
          <div className="paywall-icon">
            <Lock size={32} />
          </div>
          <h2>You've hit your free limit</h2>
          <p>Upgrade to Premium to get unlimited access to all AI financial agents.</p>
        </div>

        <div className="paywall-plans">
          {/* Monthly Plan */}
          <div className="plan-card glass-card">
            <div className="plan-title">{PLANS.monthly.label}</div>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">{PLANS.monthly.price.toLocaleString('en-IN')}</span>
              <span className="period">{PLANS.monthly.period}</span>
            </div>
            <ul className="plan-features">
              {PLANS.monthly.features.filter(f => f.included).map(f => (
                <li key={f.text}><CheckCircle2 size={16} /> {f.text}</li>
              ))}
            </ul>
            <button className="btn btn-secondary" onClick={simulateSubscription}>Subscribe Monthly</button>
          </div>

          {/* Yearly Plan */}
          <div className="plan-card glass-card plan-popular">
            <div className="popular-badge"><Sparkles size={14} /> Best Value</div>
            <div className="plan-title">{PLANS.yearly.label}</div>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">{PLANS.yearly.price.toLocaleString('en-IN')}</span>
              <span className="period">{PLANS.yearly.period}</span>
            </div>
            <p className="plan-savings">Save ₹{PLANS.yearly.savings} / year</p>
            <ul className="plan-features">
              {PLANS.yearly.features.filter(f => f.included).map(f => (
                <li key={f.text}><CheckCircle2 size={16} /> {f.text}</li>
              ))}
            </ul>
            <button className="btn btn-primary" onClick={simulateSubscription}>Upgrade to Pro</button>
          </div>
        </div>

        <div className="paywall-footer">
          <p>Secured by Razorpay. Cancel anytime.</p>
        </div>
      </div>
    </div>
  )
}
