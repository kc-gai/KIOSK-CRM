'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useTranslations } from 'next-intl'

type HistoryItem = {
    id: string
    kiosk: { modelName: string, serialNumber: string }
    prevLocation: string | null
    newLocation: string
    eventDate: string
    description: string | null
}

export default function HistoryPage() {
    const t = useTranslations('history')
    const tc = useTranslations('common')
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch('/api/history')
                if (res.ok) {
                    setHistory(await res.json())
                }
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchHistory()
    }, [])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('title')}</h1>

            {isLoading ? (
                <div>{tc('loading')}</div>
            ) : (
                <div className="space-y-3">
                    {history.map(item => (
                        <Card key={item.id}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                        {item.kiosk?.modelName} ({item.kiosk?.serialNumber})
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {item.prevLocation ? `${item.prevLocation} → ` : ''}
                                        <span className="font-medium text-blue-700">{item.newLocation}</span>
                                    </p>
                                    {item.description && <p className="text-xs text-gray-400 mt-1">{item.description}</p>}
                                </div>
                                <div className="text-xs text-gray-500 text-right">
                                    {new Date(item.eventDate).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {history.length === 0 && <p className="text-gray-500">{t('noHistory')}</p>}
                </div>
            )}
        </div>
    )
}
