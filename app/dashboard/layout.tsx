import { getTranslations } from "next-intl/server"
import { TopNavigation } from "@/components/TopNavigation"
import { prisma } from "@/lib/prisma"
import AIChatbot from "@/components/ai-chatbot"
import { menuProgress } from "@/lib/dev-progress"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // 실제 세션 확인
    const authSession = await getServerSession(authOptions)

    // 세션이 없으면 로그인 페이지로 리다이렉트
    if (!authSession?.user) {
        redirect("/login")
    }

    // DB에서 사용자 정보 가져오기
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

    // 메뉴 구성 (직접 링크 방식 - 드롭다운 없음)
    const menuItems = [
        { id: 'gate', href: '/', icon: 'ti-layout-grid', label: 'Gate' },
        { id: 'home', href: '/dashboard', icon: 'ti-home', label: t('categoryHome') },
        { id: 'order', href: '/dashboard/order', icon: 'ti-file-invoice', label: t('categoryOrder') },
        { id: 'delivery', href: '/dashboard/delivery-process', icon: 'ti-truck-delivery', label: t('categoryDelivery') },
        { id: 'installation', href: '/dashboard/installation', icon: 'ti-tool', label: t('categoryInstallation') },
        { id: 'assets', href: '/dashboard/assets', icon: 'ti-device-desktop', label: t('categoryAssets') },
        { id: 'statistics', href: '/dashboard/statistics', icon: 'ti-chart-bar', label: t('categoryStatistics') },
        { id: 'clients', href: '/dashboard/clients', icon: 'ti-building-store', label: t('categoryPartners') },
        { id: 'lease', href: '/dashboard/lease-companies', icon: 'ti-file-certificate', label: t('leaseCompanies') },
        { id: 'marketing', href: '/marketing', icon: 'ti-chart-line', label: 'Marketing CRM' },
    ]

    // Admin 드롭다운에 표시할 설정 메뉴 (내부서비스 + 설정)
    const settingsItems = [
        { href: '/dashboard/regions', icon: 'ti-map-pin', label: t('regions'), adminOnly: true, progress: menuProgress['regions'], tooltip: t('tooltipRegions') },
        { href: '/dashboard/repairs', icon: 'ti-tools', label: t('repairs'), progress: menuProgress['repairs'], tooltip: t('tooltipRepairs') },
        { href: '/dashboard/sample-loans', icon: 'ti-package', label: t('sampleLoans'), progress: menuProgress['sample-loans'], tooltip: t('tooltipSampleLoans') },
        { href: '/dashboard/assembly-manual', icon: 'ti-hammer', label: t('assemblyManual'), progress: menuProgress['assembly-manual'], tooltip: t('tooltipAssemblyManual') },
        { href: '/dashboard/manuals', icon: 'ti-book', label: t('manuals'), progress: menuProgress['manuals'], tooltip: t('tooltipManuals') },
        { href: '/dashboard/accounts', icon: 'ti-users', label: t('accounts'), adminOnly: true, progress: menuProgress['accounts'], tooltip: t('tooltipAccounts') },
        { href: '/dashboard/api-settings', icon: 'ti-plug', label: t('apiSettings'), adminOnly: true, progress: menuProgress['api-settings'], tooltip: t('tooltipApiSettings') },
        { href: '/dashboard/dev-tasks', icon: 'ti-list-check', label: t('devTasks'), adminOnly: true, progress: menuProgress['dev-tasks'], tooltip: t('tooltipDevTasks') },
        { href: '/dashboard/work-logs', icon: 'ti-clock-record', label: t('workLogs'), adminOnly: true, tooltip: t('tooltipWorkLogs') },
    ]

    const isAdmin = session?.user?.role === "ADMIN"

    return (
        <div>
            {/* Top Navigation - 직접 링크 방식 */}
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

            {/* Main Content */}
            <div className="main-content-tabs">
                <div className="p-4">
                    {children}
                </div>

                <footer className="py-3 text-center text-muted border-top bg-white">
                    <small>
                        © 2024-2026 KC Unified CRM · Kiosk Module · Powered by KAFLIXCLOUD
                    </small>
                </footer>
            </div>

            {/* AI 챗봇 */}
            <AIChatbot />
        </div>
    )
}
