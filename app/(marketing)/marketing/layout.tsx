'use client'

import './marketing.css'
import Sidebar from '@/components/marketing/Sidebar'
import Header from '@/components/marketing/Header'
import { TranslationProvider } from '@/lib/translations'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TranslationProvider>
      <div className="marketing-module flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TranslationProvider>
  )
}
