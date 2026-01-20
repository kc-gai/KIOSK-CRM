import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/corporations/next-code?fcId=xxx
 * 다음 추천 법인 코드 반환 + 기존 법인 코드 목록
 * FC에 속한 법인이면 CORP_XXX_001 형식, 독립법인이면 CORP_IND_001 형식
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fcId = searchParams.get('fcId')

        let prefix = 'CORP_IND'

        if (fcId) {
            // FC에 속한 법인인 경우, FC 코드에서 숫자 추출
            const fc = await prisma.fC.findUnique({
                where: { id: fcId },
                select: { code: true }
            })

            if (fc?.code) {
                const fcNumMatch = fc.code.match(/\d+/)
                const fcNum = fcNumMatch ? fcNumMatch[0].padStart(3, '0') : '001'
                prefix = `CORP_${fcNum}`
            }
        }

        // 해당 prefix로 시작하는 법인 코드 조회
        const corps = await prisma.corporation.findMany({
            select: { code: true },
            where: {
                code: {
                    startsWith: prefix
                }
            },
            orderBy: { code: 'asc' }
        })

        // 기존 코드 목록
        const existingCodes = corps.map(c => c.code).filter(Boolean) as string[]

        // 숫자 추출해서 최대값 찾기
        const numbers = corps
            .map(c => {
                const match = c.code?.match(/_(\d+)$/)
                return match ? parseInt(match[1], 10) : 0
            })
            .filter(n => n > 0)

        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
        const nextNumber = maxNumber + 1

        const nextCode = `${prefix}_${nextNumber.toString().padStart(3, '0')}`

        return NextResponse.json({
            nextCode,
            existingCodes,
            prefix
        })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
