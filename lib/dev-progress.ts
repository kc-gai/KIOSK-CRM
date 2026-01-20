// 개발 진척도 중앙 관리
// 이 파일을 수정하면 메뉴 진척도와 개발 작업 관리 페이지가 동시에 업데이트됩니다.

export type TaskStatus = 'completed' | 'in_progress' | 'pending' | 'blocked'
export type TaskPriority = 'high' | 'medium' | 'low'

export interface SubTask {
    id: string
    title: string
    completed: boolean
}

export interface DevTask {
    id: string
    title: string
    titleKo: string
    description: string
    descriptionKo: string
    status: TaskStatus
    priority: TaskPriority
    progress: number // 0-100
    category: string
    categoryKo: string
    notes?: string
    notesKo?: string
    relatedMenus?: string[] // layout.tsx의 menuProgress와 연동
    subtasks?: SubTask[]
}

// 메뉴별 진척도 (UI 완성도 기준)
// 100 = 완료, 0-99 = 개발 중
export const menuProgress: Record<string, number> = {
    // 메인
    'dashboard': 100,
    'ai-search': 100,

    // 프로세스
    'order-process': 60,      // 발주 프로세스 - UI 완성, 승인 워크플로우/PDF 생성 미완
    'delivery-process': 50,   // 납품 프로세스 - UI 완성, ERP 연동 미완
    'delivery-request': 100,
    'delivery-status': 100,

    // 자산 관리
    'assets': 100,
    'repairs': 100,
    'sample-loans': 100,
    'history': 100,

    // 통계
    'statistics': 100,
    'pricing': 30,            // 매출 관리 - 기본 UI만 구현

    // 거래처
    'clients': 100,          // 거래처/지점 관리 - 완료
    'lease-companies': 100,
    'fc': 100,
    'partners': 100,

    // 내부 서비스
    'regions': 100,

    // 설정
    'assembly-manual': 20,    // 조립 매뉴얼 - 기본 구조만
    'manuals': 100,
    'accounts': 100,
    'api-settings': 70,       // API 설정 - Calendar/Email 연동 미완
    'dev-tasks': 100,
}

// 개발 작업 목록 (High Priority)
export const devTasks: DevTask[] = [
    {
        id: '1',
        title: 'Google Calendar Integration',
        titleKo: 'Google Calendar 연동',
        description: 'OAuth setup, Calendar API implementation',
        descriptionKo: 'OAuth 설정, Calendar API 호출 구현',
        status: 'pending',
        priority: 'high',
        progress: 20,
        category: 'Integration',
        categoryKo: '연동',
        notes: 'Structure exists - need API call implementation',
        notesKo: '구조만 있음 - API 호출 구현 필요',
        relatedMenus: ['api-settings'],
        subtasks: [
            { id: '1-1', title: 'OAuth client setup', completed: true },
            { id: '1-2', title: 'Google Calendar API activation', completed: true },
            { id: '1-3', title: 'Calendar event query implementation', completed: false },
            { id: '1-4', title: 'Calendar event creation implementation', completed: false },
            { id: '1-5', title: 'Auto-register order/delivery schedules', completed: false },
        ]
    },
    {
        id: '2',
        title: 'Order Process Detail Completion',
        titleKo: '발주 프로세스 상세 완성',
        description: 'Approval workflow, PDF generation',
        descriptionKo: '승인 워크플로우, PDF 생성 추가',
        status: 'in_progress',
        priority: 'high',
        progress: 60,
        category: 'Process',
        categoryKo: '프로세스',
        notes: 'UI implemented - need business logic',
        notesKo: 'UI 구현됨 - 비즈니스 로직 추가 필요',
        relatedMenus: ['order-process'],
        subtasks: [
            { id: '2-1', title: 'Order process UI complete', completed: true },
            { id: '2-2', title: '5-step workflow implementation', completed: true },
            { id: '2-3', title: 'Delivery request generation', completed: true },
            { id: '2-4', title: 'PDF generation/print function', completed: false },
            { id: '2-5', title: 'Approval/rejection workflow', completed: false },
        ]
    },
    {
        id: '3',
        title: 'Delivery Process Detail Completion',
        titleKo: '납품 프로세스 상세 완성',
        description: 'ERP integration, auto-load contract info',
        descriptionKo: 'ERP 연동, 계약 정보 자동 로드',
        status: 'in_progress',
        priority: 'high',
        progress: 50,
        category: 'Process',
        categoryKo: '프로세스',
        notes: 'UI implemented - need ERP integration',
        notesKo: 'UI 구현됨 - ERP 연동 필요',
        relatedMenus: ['delivery-process'],
        subtasks: [
            { id: '3-1', title: 'Delivery process UI complete', completed: true },
            { id: '3-2', title: '2-step workflow implementation', completed: true },
            { id: '3-3', title: 'ERP integration implementation', completed: false },
            { id: '3-4', title: 'Auto-load contract info', completed: false },
            { id: '3-5', title: 'Delivery completion processing', completed: false },
        ]
    },
    {
        id: '4',
        title: 'Email/Slack Notifications',
        titleKo: '이메일/Slack 알림',
        description: 'SMTP setup, template creation, delivery notification',
        descriptionKo: 'SMTP 설정, 템플릿 작성, 납품정보 입력 시 알림',
        status: 'pending',
        priority: 'high',
        progress: 15,
        category: 'Notification',
        categoryKo: '알림',
        notes: 'Nodemailer ready - need config and templates. Add delivery info notification.',
        notesKo: 'Nodemailer 준비됨 - 설정 및 템플릿 필요. 납품정보 입력 시 메일/슬랙 전송 추가',
        relatedMenus: ['api-settings', 'delivery-process'],
        subtasks: [
            { id: '4-1', title: 'Nodemailer setup', completed: true },
            { id: '4-2', title: 'SMTP environment variables', completed: false },
            { id: '4-3', title: 'Email template creation', completed: false },
            { id: '4-4', title: 'Slack Webhook integration', completed: false },
            { id: '4-5', title: 'Notification trigger implementation', completed: false },
            { id: '4-6', title: 'Delivery info email notification', completed: false },
            { id: '4-7', title: 'Delivery info Slack notification', completed: false },
        ]
    },
    {
        id: '5',
        title: 'AI Chatbot Enhancement',
        titleKo: 'AI 채팅 보완',
        description: 'Environment check, conversation history improvement',
        descriptionKo: '환경변수 확인, 대화 히스토리 개선',
        status: 'in_progress',
        priority: 'high',
        progress: 70,
        category: 'AI',
        categoryKo: 'AI',
        notes: 'Basic implementation done - need history improvement',
        notesKo: '기본 구현됨 - 히스토리 개선 필요',
        relatedMenus: ['ai-search'],
        subtasks: [
            { id: '5-1', title: 'OpenAI API integration', completed: true },
            { id: '5-2', title: 'Chat UI implementation', completed: true },
            { id: '5-3', title: 'Environment variables setup', completed: true },
            { id: '5-4', title: 'Conversation history storage', completed: false },
            { id: '5-5', title: 'Context improvement', completed: false },
        ]
    },
    {
        id: '6',
        title: 'ERP System Integration',
        titleKo: 'ERP 시스템 연동',
        description: 'External ERP data synchronization',
        descriptionKo: '외부 ERP 시스템과 데이터 동기화',
        status: 'pending',
        priority: 'medium',
        progress: 0,
        category: 'Integration',
        categoryKo: '연동',
        relatedMenus: ['delivery-process'],
        subtasks: [
            { id: '6-1', title: 'ERP API spec review', completed: false },
            { id: '6-2', title: 'API client implementation', completed: false },
            { id: '6-3', title: 'Data mapping', completed: false },
            { id: '6-4', title: 'Sync logic implementation', completed: false },
        ]
    },
    {
        id: '7',
        title: 'PDF Generation',
        titleKo: 'PDF 생성 기능',
        description: 'Order/delivery document PDF export',
        descriptionKo: '발주서, 납품서 PDF 출력',
        status: 'pending',
        priority: 'medium',
        progress: 10,
        category: 'Feature',
        categoryKo: '기능',
        notes: 'Reviewing react-pdf or puppeteer',
        notesKo: 'react-pdf 또는 puppeteer 검토 중',
        relatedMenus: ['order-process', 'delivery-request'],
        subtasks: [
            { id: '7-1', title: 'PDF library selection', completed: true },
            { id: '7-2', title: 'Order document template design', completed: false },
            { id: '7-3', title: 'Delivery document template design', completed: false },
            { id: '7-4', title: 'PDF generation API implementation', completed: false },
        ]
    },
    {
        id: '8',
        title: 'Dashboard Progress Enhancement',
        titleKo: '대시보드 진척현황 개선',
        description: 'Real-time data display improvement',
        descriptionKo: '실시간 데이터 표시 개선',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        category: 'UI',
        categoryKo: 'UI',
        notes: 'Real-time status added',
        notesKo: '실시간 운영 현황 추가 완료',
        relatedMenus: ['dashboard'],
        subtasks: [
            { id: '8-1', title: 'Real-time status cards', completed: true },
            { id: '8-2', title: 'Chart data integration', completed: true },
            { id: '8-3', title: 'Statistics quick links', completed: true },
        ]
    },
    {
        id: '9',
        title: 'CSV Function Enhancement',
        titleKo: 'CSV 기능 강화',
        description: 'CSV import/export improvement',
        descriptionKo: 'CSV 가져오기/내보내기 개선',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        notes: 'Client CSV import completed',
        notesKo: '거래처 CSV 임포트 구현 완료',
        relatedMenus: ['clients'],
        subtasks: [
            { id: '9-1', title: 'CSV import modal implementation', completed: true },
            { id: '9-2', title: 'CSV parsing logic', completed: true },
            { id: '9-3', title: 'Error handling', completed: true },
            { id: '9-4', title: 'Multilingual CSV support', completed: true },
        ]
    },
    {
        id: '10',
        title: 'Internationalization (i18n)',
        titleKo: '다국어(i18n) 처리',
        description: 'Korean/Japanese multilingual support',
        descriptionKo: '한국어/일본어 다국어 지원',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'UI',
        categoryKo: 'UI',
        notes: 'next-intl applied',
        notesKo: 'next-intl 적용 완료',
        relatedMenus: [],
        subtasks: [
            { id: '10-1', title: 'next-intl setup', completed: true },
            { id: '10-2', title: 'ko.json translation file', completed: true },
            { id: '10-3', title: 'ja.json translation file', completed: true },
            { id: '10-4', title: 'All pages multilingual applied', completed: true },
        ]
    },
    {
        id: '11',
        title: 'Pricing Management',
        titleKo: '매출 관리 완성',
        description: 'Sales/cost management completion',
        descriptionKo: '매출/원가 관리 기능 완성',
        status: 'pending',
        priority: 'medium',
        progress: 30,
        category: 'Feature',
        categoryKo: '기능',
        notes: 'Basic UI only',
        notesKo: '기본 UI만 구현됨',
        relatedMenus: ['pricing'],
        subtasks: [
            { id: '11-1', title: 'Basic UI implementation', completed: true },
            { id: '11-2', title: 'Cost/sale price management', completed: false },
            { id: '11-3', title: 'Margin calculation', completed: false },
            { id: '11-4', title: 'Report generation', completed: false },
        ]
    },
    {
        id: '12',
        title: 'Assembly Manual',
        titleKo: '조립 매뉴얼 완성',
        description: 'Step-by-step assembly guide',
        descriptionKo: '단계별 조립 가이드 기능',
        status: 'pending',
        priority: 'low',
        progress: 20,
        category: 'Feature',
        categoryKo: '기능',
        notes: 'Basic structure only',
        notesKo: '기본 구조만 구현됨',
        relatedMenus: ['assembly-manual'],
        subtasks: [
            { id: '12-1', title: 'Basic page structure', completed: true },
            { id: '12-2', title: 'Step editor implementation', completed: false },
            { id: '12-3', title: 'Image upload function', completed: false },
            { id: '12-4', title: 'Preview function', completed: false },
        ]
    },
    {
        id: '13',
        title: 'Client/Branch Management Enhancement',
        titleKo: '거래처/지점 관리 개선',
        description: 'Branch data import, multilingual display, edit functions',
        descriptionKo: '지점 데이터 임포트, 다국어 표시, 편집 기능 보완',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        notes: 'All features completed',
        notesKo: '모든 기능 완료',
        relatedMenus: ['clients'],
        subtasks: [
            { id: '13-1', title: 'FC/Corp/Branch UI structure', completed: true },
            { id: '13-2', title: 'CSV import function', completed: true },
            { id: '13-3', title: 'Corp/Branch create/edit modals', completed: true },
            { id: '13-4', title: 'Korean/Japanese font support', completed: true },
            { id: '13-5', title: 'Multilingual name display (getDisplayName)', completed: true },
            { id: '13-6', title: 'Branch CSV import - actual data verification', completed: true },
            { id: '13-7', title: 'Branch tab list improvement', completed: true },
            { id: '13-8', title: 'Settings tab save function', completed: true },
            { id: '13-9', title: 'History tab actual data', completed: true },
        ]
    },
]

// 전체 진척도 계산
export function calculateOverallProgress(): number {
    const total = devTasks.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(total / devTasks.length)
}

// 통계 계산
export function getTaskStats() {
    return {
        total: devTasks.length,
        completed: devTasks.filter(t => t.status === 'completed').length,
        inProgress: devTasks.filter(t => t.status === 'in_progress').length,
        pending: devTasks.filter(t => t.status === 'pending').length,
        highPriority: devTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
        overallProgress: calculateOverallProgress(),
    }
}

// 권장 작업 순서
export const recommendedOrder = [
    { id: '1', reason: 'Structure exists, just need API implementation', reasonKo: '이미 구조가 있어서 API 호출만 구현하면 됨' },
    { id: '2', reason: 'UI complete, just add business logic', reasonKo: 'UI 완성되어 있고 비즈니스 로직만 추가' },
    { id: '4', reason: 'Nodemailer ready, need SMTP config', reasonKo: 'Nodemailer 준비됨, SMTP 설정 필요' },
    { id: '7', reason: 'Required for order/delivery document printing', reasonKo: '발주서/납품서 출력을 위해 필요' },
    { id: '6', reason: 'External system integration, lower priority', reasonKo: '외부 시스템 연동으로 후순위' },
]
