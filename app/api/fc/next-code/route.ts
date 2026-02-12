import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/fc/next-code
 * 다음 추천 FC 코드 반환 (예: FC024 -> FC025)
 */
export async function GET() {
    try {
        // FC 코드 패턴: FC + 숫자 (예: FC001, FC024)
        const fcs = await prisma.fC.findMany({
            select: { code: true },
            where: {
                code: {
                    startsWith: 'FC'
                }
            }
        })

        // FC 코드에서 숫자 추출
        const numbers = fcs
            .map(fc => {
                const match = fc.code?.match(/^FC(\d+)$/)
                return match ? parseInt(match[1], 10) : 0
            })
            .filter(n => n > 0)

        // 최대 숫자 + 1
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
        const nextNumber = maxNumber + 1

        // 3자리로 패딩 (FC001, FC025 등)
        const nextCode = `FC${nextNumber.toString().padStart(3, '0')}`

        return NextResponse.json({ nextCode })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
