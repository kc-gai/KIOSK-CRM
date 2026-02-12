import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

// GET /api/work-logs - 작업일지 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')       // specific date: "2026-01-22"
    const month = searchParams.get('month')     // month: "2026-01"
    const type = searchParams.get('type')       // "stats" | "calendar" | "seed" | default(list)

    // 시드 데이터 마이그레이션 (Reports JSON → DB)
    if (type === 'seed') {
      const result = await seedFromReports()
      return NextResponse.json(result)
    }

    if (type === 'stats') {
      const allLogs = await prisma.workLog.findMany()
      const totalHours = allLogs.reduce((sum, l) => sum + l.workHours, 0)
      const codingHours = allLogs.filter(l => l.category === 'coding').reduce((sum, l) => sum + l.workHours, 0)
      const manualHours = allLogs.filter(l => l.category !== 'coding').reduce((sum, l) => sum + l.workHours, 0)
      const totalCompleted = allLogs.reduce((sum, l) => {
        const tasks = l.completedTasks ? JSON.parse(l.completedTasks) : []
        return sum + tasks.length
      }, 0)
      const totalFiles = allLogs.reduce((sum, l) => {
        const modified = l.modifiedFiles ? JSON.parse(l.modifiedFiles) : []
        return sum + modified.length
      }, 0)
      const totalEntries = allLogs.length

      return NextResponse.json({
        totalHours: Math.round(totalHours * 10) / 10,
        codingHours: Math.round(codingHours * 10) / 10,
        manualHours: Math.round(manualHours * 10) / 10,
        totalCompleted,
        totalFiles,
        totalEntries,
      })
    }

    if (type === 'calendar' && month) {
      const logs = await prisma.workLog.findMany({
        where: { date: { startsWith: month } },
        select: { date: true, workHours: true, category: true, completedTasks: true },
      })

      const dateMap: Record<string, { hours: number; count: number; categories: string[] }> = {}
      for (const log of logs) {
        if (!dateMap[log.date]) {
          dateMap[log.date] = { hours: 0, count: 0, categories: [] }
        }
        dateMap[log.date].hours += log.workHours
        dateMap[log.date].count += 1
        if (!dateMap[log.date].categories.includes(log.category)) {
          dateMap[log.date].categories.push(log.category)
        }
      }

      return NextResponse.json({ dateMap })
    }

    // 특정 날짜 또는 월별 리스트
    const where: Record<string, unknown> = {}
    if (date) {
      where.date = date
    } else if (month) {
      where.date = { startsWith: month }
    }

    const logs = await prisma.workLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    })

    let monthHours = 0
    let monthCompleted = 0
    if (month || date) {
      const monthStr = month || (date ? date.substring(0, 7) : '')
      const monthLogs = await prisma.workLog.findMany({
        where: { date: { startsWith: monthStr } },
      })
      monthHours = monthLogs.reduce((sum, l) => sum + l.workHours, 0)
      monthCompleted = monthLogs.reduce((sum, l) => {
        const tasks = l.completedTasks ? JSON.parse(l.completedTasks) : []
        return sum + tasks.length
      }, 0)
    }

    return NextResponse.json({
      logs,
      monthHours: Math.round(monthHours * 10) / 10,
      monthCompleted,
    })
  } catch (error) {
    console.error('WorkLog GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch work logs' }, { status: 500 })
  }
}

// POST /api/work-logs - 작업일지 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      date, title, description, author, startTime, endTime,
      workHours, category, module: mod, tools, completedTasks, modifiedFiles,
      createdFiles, nextTasks, linesChanged,
    } = body

    if (!date || !title) {
      return NextResponse.json({ error: 'date and title are required' }, { status: 400 })
    }

    let calculatedHours = workHours || 0
    if (!workHours && startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      calculatedHours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10
      if (calculatedHours < 0) calculatedHours += 24
    }

    const log = await prisma.workLog.create({
      data: {
        date,
        title,
        description: description || null,
        author: author || 'Manual',
        startTime: startTime || null,
        endTime: endTime || null,
        workHours: calculatedHours,
        category: category || 'coding',
        module: mod || 'general',
        tools: tools ? JSON.stringify(tools) : null,
        completedTasks: completedTasks ? JSON.stringify(completedTasks) : null,
        modifiedFiles: modifiedFiles ? JSON.stringify(modifiedFiles) : null,
        createdFiles: createdFiles ? JSON.stringify(createdFiles) : null,
        nextTasks: nextTasks ? JSON.stringify(nextTasks) : null,
        linesChanged: linesChanged || null,
      },
    })

    return NextResponse.json({ log })
  } catch (error) {
    console.error('WorkLog POST error:', error)
    return NextResponse.json({ error: 'Failed to create work log' }, { status: 500 })
  }
}

// PUT /api/work-logs - 작업일지 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    if (!data.workHours && data.startTime && data.endTime) {
      const [sh, sm] = data.startTime.split(':').map(Number)
      const [eh, em] = data.endTime.split(':').map(Number)
      data.workHours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10
      if (data.workHours < 0) data.workHours += 24
    }

    if (data.tools && Array.isArray(data.tools)) data.tools = JSON.stringify(data.tools)
    if (data.completedTasks && Array.isArray(data.completedTasks)) data.completedTasks = JSON.stringify(data.completedTasks)
    if (data.modifiedFiles && Array.isArray(data.modifiedFiles)) data.modifiedFiles = JSON.stringify(data.modifiedFiles)
    if (data.createdFiles && Array.isArray(data.createdFiles)) data.createdFiles = JSON.stringify(data.createdFiles)
    if (data.nextTasks && Array.isArray(data.nextTasks)) data.nextTasks = JSON.stringify(data.nextTasks)

    const log = await prisma.workLog.update({
      where: { id },
      data,
    })

    return NextResponse.json({ log })
  } catch (error) {
    console.error('WorkLog PUT error:', error)
    return NextResponse.json({ error: 'Failed to update work log' }, { status: 500 })
  }
}

// DELETE /api/work-logs - 작업일지 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.workLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WorkLog DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete work log' }, { status: 500 })
  }
}

// ==========================================
// Reports JSON → DB 마이그레이션
// ==========================================

async function seedFromReports() {
  const reportsDir = path.join(process.cwd(), 'Reports')
  let migratedCount = 0
  let skippedCount = 0
  const errors: string[] = []

  // 1. Reports 폴더의 JSON 파일 → DB (키오스크 모듈)
  if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'))

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(reportsDir, file), 'utf-8')
        const data = JSON.parse(content)

        const createdAt = data.created_at ? new Date(data.created_at) : new Date()
        const dateStr = createdAt.toISOString().split('T')[0] // "2024-12-15"

        // 중복 체크 (같은 날짜 + 같은 제목)
        const existing = await prisma.workLog.findFirst({
          where: { date: dateStr, title: data.task_summary || data.task_summary_ja || file },
        })
        if (existing) {
          skippedCount++
          continue
        }

        // 시간 추출
        let startTime: string | null = null
        let endTime: string | null = null
        if (data.session_info?.session_start) {
          const st = new Date(data.session_info.session_start)
          startTime = `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`
        }
        if (data.session_info?.session_end) {
          const et = new Date(data.session_info.session_end)
          endTime = `${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`
        }

        // 작업시간
        let workHours = data.work_hours
        if (!workHours) {
          const taskCount = data.completed_tasks?.length || 0
          const fileCount = (data.modified_files?.length || 0) + (data.created_files?.length || 0)
          workHours = Math.max(0.5, Math.min(8, Math.round((taskCount * 0.3 + fileCount * 0.2) * 10) / 10))
        }

        // 파일 경로 추출
        const modifiedFiles = (data.modified_files || []).map((f: string | { path: string }) =>
          typeof f === 'string' ? f.split(' (')[0] : f.path
        )
        const createdFiles = (data.created_files || []).map((f: string | { path: string }) =>
          typeof f === 'string' ? f.split(' (')[0] : f.path
        )

        await prisma.workLog.create({
          data: {
            date: dateStr,
            title: data.task_summary || data.task_summary_ja || file,
            description: data.context_for_next_session || null,
            author: data.session_info?.ai_assistant || 'Claude (Anthropic)',
            startTime,
            endTime,
            workHours,
            category: 'coding',
            module: 'kiosk',
            tools: data.session_info?.tools_used ? JSON.stringify(data.session_info.tools_used) : null,
            completedTasks: data.completed_tasks ? JSON.stringify(data.completed_tasks) : null,
            modifiedFiles: modifiedFiles.length > 0 ? JSON.stringify(modifiedFiles) : null,
            createdFiles: createdFiles.length > 0 ? JSON.stringify(createdFiles) : null,
            nextTasks: data.next_steps ? JSON.stringify(data.next_steps) : null,
          },
        })
        migratedCount++
      } catch (err) {
        errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  // 2. 마케팅 모듈 작업 이력 시드
  const marketingSeeds = getMarketingWorkHistory()
  for (const seed of marketingSeeds) {
    try {
      const existing = await prisma.workLog.findFirst({
        where: { date: seed.date, title: seed.title },
      })
      if (existing) {
        skippedCount++
        continue
      }
      await prisma.workLog.create({ data: seed })
      migratedCount++
    } catch (err) {
      errors.push(`marketing-${seed.date}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 3. 통합 프로젝트 작업 이력 시드
  const unifiedSeeds = getUnifiedWorkHistory()
  for (const seed of unifiedSeeds) {
    try {
      const existing = await prisma.workLog.findFirst({
        where: { date: seed.date, title: seed.title },
      })
      if (existing) {
        skippedCount++
        continue
      }
      await prisma.workLog.create({ data: seed })
      migratedCount++
    } catch (err) {
      errors.push(`unified-${seed.date}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { migratedCount, skippedCount, errors }
}

// ==========================================
// 마케팅 모듈 작업 이력
// ==========================================

function getMarketingWorkHistory() {
  return [
    {
      date: '2025-11-15',
      title: 'Marketing SEO CRM 프로젝트 초기 설정',
      author: 'Claude (Anthropic)',
      startTime: '10:00',
      endTime: '17:00',
      workHours: 7.0,
      category: 'coding',
      module: 'marketing',
      tools: JSON.stringify(['Next.js', 'Prisma', 'SQLite', 'Tailwind CSS']),
      completedTasks: JSON.stringify([
        'Next.js 14 프로젝트 생성',
        'Prisma ORM + SQLite 설정',
        'Google Sheets API 연동 기본 구조',
        'Google Apps Script 설정',
        '대시보드 기본 레이아웃',
      ]),
      createdFiles: JSON.stringify([
        'app/dashboard/sales-tracking/page.tsx',
        'lib/sales-tracking.ts',
        'lib/google-api.ts',
        'prisma/schema.prisma',
      ]),
      nextTasks: JSON.stringify(['영업 추적 기능 구현', 'Google Sheets 컬럼 자동감지']),
    },
    {
      date: '2025-12-01',
      title: 'Company CRUD API + 연락이력 기능',
      author: 'Claude (Anthropic)',
      startTime: '09:00',
      endTime: '16:00',
      workHours: 7.0,
      category: 'coding',
      module: 'marketing',
      tools: JSON.stringify(['Next.js', 'TypeScript', 'Prisma']),
      completedTasks: JSON.stringify([
        'Company CRUD API 구현',
        'ContactRecord 모델 + API',
        '연락이력 추가/삭제 기능',
        'Prisma 모델: Company, ContactRecord, EmailReply, InquiryFormLog',
      ]),
      modifiedFiles: JSON.stringify([
        'prisma/schema.prisma',
        'app/api/companies/route.ts',
      ]),
      createdFiles: JSON.stringify([
        'app/api/companies/route.ts',
        'app/api/contact-import/route.ts',
      ]),
      nextTasks: JSON.stringify(['이메일 발송 기능', 'Gmail API 연동']),
    },
    {
      date: '2025-12-10',
      title: 'Gmail 회신 감지 + Slack 알림',
      author: 'Claude (Anthropic)',
      startTime: '10:00',
      endTime: '17:00',
      workHours: 7.0,
      category: 'coding',
      module: 'marketing',
      tools: JSON.stringify(['Next.js', 'Gmail API', 'Slack API']),
      completedTasks: JSON.stringify([
        'Gmail API Service Account 설정 (DWD)',
        '이메일 회신 자동 감지 구현',
        'Slack 알림 기능 연동',
        '이메일 발송 API 구현',
        'BulkEmailTab 3-step wizard 컴포넌트',
      ]),
      createdFiles: JSON.stringify([
        'lib/gmail.ts',
        'lib/slack.ts',
        'app/api/email-send/route.ts',
        'app/api/email-replies/route.ts',
        'components/dashboard/BulkEmailTab.tsx',
      ]),
      nextTasks: JSON.stringify(['문의폼 반자동 입력', 'SNS 필드 추가']),
    },
    {
      date: '2025-12-20',
      title: '문의폼 반자동 입력 + SNS 필드',
      author: 'Claude (Anthropic)',
      startTime: '09:00',
      endTime: '15:00',
      workHours: 6.0,
      category: 'coding',
      module: 'marketing',
      tools: JSON.stringify(['Next.js', 'TypeScript', 'Prisma']),
      completedTasks: JSON.stringify([
        '문의폼 반자동 입력 (form-filler.ts)',
        'SNS 필드 추가 (LINE/Instagram/Twitter/Facebook)',
        'localStorage → DB 마이그레이션',
        '이메일 이력 통합 뷰 (EmailHistoryPanel.tsx)',
      ]),
      createdFiles: JSON.stringify([
        'lib/form-filler.ts',
        'components/dashboard/EmailHistoryPanel.tsx',
      ]),
      nextTasks: JSON.stringify(['Google Sheets 컬럼 자동감지', '영업제외 필터']),
    },
    {
      date: '2026-01-10',
      title: 'Google Sheets 컬럼 자동감지 + 영업제외 필터',
      author: 'Claude (Anthropic)',
      startTime: '10:00',
      endTime: '17:00',
      workHours: 7.0,
      category: 'coding',
      module: 'marketing',
      tools: JSON.stringify(['Next.js', 'TypeScript', 'Google Sheets API']),
      completedTasks: JSON.stringify([
        'detectColumnMap() 함수 구현 - 헤더 기반 컬럼 자동감지',
        '시트별 차이 대응 (관동 vs 나머지: NDA/MOU/DX/SONOCAR 컬럼 유무)',
        '電話番号 키워드 기준점 사용',
        '영업제외(보류·실주) 필터 구현',
      ]),
      modifiedFiles: JSON.stringify([
        'lib/sales-tracking.ts',
        'app/dashboard/sales-tracking/page.tsx',
      ]),
      nextTasks: JSON.stringify(['날짜 파싱 간소화', 'email/contactUrl 분리']),
    },
    {
      date: '2026-02-08',
      title: '날짜 파싱 간소화 + email/contactUrl 분리',
      author: 'Claude (Anthropic)',
      startTime: '09:00',
      endTime: '16:00',
      workHours: 7.0,
      category: 'coding',
      module: 'marketing',
      tools: JSON.stringify(['Next.js', 'TypeScript', 'Prisma']),
      completedTasks: JSON.stringify([
        '년도 추론 로직 완전 제거 (parseDateWithYearInference → parseDate)',
        'email/contactUrl 옵션 필드 분리',
        '전각＠(U+FF20) 이메일 감지 + 반각@ 변환',
        'isEmailAddress() / normalizeEmail() 함수',
        '편집 후 리스트 위치 유지 (mergedCompanies)',
      ]),
      modifiedFiles: JSON.stringify([
        'lib/sales-tracking.ts',
        'app/api/sales-tracking/route.ts',
        'app/dashboard/sales-tracking/page.tsx',
      ]),
      nextTasks: JSON.stringify(['개발 스케줄 페이지', 'OTA 크롤링 삭제']),
    },
    {
      date: '2026-02-09',
      title: '개발 스케줄 페이지 + OTA 크롤링 삭제',
      author: 'Claude (Anthropic)',
      startTime: '10:00',
      endTime: '17:00',
      workHours: 7.0,
      category: 'coding',
      module: 'marketing',
      tools: JSON.stringify(['Next.js', 'TypeScript', 'Lucide Icons']),
      completedTasks: JSON.stringify([
        '/dashboard/dev-tasks 페이지 신규 생성',
        '사이드바에 개발 스케줄 메뉴 추가 (Code2 아이콘)',
        'OTA 크롤링 기능 완전 삭제',
        'dev-tasks 페이지 전체 다국어 처리',
      ]),
      createdFiles: JSON.stringify([
        'app/dashboard/dev-tasks/page.tsx',
      ]),
      modifiedFiles: JSON.stringify([
        'components/layout/Sidebar.tsx',
        'lib/translations.tsx',
      ]),
      nextTasks: JSON.stringify(['작업일지 페이지', '통합 CRM 프로젝트']),
    },
    {
      date: '2026-02-10',
      title: '작업일지 페이지 + dev-tasks 카테고리 재구성',
      author: 'Claude (Anthropic)',
      startTime: '09:00',
      endTime: '18:00',
      workHours: 9.0,
      category: 'coding',
      module: 'marketing',
      tools: JSON.stringify(['Next.js', 'TypeScript', 'Prisma', 'Tailwind CSS']),
      completedTasks: JSON.stringify([
        'WorkLog Prisma 모델 생성',
        '/api/work-logs API (CRUD + stats/calendar)',
        '/dashboard/work-logs 페이지 신규 생성',
        '캘린더(월뷰) + 요약카드 + 날짜별 상세 + 추가/편집 모달',
        'dev-tasks 7개 사이드바 카테고리 재구성',
        '사이드바 작업일지 메뉴 추가',
      ]),
      createdFiles: JSON.stringify([
        'app/dashboard/work-logs/page.tsx',
        'app/api/work-logs/route.ts',
      ]),
      modifiedFiles: JSON.stringify([
        'prisma/schema.prisma',
        'components/layout/Sidebar.tsx',
        'lib/translations.tsx',
        'app/dashboard/dev-tasks/page.tsx',
      ]),
      nextTasks: JSON.stringify(['통합 CRM 프로젝트 통합', 'Vercel 배포']),
    },
  ]
}

// ==========================================
// 통합 프로젝트 작업 이력
// ==========================================

function getUnifiedWorkHistory() {
  return [
    {
      date: '2026-02-11',
      title: 'KC 통합 CRM 프로젝트 생성 (Kiosk + Marketing 통합)',
      author: 'Claude (Anthropic)',
      startTime: '10:00',
      endTime: '20:00',
      workHours: 10.0,
      category: 'coding',
      module: 'general',
      tools: JSON.stringify(['Next.js', 'TypeScript', 'Prisma', 'Tailwind CSS', 'Git']),
      completedTasks: JSON.stringify([
        'unified-crm 프로젝트 디렉토리 생성 (키오스크 기반)',
        'Prisma 스키마 통합 (키오스크 26모델 + 마케팅 16모델)',
        '마케팅 파일 복사 (lib, API, pages, components)',
        'Route Group: app/(marketing)/marketing/ 생성',
        'marketing.css CSS 변수 오버라이드 (Tailwind v4 대응)',
        'Recharts v3 타입 호환성 수정 (6개 파일)',
        '모듈 전환 네비게이션 (키오스크 ↔ 마케팅)',
        '마케팅 경로 /dashboard/* → /marketing/* 마이그레이션',
        'Git 초기화 + GitHub 리모트 설정',
        'Force push로 기존 KIOSK-CRM 리포 교체',
      ]),
      createdFiles: JSON.stringify([
        'app/(marketing)/marketing/layout.tsx',
        'app/(marketing)/marketing/marketing.css',
        'components/marketing/Sidebar.tsx',
        'components/marketing/Header.tsx',
      ]),
      modifiedFiles: JSON.stringify([
        'prisma/schema.prisma',
        'package.json',
        'app/dashboard/layout.tsx',
        '.env.example',
      ]),
      nextTasks: JSON.stringify(['작업일지 자동 카운팅', 'Vercel 배포 설정']),
    },
    {
      date: '2026-02-12',
      title: '작업일지 시드 데이터 + 자동 카운팅 설정',
      author: 'Claude (Anthropic)',
      startTime: '09:00',
      endTime: '12:00',
      workHours: 3.0,
      category: 'coding',
      module: 'general',
      tools: JSON.stringify(['Next.js', 'TypeScript', 'Prisma']),
      completedTasks: JSON.stringify([
        'work-logs API를 Prisma 기반으로 교체 (JSON → DB)',
        'Reports JSON → DB 자동 마이그레이션 기능',
        '마케팅 모듈 작업 이력 8건 시드',
        '통합 프로젝트 작업 이력 2건 시드',
        '키오스크 리포트 23건 마이그레이션',
        'module 필드 (kiosk/marketing/general) 구분',
      ]),
      modifiedFiles: JSON.stringify([
        'app/api/work-logs/route.ts',
        'app/(marketing)/marketing/work-logs/page.tsx',
      ]),
      nextTasks: JSON.stringify(['Vercel 배포 설정', 'Prisma 모델명 정리']),
    },
  ]
}
