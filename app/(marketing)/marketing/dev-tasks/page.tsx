'use client'

import React, { useState, useMemo } from 'react'
import { useTranslation } from '@/lib/translations'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Filter,
  BarChart3,
  Mail,
  Globe,
  Send,
  LineChart,
  Settings,
  Code2,
  LayoutDashboard,
  CalendarDays,
  Target,
  PenTool,
  RefreshCw,
  FileText,
  TrendingUp,
} from 'lucide-react'

// ==========================================
// Types
// ==========================================

type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
type TaskStatus = 'completed' | 'in_progress' | 'pending'
type CategoryIcon = 'dashboard' | 'globe' | 'send' | 'chart' | 'code' | 'calendar' | 'settings'

interface SubTask {
  id: string
  title: string
  titleJa: string
  status: TaskStatus
}

interface DevTask {
  id: string
  title: string
  titleJa: string
  description: string
  descriptionJa: string
  priority: Priority
  status: TaskStatus
  progress: number
  subTasks: SubTask[]
  tags: string[]
  tagsJa?: string[]
  dependencies?: string[]
  dependenciesJa?: string[]
}

interface SubMenu {
  id: string
  name: string
  nameJa: string
  icon: React.FC<{ className?: string; size?: number }>
  tasks: DevTask[]
}

interface DevCategory {
  id: string
  title: string
  titleKo: string
  icon: CategoryIcon
  color: string
  description: string
  descriptionKo: string
  subMenus: SubMenu[]
}

// ==========================================
// Data — 사이드바 메뉴 기준 구조
// ==========================================

const DEV_CATEGORIES: DevCategory[] = [
  // ─────────────────────────────────────
  // 1. 대시보드
  // ─────────────────────────────────────
  {
    id: 'dashboard',
    title: 'ダッシュボード',
    titleKo: '대시보드',
    icon: 'dashboard',
    color: '#206bc4',
    description: 'SEOパフォーマンス概要・Looker Studio連携・KPIサマリー',
    descriptionKo: 'SEO 퍼포먼스 개요, Looker Studio 연동, KPI 요약',
    subMenus: [
      {
        id: 'dashboard-main',
        name: '메인 대시보드',
        nameJa: 'メインダッシュボード',
        icon: LayoutDashboard,
        tasks: [
          {
            id: 'dash-1',
            title: 'Looker Studio 임베드 (GA4/GSC)',
            titleJa: 'Looker Studio埋め込み (GA4/GSC)',
            description: 'GA4 리포트 + Search Console 리포트 임베드',
            descriptionJa: 'GA4レポート + Search Consoleレポート埋め込み',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'dash-1-1', title: 'GA4 리포트 임베드', titleJa: 'GA4レポート埋め込み', status: 'completed' },
              { id: 'dash-1-2', title: 'GSC 리포트 임베드', titleJa: 'GSCレポート埋め込み', status: 'completed' },
            ],
            tags: ['Looker Studio'],
          },
          {
            id: 'dash-2',
            title: 'KPI 요약 카드 (노출, 클릭, CTR, 순위)',
            titleJa: 'KPIサマリーカード（表示回数, クリック, CTR, 順位）',
            description: '핵심 지표 카드 6개 + 전기 대비 변화율',
            descriptionJa: '主要指標カード6個 + 前期比変化率',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'dash-2-1', title: '지표 카드 UI', titleJa: '指標カードUI', status: 'completed' },
              { id: 'dash-2-2', title: '전기 대비 변화율 표시', titleJa: '前期比変化率表示', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
          {
            id: 'dash-3',
            title: '디바이스별 분포 / 지역별 클릭 차트',
            titleJa: 'デバイス別分布 / 地域別クリックチャート',
            description: '디바이스 원형 차트, 해외 지역별 클릭 현황',
            descriptionJa: 'デバイス円グラフ、海外地域別クリック現況',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'dash-3-1', title: '디바이스 원형 차트', titleJa: 'デバイス円グラフ', status: 'completed' },
              { id: 'dash-3-2', title: '지역별 클릭 차트', titleJa: '地域別クリックチャート', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
          {
            id: 'dash-4',
            title: 'AI 인용 스코어 모니터링',
            titleJa: 'AI引用スコアモニタリング',
            description: 'Perplexity/Bing/ChatGPT/Gemini 인용 스코어 추적',
            descriptionJa: 'Perplexity/Bing/ChatGPT/Gemini引用スコア追跡',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'dash-4-1', title: 'AI 인용 DB 모델', titleJa: 'AI引用DBモデル', status: 'completed' },
              { id: 'dash-4-2', title: '스코어 입력 + 표시 UI', titleJa: 'スコア入力 + 表示UI', status: 'completed' },
            ],
            tags: ['Prisma', '프론트엔드 (100%)'], tagsJa: ['Prisma', 'フロントエンド (100%)'],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────
  // 2. 인바운드
  // ─────────────────────────────────────
  {
    id: 'inbound',
    title: 'インバウンド',
    titleKo: '인바운드',
    icon: 'globe',
    color: '#2fb344',
    description: 'SEOコンテンツ戦略・制作・最適化・分析',
    descriptionKo: 'SEO 콘텐츠 전략, 제작, 최적화, 분석',
    subMenus: [
      {
        id: 'content-strategy',
        name: '콘텐츠 전략',
        nameJa: 'コンテンツ戦略',
        icon: Target,
        tasks: [
          {
            id: 'cs-1',
            title: 'SEO 전략 대시보드',
            titleJa: 'SEO戦略ダッシュボード',
            description: '방향성 A/B/AEO 전략 카드, 연계상품 매핑',
            descriptionJa: '方向性A/B/AEO戦略カード、連携商品マッピング',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'cs-1-1', title: '3가지 전략 방향성 카드', titleJa: '3つの戦略方向性カード', status: 'completed' },
              { id: 'cs-1-2', title: '연계 상품 매핑', titleJa: '連携商品マッピング', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
          {
            id: 'cs-2',
            title: '시즌 선행 계획',
            titleJa: 'シーズン先行計画',
            description: '2개월 전 공개 원칙, 분기별 중점 테마',
            descriptionJa: '2ヶ月前公開原則、四半期別重点テーマ',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'cs-2-1', title: '시즌 타임라인 UI', titleJa: 'シーズンタイムラインUI', status: 'completed' },
              { id: 'cs-2-2', title: '분기별 테마 관리', titleJa: '四半期別テーマ管理', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
          {
            id: 'cs-3',
            title: '데이터 기반 전략 수정',
            titleJa: 'データ基盤の戦略修正',
            description: '3개월 데이터에서 전략 수정 포인트 도출',
            descriptionJa: '3ヶ月データからの戦略修正ポイント',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'cs-3-1', title: '인사이트 카드 UI', titleJa: 'インサイトカードUI', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
        ],
      },
      {
        id: 'content-production',
        name: '콘텐츠 제작',
        nameJa: 'コンテンツ制作',
        icon: PenTool,
        tasks: [
          {
            id: 'cp-1',
            title: '기사 제작 파이프라인',
            titleJa: '記事制作パイプライン',
            description: '기획→작성→검수 워크플로우, 상태 관리',
            descriptionJa: '企画→作成→検収ワークフロー、状態管理',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'cp-1-1', title: '기사 제작 UI', titleJa: '記事制作UI', status: 'completed' },
              { id: 'cp-1-2', title: '상태 관리 (계획/작성/검수/발행)', titleJa: '状態管理（計画/作成/検収/発行）', status: 'completed' },
            ],
            tags: ['Prisma', '프론트엔드 (100%)'], tagsJa: ['Prisma', 'フロントエンド (100%)'],
          },
          {
            id: 'cp-2',
            title: '콘텐츠 캘린더',
            titleJa: 'コンテンツカレンダー',
            description: '월별 발행 일정, 카테고리별 필터',
            descriptionJa: '月別発行日程、カテゴリ別フィルター',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'cp-2-1', title: '캘린더 뷰', titleJa: 'カレンダービュー', status: 'completed' },
              { id: 'cp-2-2', title: '월별 발행 통계', titleJa: '月別発行統計', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
        ],
      },
      {
        id: 'content-optimization',
        name: '콘텐츠 최적화',
        nameJa: 'コンテンツ最適化',
        icon: RefreshCw,
        tasks: [
          {
            id: 'co-1',
            title: 'AI 영향 분석 (고노출·저CTR)',
            titleJa: 'AI影響分析（高表示・低CTR）',
            description: 'AI 검색에 답변을 빼앗긴 기사 감지',
            descriptionJa: 'AI検索に回答を取られた記事の検出',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'co-1-1', title: 'Looker Studio 필터 뷰', titleJa: 'Looker Studioフィルタービュー', status: 'completed' },
            ],
            tags: ['Looker Studio'],
          },
          {
            id: 'co-2',
            title: '리라이팅 관리',
            titleJa: 'リライト管理',
            description: '대상 기사 등록, CTR 변화 추적, 상태 관리',
            descriptionJa: '対象記事登録、CTR変化追跡、状態管理',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'co-2-1', title: '리라이팅 대상 CRUD', titleJa: 'リライト対象CRUD', status: 'completed' },
              { id: 'co-2-2', title: 'CTR 변화 추적', titleJa: 'CTR変化追跡', status: 'completed' },
            ],
            tags: ['Prisma', '프론트엔드 (100%)'], tagsJa: ['Prisma', 'フロントエンド (100%)'],
          },
          {
            id: 'co-3',
            title: 'CTR 개선 + 최적화 제안',
            titleJa: 'CTR改善 + 最適化提案',
            description: 'CTR 분석 대시보드, 최적화 제안 엔진, A/B 테스트',
            descriptionJa: 'CTR分析ダッシュボード、最適化提案エンジン、A/Bテスト',
            priority: 'MEDIUM', status: 'in_progress', progress: 70,
            subTasks: [
              { id: 'co-3-1', title: 'CTR 분석 대시보드', titleJa: 'CTR分析ダッシュボード', status: 'completed' },
              { id: 'co-3-2', title: '최적화 제안 엔진', titleJa: '最適化提案エンジン', status: 'in_progress' },
              { id: 'co-3-3', title: 'A/B 테스트 추적', titleJa: 'A/Bテスト追跡', status: 'pending' },
            ],
            tags: ['프론트엔드 (70%)'], tagsJa: ['フロントエンド (70%)'],
          },
          {
            id: 'co-4',
            title: '2단 콘텐츠 구조 가이드',
            titleJa: '2段コンテンツ構造ガイド',
            description: 'AI 인용용 섹션 + 클릭 유도 섹션 가이드',
            descriptionJa: 'AI引用用セクション + クリック誘導セクションガイド',
            priority: 'LOW', status: 'completed', progress: 100,
            subTasks: [
              { id: 'co-4-1', title: '구조 가이드 UI', titleJa: '構造ガイドUI', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
        ],
      },
      {
        id: 'seo-analysis',
        name: 'SEO 분석',
        nameJa: 'SEO分析',
        icon: FileText,
        tasks: [
          {
            id: 'sa-1',
            title: '검색 성과 리포트',
            titleJa: '検索成果レポート',
            description: '키워드별 노출/클릭/CTR/순위 리포트',
            descriptionJa: 'キーワード別表示/クリック/CTR/順位レポート',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'sa-1-1', title: 'SEO 리포트 페이지', titleJa: 'SEOレポートページ', status: 'completed' },
              { id: 'sa-1-2', title: '검색 쿼리 분석', titleJa: '検索クエリ分析', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────
  // 3. 아웃바운드
  // ─────────────────────────────────────
  {
    id: 'outbound',
    title: 'アウトバウンド',
    titleKo: '아웃바운드',
    icon: 'send',
    color: '#206bc4',
    description: '営業リスト管理・メール一括送信・コールドメール・問合せフォーム',
    descriptionKo: '영업 리스트 관리, 이메일 일괄 발송, 콜드이메일, 문의폼',
    subMenus: [
      {
        id: 'sales-list',
        name: '영업 리스트 관리',
        nameJa: '営業リスト管理',
        icon: Send,
        tasks: [
          {
            id: 'sl-1',
            title: 'Google Sheets 연동 + 자동감지',
            titleJa: 'Google Sheets連携 + 自動検出',
            description: 'CSV 파싱, 컬럼 자동감지(detectColumnMap), 10개 지역',
            descriptionJa: 'CSVパース、カラム自動検出(detectColumnMap)、10地域',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'sl-1-1', title: 'CSV 파싱 엔진', titleJa: 'CSVパースエンジン', status: 'completed' },
              { id: 'sl-1-2', title: '시트별 컬럼 자동감지', titleJa: 'シート別カラム自動検出', status: 'completed' },
              { id: 'sl-1-3', title: '10개 지역 시트 매핑', titleJa: '10地域シートマッピング', status: 'completed' },
              { id: 'sl-1-4', title: '날짜 파싱 (전각＠ 대응)', titleJa: '日付パース（全角＠対応）', status: 'completed' },
            ],
            tags: ['Google Sheets', 'API (100%)'],
          },
          {
            id: 'sl-2',
            title: 'Company CRUD + DB',
            titleJa: 'Company CRUD + DB',
            description: 'Prisma 모델, CRUD API, localStorage→DB, SNS 필드',
            descriptionJa: 'Prismaモデル、CRUD API、localStorage→DB、SNSフィールド',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'sl-2-1', title: 'Prisma 모델 (Company, ContactRecord)', titleJa: 'Prismaモデル (Company, ContactRecord)', status: 'completed' },
              { id: 'sl-2-2', title: 'CRUD API (/api/companies)', titleJa: 'CRUD API (/api/companies)', status: 'completed' },
              { id: 'sl-2-3', title: 'localStorage → DB 마이그레이션', titleJa: 'localStorage→DBマイグレーション', status: 'completed' },
              { id: 'sl-2-4', title: 'SNS 필드 (LINE/Instagram 등)', titleJa: 'SNSフィールド (LINE/Instagram等)', status: 'completed' },
            ],
            tags: ['Prisma', 'API (100%)'],
          },
          {
            id: 'sl-3',
            title: '영업 필터 + 통계',
            titleJa: '営業フィルター + 統計',
            description: '진척상태/연락횟수/보류·실주 필터, 지역별 통계',
            descriptionJa: '進捗状態/連絡回数/保留・失注フィルター、地域別統計',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'sl-3-1', title: '진척상태별 필터', titleJa: '進捗状態別フィルター', status: 'completed' },
              { id: 'sl-3-2', title: '보류·실주 필터', titleJa: '保留・失注フィルター', status: 'completed' },
              { id: 'sl-3-3', title: '지역별/오피스별 통계', titleJa: '地域別/オフィス別統計', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
          {
            id: 'sl-4',
            title: '편집 후 리스트 위치 유지 + email/contactUrl 분리',
            titleJa: '編集後リスト位置維持 + email/contactUrl分離',
            description: 'DB 오버라이드 위치 유지, 전각＠ 정규화',
            descriptionJa: 'DBオーバーライド位置維持、全角＠正規化',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'sl-4-1', title: 'mergedCompanies 위치 유지', titleJa: 'mergedCompanies位置維持', status: 'completed' },
              { id: 'sl-4-2', title: 'email/contactUrl 분리', titleJa: 'email/contactUrl分離', status: 'completed' },
              { id: 'sl-4-3', title: '전각＠ 정규화', titleJa: '全角＠正規化', status: 'completed' },
            ],
            tags: ['버그 수정'], tagsJa: ['バグ修正'],
          },
          {
            id: 'sl-5',
            title: 'Pipedrive 연동',
            titleJa: 'Pipedrive連携',
            description: 'Pipedrive API 리드/딜 동기화, 매칭',
            descriptionJa: 'Pipedrive APIリード/ディール同期、マッチング',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'sl-5-1', title: 'Pipedrive API 연동', titleJa: 'Pipedrive API連携', status: 'completed' },
              { id: 'sl-5-2', title: 'Sheets ↔ Pipedrive 매칭', titleJa: 'Sheets ↔ Pipedriveマッチング', status: 'completed' },
            ],
            tags: ['API (100%)'],
          },
        ],
      },
      {
        id: 'email-sending',
        name: '이메일 발송',
        nameJa: 'メール送信',
        icon: Mail,
        tasks: [
          {
            id: 'em-1',
            title: 'Gmail API 설정 + 발송',
            titleJa: 'Gmail API設定 + 送信',
            description: 'Service Account DWD, 발송 API, 템플릿 변수',
            descriptionJa: 'Service Account DWD、送信API、テンプレート変数',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'em-1-1', title: 'Service Account DWD 설정', titleJa: 'Service Account DWD設定', status: 'completed' },
              { id: 'em-1-2', title: '발송 API (/api/email-send)', titleJa: '送信API (/api/email-send)', status: 'completed' },
              { id: 'em-1-3', title: '템플릿 변수 치환', titleJa: 'テンプレート変数置換', status: 'completed' },
            ],
            tags: ['Gmail', 'API (100%)'],
          },
          {
            id: 'em-2',
            title: '일괄 이메일 발송 (BulkEmail)',
            titleJa: '一括メール送信 (BulkEmail)',
            description: '3단계 위자드, 템플릿 관리, 발송 로그, 블랙리스트',
            descriptionJa: '3ステップウィザード、テンプレート管理、送信ログ、ブラックリスト',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'em-2-1', title: '3단계 위자드 UI', titleJa: '3ステップウィザードUI', status: 'completed' },
              { id: 'em-2-2', title: '이메일 템플릿 관리', titleJa: 'メールテンプレート管理', status: 'completed' },
              { id: 'em-2-3', title: '발송 로그 + 대시보드', titleJa: '送信ログ + ダッシュボード', status: 'completed' },
              { id: 'em-2-4', title: '블랙리스트 관리', titleJa: 'ブラックリスト管理', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
          {
            id: 'em-3',
            title: 'Gmail 회신 감지 + Slack 알림',
            titleJa: 'Gmail返信検知 + Slack通知',
            description: '수신함 회신 체크, Slack 알림, DWD 스코프',
            descriptionJa: '受信トレイ返信チェック、Slack通知、DWDスコープ',
            priority: 'HIGH', status: 'in_progress', progress: 60,
            subTasks: [
              { id: 'em-3-1', title: '회신 감지 API', titleJa: '返信検知API', status: 'completed' },
              { id: 'em-3-2', title: '리스트 내 회신확인 버튼', titleJa: 'リスト内返信確認ボタン', status: 'completed' },
              { id: 'em-3-3', title: 'Slack 알림 연동', titleJa: 'Slack通知連携', status: 'in_progress' },
              { id: 'em-3-4', title: 'Gmail DWD gmail.readonly 스코프', titleJa: 'Gmail DWD gmail.readonlyスコープ', status: 'pending' },
            ],
            tags: ['API (80%)', 'Slack'], tagsJa: ['API (80%)', 'Slack'],
            dependencies: ['Gmail DWD 스코프 추가 필요'], dependenciesJa: ['Gmail DWDスコープ追加が必要'],
          },
          {
            id: 'em-4',
            title: '이메일 이력 통합 뷰',
            titleJa: 'メール履歴統合ビュー',
            description: 'EmailHistoryPanel - 발송/회신 이력 통합',
            descriptionJa: 'EmailHistoryPanel - 送信/返信履歴統合',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'em-4-1', title: 'EmailHistoryPanel', titleJa: 'EmailHistoryPanel', status: 'completed' },
              { id: 'em-4-2', title: '발송 로그 + 회신 통합', titleJa: '送信ログ + 返信統合', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
        ],
      },
      {
        id: 'cold-email',
        name: '콜드이메일 / 문의',
        nameJa: 'コールドメール / 問合せ',
        icon: FileText,
        tasks: [
          {
            id: 'ce-1',
            title: '콜드이메일 실적 기록',
            titleJa: 'コールドメール実績記録',
            description: '월별 지역별 이메일/문의 건수 기록 및 집계',
            descriptionJa: '月別地域別メール/問合せ件数記録・集計',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'ce-1-1', title: '월별 실적 입력 UI', titleJa: '月別実績入力UI', status: 'completed' },
              { id: 'ce-1-2', title: '지역코드별 집계', titleJa: '地域コード別集計', status: 'completed' },
              { id: 'ce-1-3', title: 'DB 저장 API', titleJa: 'DB保存API', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)', 'API (100%)'], tagsJa: ['フロントエンド (100%)', 'API (100%)'],
          },
          {
            id: 'ce-2',
            title: '문의폼 반자동 입력',
            titleJa: '問合せフォーム半自動入力',
            description: 'HP 문의폼 자동 채우기 (form-filler)',
            descriptionJa: 'HP問合せフォーム自動入力 (form-filler)',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'ce-2-1', title: 'form-filler 라이브러리', titleJa: 'form-fillerライブラリ', status: 'completed' },
              { id: 'ce-2-2', title: '리스트 내 문의폼 버튼', titleJa: 'リスト内問合せフォームボタン', status: 'completed' },
            ],
            tags: ['라이브러리 (100%)'], tagsJa: ['ライブラリ (100%)'],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────
  // 4. 애널리틱스
  // ─────────────────────────────────────
  {
    id: 'analytics',
    title: 'アナリティクス',
    titleKo: '애널리틱스',
    icon: 'chart',
    color: '#ae3ec9',
    description: 'GA4・Search Console連携、KPI追跡、Looker Studioレポート',
    descriptionKo: 'GA4, Search Console 연동, KPI 추적, Looker Studio 리포트',
    subMenus: [
      {
        id: 'performance',
        name: '퍼포먼스 현황',
        nameJa: 'パフォーマンス現況',
        icon: TrendingUp,
        tasks: [
          {
            id: 'pf-1',
            title: 'Looker Studio 리포트 연동',
            titleJa: 'Looker Studioレポート連携',
            description: 'GA4/GSC 리포트 임베드, 실시간 데이터',
            descriptionJa: 'GA4/GSCレポート埋め込み、リアルタイムデータ',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'pf-1-1', title: 'Looker Studio 임베드', titleJa: 'Looker Studio埋め込み', status: 'completed' },
              { id: 'pf-1-2', title: '퍼포먼스 대시보드', titleJa: 'パフォーマンスダッシュボード', status: 'completed' },
            ],
            tags: ['Looker Studio'],
          },
        ],
      },
      {
        id: 'kpi',
        name: 'KPI 트래킹',
        nameJa: 'KPIトラッキング',
        icon: Target,
        tasks: [
          {
            id: 'kp-1',
            title: 'KPI 대시보드',
            titleJa: 'KPIダッシュボード',
            description: '목표 대비 실적 추적, 트렌드 차트',
            descriptionJa: '目標対実績追跡、トレンドチャート',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'kp-1-1', title: 'KPI 대시보드 UI', titleJa: 'KPIダッシュボードUI', status: 'completed' },
              { id: 'kp-1-2', title: '목표 설정 + 추적', titleJa: '目標設定 + 追跡', status: 'completed' },
              { id: 'kp-1-3', title: '월별 트렌드 차트', titleJa: '月別トレンドチャート', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────
  // 5. 개발 스케줄
  // ─────────────────────────────────────
  {
    id: 'dev-tasks',
    title: '開発スケジュール',
    titleKo: '개발 스케줄',
    icon: 'code',
    color: '#0ca678',
    description: '開発進捗管理・チェックリスト',
    descriptionKo: '개발 진척 관리, 체크리스트',
    subMenus: [
      {
        id: 'dev-progress',
        name: '개발 진행 관리',
        nameJa: '開発進行管理',
        icon: Code2,
        tasks: [
          {
            id: 'dt-1',
            title: '개발 진척도 페이지',
            titleJa: '開発進捗ページ',
            description: '카테고리별 태스크/서브태스크 진행 현황 대시보드',
            descriptionJa: 'カテゴリ別タスク/サブタスク進行状況ダッシュボード',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'dt-1-1', title: '진척도 UI', titleJa: '進捗UI', status: 'completed' },
              { id: 'dt-1-2', title: '필터 (상태/우선순위)', titleJa: 'フィルター（状態/優先度）', status: 'completed' },
              { id: 'dt-1-3', title: '전체 다국어 처리', titleJa: '全体多言語対応', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────
  // 6. 작업 일지
  // ─────────────────────────────────────
  {
    id: 'work-logs',
    title: '作業日誌',
    titleKo: '작업 일지',
    icon: 'calendar',
    color: '#f76707',
    description: '開発作業レポート自動集計・カレンダービュー',
    descriptionKo: '개발 작업 리포트 자동 집계, 캘린더 뷰',
    subMenus: [
      {
        id: 'work-log-main',
        name: '작업일지 기능',
        nameJa: '作業日誌機能',
        icon: CalendarDays,
        tasks: [
          {
            id: 'wl-1',
            title: '작업일지 CRUD + 캘린더',
            titleJa: '作業日誌CRUD + カレンダー',
            description: 'Prisma WorkLog 모델, API, 캘린더 뷰, 요약 카드',
            descriptionJa: 'Prisma WorkLogモデル、API、カレンダービュー、サマリーカード',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'wl-1-1', title: 'Prisma WorkLog 모델', titleJa: 'Prisma WorkLogモデル', status: 'completed' },
              { id: 'wl-1-2', title: 'CRUD API (/api/work-logs)', titleJa: 'CRUD API (/api/work-logs)', status: 'completed' },
              { id: 'wl-1-3', title: '캘린더 뷰 (월 단위)', titleJa: 'カレンダービュー（月単位）', status: 'completed' },
              { id: 'wl-1-4', title: '요약 카드 + 통계', titleJa: 'サマリーカード + 統計', status: 'completed' },
              { id: 'wl-1-5', title: '추가/편집/삭제 모달', titleJa: '追加/編集/削除モーダル', status: 'completed' },
            ],
            tags: ['Prisma', 'API (100%)', '프론트엔드 (100%)'], tagsJa: ['Prisma', 'API (100%)', 'フロントエンド (100%)'],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────
  // 7. 설정
  // ─────────────────────────────────────
  {
    id: 'settings',
    title: '設定',
    titleKo: '설정',
    icon: 'settings',
    color: '#656d77',
    description: '認証・DB・デプロイ・多言語・エクスポート',
    descriptionKo: '인증, DB, 배포, 다국어, 내보내기 등 공통 인프라',
    subMenus: [
      {
        id: 'infra',
        name: '인프라/공통',
        nameJa: 'インフラ・共通',
        icon: Settings,
        tasks: [
          {
            id: 'inf-1',
            title: 'Prisma + SQLite 설정',
            titleJa: 'Prisma + SQLite設定',
            description: '스키마 설계, 마이그레이션, 시드 데이터',
            descriptionJa: 'スキーマ設計、マイグレーション、シードデータ',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'inf-1-1', title: 'Prisma 스키마 설계', titleJa: 'Prismaスキーマ設計', status: 'completed' },
              { id: 'inf-1-2', title: 'DB 마이그레이션', titleJa: 'DBマイグレーション', status: 'completed' },
            ],
            tags: ['Prisma (100%)'],
          },
          {
            id: 'inf-2',
            title: '다국어 지원 (일/한)',
            titleJa: '多言語対応（日/韓）',
            description: 'TranslationProvider, 번역 키, 언어 전환',
            descriptionJa: 'TranslationProvider、翻訳キー、言語切替',
            priority: 'MEDIUM', status: 'completed', progress: 100,
            subTasks: [
              { id: 'inf-2-1', title: 'TranslationProvider 구현', titleJa: 'TranslationProvider実装', status: 'completed' },
              { id: 'inf-2-2', title: '전체 UI 번역', titleJa: '全UI翻訳', status: 'completed' },
            ],
            tags: ['프론트엔드 (100%)'], tagsJa: ['フロントエンド (100%)'],
          },
          {
            id: 'inf-3',
            title: '내보내기 기능',
            titleJa: 'エクスポート機能',
            description: 'CSV 완료, Excel (서식 포함) 미완',
            descriptionJa: 'CSV完了、Excel（書式含む）未完',
            priority: 'LOW', status: 'in_progress', progress: 50,
            subTasks: [
              { id: 'inf-3-1', title: 'CSV 내보내기', titleJa: 'CSVエクスポート', status: 'completed' },
              { id: 'inf-3-2', title: 'Excel 내보내기 (서식 포함)', titleJa: 'Excelエクスポート（書式含む）', status: 'pending' },
            ],
            tags: ['프론트엔드 (50%)'], tagsJa: ['フロントエンド (50%)'],
          },
          {
            id: 'inf-4',
            title: 'Gmail API 설정',
            titleJa: 'Gmail API設定',
            description: 'Service Account, DWD, 환경변수 관리',
            descriptionJa: 'Service Account、DWD、環境変数管理',
            priority: 'HIGH', status: 'completed', progress: 100,
            subTasks: [
              { id: 'inf-4-1', title: 'Service Account 설정', titleJa: 'Service Account設定', status: 'completed' },
              { id: 'inf-4-2', title: 'DWD 위임 설정', titleJa: 'DWD委任設定', status: 'completed' },
            ],
            tags: ['Gmail', 'API (100%)'],
          },
        ],
      },
    ],
  },
]

// ==========================================
// Helpers
// ==========================================

const ICON_MAP: Record<CategoryIcon, React.FC<{ className?: string; style?: React.CSSProperties; size?: number }>> = {
  dashboard: LayoutDashboard,
  globe: Globe,
  send: Send,
  chart: LineChart,
  code: Code2,
  calendar: CalendarDays,
  settings: Settings,
}

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; label: string }> = {
  HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: 'High' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
  LOW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Low' },
}

const STATUS_ICON: Record<TaskStatus, React.FC<{ className?: string; size?: number }>> = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  completed: 'text-green-500',
  in_progress: 'text-blue-500',
  pending: 'text-gray-300',
}

function getAllTasks(cat: DevCategory): DevTask[] {
  return cat.subMenus.flatMap(sm => sm.tasks)
}

function getCategoryProgress(cat: DevCategory): number {
  const tasks = getAllTasks(cat)
  if (tasks.length === 0) return 0
  return Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
}

function getProgressColor(progress: number): string {
  if (progress === 100) return 'bg-green-500'
  if (progress >= 60) return 'bg-blue-500'
  if (progress >= 30) return 'bg-yellow-500'
  return 'bg-gray-300'
}

// ==========================================
// Component
// ==========================================

export default function DevTasksPage() {
  const { locale } = useTranslation()
  const isJa = locale === 'ja'

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(DEV_CATEGORIES.map(c => c.id))
  )
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // Stats
  const stats = useMemo(() => {
    const allTasks = DEV_CATEGORIES.flatMap(getAllTasks)
    const completed = allTasks.filter(t => t.status === 'completed').length
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length
    const pending = allTasks.filter(t => t.status === 'pending').length
    const highPriority = allTasks.filter(t => t.priority === 'HIGH' && t.status !== 'completed').length
    const totalProgress = allTasks.length > 0
      ? Math.round(allTasks.reduce((acc, t) => acc + t.progress, 0) / allTasks.length)
      : 0
    return { total: allTasks.length, completed, inProgress, pending, highPriority, totalProgress }
  }, [])

  // Filter
  const filteredCategories = useMemo(() => {
    return DEV_CATEGORIES.map(cat => ({
      ...cat,
      subMenus: cat.subMenus.map(sm => ({
        ...sm,
        tasks: sm.tasks.filter(task => {
          if (statusFilter !== 'all' && task.status !== statusFilter) return false
          if (priorityFilter && task.priority !== priorityFilter) return false
          return true
        }),
      })).filter(sm => sm.tasks.length > 0),
    })).filter(cat => cat.subMenus.length > 0)
  }, [statusFilter, priorityFilter])

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl fw-bold text-gray-900 d-flex align-items-center gap-2">
          <BarChart3 size={28} className="text-primary" />
          {isJa ? '開発スケジュール' : '개발 스케줄'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isJa ? 'サイドバーメニュー別の開発進捗・機能要件チェックリスト' : '사이드바 메뉴별 개발 진척·기능 요구사항 체크리스트'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="card shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-lg bg-blue-50 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <BarChart3 size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{isJa ? '全体進捗度' : '전체 진척도'}</div>
                  <div className="text-2xl fw-bold text-gray-900">{stats.totalProgress}%</div>
                </div>
              </div>
              <div className="progress" style={{ height: '0.5rem' }}>
                <div className="progress-bar bg-blue-500" style={{ width: `${stats.totalProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-lg bg-green-50 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{isJa ? '完了' : '완료'}</div>
                  <div className="text-2xl fw-bold text-gray-900">
                    {stats.completed}<span className="text-sm fw-normal text-gray-400">/{stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-lg bg-blue-50 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <Clock size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{isJa ? '進行中' : '진행 중'}</div>
                  <div className="text-2xl fw-bold text-gray-900">{stats.inProgress}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-lg bg-red-50 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <AlertCircle size={20} className="text-red-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{isJa ? '高優先度 待機' : 'High Priority 대기'}</div>
                  <div className="text-2xl fw-bold text-gray-900">{stats.highPriority}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Progress Overview — 7 sidebar menus */}
      <div className="row g-2">
        {DEV_CATEGORIES.map(cat => {
          const progress = getCategoryProgress(cat)
          const IconComp = ICON_MAP[cat.icon]
          return (
            <div key={cat.id} className="col-3 col-lg">
              <button
                onClick={() => {
                  const el = document.getElementById(`cat-${cat.id}`)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setExpandedCategories(prev => new Set([...Array.from(prev), cat.id]))
                }}
                className="card shadow-sm p-3 hover:shadow-md transition-shadow text-start w-100 border"
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <IconComp size={16} style={{ color: cat.color }} />
                  <span className="text-xs fw-medium text-gray-700 truncate">
                    {isJa ? cat.title : cat.titleKo}
                  </span>
                </div>
                <div className="text-lg fw-bold text-gray-900 mb-1">{progress}%</div>
                <div className="progress" style={{ height: '0.375rem' }}>
                  <div
                    className={`progress-bar transition-all ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        {(['all', 'in_progress', 'pending', 'completed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn btn-sm text-xs fw-medium rounded-lg transition-colors ${
              statusFilter === s
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? (isJa ? '全て' : '전체')
              : s === 'in_progress' ? (isJa ? '進行中' : '진행중')
              : s === 'pending' ? (isJa ? '待機' : '대기')
              : (isJa ? '完了' : '완료')}
          </button>
        ))}
        <div className="bg-gray-200 mx-1" style={{ width: '1px', height: '1.25rem' }} />
        {(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map(p => (
          <button
            key={p}
            onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
            className={`btn btn-sm text-xs fw-medium rounded-lg transition-colors ${
              priorityFilter === p
                ? `${PRIORITY_STYLES[p].bg} ${PRIORITY_STYLES[p].text}`
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {PRIORITY_STYLES[p].label}
          </button>
        ))}
      </div>

      {/* Category Sections */}
      <div className="row g-4">
        {filteredCategories.map(cat => {
          const isExpanded = expandedCategories.has(cat.id)
          const IconComp = ICON_MAP[cat.icon]
          const totalTasks = cat.subMenus.reduce((sum, sm) => sum + sm.tasks.length, 0)

          return (
            <div key={cat.id} className="col-12 col-xl-6">
              <div id={`cat-${cat.id}`} className="card shadow-sm">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-100 ps-3 pe-3 pt-3 pb-3 d-flex align-items-center justify-content-between hover:bg-gray-50 transition-colors rounded-lg"
                >
                  <div className="d-flex align-items-center gap-2">
                    {isExpanded
                      ? <ChevronDown size={20} className="text-gray-400" />
                      : <ChevronRight size={20} className="text-gray-400" />}
                    <div className="rounded-lg d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem', backgroundColor: `${cat.color}15` }}>
                      <IconComp size={16} style={{ color: cat.color }} />
                    </div>
                    <div className="text-start">
                      <div className="fw-semibold text-gray-800 d-flex align-items-center gap-2">
                        {isJa ? cat.title : cat.titleKo}
                        <span className="text-xs fw-normal text-gray-400">{totalTasks}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end text-xs text-gray-400">
                    {getCategoryProgress(cat)}%
                  </div>
                </button>

                {/* Category Body */}
                {isExpanded && (
                  <div className="border-top border-gray-100">
                    <div className="ps-3 pe-3 pt-2 pb-2 text-xs text-gray-500">
                      {isJa ? cat.description : cat.descriptionKo}
                    </div>

                    {/* Sub-Menus */}
                    {cat.subMenus.map(sm => {
                      const SmIcon = sm.icon
                      const smCompleted = sm.tasks.filter(t => t.status === 'completed').length

                      return (
                        <div key={sm.id}>
                          {/* Sub-menu header (show only if category has multiple sub-menus) */}
                          {cat.subMenus.length > 1 && (
                            <div className="ps-3 pe-3 pt-2 pb-2 bg-gray-50/70 border-top border-bottom border-gray-100 d-flex align-items-center gap-2">
                              <SmIcon size={14} className="text-gray-500" />
                              <span className="text-xs fw-semibold text-gray-600">
                                {isJa ? sm.nameJa : sm.name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {smCompleted}/{sm.tasks.length}
                              </span>
                            </div>
                          )}

                          {/* Tasks */}
                          <div className="divide-y divide-gray-50">
                            {sm.tasks.map(task => {
                              const isTaskExpanded = expandedTasks.has(task.id)
                              const StatusIcon = STATUS_ICON[task.status]
                              const taskTags = (isJa && task.tagsJa) ? task.tagsJa : task.tags
                              const taskDeps = (isJa && task.dependenciesJa) ? task.dependenciesJa : task.dependencies

                              return (
                                <div key={task.id} className="ps-3 pe-3 pt-2 pb-2">
                                  <div className="d-flex align-items-center gap-2">
                                    <StatusIcon size={20} className={`flex-shrink-0 ${STATUS_COLOR[task.status]}`} />
                                    <button
                                      onClick={() => toggleTask(task.id)}
                                      className="flex-fill text-start d-flex align-items-center gap-2"
                                      style={{ minWidth: 0 }}
                                    >
                                      {task.subTasks.length > 0 && (
                                        isTaskExpanded
                                          ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                                          : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                                      )}
                                      <span className={`text-sm fw-medium truncate ${
                                        task.status === 'completed' ? 'text-gray-500' : 'text-gray-800'
                                      }`}>
                                        {isJa ? task.titleJa : task.title}
                                      </span>
                                      <span className={`flex-shrink-0 text-[10px] fw-semibold rounded px-2 py-0.5 ${
                                        PRIORITY_STYLES[task.priority].bg} ${PRIORITY_STYLES[task.priority].text}`}>
                                        {PRIORITY_STYLES[task.priority].label.toUpperCase()}
                                      </span>
                                    </button>
                                    <div className="d-flex align-items-center gap-2 flex-shrink-0" style={{ width: '8rem' }}>
                                      <div className="flex-fill progress" style={{ height: '0.375rem' }}>
                                        <div
                                          className={`progress-bar transition-all ${getProgressColor(task.progress)}`}
                                          style={{ width: `${task.progress}%` }}
                                        />
                                      </div>
                                      <span className={`text-xs fw-medium text-end ${
                                        task.progress === 100 ? 'text-green-600' : 'text-gray-500'}`}
                                        style={{ width: '2.5rem' }}>
                                        {task.progress}%
                                      </span>
                                    </div>
                                  </div>

                                  {task.status !== 'completed' && (
                                    <div className="ms-4 mt-1 text-xs text-gray-400">
                                      {isJa ? task.descriptionJa : task.description}
                                    </div>
                                  )}

                                  {taskDeps && taskDeps.length > 0 && (
                                    <div className="ms-4 mt-1 d-flex align-items-center gap-1">
                                      <AlertCircle size={12} className="text-amber-500" />
                                      {taskDeps.map((dep, i) => (
                                        <span key={i} className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                          {dep}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {taskTags.length > 0 && (
                                    <div className="ms-4 mt-1 d-flex flex-wrap gap-1">
                                      {taskTags.map((tag, i) => (
                                        <span key={i} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {isTaskExpanded && task.subTasks.length > 0 && (
                                    <div className="ms-4 mt-2 space-y-1 ps-3 border-start border-2 border-gray-100">
                                      {task.subTasks.map(sub => {
                                        const SubIcon = STATUS_ICON[sub.status]
                                        return (
                                          <div key={sub.id} className="d-flex align-items-center gap-2">
                                            <SubIcon size={16} className={STATUS_COLOR[sub.status]} />
                                            <span className={`text-xs ${
                                              sub.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'
                                            }`}>
                                              {isJa ? sub.titleJa : sub.title}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
