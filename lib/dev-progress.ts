// 개발 진척도 중앙 관리
// 이 파일을 수정하면 메뉴 진척도와 개발 작업 관리 페이지가 동시에 업데이트됩니다.

export type TaskStatus = 'completed' | 'in_progress' | 'pending' | 'blocked'
export type TaskPriority = 'high' | 'medium' | 'low'

// 프로세스 카테고리 정의 (발주 → 납품 → 설치 → 자산 → 통계 → 거래처 → 공통)
export type ProcessCategory = 'order' | 'delivery' | 'installation' | 'assets' | 'statistics' | 'partners' | 'common'

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
    processCategory: ProcessCategory // 프로세스 카테고리 추가
    notes?: string
    notesKo?: string
    notesJa?: string
    relatedMenus?: string[] // layout.tsx의 menuProgress와 연동
    subtasks?: SubTask[]
}

// 프로세스 카테고리 정보
export const processCategories: Record<ProcessCategory, {
    label: string
    labelKo: string
    labelJa: string
    icon: string
    description: string
    descriptionKo: string
    descriptionJa: string
    stakeholders: string
    stakeholdersKo: string
    stakeholdersJa: string
    integrations: string[]
}> = {
    order: {
        label: 'Order Process',
        labelKo: '발주',
        labelJa: '発注',
        icon: 'ti-file-invoice',
        description: 'Order management through status and list',
        descriptionKo: '발주를 통한 상태 및 리스트 관리',
        descriptionJa: '発注による状態およびリスト管理',
        stakeholders: 'Sales, General Management',
        stakeholdersKo: '영업, 통괄관리',
        stakeholdersJa: '営業、統括管理',
        integrations: ['Jobcan API', 'Gmail', 'Google Calendar']
    },
    delivery: {
        label: 'Delivery Process',
        labelKo: '납품',
        labelJa: '納品',
        icon: 'ti-truck-delivery',
        description: 'Kiosk manufacturer (Ooe Electric) preparation status and delivery management',
        descriptionKo: '키오스크 생산업체(오오에전기)의 준비 상태 및 배송 상황 관리',
        descriptionJa: 'キオスクメーカー(オオエ電機)の準備状況および配送状況管理',
        stakeholders: 'Ooe Electric, General Management',
        stakeholdersKo: '오오에전기 담당, 통괄관리',
        stakeholdersJa: 'オオエ電機担当、統括管理',
        integrations: ['Gmail', 'Google Calendar']
    },
    installation: {
        label: 'Installation Process',
        labelKo: '설치',
        labelJa: '設置',
        icon: 'ti-tool',
        description: 'Installation completion check and management at branch locations',
        descriptionKo: '설치 지점에 설치완료 여부를 체크 및 관리',
        descriptionJa: '設置拠点の設置完了チェックおよび管理',
        stakeholders: 'CS Team',
        stakeholdersKo: 'CS팀',
        stakeholdersJa: 'CSチーム',
        integrations: ['GitHub']
    },
    assets: {
        label: 'Asset Management',
        labelKo: '자산',
        labelJa: '資産',
        icon: 'ti-device-desktop',
        description: 'Kiosk asset integrated management',
        descriptionKo: '키오스크 자산 통합 관리 (자산목록, 이력관리)',
        descriptionJa: 'キオスク資産統合管理（資産一覧、履歴管理）',
        stakeholders: 'General Management',
        stakeholdersKo: '통괄관리부',
        stakeholdersJa: '統括管理部',
        integrations: []
    },
    statistics: {
        label: 'Statistics Process',
        labelKo: '통계',
        labelJa: '統計',
        icon: 'ti-chart-bar',
        description: 'Check and integrate status from order/delivery/installation for statistics',
        descriptionKo: '발주/납품/설치의 상태를 체크하고 통합하여 통계 처리',
        descriptionJa: '発注/納品/設置の状態を確認し統合して統計処理',
        stakeholders: 'Management, All Employees',
        stakeholdersKo: '경영자 및 전사원',
        stakeholdersJa: '経営者および全社員',
        integrations: []
    },
    partners: {
        label: 'Partner Management',
        labelKo: '거래처',
        labelJa: '取引先',
        icon: 'ti-building-store',
        description: 'FC, corporation, branch and lease company management',
        descriptionKo: 'FC, 법인, 지점 및 리스회사 관리',
        descriptionJa: 'FC、法人、支店およびリース会社管理',
        stakeholders: 'Sales, General Management',
        stakeholdersKo: '영업, 통괄관리',
        stakeholdersJa: '営業、統括管理',
        integrations: []
    },
    common: {
        label: 'Common Features',
        labelKo: '공통 기능',
        labelJa: '共通機能',
        icon: 'ti-settings',
        description: 'Common features across all processes',
        descriptionKo: '모든 프로세스에 공통으로 적용되는 기능',
        descriptionJa: '全プロセスに共通で適用される機能',
        stakeholders: 'All Users',
        stakeholdersKo: '전체 사용자',
        stakeholdersJa: '全ユーザー',
        integrations: []
    }
}

// 메뉴별 진척도 (UI 완성도 기준)
// 100 = 완료, 0-99 = 개발 중
export const menuProgress: Record<string, number> = {
    // 메인
    'dashboard': 100,
    'ai-search': 100,

    // 프로세스
    'order-process': 100,     // 발주 프로세스 - 핵심 기능 완료 (UI, PDF, 상세페이지, API)
    'delivery-process': 50,   // 납품 프로세스 - UI 완성, ERP 연동 미완
    'delivery-request': 100,
    'delivery-status': 100,

    // 자산 관리
    'assets': 100,
    'repairs': 100,
    'sample-loans': 100,
    'history': 100,           // 이력 관리 - 완료
    'installation': 0,        // 설치 관리 - 미구현

    // 통계
    'statistics': 100,
    'pricing': 75,            // 매출 관리 - 원가/판매가/마진 관리 구현, 리포트만 미완

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
    'api-settings': 80,       // API 설정 - Email SMTP 완료, Calendar OAuth 완료, 이벤트 연동만 미완
    'dev-tasks': 100,
}

// 개발 작업 목록 - 프로세스 카테고리별 정리
// 프로세스: 발주(order) → 납품(delivery) → 설치(installation) → 통계(statistics)
export const devTasks: DevTask[] = [
    // ========== 발주 프로세스 (Order) ==========
    {
        id: 'order-1',
        title: 'Order Process Detail Completion',
        titleKo: '발주 프로세스 상세 완성',
        titleJa: '発注プロセス詳細完成',
        description: 'Order info → Approval → PDF → Detail page flow',
        descriptionKo: '정보입력 → 품의번호입력 → PDF생성 → 상세페이지 흐름 완성',
        descriptionJa: '情報入力→稟議番号入力→PDF生成→詳細ページフロー完成',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'Process',
        categoryKo: '프로세스',
        categoryJa: 'プロセス',
        processCategory: 'order',
        notes: 'Core order process fully completed - UI, detail page, PDF, API all done',
        notesKo: '발주 핵심 프로세스 완료 - UI, 상세페이지, PDF, API 모두 완성',
        notesJa: '発注コアプロセス完了 - UI、詳細ページ、PDF、API全完成',
        relatedMenus: ['order-process'],
        subtasks: [
            { id: 'order-1-1', title: '정보입력 UI 완성', completed: true },
            { id: 'order-1-2', title: '품의번호 입력 기능 (상세페이지)', completed: true },
            { id: 'order-1-3', title: '발주의뢰서 상세 페이지', completed: true },
            { id: 'order-1-4', title: '목록→상세 네비게이션 (단계/번호 클릭)', completed: true },
            { id: 'order-1-5', title: 'PDF 생성 (브라우저 인쇄)', completed: true },
        ]
    },
    {
        id: 'order-2',
        title: 'Jobcan Approval System Integration',
        titleKo: 'Jobcan 품의 시스템 API 연동',
        titleJa: 'Jobcan稟議システムAPI連携',
        description: 'Jobcan approval workflow integration - approval status auto-sync',
        descriptionKo: 'Jobcan 품의 시스템 API 연동 - 승인/반려 상태 자동 조회',
        descriptionJa: 'Jobcan稟議システムAPI連携 - 承認/却下状態自動照会',
        status: 'in_progress',
        priority: 'high',
        progress: 50,
        category: 'Integration',
        categoryKo: '연동',
        categoryJa: '連携',
        processCategory: 'order',
        notes: 'Full code + UI complete (individual sync, bulk sync, settings). Real Jobcan API token needed for testing.',
        notesKo: '코드+UI 전체 완료 (개별/일괄 동기화, 설정). 실제 Jobcan API 토큰 설정 후 테스트 필요',
        notesJa: 'コード+UI全体完了（個別/一括同期、設定）。実際のJobcan APIトークン設定後テスト必要',
        relatedMenus: ['api-settings', 'order-process'],
        subtasks: [
            { id: 'order-2-1', title: 'API 클라이언트 코드 작성 (lib/jobcan.ts)', completed: true },
            { id: 'order-2-2', title: '개별 동기화 API + UI 버튼 (approval-sync)', completed: true },
            { id: 'order-2-3', title: '일괄 동기화 API + UI 버튼 (sync-all)', completed: true },
            { id: 'order-2-4', title: 'API 설정 페이지 (토큰 입력, 연결 테스트)', completed: true },
            { id: 'order-2-5', title: 'Jobcan API 토큰 설정 및 연결 테스트', completed: false },
            { id: 'order-2-6', title: '실제 품의번호로 승인상태 동기화 테스트', completed: false },
        ]
    },
    {
        id: 'order-3',
        title: 'Google Calendar Integration (Order)',
        titleKo: 'Google Calendar 연동 (발주)',
        titleJa: 'Google Calendar連携（発注）',
        description: 'Order schedule registration to Calendar',
        descriptionKo: '발주 일정 Google Calendar 등록',
        descriptionJa: '発注日程Google Calendar登録',
        status: 'in_progress',
        priority: 'high',
        progress: 50,
        category: 'Integration',
        categoryKo: '연동',
        categoryJa: '連携',
        processCategory: 'order',
        notes: 'Full code complete (create/update/delete events, UI display). Google Service Account needed for testing.',
        notesKo: '코드 전체 완료 (생성/수정/삭제 이벤트, UI 표시). Google Service Account 설정 후 테스트 필요',
        notesJa: 'コード全体完了（作成/更新/削除イベント、UI表示）。Google Service Account設定後テスト必要',
        relatedMenus: ['api-settings'],
        subtasks: [
            { id: 'order-3-1', title: 'Calendar API 클라이언트 코드 (CRUD)', completed: true },
            { id: 'order-3-2', title: '발주 생성 시 캘린더 이벤트 자동 등록', completed: true },
            { id: 'order-3-3', title: '납기일 수정 시 캘린더 이벤트 업데이트', completed: true },
            { id: 'order-3-4', title: '발주 삭제 시 캘린더 이벤트 삭제', completed: true },
            { id: 'order-3-5', title: '상세페이지 캘린더 연동 정보 표시', completed: true },
            { id: 'order-3-6', title: 'Google Service Account 설정 및 연결 테스트', completed: false },
            { id: 'order-3-7', title: '실제 발주 시 캘린더 이벤트 동작 확인', completed: false },
        ]
    },
    {
        id: 'order-4',
        title: 'Gmail Integration (Order)',
        titleKo: 'Gmail 연동 (발주)',
        titleJa: 'Gmail連携（発注）',
        description: 'Order notification email via Gmail',
        descriptionKo: '발주 관련 알림 이메일 발송',
        descriptionJa: '発注関連通知メール送信',
        status: 'in_progress',
        priority: 'high',
        progress: 50,
        category: 'Notification',
        categoryKo: '알림',
        categoryJa: '通知',
        processCategory: 'order',
        notes: 'Full code + UI + templates complete. Real SMTP credentials needed for testing.',
        notesKo: '코드+UI+템플릿 전체 완료. 실제 SMTP 인증정보 설정 후 테스트 필요',
        notesJa: 'コード+UI+テンプレート全体完了。実際のSMTP認証情報設定後テスト必要',
        relatedMenus: ['api-settings'],
        subtasks: [
            { id: 'order-4-1', title: 'Nodemailer + SMTP 발송 코드', completed: true },
            { id: 'order-4-2', title: '발주 통지 메일 템플릿 + API', completed: true },
            { id: 'order-4-3', title: '승인/반려 알림 메일 템플릿 + 자동발송', completed: true },
            { id: 'order-4-4', title: '상세페이지 발송 버튼 + 상태 표시', completed: true },
            { id: 'order-4-5', title: 'API 설정 페이지 (SMTP, 테스트 메일)', completed: true },
            { id: 'order-4-6', title: 'SMTP 계정 설정 및 연결 테스트', completed: false },
            { id: 'order-4-7', title: '실제 발주 통지 메일 발송/수신 확인', completed: false },
        ]
    },

    // ========== 납품 프로세스 (Delivery) ==========
    {
        id: 'delivery-1',
        title: 'Delivery Process Detail Completion',
        titleKo: '납품 프로세스 상세 완성',
        titleJa: '納品プロセス詳細完成',
        description: 'Delivery info input (serial, Anydesk)',
        descriptionKo: '배송정보 입력 (시리얼, Anydesk No) 기능 완성',
        descriptionJa: '配送情報入力（シリアル、Anydesk No）機能完成',
        status: 'in_progress',
        priority: 'high',
        progress: 40,
        category: 'Process',
        categoryKo: '프로세스',
        categoryJa: 'プロセス',
        processCategory: 'delivery',
        notes: 'UI implemented - need delivery info features',
        notesKo: 'UI 구현됨 - 배송정보 기능 필요',
        notesJa: 'UI実装済み - 配送情報機能必要',
        relatedMenus: ['delivery-process'],
        subtasks: [
            { id: 'delivery-1-1', title: '납품 프로세스 UI 완성', completed: true },
            { id: 'delivery-1-2', title: '발주 리스트 연동', completed: true },
            { id: 'delivery-1-3', title: '배송일 입력', completed: false },
            { id: 'delivery-1-4', title: '키오스크 시리얼 입력', completed: false },
            { id: 'delivery-1-5', title: 'Anydesk No 입력', completed: false },
        ]
    },
    {
        id: 'delivery-2',
        title: 'Gmail Integration (Delivery)',
        titleKo: 'Gmail 연동 (납품)',
        titleJa: 'Gmail連携（納品）',
        description: 'Delivery notification to Ooe Electric',
        descriptionKo: '오오에전기 담당자 배송 알림',
        descriptionJa: 'オオエ電機担当者配送通知',
        status: 'pending',
        priority: 'high',
        progress: 0,
        category: 'Notification',
        categoryKo: '알림',
        categoryJa: '通知',
        processCategory: 'delivery',
        relatedMenus: ['api-settings', 'delivery-process'],
        subtasks: [
            { id: 'delivery-2-1', title: '납품 알림 템플릿', completed: false },
            { id: 'delivery-2-2', title: '배송 완료 알림', completed: false },
            { id: 'delivery-2-3', title: '담당자 이메일 목록 관리', completed: false },
        ]
    },
    {
        id: 'delivery-3',
        title: 'Google Calendar Integration (Delivery)',
        titleKo: 'Google Calendar 연동 (납품)',
        titleJa: 'Google Calendar連携（納品）',
        description: 'Delivery schedule registration',
        descriptionKo: '배송 일정 Calendar 등록',
        descriptionJa: '配送日程Calendar登録',
        status: 'pending',
        priority: 'medium',
        progress: 0,
        category: 'Integration',
        categoryKo: '연동',
        categoryJa: '連携',
        processCategory: 'delivery',
        relatedMenus: ['api-settings'],
        subtasks: [
            { id: 'delivery-3-1', title: '배송일 이벤트 생성', completed: false },
            { id: 'delivery-3-2', title: '도착예정일 알림', completed: false },
        ]
    },

    // ========== 설치 프로세스 (Installation) ==========
    {
        id: 'installation-1',
        title: 'Installation Management Page',
        titleKo: '설치 관리 페이지 개발',
        titleJa: '設置管理ページ開発',
        description: 'Installation completion check and management',
        descriptionKo: '설치 완료 체크 및 관리 페이지',
        descriptionJa: '設置完了チェックおよび管理ページ',
        status: 'pending',
        priority: 'high',
        progress: 0,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'installation',
        relatedMenus: ['installation'],
        subtasks: [
            { id: 'installation-1-1', title: '설치 관리 페이지 UI', completed: false },
            { id: 'installation-1-2', title: '납품 완료 리스트 연동', completed: false },
            { id: 'installation-1-3', title: '설치 완료 체크 기능', completed: false },
            { id: 'installation-1-4', title: '설치 일자/담당자 입력', completed: false },
        ]
    },
    {
        id: 'installation-2',
        title: 'GitHub Integration',
        titleKo: 'GitHub 연동',
        titleJa: 'GitHub連携',
        description: 'Auto-create GitHub issue for statistics request',
        descriptionKo: '설치 완료 시 개발팀에 통계요청 이슈 자동 생성',
        descriptionJa: '設置完了時開発チームに統計要請Issue自動作成',
        status: 'pending',
        priority: 'high',
        progress: 0,
        category: 'Integration',
        categoryKo: '연동',
        categoryJa: '連携',
        processCategory: 'installation',
        relatedMenus: ['api-settings', 'installation'],
        subtasks: [
            { id: 'installation-2-1', title: 'GitHub API 연동', completed: false },
            { id: 'installation-2-2', title: '이슈 템플릿 작성', completed: false },
            { id: 'installation-2-3', title: '자동 이슈 생성 기능', completed: false },
            { id: 'installation-2-4', title: '이슈 상태 동기화', completed: false },
        ]
    },

    // ========== 자산 관리 (Assets) ==========
    {
        id: 'assets-1',
        title: 'Asset List Management',
        titleKo: '자산 목록 관리',
        titleJa: '資産一覧管理',
        description: 'Kiosk asset list CRUD and display',
        descriptionKo: '키오스크 자산 목록 CRUD 및 표시',
        descriptionJa: 'キオスク資産一覧CRUDおよび表示',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'assets',
        notes: 'Fully implemented',
        notesKo: '완전 구현됨',
        notesJa: '完全実装済み',
        relatedMenus: ['assets'],
        subtasks: [
            { id: 'assets-1-1', title: '자산 목록 UI', completed: true },
            { id: 'assets-1-2', title: '필터/검색 기능', completed: true },
            { id: 'assets-1-3', title: '인라인 편집', completed: true },
            { id: 'assets-1-4', title: '페이지네이션', completed: true },
            { id: 'assets-1-5', title: '컬럼 토글', completed: true },
        ]
    },
    {
        id: 'assets-2',
        title: 'Asset Detail Page',
        titleKo: '자산 상세 페이지',
        titleJa: '資産詳細ページ',
        description: 'Kiosk individual asset detail view',
        descriptionKo: '키오스크 개별 자산 상세 조회',
        descriptionJa: 'キオスク個別資産詳細照会',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'assets',
        notes: 'Fully implemented',
        notesKo: '완전 구현됨',
        notesJa: '完全実装済み',
        relatedMenus: ['assets'],
        subtasks: [
            { id: 'assets-2-1', title: '상세 정보 표시', completed: true },
            { id: 'assets-2-2', title: '이동 이력 표시', completed: true },
            { id: 'assets-2-3', title: '이동 등록 기능', completed: true },
            { id: 'assets-2-4', title: '기본 정보 편집', completed: true },
        ]
    },
    {
        id: 'assets-3',
        title: 'History Page Enhancement',
        titleKo: '이력 페이지 고도화',
        titleJa: '履歴ページ高度化',
        description: 'Enhance history page with filters and search',
        descriptionKo: '이력 페이지 필터/검색 기능 추가',
        descriptionJa: '履歴ページフィルター/検索機能追加',
        status: 'completed',
        priority: 'low',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'assets',
        notes: 'Fully implemented',
        notesKo: '완전 구현됨',
        notesJa: '完全実装済み',
        relatedMenus: ['history'],
        subtasks: [
            { id: 'assets-3-1', title: '기본 목록 표시', completed: true },
            { id: 'assets-3-2', title: '날짜 필터', completed: true },
            { id: 'assets-3-3', title: '이동유형 필터', completed: true },
            { id: 'assets-3-4', title: '키오스크 검색', completed: true },
        ]
    },

    // ========== 통계 프로세스 (Statistics) ==========
    {
        id: 'statistics-1',
        title: 'Integrated Statistics Dashboard',
        titleKo: '통합 통계 대시보드',
        titleJa: '統合統計ダッシュボード',
        description: 'Order/Delivery/Installation integrated statistics',
        descriptionKo: '발주/납품/설치 현황 통합 통계',
        descriptionJa: '発注/納品/設置状況統合統計',
        status: 'in_progress',
        priority: 'high',
        progress: 60,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'statistics',
        notes: 'Dashboard charts complete, delivery stats included, installation module not yet built',
        notesKo: '대시보드 차트 완성, 납품 현황 포함, 설치 모듈 미구현',
        notesJa: 'ダッシュボードチャート完成、納品現況含む、設置モジュール未実装',
        relatedMenus: ['statistics', 'dashboard'],
        subtasks: [
            { id: 'statistics-1-1', title: '대시보드 기본 통계', completed: true },
            { id: 'statistics-1-2', title: '발주 현황 통계', completed: true },
            { id: 'statistics-1-3', title: '납품 현황 통계 (배송율 등)', completed: true },
            { id: 'statistics-1-4', title: '설치 현황 통계', completed: false },
            { id: 'statistics-1-5', title: '통합 리포트 (CSV 외 추가)', completed: false },
        ]
    },
    {
        id: 'statistics-2',
        title: 'Pricing Management',
        titleKo: '매출 관리 완성',
        titleJa: '売上管理完成',
        description: 'Sales/cost management completion',
        descriptionKo: '매출/원가 관리 기능 완성',
        descriptionJa: '売上/原価管理機能完成',
        status: 'in_progress',
        priority: 'medium',
        progress: 75,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'statistics',
        notes: 'CRUD complete with cost/price/margin - report generation pending',
        notesKo: '원가/판매가/마진 관리 구현 완료 - 리포트 생성만 미완',
        notesJa: '原価/販売価格/マージン管理実装完了 - レポート生成のみ未完',
        relatedMenus: ['pricing'],
        subtasks: [
            { id: 'statistics-2-1', title: '기본 UI 구현', completed: true },
            { id: 'statistics-2-2', title: '원가/판매가 관리', completed: true },
            { id: 'statistics-2-3', title: '마진 계산', completed: true },
            { id: 'statistics-2-4', title: '리포트 생성', completed: false },
        ]
    },

    // ========== 거래처 관리 (Partners) ==========
    {
        id: 'partners-1',
        title: 'FC/Corporation/Branch Management',
        titleKo: 'FC/법인/지점 관리',
        titleJa: 'FC/法人/支店管理',
        description: 'Client hierarchy management',
        descriptionKo: 'FC → 법인 → 지점 계층 구조 관리',
        descriptionJa: 'FC→法人→支店階層構造管理',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'partners',
        notes: 'Fully implemented',
        notesKo: '완전 구현됨',
        notesJa: '完全実装済み',
        relatedMenus: ['clients'],
        subtasks: [
            { id: 'partners-1-1', title: 'FC 목록 및 편집', completed: true },
            { id: 'partners-1-2', title: '법인 목록 및 편집', completed: true },
            { id: 'partners-1-3', title: '지점 목록 및 편집', completed: true },
            { id: 'partners-1-4', title: 'CSV 임포트', completed: true },
            { id: 'partners-1-5', title: '다국어 이름 지원', completed: true },
        ]
    },
    {
        id: 'partners-2',
        title: 'Lease Company Management',
        titleKo: '리스회사 관리',
        titleJa: 'リース会社管理',
        description: 'Lease company CRUD',
        descriptionKo: '리스회사 등록/수정/삭제',
        descriptionJa: 'リース会社登録/修正/削除',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'partners',
        notes: 'Fully implemented',
        notesKo: '완전 구현됨',
        notesJa: '完全実装済み',
        relatedMenus: ['lease-companies'],
        subtasks: [
            { id: 'partners-2-1', title: '리스회사 목록', completed: true },
            { id: 'partners-2-2', title: '리스회사 등록', completed: true },
            { id: 'partners-2-3', title: '리스회사 편집', completed: true },
            { id: 'partners-2-4', title: '기본 수수료 설정', completed: true },
        ]
    },

    // ========== 공통 기능 (Common) ==========
    {
        id: 'common-1',
        title: 'PDF Generation',
        titleKo: 'PDF 생성 기능',
        titleJa: 'PDF生成機能',
        description: 'Order/delivery document PDF export',
        descriptionKo: '발주서, 납품서 PDF 출력',
        descriptionJa: '発注書、納品書PDF出力',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'common',
        notes: 'Order PDF: browser print + html2canvas/jsPDF download implemented',
        notesKo: '발주서 PDF: 브라우저 인쇄 + html2canvas/jsPDF 다운로드 구현 완료',
        notesJa: '発注書PDF: ブラウザ印刷 + html2canvas/jsPDFダウンロード実装完了',
        relatedMenus: ['order-process', 'delivery-request'],
        subtasks: [
            { id: 'common-1-1', title: 'PDF 방식 선정 (브라우저 인쇄)', completed: true },
            { id: 'common-1-2', title: '발주서 PDF 페이지', completed: true },
            { id: 'common-1-3', title: 'PDF 다운로드 (html2canvas + jsPDF)', completed: true },
            { id: 'common-1-4', title: '납품서 PDF (납품 프로세스에서 처리)', completed: true },
        ]
    },
    {
        id: 'common-2',
        title: 'AI Chatbot Enhancement',
        titleKo: 'AI 채팅 보완',
        titleJa: 'AIチャットボット改善',
        description: 'Environment check, conversation history improvement',
        descriptionKo: '환경변수 확인, 대화 히스토리 개선',
        descriptionJa: '環境変数確認、会話履歴改善',
        status: 'in_progress',
        priority: 'medium',
        progress: 60,
        category: 'AI',
        categoryKo: 'AI',
        categoryJa: 'AI',
        processCategory: 'common',
        notes: 'Basic implementation done - need history improvement',
        notesKo: '기본 구현됨 - 히스토리 개선 필요',
        notesJa: '基本実装完了 - 履歴改善必要',
        relatedMenus: ['ai-search'],
        subtasks: [
            { id: 'common-2-1', title: 'OpenAI API 연동', completed: true },
            { id: 'common-2-2', title: '채팅 UI 구현', completed: true },
            { id: 'common-2-3', title: '환경변수 설정', completed: true },
            { id: 'common-2-4', title: '대화 히스토리 저장', completed: false },
            { id: 'common-2-5', title: '컨텍스트 개선', completed: false },
        ]
    },
    {
        id: 'common-3',
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
        processCategory: 'common',
        notes: 'next-intl applied',
        notesKo: 'next-intl 적용 완료',
        notesJa: 'next-intl適用完了',
        relatedMenus: [],
        subtasks: [
            { id: 'common-3-1', title: 'next-intl 설정', completed: true },
            { id: 'common-3-2', title: 'ko.json 번역 파일', completed: true },
            { id: 'common-3-3', title: 'ja.json 번역 파일', completed: true },
            { id: 'common-3-4', title: '전체 페이지 다국어 적용', completed: true },
        ]
    },
    {
        id: 'common-4',
        title: 'Client/Branch Management',
        titleKo: '거래처/지점 관리',
        titleJa: '取引先/支店管理',
        description: 'Branch data import, multilingual display',
        descriptionKo: '지점 데이터 임포트, 다국어 표시',
        descriptionJa: '支店データインポート、多言語表示',
        status: 'completed',
        priority: 'high',
        progress: 100,
        category: 'Feature',
        categoryKo: '기능',
        categoryJa: '機能',
        processCategory: 'common',
        notes: 'All features completed',
        notesKo: '모든 기능 완료',
        notesJa: '全機能完了',
        relatedMenus: ['clients'],
        subtasks: [
            { id: 'common-4-1', title: 'FC/법인/지점 UI 구조', completed: true },
            { id: 'common-4-2', title: 'CSV 임포트 기능', completed: true },
            { id: 'common-4-3', title: '법인/지점 생성/편집 모달', completed: true },
            { id: 'common-4-4', title: '다국어 이름 표시', completed: true },
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

// 프로세스별 통계 계산
export function getProcessStats(processCategory: ProcessCategory) {
    const processTasks = devTasks.filter(t => t.processCategory === processCategory)
    const total = processTasks.length
    const completed = processTasks.filter(t => t.status === 'completed').length
    const inProgress = processTasks.filter(t => t.status === 'in_progress').length
    const pending = processTasks.filter(t => t.status === 'pending').length
    const progress = total > 0
        ? Math.round(processTasks.reduce((sum, t) => sum + calculateTaskProgress(t), 0) / total)
        : 0
    return { total, completed, inProgress, pending, progress }
}

// 권장 작업 순서 (프로세스 흐름 기준) - 2026-02-09 업데이트
// 코드가 있어도 실제 연동 테스트가 안 된 것은 미완성
export const recommendedOrder = [
    { id: 'order-2', reason: 'Jobcan API token setup + real test', reasonKo: 'Jobcan API 토큰 설정 및 실제 연동 테스트', reasonJa: 'Jobcan APIトークン設定および実連動テスト' },
    { id: 'order-4', reason: 'SMTP setup + email send test', reasonKo: 'SMTP 설정 및 메일 발송 테스트', reasonJa: 'SMTP設定およびメール送信テスト' },
    { id: 'order-3', reason: 'Google Calendar setup + event test', reasonKo: 'Google Calendar 설정 및 이벤트 등록 테스트', reasonJa: 'Google Calendar設定およびイベント登録テスト' },
    { id: 'delivery-1', reason: 'Delivery serial/Anydesk input', reasonKo: '납품 시리얼/Anydesk 입력 기능', reasonJa: '納品シリアル/Anydesk入力機能' },
    { id: 'installation-1', reason: 'Installation management page', reasonKo: '설치 관리 페이지 개발', reasonJa: '設置管理ページ開発' },
    { id: 'statistics-1', reason: 'Complete installation stats', reasonKo: '설치 현황 통계 완성', reasonJa: '設置現況統計完成' },
]
