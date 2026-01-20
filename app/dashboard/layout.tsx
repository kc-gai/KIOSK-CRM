import { getTranslations } from "next-intl/server"
import { TopNavigation } from "@/components/TopNavigation"
import { prisma } from "@/lib/prisma"
import AIChatbot from "@/components/ai-chatbot"
import { menuProgress } from "@/lib/dev-progress"

// 기본 관리자 계정 ID (DB에 admin@example.com이 있으면 해당 정보 사용)
const DEFAULT_ADMIN_EMAIL = "admin@example.com"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // DB에서 기본 관리자 계정 정보 가져오기
    const adminUser = await prisma.user.findFirst({
        where: {
            role: "ADMIN",
            isActive: true
        },
        orderBy: { createdAt: 'asc' }
    })

    const session = {
        user: {
            email: adminUser?.email || DEFAULT_ADMIN_EMAIL,
            role: adminUser?.role || "ADMIN",
            name: adminUser?.name || "Admin",
            allowedMenus: adminUser?.allowedMenus ? JSON.parse(adminUser.allowedMenus) : []
        }
    }
    const t = await getTranslations('nav')

    // 신규안건 카운트 (실제로는 DB에서 조회해야 함)
    const newItemCounts: Record<string, number> = {
        'order-process': 3,
        'delivery-process': 2,
        'assets': 0,
    }

    // 카테고리별로 메뉴 구성
    const categories = [
        {
            id: 'home',
            label: t('categoryHome'),
            icon: 'ti-home',
            items: [
                { href: '/dashboard', icon: 'ti-dashboard', label: t('dashboard'), progress: menuProgress['dashboard'] },
                { href: '/dashboard/ai-search', icon: 'ti-sparkles', label: t('aiSearch'), progress: menuProgress['ai-search'] },
            ]
        },
        {
            id: 'process',
            label: t('categoryProcess'),
            icon: 'ti-arrows-exchange',
            items: [
                { href: '/dashboard/order-process', icon: 'ti-file-plus', label: t('orderProcess'), progress: menuProgress['order-process'], newCount: newItemCounts['order-process'] },
                { href: '/dashboard/delivery-status', icon: 'ti-truck-delivery', label: t('deliveryStatus'), progress: menuProgress['delivery-status'], newCount: newItemCounts['delivery-status'] },
                { href: '/dashboard/delivery-process', icon: 'ti-truck', label: t('deliveryProcess'), progress: menuProgress['delivery-process'] },
                { href: '/dashboard/delivery-request', icon: 'ti-mail', label: t('deliveryRequest'), progress: menuProgress['delivery-request'] },
            ]
        },
        {
            id: 'assets',
            label: t('categoryAssets'),
            icon: 'ti-device-desktop',
            items: [
                { href: '/dashboard/assets', icon: 'ti-device-desktop', label: t('assets'), progress: menuProgress['assets'], newCount: newItemCounts['assets'] },
                { href: '/dashboard/repairs', icon: 'ti-settings', label: t('repairs'), progress: menuProgress['repairs'] },
                { href: '/dashboard/sample-loans', icon: 'ti-package', label: t('sampleLoans'), progress: menuProgress['sample-loans'] },
                { href: '/dashboard/history', icon: 'ti-history', label: t('history'), progress: menuProgress['history'] },
            ]
        },
        {
            id: 'statistics',
            label: t('categoryStatistics'),
            icon: 'ti-chart-bar',
            items: [
                { href: '/dashboard/statistics', icon: 'ti-chart-bar', label: t('statistics'), progress: menuProgress['statistics'] },
                { href: '/dashboard/pricing', icon: 'ti-currency-dollar', label: t('pricing'), progress: menuProgress['pricing'] },
            ]
        },
        {
            id: 'partners',
            label: t('categoryPartners'),
            icon: 'ti-building-store',
            items: [
                { href: '/dashboard/clients', icon: 'ti-building-store', label: t('clients'), progress: menuProgress['clients'] },
                { href: '/dashboard/lease-companies', icon: 'ti-file-certificate', label: t('leaseCompanies'), progress: menuProgress['lease-companies'] },
            ]
        },
    ]

    // Admin 드롭다운에 표시할 설정 메뉴 (내부서비스 + 설정)
    const settingsItems = [
        { href: '/dashboard/regions', icon: 'ti-map-pin', label: t('regions'), adminOnly: true, progress: menuProgress['regions'] },
        { href: '/dashboard/assembly-manual', icon: 'ti-tool', label: t('assemblyManual'), progress: menuProgress['assembly-manual'] },
        { href: '/dashboard/manuals', icon: 'ti-book', label: t('manuals'), progress: menuProgress['manuals'] },
        { href: '/dashboard/accounts', icon: 'ti-users', label: t('accounts'), adminOnly: true, progress: menuProgress['accounts'] },
        { href: '/dashboard/api-settings', icon: 'ti-plug', label: t('apiSettings'), adminOnly: true, progress: menuProgress['api-settings'] },
        { href: '/dashboard/dev-tasks', icon: 'ti-list-check', label: t('devTasks'), adminOnly: true, progress: menuProgress['dev-tasks'] },
        { href: '/dashboard/work-logs', icon: 'ti-clock-record', label: t('workLogs'), adminOnly: true },
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
