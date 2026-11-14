import { Coins, Sparkles } from 'lucide-react'
import { FREE_CREDITS, useCredits } from '../context/CreditContext'
import ThemeToggleButton from './ui/theme-toggle-button'
import './CreditBadge.css'

export default function CreditBadge() {
  const { credits, isSubscribed } = useCredits()

  return (
    <div className="top-nav-actions">
      <ThemeToggleButton />
      <div className="credit-badge glass-card">
        {isSubscribed ? (
          <>
            <Sparkles size={16} className="text-amber animate-pulse" />
            <span className="badge-text pro-text">Pro Plan</span>
          </>
        ) : (
          <>
            <Coins size={16} className={credits > 0 ? "text-amber" : "text-rose"} />
            <span className="badge-text">
              {credits} {credits === 1 ? 'Credit' : 'Credits'} Left
            </span>
            <div className="mini-progress">
              <div
                className="mini-progress-fill"
                style={{
                  width: `${(credits / FREE_CREDITS) * 100}%`,
                  background: credits > 1 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
