import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 임시: 인증 비활성화 (개발용)

export async function GET() {
    try {
        const kiosks = await prisma.kiosk.findMany({
            include: {
                currentPartner: {
                    select: { id: true, name: true, nameJa: true }
                },
                leaseCompany: {
                    select: { id: true, code: true, name: true, nameJa: true }
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        nameJa: true,
                        regionCode: true,
                        areaCode: true,
                        corporation: {
                            select: {
                                id: true,
                                name: true,
                                nameJa: true,
                                code: true,
                                fc: {
                                    select: { id: true, code: true, name: true, nameJa: true }
                                }
                            }
                        }
                    }
                },
                // 최신 이력의 정보를 가져오기 위해 history 포함 (소속 정보 포함)
                // eventDate가 같은 경우 createdAt 기준으로 가장 나중에 생성된 이력 사용
                history: {
                    orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
                    take: 1,
                    select: {
                        eventDate: true,
                        moveType: true,
                        newBranch: true,
                        newBranchId: true,
                        newBranchRel: {
                            select: {
                                id: true,
                                name: true,
                                nameJa: true,
                                regionCode: true,
                                areaCode: true,
                                corporation: {
                                    select: {
                                        id: true,
                                        name: true,
                                        nameJa: true,
                                        code: true,
                                        fc: {
                                            select: { id: true, code: true, name: true, nameJa: true }
                                        }
                                    }
                                }
                            }
                        },
                        newCorporation: {
                            select: {
                                id: true,
                                name: true,
                                nameJa: true,
                                code: true,
                                fc: {
                                    select: { id: true, code: true, name: true, nameJa: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: { history: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        // 최신 이력의 정보를 기반으로 소속 정보 오버라이드
        const kiosksWithLatestInfo = kiosks.map(kiosk => {
            const latestHistory = kiosk.history[0]

            // 최신 이력이 있으면 해당 정보로 오버라이드
            if (latestHistory) {
                // 최신 이력의 지점/법인 정보 사용
                const latestBranch = latestHistory.newBranchRel
                const latestCorporation = latestHistory.newCorporation || latestBranch?.corporation
                const latestFc = latestCorporation?.fc

                return {
                    ...kiosk,
                    latestEventDate: latestHistory.eventDate,
                    latestMoveType: latestHistory.moveType,
                    // 최신 이력 기반 소속 정보
                    latestBranchName: latestHistory.newBranch || latestBranch?.name || null,
                    latestBranch: latestBranch ? {
                        id: latestBranch.id,
                        name: latestBranch.name,
                        nameJa: latestBranch.nameJa,
                        regionCode: latestBranch.regionCode,
                        areaCode: latestBranch.areaCode,
                        corporation: latestBranch.corporation
                    } : null,
                    latestCorporation: latestCorporation ? {
                        id: latestCorporation.id,
                        name: latestCorporation.name,
                        nameJa: latestCorporation.nameJa,
                        code: latestCorporation.code,
                        fc: latestFc
                    } : null,
                    history: undefined
                }
            }

            return {
                ...kiosk,
                latestEventDate: null,
                latestMoveType: null,
                latestBranchName: null,
                latestBranch: null,
                latestCorporation: null,
                history: undefined
            }
        })

        return NextResponse.json(kiosksWithLatestInfo)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()

        // 코드 중복 체크 (코드가 있는 경우에만)
        if (json.code) {
            const existing = await prisma.kiosk.findUnique({
                where: { code: json.code }
            })
            if (existing) {
                return NextResponse.json({ error: `코드 '${json.code}'가 이미 존재합니다` }, { status: 400 })
            }
        }

        // serialNumber가 비어있으면 임시 값 생성 (TEMP-타임스탬프-랜덤)
        let serialNumber = json.serialNumber
        if (!serialNumber || serialNumber.trim() === '') {
            const timestamp = Date.now()
            const random = Math.floor(Math.random() * 1000)
            serialNumber = `TEMP-${timestamp}-${random}`
        }

        // serialNumber 중복 체크
        const existingSerial = await prisma.kiosk.findUnique({
            where: { serialNumber }
        })
        if (existingSerial) {
            return NextResponse.json({ error: `시리얼 번호 '${serialNumber}'가 이미 존재합니다` }, { status: 400 })
        }

        const kiosk = await prisma.kiosk.create({
            data: {
                code: json.code || null,
                serialNumber,
                kioskNumber: json.kioskNumber || null,
                anydeskId: json.anydeskId || null,
                brandName: json.brandName || null,
                currentPartnerId: json.currentPartnerId || null,
                branchId: json.branchId || null,
                branchName: json.branchName || null,
                regionCode: json.regionCode || null,
                areaCode: json.areaCode || null,
                acquisition: json.acquisition || 'PURCHASE',
                salePrice: json.salePrice ? parseInt(json.salePrice) : null,
                orderRequestDate: json.orderRequestDate ? new Date(json.orderRequestDate) : null,
                deliveryDueDate: json.deliveryDueDate || null,  // 텍스트 형식 지원을 위해 String으로 저장
                deliveryDate: json.deliveryDate ? new Date(json.deliveryDate) : null,
                deliveryStatus: json.deliveryStatus || 'PENDING',
                status: json.status || 'IN_STOCK'
            },
            include: {
                currentPartner: {
                    select: { id: true, name: true, nameJa: true }
                }
            }
        })

        // branchId가 있으면 해당 Branch의 corporationId 조회
        let newBranchCorporationId: string | null = null
        if (json.branchId) {
            const newBranch = await prisma.branch.findUnique({
                where: { id: json.branchId },
                select: { corporationId: true }
            })
            newBranchCorporationId = newBranch?.corporationId || null
        }

        // 이력 생성 - 입력된 납품일(deliveryDate)을 eventDate로 사용
        await prisma.locationHistory.create({
            data: {
                kioskId: kiosk.id,
                newLocation: json.branchName || '창고 (신규등록)',
                newPartnerId: json.currentPartnerId || null,
                newBranch: json.branchName || null,
                newBranchId: json.branchId || null,
                newCorporationId: newBranchCorporationId,
                moveType: 'DEPLOY',
                description: '신규 자산 등록',
                eventDate: json.deliveryDate ? new Date(json.deliveryDate) : new Date()
            }
        })

        return NextResponse.json(kiosk)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
