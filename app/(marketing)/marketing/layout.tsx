import { getTranslations } from "next-intl/server"
import { TopNavigation } from "@/components/TopNavigation"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MarketingLayoutClient } from "./marketing-layout-client"

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
    const authSession = await getServerSession(authOptions)

    if (!authSession?.user) {
        redirect("/login")
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: authSession.user.email || "" }
    })

    const session = {
        user: {
            email: authSession.user.email || "",
            role: dbUser?.role || "USER",
            name: authSession.user.name || dbUser?.name || "User",
            allowedMenus: dbUser?.allowedMenus ? JSON.parse(dbUser.allowedMenus) : []
        }
    }
    const t = await getTranslations('nav')

    const menuItems = [
        { id: 'gate', href: '/', icon: 'ti-layout-grid', label: 'Gate' },
        { id: 'kiosk', href: '/dashboard', icon: 'ti-device-desktop', label: 'Kiosk CRM' },
        { id: 'home', href: '/marketing', icon: 'ti-chart-line', label: t('marketingHome') },
        { id: 'inbound', href: '/marketing/strategy', icon: 'ti-world', label: t('marketingInbound') },
        { id: 'outbound', href: '/marketing/sales-tracking', icon: 'ti-send', label: t('marketingOutbound') },
        { id: 'analytics', href: '/marketing/kpi', icon: 'ti-chart-bar', label: t('marketingAnalytics') },
    ]

    const settingsItems = [
        { href: '/marketing/dev-tasks', icon: 'ti-list-check', label: t('devTasks'), adminOnly: true },
        { href: '/marketing/work-logs', icon: 'ti-clock-record', label: t('workLogs'), adminOnly: true },
        { href: '/dashboard/api-settings', icon: 'ti-plug', label: t('apiSettings'), adminOnly: true },
    ]

    const isAdmin = session?.user?.role === "ADMIN"

    return (
        <div>
            <TopNavigation
                menuItems={menuItems}
                isAdmin={isAdmin}
                userName={session.user?.name || ''}
                userEmail={session.user?.email || ''}
                userRole={session.user?.role || 'USER'}
                allowedMenus={session.user?.allowedMenus || []}
                settingsItems={settingsItems}
                logoutLabel={t('logout')}
            />

            <div className="main-content-tabs">
                <MarketingLayoutClient>
                    {children}
                </MarketingLayoutClient>

                <footer className="py-3 text-center text-muted border-top bg-white">
                    <small>
                        © 2024-2026 KC Unified CRM · Marketing Module · Powered by KAFLIXCLOUD
                    </small>
                </footer>
            </div>
        </div>
    )
}
