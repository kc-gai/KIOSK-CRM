import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        // Corporation별 branch count 확인
        const corporations = await prisma.corporation.findMany({
            include: {
                branches: true,
                fc: true,
                _count: {
                    select: { branches: true }
                }
            }
        })

        const result = corporations.map(corp => ({
            id: corp.id,
            name: corp.name,
            fcName: corp.fc?.name || 'Independent',
            branchCount: corp.branches.length,
            branchCountFromCount: corp._count.branches,
            branches: corp.branches.map(b => ({
                id: b.id,
                name: b.name,
                code: b.code
            }))
        }))

        // Total counts
        const totalBranches = await prisma.branch.count()
        const totalCorps = await prisma.corporation.count()

        return NextResponse.json({
            totalCorps,
            totalBranches,
            corporations: result
        })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
