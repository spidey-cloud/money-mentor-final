import React from 'react'
import './PageSkeleton.css'

export default function PageSkeleton() {
  return (
    <div className="page-skeleton-container" aria-busy="true" aria-label="Loading page content">
      {/* Header Skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-shimmer skeleton-badge" />
        <div className="skeleton-shimmer skeleton-title" />
        <div className="skeleton-shimmer skeleton-subtitle" />
      </div>

      {/* 4 Feature/Stat Cards Grid */}
      <div className="skeleton-stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-card-top">
              <div className="skeleton-shimmer skeleton-icon" />
              <div className="skeleton-shimmer" style={{ width: '50px', height: '18px', borderRadius: '12px' }} />
            </div>
            <div className="skeleton-shimmer skeleton-card-title" />
            <div className="skeleton-shimmer skeleton-card-value" />
            <div className="skeleton-shimmer skeleton-card-foot" />
          </div>
        ))}
      </div>

      {/* Main Content & Chart Skeleton Card */}
      <div className="skeleton-main-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton-shimmer" style={{ width: '220px', height: '24px', borderRadius: '8px' }} />
          <div className="skeleton-shimmer" style={{ width: '90px', height: '32px', borderRadius: '10px' }} />
        </div>

        {/* Simulated Bar Graph */}
        <div className="skeleton-graph-bars">
          {[45, 75, 30, 90, 60, 85, 40, 70, 95, 50, 80, 65].map((height, idx) => (
            <div
              key={idx}
              className="skeleton-shimmer skeleton-bar"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Shimmer Detail Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="skeleton-shimmer skeleton-row" style={{ width: '100%' }} />
          <div className="skeleton-shimmer skeleton-row" style={{ width: '85%' }} />
          <div className="skeleton-shimmer skeleton-row" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  )
}

