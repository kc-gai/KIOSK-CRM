'use client'

import { useState } from 'react'
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react'

type LookerEmbedProps = {
  title: string
  subtitle?: string
  embedUrl: string
  height?: number
}

export default function LookerEmbed({ title, subtitle, embedUrl, height = 450 }: LookerEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="d-flex align-items-center gap-2">
          <a
            href={embedUrl.replace('/embed/reporting/', '/reporting/').replace(/\/page\/.*$/, '')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost-secondary btn-icon btn-sm"
            title="Looker Studioで開く"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-ghost-secondary btn-icon btn-sm"
            title={isExpanded ? '縮小' : '拡大'}
          >
            {isExpanded ? (
              <Minimize2 size={16} />
            ) : (
              <Maximize2 size={16} />
            )}
          </button>
        </div>
      </div>
      <div className="position-relative" style={{ height: isExpanded ? '80vh' : height }}>
        {isLoading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-gray-50">
            <div className="d-flex flex-column align-items-center gap-2">
              <div className="rounded-circle animate-spin" style={{ width: '2rem', height: '2rem', border: '2px solid var(--tblr-primary)', borderTopColor: 'transparent' }} />
              <span className="text-sm text-gray-500">読み込み中...</span>
            </div>
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-100 h-100 border-0"
          onLoad={() => setIsLoading(false)}
          allowFullScreen
        />
      </div>
    </div>
  )
}
