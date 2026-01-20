import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const corporationId = searchParams.get('corporationId')

        if (!corporationId) {
            return NextResponse.json({ nextCode: '', existingCodes: [] })
        }

        // 해당 법인의 모든 지점 코드 조회
        const branches = await prisma.branch.findMany({
            where: { corporationId },
            select: { code: true },
            orderBy: { code: 'asc' }
        })

        const existingCodes = branches.map(b => b.code).filter(Boolean) as string[]

        // 숫자 패턴의 코드에서 다음 번호 추출
        const numericCodes = existingCodes
            .map(code => {
                const match = code.match(/(\d+)$/)
                return match ? parseInt(match[1], 10) : 0
            })
            .filter(n => n > 0)

        let nextNumber = 1
        if (numericCodes.length > 0) {
            nextNumber = Math.max(...numericCodes) + 1
        }

        // 3자리 숫자 패딩
        const nextCode = String(nextNumber).padStart(3, '0')

        return NextResponse.json({
            nextCode,
            existingCodes
        })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
