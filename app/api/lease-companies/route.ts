import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: 리스 회사 목록 조회
export async function GET() {
    try {
        const leaseCompanies = await prisma.leaseCompany.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { leasedKiosks: true }
                },
                leasedKiosks: {
                    select: {
                        id: true,
                        serialNumber: true,
                        kioskNumber: true,
                        anydeskId: true,
                        brandName: true,
                        branchName: true,
                        regionCode: true,
                        deliveryDate: true,
                        leaseStartDate: true,
                        leaseEndDate: true,
                        leaseMonthlyFee: true,
                        branch: {
                            select: {
                                name: true,
                                nameJa: true,
                                regionCode: true,
                                areaCode: true,
                                corporation: {
                                    select: {
                                        name: true,
                                        nameJa: true,
                                        fc: {
                                            select: {
                                                code: true,
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { leaseStartDate: 'desc' }
                }
            }
        })
        return NextResponse.json(leaseCompanies)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

// POST: 리스 회사 생성
export async function POST(req: Request) {
    try {
        const json = await req.json()

        // 코드 필수 체크
        if (!json.code) {
            return NextResponse.json({ error: '코드는 필수입니다' }, { status: 400 })
        }

        // 코드 중복 체크
        const existing = await prisma.leaseCompany.findUnique({
            where: { code: json.code }
        })
        if (existing) {
            return NextResponse.json({ error: `코드 '${json.code}'가 이미 존재합니다` }, { status: 400 })
        }

        const leaseCompany = await prisma.leaseCompany.create({
            data: {
                code: json.code,
                name: json.name,
                nameJa: json.nameJa || null,
                contact: json.contact || null,
                email: json.email || null,
                address: json.address || null,
                managerName: json.managerName || null,
                managerPhone: json.managerPhone || null,
                managerEmail: json.managerEmail || null,
                defaultMonthlyFee: json.defaultMonthlyFee ? parseInt(json.defaultMonthlyFee) : null,
                defaultPeriod: json.defaultPeriod ? parseInt(json.defaultPeriod) : null,
                contractTerms: json.contractTerms || null,
                isActive: json.isActive !== false
            }
        })
        return NextResponse.json(leaseCompany)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
