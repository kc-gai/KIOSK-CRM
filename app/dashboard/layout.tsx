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
            id: 'order',
            label: t('categoryOrder'),
            icon: 'ti-file-plus',
            items: [
                { href: '/dashboard/order', icon: 'ti-file-plus', label: t('orderProcess'), progress: menuProgress['order-process'] },
                { href: '/dashboard/delivery-status', icon: 'ti-list-check', label: t('deliveryStatus'), progress: menuProgress['delivery-status'] },
                { href: '/dashboard/order-process', icon: 'ti-archive', label: t('orderProcessOld'), progress: menuProgress['order-process'] },
            ]
        },
        {
            id: 'delivery',
            label: t('categoryDelivery'),
            icon: 'ti-truck',
            items: [
                { href: '/dashboard/delivery-process', icon: 'ti-truck', label: t('deliveryProcess'), progress: menuProgress['delivery-process'] },
                { href: '/dashboard/delivery-request', icon: 'ti-mail', label: t('deliveryRequest'), progress: menuProgress['delivery-request'] },
            ]
        },
        {
            id: 'assets',
            label: t('categoryAssets'),
            icon: 'ti-device-desktop',
            items: [
                { href: '/dashboard/assets', icon: 'ti-device-desktop', label: t('assets'), progress: menuProgress['assets'] },
                { href: '/dashboard/repairs', icon: 'ti-tool', label: t('repairs'), progress: menuProgress['repairs'] },
                { href: '/dashboard/sample-loans', icon: 'ti-package', label: t('sampleLoans'), progress: menuProgress['sample-loans'] },
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
