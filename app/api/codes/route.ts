import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 전체 코드 목록 조회 API
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''
        const type = searchParams.get('type') || 'all' // all, fc, corp, branch

        const codes: {
            code: string
            type: string
            name: string
            nameJa: string | null
            parentCode: string | null
            parentName: string | null
            isActive: boolean
        }[] = []

        // FC 코드 조회
        if (type === 'all' || type === 'fc') {
            const fcs = await prisma.fC.findMany({
                where: search ? {
                    OR: [
                        { code: { contains: search, mode: 'insensitive' } },
                        { name: { contains: search, mode: 'insensitive' } },
                        { nameJa: { contains: search, mode: 'insensitive' } },
                    ]
                } : undefined,
                select: {
                    code: true,
                    name: true,
                    nameJa: true,
                    isActive: true,
                },
                orderBy: { code: 'asc' }
            })

            fcs.forEach(fc => {
                codes.push({
                    code: fc.code,
                    type: 'FC',
                    name: fc.name,
                    nameJa: fc.nameJa,
                    parentCode: null,
                    parentName: null,
                    isActive: fc.isActive,
                })
            })
        }

        // 법인 코드 조회
        if (type === 'all' || type === 'corp') {
            const corps = await prisma.corporation.findMany({
                where: search ? {
                    OR: [
                        { code: { contains: search, mode: 'insensitive' } },
                        { name: { contains: search, mode: 'insensitive' } },
                        { nameJa: { contains: search, mode: 'insensitive' } },
                    ]
                } : undefined,
                select: {
                    code: true,
                    name: true,
                    nameJa: true,
                    isActive: true,
                    fc: {
                        select: {
                            code: true,
                            name: true,
                        }
                    }
                },
                orderBy: { code: 'asc' }
            })

            corps.forEach(corp => {
                codes.push({
                    code: corp.code,
                    type: 'CORP',
                    name: corp.name,
                    nameJa: corp.nameJa,
                    parentCode: corp.fc?.code || null,
                    parentName: corp.fc?.name || null,
                    isActive: corp.isActive,
                })
            })
        }

        // 지점 코드 조회
        if (type === 'all' || type === 'branch') {
            const branches = await prisma.branch.findMany({
                where: search ? {
                    OR: [
                        { code: { contains: search, mode: 'insensitive' } },
                        { name: { contains: search, mode: 'insensitive' } },
                        { nameJa: { contains: search, mode: 'insensitive' } },
                    ]
                } : undefined,
                select: {
                    code: true,
                    name: true,
                    nameJa: true,
                    isActive: true,
                    corporation: {
                        select: {
                            code: true,
                            name: true,
                        }
                    }
                },
                orderBy: { code: 'asc' }
            })

            branches.forEach(branch => {
                if (branch.code) {
                    codes.push({
                        code: branch.code,
                        type: 'BRANCH',
                        name: branch.name,
                        nameJa: branch.nameJa,
                        parentCode: branch.corporation?.code || null,
                        parentName: branch.corporation?.name || null,
                        isActive: branch.isActive,
                    })
                }
            })
        }

        // 코드 순으로 정렬
        codes.sort((a, b) => a.code.localeCompare(b.code))

        return NextResponse.json(codes)
    } catch (error) {
        console.error('Error fetching codes:', error)
        return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
    }
}
