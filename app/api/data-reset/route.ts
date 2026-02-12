import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/data-reset
 * FC, Corporation, Branch 데이터 전체 삭제
 */
export async function POST() {
    try {
        // 순서: Branch → Corporation → FC (외래키 제약 순서)
        const deletedBranches = await prisma.branch.deleteMany({})
        const deletedCorps = await prisma.corporation.deleteMany({})
        const deletedFcs = await prisma.fC.deleteMany({})

        return NextResponse.json({
            message: '데이터 삭제 완료',
            deleted: {
                branches: deletedBranches.count,
                corporations: deletedCorps.count,
                fcs: deletedFcs.count
            }
        })
    } catch (error) {
        console.error('Data reset error:', error)
        return NextResponse.json(
            { error: '데이터 삭제 중 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}
