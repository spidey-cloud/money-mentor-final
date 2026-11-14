import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage'

const CreditContext = createContext()

export const FREE_CREDITS = 5

export function CreditProvider({ children }) {
  const [credits, setCredits] = useState(() => {
    const saved = readJSON('mm_remaining_credits', null)
    return saved !== null ? parseInt(saved, 10) : FREE_CREDITS
  })
  const [isSubscribed, setIsSubscribed] = useState(
    () => readJSON('mm_is_subscribed', false)
  )
  const [showPaywall, setShowPaywall] = useState(false)
  // subSuccess drives an in-app banner instead of alert()
  const [subSuccess, setSubSuccess] = useState(false)

  // Ref prevents double-spend when user clicks twice before state settles
  const spending = useRef(false)

  useEffect(() => {
    writeJSON('mm_remaining_credits', credits)
    writeJSON('mm_is_subscribed', isSubscribed)
  }, [credits, isSubscribed])

  const useCredit = () => {
    if (spending.current) return false
    if (isSubscribed) return true
    if (credits > 0) {
      spending.current = true
      setCredits(prev => {
        spending.current = false
        return prev - 1
      })
      return true
    }
    setShowPaywall(true)
    return false
  }

  const openPaywall = () => setShowPaywall(true)

  const simulateSubscription = () => {
    setIsSubscribed(true)
    setShowPaywall(false)
    setSubSuccess(true)
    setTimeout(() => setSubSuccess(false), 4000)
  }

  return (
    <CreditContext.Provider value={{
      credits,
      isSubscribed,
      showPaywall,
      openPaywall,
      setShowPaywall,
      useCredit,
      simulateSubscription,
      subSuccess,
    }}>
      {children}
    </CreditContext.Provider>
  )
}

export const useCredits = () => useContext(CreditContext)
