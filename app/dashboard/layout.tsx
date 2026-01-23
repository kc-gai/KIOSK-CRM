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

    // 카테고리별로 메뉴 구성 (프로세스 흐름: 발주 → 납품 → 설치 → 통계)
    const categories = [
        {
            id: 'home',
            label: t('categoryHome'),
            icon: 'ti-home',
            items: [
                { href: '/dashboard', icon: 'ti-dashboard', label: t('dashboard'), progress: menuProgress['dashboard'], tooltip: t('tooltipDashboard') },
                { href: '/dashboard/ai-search', icon: 'ti-sparkles', label: t('aiSearch'), progress: menuProgress['ai-search'], tooltip: t('tooltipAiSearch') },
            ]
        },
        {
            id: 'order',
            label: t('categoryOrder'),
            icon: 'ti-file-invoice',
            tooltip: t('tooltipCategoryOrder'),
            items: [
                { href: '/dashboard/order', icon: 'ti-file-plus', label: t('orderProcess'), progress: menuProgress['order-process'], tooltip: t('tooltipOrderProcess') },
                { href: '/dashboard/delivery-status', icon: 'ti-list-check', label: t('deliveryStatus'), progress: menuProgress['delivery-status'], tooltip: t('tooltipDeliveryStatus') },
            ]
        },
        {
            id: 'delivery',
            label: t('categoryDelivery'),
            icon: 'ti-truck-delivery',
            tooltip: t('tooltipCategoryDelivery'),
            items: [
                { href: '/dashboard/delivery-process', icon: 'ti-truck', label: t('deliveryProcess'), progress: menuProgress['delivery-process'], tooltip: t('tooltipDeliveryProcess') },
            ]
        },
        {
            id: 'installation',
            label: t('categoryInstallation'),
            icon: 'ti-tool',
            tooltip: t('tooltipCategoryInstallation'),
            items: [
                { href: '/dashboard/installation', icon: 'ti-check', label: t('installation'), progress: menuProgress['installation'], tooltip: t('tooltipInstallation') },
            ]
        },
        {
            id: 'assets',
            label: t('categoryAssets'),
            icon: 'ti-device-desktop',
            tooltip: t('tooltipCategoryAssets'),
            items: [
                { href: '/dashboard/assets', icon: 'ti-device-desktop', label: t('assets'), progress: menuProgress['assets'], tooltip: t('tooltipAssets') },
                { href: '/dashboard/history', icon: 'ti-history', label: t('history'), progress: menuProgress['history'], tooltip: t('tooltipHistory') },
            ]
        },
        {
            id: 'statistics',
            label: t('categoryStatistics'),
            icon: 'ti-chart-bar',
            tooltip: t('tooltipCategoryStatistics'),
            items: [
                { href: '/dashboard/statistics', icon: 'ti-chart-bar', label: t('statistics'), progress: menuProgress['statistics'], tooltip: t('tooltipStatistics') },
                { href: '/dashboard/pricing', icon: 'ti-currency-dollar', label: t('pricing'), progress: menuProgress['pricing'], tooltip: t('tooltipPricing') },
            ]
        },
        {
            id: 'partners',
            label: t('categoryPartners'),
            icon: 'ti-building-store',
            items: [
                { href: '/dashboard/clients', icon: 'ti-building-store', label: t('clients'), progress: menuProgress['clients'], tooltip: t('tooltipClients') },
                { href: '/dashboard/lease-companies', icon: 'ti-file-certificate', label: t('leaseCompanies'), progress: menuProgress['lease-companies'], tooltip: t('tooltipLeaseCompanies') },
            ]
        },
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
            {/* Top Navigation with Categories and Tabs */}
            <TopNavigation
                categories={categories}
                isAdmin={isAdmin}
                userName={session.user?.name || ''}
                userEmail={session.user?.email || ''}
                userRole={session.user?.role || 'USER'}
                allowedMenus={session.user?.allowedMenus || []}
                tabHomeLabel={t('tabHome')}
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
                        © 2024 Kiosk Asset CRM v1.0.0 · Developed by gai · Powered by KAFLIXCLOUD
                    </small>
                </footer>
            </div>

            {/* AI 챗봇 */}
            <AIChatbot />
        </div>
    )
}
