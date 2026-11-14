import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage'

const ReviewContext = createContext()

const MAX_STORED_REVIEWS = 50

export function ReviewProvider({ children }) {
  const [reviews, setReviews] = useState(() => readJSON('moneymentor_reviews', []))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastAnalysisType, setLastAnalysisType] = useState('')
  const reviewTimerRef = useRef(null)

  // Persist on change — load is handled by the lazy useState initializer above.
  useEffect(() => {
    writeJSON('moneymentor_reviews', reviews)
  }, [reviews])

  const saveReview = (review) => {
    const next = [
      ...reviews,
      { ...review, id: Date.now(), date: new Date().toISOString() },
    ].slice(-MAX_STORED_REVIEWS)   // cap to avoid QuotaExceededError
    setReviews(next)
    setIsModalOpen(false)
  }

  const triggerReview = (type, delayMs = 2000) => {
    // Cancel any pending trigger so the modal never fires on the wrong page.
    clearTimeout(reviewTimerRef.current)
    setLastAnalysisType(type)
    reviewTimerRef.current = setTimeout(() => setIsModalOpen(true), delayMs)
  }

  const getTopReview = () => {
    if (reviews.length === 0) return null
    return [...reviews].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating
      return new Date(b.date) - new Date(a.date)
    })[0]
  }

  return (
    <ReviewContext.Provider value={{
      reviews,
      isModalOpen,
      setIsModalOpen,
      saveReview,
      triggerReview,
      getTopReview,
      lastAnalysisType,
    }}>
      {children}
    </ReviewContext.Provider>
  )
}

export const useReview = () => useContext(ReviewContext)
