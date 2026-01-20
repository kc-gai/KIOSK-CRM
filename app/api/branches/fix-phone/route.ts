import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 담당자명에 있는 전화번호를 담당자연락처로 이동하는 API
export async function POST() {
    try {
        // 담당자명에 전화번호 패턴이 있는 지점들 조회
        const branches = await prisma.branch.findMany({
            where: {
                OR: [
                    { managerName: { contains: '-' } },
                    { managerName: { startsWith: '0' } }
                ]
            }
        })

        const updated: string[] = []
        const phonePattern = /^[\d\-\(\)\s]+$/

        for (const branch of branches) {
            if (branch.managerName && phonePattern.test(branch.managerName.trim())) {
                // 담당자명이 전화번호인 경우 - 연락처로 이동
                await prisma.branch.update({
                    where: { id: branch.id },
                    data: {
                        managerPhone: branch.managerName.trim(),
                        managerName: null
                    }
                })
                updated.push(`${branch.name}: ${branch.managerName} → managerPhone`)
            }
        }

        return NextResponse.json({
            success: true,
            updated: updated.length,
            details: updated
        })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
