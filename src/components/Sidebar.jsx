import * as React from 'react'
import {
  Activity,
  Calculator,
  Compass,
  Flame,
  Home,
  LayoutDashboard,
  Moon,
  Sparkles,
  Sun,
  User
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { Dock } from './unlumen-ui/dock'
import './Sidebar.css'

export default function Sidebar() {
  const { toggleTheme, isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const dockConfig = React.useMemo(() => [
    { path: '/', icon: <Home size={22} />, label: 'Home' },
    { path: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
    { path: '/health-score', icon: <Activity size={22} />, label: 'Health' },
    { path: '/tax-wizard', icon: <Calculator size={22} />, label: 'Taxes' },
    { path: '/fire-planner', icon: <Flame size={22} />, label: 'FIRE' },
    { path: '/guides', icon: <Compass size={22} />, label: 'Guides' },
    { path: '/pricing', icon: <Sparkles size={22} />, label: 'Pro', isPro: true, separator: true },
    { path: '/account', icon: <User size={22} />, label: 'Account' },
  ], [])

  const dockItems = React.useMemo(() => {
    return dockConfig.map((item) => ({
      ...item,
      isActive: item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path),
      onClick: () => navigate(item.path),
    }))
  }, [dockConfig, location.pathname, navigate])

  return (
    <>
      {/* Top Floating Editorial Header */}
      <header className="editorial-topbar">
        <NavLink to="/" className="topbar-brand">
          <span className="brand-monogram">M</span>
          <div className="brand-text">
            <span className="brand-name font-editorial">MoneyMentor</span>
            <span className="brand-tag">Wealth Advisory AI</span>
          </div>
        </NavLink>

        <div className="topbar-actions">
          <button
            className="theme-pill-btn"
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
            type="button"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* Floating Bottom Mac-style Dock Navigation */}
      <nav className="mac-dock-container" aria-label="Quick navigation">
        <Dock
          items={dockItems}
          magnification={2.0}
          distance={125}
          iconSize={48}
          gap={10}
          borderRadius={20}
        />
      </nav>
    </>
  )
}
