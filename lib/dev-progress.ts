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
    titleJa: string
    description: string
    descriptionKo: string
    descriptionJa: string
    status: TaskStatus
    priority: TaskPriority
    progress: number // 0-100
    category: string
    categoryKo: string
    categoryJa: string
    notes?: string
    notesKo?: string
    notesJa?: string
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
        titleJa: 'Google Calendar連携',
        description: 'OAuth setup, Calendar API implementation',
        descriptionKo: 'OAuth 설정, Calendar API 호출 구현',
        descriptionJa: 'OAuth設定、Calendar API実装',
        status: 'in_progress',
        priority: 'high',
        progress: 40, // 2/5 subtasks
        category: 'Integration',
        categoryKo: '연동',
        categoryJa: '連携',
        notes: 'Structure exists - need API call implementation',
        notesKo: '구조만 있음 - API 호출 구현 필요',
        notesJa: '構造は存在 - API呼び出し実装が必要',
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
        titleJa: '発注プロセス詳細完成',
        description: 'Approval workflow, PDF generation',
        descriptionKo: '승인 워크플로우, PDF 생성 추가',
        descriptionJa: '承認ワークフロー、PDF生成',
        status: 'in_progress',
        priority: 'high',
        progress: 60, // 3/5 subtasks
        category: 'Process',
        categoryKo: '프로세스',
        categoryJa: 'プロセス',
        notes: 'UI implemented - need business logic',
        notesKo: 'UI 구현됨 - 비즈니스 로직 추가 필요',
        notesJa: 'UI実装済み - ビジネスロジック追加必要',
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
        titleJa: '納品プロセス詳細完成',
        description: 'ERP integration, auto-load contract info',
        descriptionKo: 'ERP 연동, 계약 정보 자동 로드',
        descriptionJa: 'ERP連携、契約情報自動ロード',
        status: 'in_progress',
        priority: 'high',
        progress: 40, // 2/5 subtasks
        category: 'Process',
        categoryKo: '프로세스',
        categoryJa: 'プロセス',
        notes: 'UI implemented - need ERP integration',
        notesKo: 'UI 구현됨 - ERP 연동 필요',
        notesJa: 'UI実装済み - ERP連携必要',
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
        titleJa: 'メール/Slack通知',
        description: 'SMTP setup, template creation, delivery notification',
        descriptionKo: 'SMTP 설정, 템플릿 작성, 납품정보 입력 시 알림',
        descriptionJa: 'SMTP設定、テンプレート作成、納品通知',
        status: 'in_progress',
        priority: 'high',
        progress: 14, // 1/7 subtasks
        category: 'Notification',
        categoryKo: '알림',
        categoryJa: '通知',
        notes: 'Nodemailer ready - need config and templates. Add delivery info notification.',
        notesKo: 'Nodemailer 준비됨 - 설정 및 템플릿 필요. 납품정보 입력 시 메일/슬랙 전송 추가',
        notesJa: 'Nodemailer準備済み - 設定とテンプレート必要。納品情報入力時通知追加',
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
        titleJa: 'AIチャットボット改善',
        description: 'Environment check, conversation history improvement',
        descriptionKo: '환경변수 확인, 대화 히스토리 개선',
        descriptionJa: '環境変数確認、会話履歴改善',
        status: 'in_progress',
        priority: 'high',
        progress: 60, // 3/5 subtasks
        category: 'AI',
        categoryKo: 'AI',
        categoryJa: 'AI',
        notes: 'Basic implementation done - need history improvement',
        notesKo: '기본 구현됨 - 히스토리 개선 필요',
        notesJa: '基本実装完了 - 履歴改善必要',
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
        titleJa: 'ERPシステム連携',
        description: 'External ERP data synchronization',
        descriptionKo: '외부 ERP 시스템과 데이터 동기화',
        descriptionJa: '外部ERPシステムとデータ同期',
        status: 'pending',
        priority: 'medium',
        progress: 0, // 0/4 subtasks
        category: 'Integration',
        categoryKo: '연동',
        categoryJa: '連携',
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
        titleJa: 'PDF生成機能',
        description: 'Order/delivery document PDF export',
        descriptionKo: '발주서, 납품서 PDF 출력',
        descriptionJa: '発注書、納品書PDF出力',
        status: 'in_progress',
        priority: 'medium',
        progress: 25, // 1/4 subtasks
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        notes: 'Reviewing react-pdf or puppeteer',
        notesKo: 'react-pdf 또는 puppeteer 검토 중',
        notesJa: 'react-pdfまたはpuppeteer検討中',
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
        titleJa: 'ダッシュボード進捗改善',
        description: 'Real-time data display improvement',
        descriptionKo: '실시간 데이터 표시 개선',
        descriptionJa: 'リアルタイムデータ表示改善',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        category: 'UI',
        categoryKo: 'UI',
        categoryJa: 'UI',
        notes: 'Real-time status added',
        notesKo: '실시간 운영 현황 추가 완료',
        notesJa: 'リアルタイム運用状況追加完了',
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
        titleJa: 'CSV機能強化',
        description: 'CSV import/export improvement',
        descriptionKo: 'CSV 가져오기/내보내기 개선',
        descriptionJa: 'CSVインポート/エクスポート改善',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        notes: 'Client CSV import completed',
        notesKo: '거래처 CSV 임포트 구현 완료',
        notesJa: '取引先CSVインポート実装完了',
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
        titleJa: '多言語(i18n)対応',
        description: 'Korean/Japanese multilingual support',
        descriptionKo: '한국어/일본어 다국어 지원',
        descriptionJa: '韓国語/日本語多言語サポート',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'UI',
        categoryKo: 'UI',
        categoryJa: 'UI',
        notes: 'next-intl applied',
        notesKo: 'next-intl 적용 완료',
        notesJa: 'next-intl適用完了',
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
        titleJa: '売上管理完成',
        description: 'Sales/cost management completion',
        descriptionKo: '매출/원가 관리 기능 완성',
        descriptionJa: '売上/原価管理機能完成',
        status: 'in_progress',
        priority: 'medium',
        progress: 25, // 1/4 subtasks
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        notes: 'Basic UI only',
        notesKo: '기본 UI만 구현됨',
        notesJa: '基本UIのみ実装',
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
        titleJa: '組立マニュアル完成',
        description: 'Step-by-step assembly guide',
        descriptionKo: '단계별 조립 가이드 기능',
        descriptionJa: 'ステップバイステップ組立ガイド',
        status: 'in_progress',
        priority: 'low',
        progress: 25, // 1/4 subtasks
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        notes: 'Basic structure only',
        notesKo: '기본 구조만 구현됨',
        notesJa: '基本構造のみ実装',
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
        titleJa: '取引先/支店管理改善',
        description: 'Branch data import, multilingual display, edit functions',
        descriptionKo: '지점 데이터 임포트, 다국어 표시, 편집 기능 보완',
        descriptionJa: '支店データインポート、多言語表示、編集機能補完',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        notes: 'All features completed',
        notesKo: '모든 기능 완료',
        notesJa: '全機能完了',
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

// 서브태스크 기반 진척도 계산
export function calculateTaskProgress(task: DevTask): number {
    if (!task.subtasks || task.subtasks.length === 0) {
        return task.progress
    }
    const completedCount = task.subtasks.filter(st => st.completed).length
    return Math.round((completedCount / task.subtasks.length) * 100)
}

// 전체 진척도 계산 (서브태스크 기반)
export function calculateOverallProgress(): number {
    const total = devTasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0)
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
    { id: '1', reason: 'Structure exists, just need API implementation', reasonKo: '이미 구조가 있어서 API 호출만 구현하면 됨', reasonJa: '構造が存在、API実装のみ必要' },
    { id: '2', reason: 'UI complete, just add business logic', reasonKo: 'UI 완성되어 있고 비즈니스 로직만 추가', reasonJa: 'UI完成済み、ビジネスロジック追加のみ' },
    { id: '4', reason: 'Nodemailer ready, need SMTP config', reasonKo: 'Nodemailer 준비됨, SMTP 설정 필요', reasonJa: 'Nodemailer準備済み、SMTP設定必要' },
    { id: '7', reason: 'Required for order/delivery document printing', reasonKo: '발주서/납품서 출력을 위해 필요', reasonJa: '発注書/納品書出力に必要' },
    { id: '6', reason: 'External system integration, lower priority', reasonKo: '외부 시스템 연동으로 후순위', reasonJa: '外部システム連携で後順位' },
]
