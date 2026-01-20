import { NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"

export async function GET() {
    try {
        // Reports 폴더 경로
        const reportsDir = path.join(process.cwd(), "Reports")

        // 폴더가 없으면 빈 배열 반환
        if (!fs.existsSync(reportsDir)) {
            return NextResponse.json([])
        }

        // JSON 파일 목록 가져오기
        const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'))

        // 각 파일 읽어서 파싱
        const reports = files.map(file => {
            try {
                const filePath = path.join(reportsDir, file)
                const content = fs.readFileSync(filePath, 'utf-8')
                const data = JSON.parse(content)

                // modified_files 형식 통일 (문자열 배열 → 객체 배열)
                let modifiedFiles = data.modified_files || []
                if (modifiedFiles.length > 0 && typeof modifiedFiles[0] === 'string') {
                    modifiedFiles = modifiedFiles.map((f: string) => ({
                        path: f.split(' (')[0],
                        changes: f.includes('(') ? f.split('(')[1].replace(')', '') : ''
                    }))
                }

                // created_files 형식 통일 (문자열 배열 → 객체 배열)
                let createdFiles = data.created_files || []
                if (createdFiles.length > 0 && typeof createdFiles[0] === 'string') {
                    createdFiles = createdFiles.map((f: string) => ({
                        path: f.split(' (')[0],
                        description: f.includes('(') ? f.split('(')[1].replace(')', '') : ''
                    }))
                }

                // 작업 시간 계산 (파일에 있으면 사용, 없으면 작업량 기반 추정)
                // 추정 기준: 완료 작업 1건당 0.3시간, 파일 수정 1건당 0.2시간
                let workHours = data.work_hours
                if (workHours === undefined || workHours === null) {
                    const taskCount = data.completed_tasks?.length || 0
                    const fileCount = (modifiedFiles?.length || 0) + (createdFiles?.length || 0)
                    workHours = Math.round((taskCount * 0.3 + fileCount * 0.2) * 10) / 10
                    // 최소 0.5시간, 최대 8시간
                    workHours = Math.max(0.5, Math.min(8, workHours))
                }

                return {
                    ...data,
                    modified_files: modifiedFiles,
                    created_files: createdFiles,
                    work_hours: workHours,
                    _filename: file
                }
            } catch (err) {
                console.error(`Failed to parse ${file}:`, err)
                return null
            }
        }).filter(Boolean)

        // 날짜 기준 내림차순 정렬 (최신 먼저)
        reports.sort((a, b) => {
            const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0
            const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0
            return dateB - dateA
        })

        return NextResponse.json(reports)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
