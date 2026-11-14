import { MessageSquare, Star, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useReview } from '../context/ReviewContext'
import './ReviewModal.css'

// No preset list needed — user can type any Indian city

export default function ReviewModal() {
  const { isModalOpen, setIsModalOpen, saveReview, lastAnalysisType } = useReview()
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [city, setCity] = useState('')
  const [name, setName] = useState('')

  if (!isModalOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (rating === 0) return

    const cityName = city.trim() || 'India'
    const reviewerName = name.trim() || user?.name || user?.email?.split('@')[0] || 'MoneyMentor Investor'

    saveReview({
      rating,
      comment,
      type: lastAnalysisType || 'Financial Assessment',
      userName: reviewerName,
      city: cityName,
      country: 'IN',
      // lat/lng resolved later in globe-reviews using the city lookup table
      lat: null,
      lng: null,
      role: 'Verified Investor'
    })

    // Reset state
    setRating(0)
    setComment('')
    setName('')
  }

  return (
    <div className="review-modal-overlay animate-fade-in">
      <div className="review-modal glass-card animate-scale-in">
        <button className="review-close" onClick={() => setIsModalOpen(false)}>
          <X size={20} />
        </button>

        <div className="review-icon-wrap">
          <MessageSquare size={32} />
        </div>

        <h2>Great insights?</h2>
        <p>How would you rate your {lastAnalysisType || 'financial planning'} experience?</p>

        <form onSubmit={handleSubmit}>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${(hover || rating) >= star ? 'active' : ''}`}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={32}
                  fill={(hover || rating) >= star ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Your Name
              </label>
              <input
                type="text"
                placeholder={user?.name || "e.g. Vikram Sharma"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Your City
              </label>
              <input
                type="text"
                placeholder="e.g. Jaipur, Surat, Nagpur..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          <textarea
            className="review-textarea"
            placeholder="Tell us what you liked (or what we could improve)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          ></textarea>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={rating === 0}
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  )
}
