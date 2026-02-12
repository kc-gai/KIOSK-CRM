import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const fcs = await prisma.fC.findMany({
            include: {
                corporations: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        nameJa: true,
                        contact: true,
                        address: true,
                        isActive: true,
                        fcId: true,
                        contractDate: true,
                        erpFeeRate: true,
                        kioskMaintenanceCost: true,
                        kioskSaleCost: true,
                        createdAt: true,
                        updatedAt: true,
                        branches: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                nameJa: true,
                                address: true,
                                postalCode: true,
                                managerName: true,
                                managerPhone: true,
                                isActive: true,
                                corporationId: true,
                                createdAt: true,
                                updatedAt: true,
                                kiosks: {
                                    select: {
                                        id: true,
                                        acquisition: true
                                    }
                                },
                                _count: {
                                    select: { kiosks: true }
                                }
                            },
                            orderBy: { code: 'asc' }
                        },
                        _count: {
                            select: { branches: true }
                        }
                    }
                },
                _count: {
                    select: { corporations: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        // 취득유형별 카운트 추가 (FREE: 무상, LEASE_FREE: 리스(무상), PAID: 유상, RENTAL: 렌탈)
        const fcsWithAcquisitionCount = fcs.map(fc => ({
            ...fc,
            corporations: fc.corporations.map(corp => ({
                ...corp,
                branches: corp.branches.map(branch => {
                    const freeCount = branch.kiosks.filter(k => k.acquisition === 'FREE').length
                    const leaseFreeCount = branch.kiosks.filter(k => k.acquisition === 'LEASE_FREE').length
                    const paidCount = branch.kiosks.filter(k => k.acquisition === 'PAID').length
                    const rentalCount = branch.kiosks.filter(k => k.acquisition === 'RENTAL').length
                    return {
                        ...branch,
                        _acquisitionCount: {
                            free: freeCount,
                            leaseFree: leaseFreeCount,
                            paid: paidCount,
                            rental: rentalCount
                        }
                    }
                })
            }))
        }))

        return NextResponse.json(fcsWithAcquisitionCount)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()

        // 코드 필수 체크
        if (!json.code) {
            return NextResponse.json({ error: '코드는 필수입니다' }, { status: 400 })
        }

        // FC 코드 중복 체크
        const existing = await prisma.fC.findUnique({
            where: { code: json.code }
        })
        if (existing) {
            return NextResponse.json({ error: `코드 '${json.code}'가 이미 존재합니다` }, { status: 400 })
        }

        // 법인코드 생성 (CORP_XXX_001 형식 또는 전달받은 값)
        let corpCode = json.corpCode
        if (!corpCode) {
            // 법인코드 자동 생성: CORP_ + FC코드에서 숫자 추출 + _001
            const fcNumMatch = json.code.match(/\d+/)
            const fcNum = fcNumMatch ? fcNumMatch[0].padStart(3, '0') : '001'
            corpCode = `CORP_${fcNum}_001`

            // 중복 확인 및 연번 증가
            let counter = 1
            while (true) {
                const existingCorp = await prisma.corporation.findUnique({
                    where: { code: corpCode }
                })
                if (!existingCorp) break
                counter++
                corpCode = `CORP_${fcNum}_${counter.toString().padStart(3, '0')}`
            }
        }

        // FC와 법인을 함께 생성 (트랜잭션)
        // 법인명은 별도 입력(corpName, corpNameJa)이 있으면 사용, 없으면 브랜드명(name, nameJa)과 동일
        const fc = await prisma.$transaction(async (tx) => {
            // 1. FC 생성 (name, nameJa = 브랜드명)
            const newFc = await tx.fC.create({
                data: {
                    code: json.code,
                    name: json.name,
                    nameJa: json.nameJa,
                    fcType: json.fcType || 'RENTAL_CAR',
                    contact: json.contact,
                    address: json.address,
                    contractDate: json.contractDate ? new Date(json.contractDate) : null,
                    commissionRate: json.commissionRate,
                    isActive: json.isActive ?? true
                }
            })

            // 2. 법인 자동 생성 (corpName, corpNameJa가 있으면 사용, 없으면 브랜드명 사용)
            await tx.corporation.create({
                data: {
                    code: corpCode,
                    name: json.corpName || json.name,
                    nameJa: json.corpNameJa || json.nameJa,
                    contact: json.contact,
                    address: json.address,
                    fcId: newFc.id,
                    isActive: true
                }
            })

            return newFc
        })

        return NextResponse.json(fc)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
