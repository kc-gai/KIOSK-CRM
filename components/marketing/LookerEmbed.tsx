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
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={embedUrl.replace('/embed/reporting/', '/reporting/').replace(/\/page\/.*$/, '')}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            title="Looker Studioで開く"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            title={isExpanded ? '縮小' : '拡大'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <div className="relative" style={{ height: isExpanded ? '80vh' : height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">読み込み中...</span>
            </div>
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allowFullScreen
        />
      </div>
    </div>
  )
}
