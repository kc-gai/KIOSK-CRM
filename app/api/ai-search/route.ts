import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// AI 검색 API - 자연어 쿼리로 데이터베이스 검색
export async function POST(req: Request) {
    try {
        const { query } = await req.json()

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ error: "Query is required (min 2 chars)" }, { status: 400 })
        }

        const q = query.trim().toLowerCase()
        const results: {
            type: string
            items: unknown[]
            count: number
        }[] = []

        // 1. 키오스크 검색 (시리얼번호, AnyDesk ID, 지점명)
        const kiosks = await prisma.kiosk.findMany({
            where: {
                OR: [
                    { serialNumber: { contains: q } },
                    { kioskNumber: { contains: q } },
                    { anydeskId: { contains: q } },
                    { branchName: { contains: q } },
                    { brandName: { contains: q } }
                ]
            },
            include: {
                currentPartner: { select: { name: true } },
                branch: {
                    select: {
                        name: true,
                        corporation: {
                            select: {
                                name: true,
                                fc: { select: { name: true } }
                            }
                        }
                    }
                }
            },
            take: 20
        })

        if (kiosks.length > 0) {
            results.push({
                type: 'kiosk',
                items: kiosks.map(k => ({
                    id: k.id,
                    serialNumber: k.serialNumber,
                    kioskNumber: k.kioskNumber,
                    anydeskId: k.anydeskId,
                    status: k.status,
                    deliveryStatus: k.deliveryStatus,
                    branchName: k.branch?.name || k.branchName,
                    corporationName: k.branch?.corporation?.name,
                    fcName: k.branch?.corporation?.fc?.name,
                    partnerName: k.currentPartner?.name,
                    regionCode: k.regionCode,
                    areaCode: k.areaCode
                })),
                count: kiosks.length
            })
        }

        // 2. 거래처 검색
        const partners = await prisma.partner.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { nameJa: { contains: q } },
                    { contact: { contains: q } },
                    { address: { contains: q } }
                ]
            },
            include: {
                _count: { select: { currentKiosks: true } }
            },
            take: 20
        })

        if (partners.length > 0) {
            results.push({
                type: 'partner',
                items: partners.map(p => ({
                    id: p.id,
                    name: p.name,
                    nameJa: p.nameJa,
                    type: p.type,
                    contact: p.contact,
                    address: p.address,
                    kioskCount: p._count.currentKiosks
                })),
                count: partners.length
            })
        }

        // 3. FC 검색
        const fcs = await prisma.fC.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { nameJa: { contains: q } }
                ]
            },
            include: {
                _count: { select: { corporations: true } }
            },
            take: 20
        })

        if (fcs.length > 0) {
            results.push({
                type: 'fc',
                items: fcs.map(f => ({
                    id: f.id,
                    name: f.name,
                    nameJa: f.nameJa,
                    fcType: f.fcType,
                    corporationCount: f._count.corporations
                })),
                count: fcs.length
            })
        }

        // 4. 법인 검색
        const corporations = await prisma.corporation.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { nameJa: { contains: q } }
                ]
            },
            include: {
                fc: { select: { name: true } },
                _count: { select: { branches: true } }
            },
            take: 20
        })

        if (corporations.length > 0) {
            results.push({
                type: 'corporation',
                items: corporations.map(c => ({
                    id: c.id,
                    name: c.name,
                    nameJa: c.nameJa,
                    fcName: c.fc?.name,
                    branchCount: c._count.branches
                })),
                count: corporations.length
            })
        }

        // 5. 지점 검색
        const branches = await prisma.branch.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { nameJa: { contains: q } },
                    { address: { contains: q } },
                    { managerName: { contains: q } }
                ]
            },
            include: {
                corporation: {
                    select: {
                        name: true,
                        fc: { select: { name: true } }
                    }
                },
                _count: { select: { kiosks: true } }
            },
            take: 20
        })

        if (branches.length > 0) {
            results.push({
                type: 'branch',
                items: branches.map(b => ({
                    id: b.id,
                    name: b.name,
                    nameJa: b.nameJa,
                    address: b.address,
                    corporationName: b.corporation.name,
                    fcName: b.corporation.fc?.name,
                    regionCode: b.regionCode,
                    areaCode: b.areaCode,
                    kioskCount: b._count.kiosks
                })),
                count: branches.length
            })
        }

        // 6. 납품 현황 검색
        const deliveries = await prisma.delivery.findMany({
            where: {
                OR: [
                    { serialNumber: { contains: q } },
                    { anydeskId: { contains: q } },
                    { destination: { contains: q } },
                    { invoiceNumber: { contains: q } },
                    { recipientName: { contains: q } }
                ]
            },
            take: 20
        })

        if (deliveries.length > 0) {
            results.push({
                type: 'delivery',
                items: deliveries.map(d => ({
                    id: d.id,
                    serialNumber: d.serialNumber,
                    anydeskId: d.anydeskId,
                    destination: d.destination,
                    status: d.status,
                    deliveryDate: d.deliveryDate
                })),
                count: deliveries.length
            })
        }

        // 7. 지역 검색
        const regions = await prisma.region.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { code: { contains: q } },
                    { prefectures: { contains: q } }
                ]
            },
            take: 10
        })

        if (regions.length > 0) {
            results.push({
                type: 'region',
                items: regions.map(r => ({
                    id: r.id,
                    code: r.code,
                    name: r.name,
                    prefectures: r.prefectures
                })),
                count: regions.length
            })
        }

        // 총 결과 수 계산
        const totalCount = results.reduce((sum, r) => sum + r.count, 0)

        return NextResponse.json({
            query: query.trim(),
            totalCount,
            results
        })
    } catch (error) {
        console.error('AI Search Error:', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

// 데이터 통계 가져오기
export async function GET() {
    try {
        const [
            kioskCount,
            partnerCount,
            fcCount,
            corporationCount,
            branchCount,
            deliveryCount,
            regionCount,
            areaCount
        ] = await Promise.all([
            prisma.kiosk.count(),
            prisma.partner.count(),
            prisma.fC.count(),
            prisma.corporation.count(),
            prisma.branch.count(),
            prisma.delivery.count(),
            prisma.region.count(),
            prisma.area.count()
        ])

        // 최근 키오스크 상태별 통계
        const kioskStatuses = await prisma.kiosk.groupBy({
            by: ['status'],
            _count: true
        })

        // 최근 납품 상태별 통계
        const deliveryStatuses = await prisma.delivery.groupBy({
            by: ['status'],
            _count: true
        })

        return NextResponse.json({
            counts: {
                kiosks: kioskCount,
                partners: partnerCount,
                fcs: fcCount,
                corporations: corporationCount,
                branches: branchCount,
                deliveries: deliveryCount,
                regions: regionCount,
                areas: areaCount
            },
            kioskStatuses: kioskStatuses.reduce((acc, s) => {
                acc[s.status] = s._count
                return acc
            }, {} as Record<string, number>),
            deliveryStatuses: deliveryStatuses.reduce((acc, s) => {
                acc[s.status] = s._count
                return acc
            }, {} as Record<string, number>)
        })
    } catch (error) {
        console.error('Stats Error:', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
