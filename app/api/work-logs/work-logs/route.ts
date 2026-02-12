import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/work-logs - 작업일지 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')       // specific date: "2026-01-22"
    const month = searchParams.get('month')     // month: "2026-01"
    const type = searchParams.get('type')       // "stats" | "calendar" | default(list)

    if (type === 'stats') {
      // 전체 통계
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
      // 월별 달력용 - 날짜별 시간/건수 요약
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

    // 날짜별 통계도 함께
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
      workHours, category, tools, completedTasks, modifiedFiles,
      createdFiles, nextTasks, linesChanged,
    } = body

    if (!date || !title) {
      return NextResponse.json({ error: 'date and title are required' }, { status: 400 })
    }

    // 작업시간 자동 계산
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

    // 작업시간 자동 계산
    if (!data.workHours && data.startTime && data.endTime) {
      const [sh, sm] = data.startTime.split(':').map(Number)
      const [eh, em] = data.endTime.split(':').map(Number)
      data.workHours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10
      if (data.workHours < 0) data.workHours += 24
    }

    // JSON 필드 직렬화
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
