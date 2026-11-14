import { useEffect, useState } from 'react'
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import './App.css'
import CreditBadge from './components/CreditBadge'
import Footer from './components/Footer'
import PaywallModal from './components/PaywallModal'
import ReviewModal from './components/ReviewModal'
import Sidebar from './components/Sidebar'
import PageSkeleton from './components/ui/PageSkeleton'
import { AuthProvider } from './context/AuthContext'
import { CreditProvider, useCredits } from './context/CreditContext'
import { ReviewProvider } from './context/ReviewContext'
import { ThemeProvider } from './context/ThemeContext'
import AboutUs from './pages/AboutUs'
import Account from './pages/Account'
import ContactUs from './pages/ContactUs'
import Dashboard from './pages/Dashboard'
import Disclaimer from './pages/Disclaimer'
import FirePlanner from './pages/FirePlanner'
import GuideDetail from './pages/GuideDetail'
import Guides from './pages/Guides'
import HealthScore from './pages/HealthScore'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TaxWizard from './pages/TaxWizard'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'

// PAGE_TRANSITION_MS matches the CSS fade-out duration in index.css (.animate-fade-in-up).
const PAGE_TRANSITION_MS = 280

function PageTransitionWrapper({ children }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), PAGE_TRANSITION_MS)
    return () => clearTimeout(timer)
  }, [location.pathname])

  if (loading) return <PageSkeleton />
  return children
}

// In-app subscription success banner — replaces the alert() call.
function SubscriptionSuccessBanner() {
  const { subSuccess } = useCredits()
  if (!subSuccess) return null
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, background: 'var(--accent-emerald)', color: '#fff',
        padding: '0.75rem 1.5rem', borderRadius: '12px',
        fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
      }}
    >
      🚀 Payment successful! You are now a Premium Member.
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CreditProvider>
          <ReviewProvider>
            <Router>
              <div className="app-layout" style={{ position: 'relative' }}>
                <Sidebar />
                <CreditBadge />
                <main className="main-content">
                  <PageTransitionWrapper>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/health-score" element={<HealthScore />} />
                      <Route path="/tax-wizard" element={<TaxWizard />} />
                      <Route path="/fire-planner" element={<FirePlanner />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/contact" element={<ContactUs />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/guides" element={<Guides />} />
                      <Route path="/guides/:id" element={<GuideDetail />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/disclaimer" element={<Disclaimer />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </PageTransitionWrapper>
                  <Footer />
                </main>
                <PaywallModal />
                <ReviewModal />
                <SubscriptionSuccessBanner />
              </div>
            </Router>
          </ReviewProvider>
        </CreditProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
