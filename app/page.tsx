import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { GateClient } from "./gate-client"

export default async function GatePage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    const t = await getTranslations()

    // 키오스크 모듈 요약 데이터
    const [totalKiosks, deployedKiosks, pendingOrders, totalCorporations] = await Promise.all([
        prisma.kiosk.count(),
        prisma.kiosk.count({ where: { status: 'DEPLOYED' } }),
        prisma.orderProcess.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.corporation.count(),
    ])

    // 마케팅 모듈 요약 데이터
    const [totalCompanies, emailsSent, contentPlans, workLogs] = await Promise.all([
        prisma.company.count(),
        prisma.emailLog.count({ where: { status: 'SENT' } }),
        prisma.contentPlan.count(),
        prisma.workLog.count({ where: { module: 'marketing' } }),
    ])

    const kioskStats = {
        totalKiosks,
        deployedKiosks,
        pendingOrders,
        totalCorporations,
    }

    const marketingStats = {
        totalCompanies,
        emailsSent,
        contentPlans,
        workLogs,
    }

    return (
        <GateClient
            userName={session.user.name || 'User'}
            userEmail={session.user.email || ''}
            kioskStats={kioskStats}
            marketingStats={marketingStats}
        />
    )
}
