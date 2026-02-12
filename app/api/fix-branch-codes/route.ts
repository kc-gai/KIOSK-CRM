import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/fix-branch-codes
 * 지점코드에서 마지막 _001 접미사 제거
 * CORP_SKY_001_001 → CORP_SKY_001
 */
export async function POST() {
    try {
        // 모든 지점 조회
        const branches = await prisma.branch.findMany({
            select: { id: true, code: true }
        })

        let updated = 0
        const changes: { before: string; after: string }[] = []

        for (const branch of branches) {
            if (!branch.code) continue
            // _001, _002 등의 접미사 패턴 확인 (마지막 _숫자3자리)
            const match = branch.code.match(/^(.+)_(\d{3})_(\d{3})$/)

            if (match) {
                // CORP_SKY_001_001 → CORP_SKY_001
                const newCode = `${match[1]}_${match[2]}`

                // 중복 체크
                const existing = await prisma.branch.findFirst({
                    where: {
                        code: newCode,
                        id: { not: branch.id }
                    }
                })

                if (!existing) {
                    await prisma.branch.update({
                        where: { id: branch.id },
                        data: { code: newCode }
                    })
                    changes.push({ before: branch.code, after: newCode })
                    updated++
                }
            }
        }

        return NextResponse.json({
            message: `${updated}개 지점코드 수정 완료`,
            updated,
            changes: changes.slice(0, 20) // 처음 20개만 표시
        })

    } catch (error) {
        console.error('Fix branch codes error:', error)
        return NextResponse.json(
            { error: '지점코드 수정 중 오류 발생' },
            { status: 500 }
        )
    }
}

export async function GET() {
    // 미리보기
    const branches = await prisma.branch.findMany({
        select: { id: true, code: true }
    })

    const preview: { before: string; after: string }[] = []

    for (const branch of branches) {
        if (!branch.code) continue
        const match = branch.code.match(/^(.+)_(\d{3})_(\d{3})$/)
        if (match) {
            preview.push({
                before: branch.code,
                after: `${match[1]}_${match[2]}`
            })
        }
    }

    return NextResponse.json({
        message: `${preview.length}개 지점코드 수정 예정`,
        preview
    })
}
