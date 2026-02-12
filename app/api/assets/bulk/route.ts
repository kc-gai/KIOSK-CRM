import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 주소에서 지역코드와 관할지역코드를 자동 매핑하는 함수
async function mapAddressToRegionAndArea(address: string | null | undefined): Promise<{ regionCode: string | null, areaCode: string | null }> {
    if (!address || !address.trim()) {
        return { regionCode: null, areaCode: null }
    }

    const addr = address.trim()

    // 모든 Area를 가져와서 addressKeywords 매칭
    const areas = await prisma.area.findMany({
        where: { isActive: true },
        include: { region: true }
    })

    for (const area of areas) {
        if (area.addressKeywords) {
            const keywords = area.addressKeywords.split(',').map(k => k.trim())
            for (const keyword of keywords) {
                if (keyword && addr.includes(keyword)) {
                    return {
                        regionCode: area.region.code,
                        areaCode: area.code
                    }
                }
            }
        }
    }

    // Area에서 못 찾으면 Region의 prefectures로 매칭 시도
    const regions = await prisma.region.findMany({
        where: { isActive: true }
    })

    for (const region of regions) {
        if (region.prefectures) {
            const prefectures = region.prefectures.split(',').map(p => p.trim())
            for (const pref of prefectures) {
                if (pref && addr.includes(pref)) {
                    // 해당 region의 첫 번째 area를 기본값으로
                    const defaultArea = await prisma.area.findFirst({
                        where: { regionId: region.id, isActive: true },
                        orderBy: { sortOrder: 'asc' }
                    })
                    return {
                        regionCode: region.code,
                        areaCode: defaultArea?.code || null
                    }
                }
            }
        }
    }

    return { regionCode: null, areaCode: null }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()

        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json(
                { success: false, error: "데이터가 없습니다" },
                { status: 400 }
            )
        }

        let successCount = 0
        let failedCount = 0
        const errors: string[] = []

        for (const row of data) {
            try {
                // 시리얼 번호: 비어있으면 임시 번호 생성 (나중에 수동으로 입력 가능)
                let serialNumber = row.serialNumber?.trim()
                if (!serialNumber) {
                    // 임시 시리얼 번호 생성 (TEMP-타임스탬프-랜덤)
                    serialNumber = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                }

                // corporationName으로 Corporation 및 Branch 찾기
                let branchId: string | null = null
                let brandName: string | null = null
                let regionCode: string | null = null
                let areaCode: string | null = null

                // CSV에서 주소, 우편번호, 연락처 정보 가져오기
                const csvAddress = row.address?.trim() || null
                const csvPostalCode = row.zip?.trim() || row.postalCode?.trim() || null
                const csvManagerPhone = row.managerPhone?.trim() || row.contact?.trim() || null
                const csvManagerName = row.managerName?.trim() || null

                if (row.corporationName && row.corporationName.trim()) {
                    // Corporation 찾기
                    const corporation = await prisma.corporation.findFirst({
                        where: {
                            OR: [
                                { name: { contains: row.corporationName.trim() } },
                                { nameJa: { contains: row.corporationName.trim() } }
                            ]
                        },
                        include: {
                            fc: true,
                            branches: {
                                where: row.branchName ? {
                                    OR: [
                                        { name: { contains: row.branchName.trim() } },
                                        { nameJa: { contains: row.branchName.trim() } }
                                    ]
                                } : undefined
                            }
                        }
                    })

                    if (corporation) {
                        // FC 브랜드명 설정
                        if (corporation.fc) {
                            brandName = `${corporation.fc.code} / ${corporation.fc.name}`
                        }

                        // Branch 찾기 또는 생성
                        if (row.branchName) {
                            if (corporation.branches.length > 0) {
                                const branch = corporation.branches[0]
                                branchId = branch.id
                                regionCode = branch.regionCode
                                areaCode = branch.areaCode

                                // Branch에 주소 정보가 없으면 CSV 데이터로 업데이트
                                if (csvAddress || csvPostalCode || csvManagerPhone || csvManagerName) {
                                    const updateData: any = {}
                                    if (csvAddress && !branch.address) updateData.address = csvAddress
                                    if (csvPostalCode && !branch.postalCode) updateData.postalCode = csvPostalCode
                                    if (csvManagerPhone && !branch.managerPhone) updateData.managerPhone = csvManagerPhone
                                    if (csvManagerName && !branch.managerName) updateData.managerName = csvManagerName

                                    // 주소 기반 지역코드 자동 매핑
                                    if (csvAddress && (!branch.regionCode || !branch.areaCode)) {
                                        const mapped = await mapAddressToRegionAndArea(csvAddress)
                                        if (mapped.regionCode && !branch.regionCode) {
                                            updateData.regionCode = mapped.regionCode
                                            regionCode = mapped.regionCode
                                        }
                                        if (mapped.areaCode && !branch.areaCode) {
                                            updateData.areaCode = mapped.areaCode
                                            areaCode = mapped.areaCode
                                        }
                                    }

                                    if (Object.keys(updateData).length > 0) {
                                        await prisma.branch.update({
                                            where: { id: branch.id },
                                            data: updateData
                                        })
                                    }
                                }
                            } else {
                                // Branch가 없으면 새로 생성
                                // 주소 기반 지역코드 자동 매핑
                                const mapped = await mapAddressToRegionAndArea(csvAddress)
                                regionCode = mapped.regionCode
                                areaCode = mapped.areaCode

                                const newBranch = await prisma.branch.create({
                                    data: {
                                        name: row.branchName.trim(),
                                        corporationId: corporation.id,
                                        address: csvAddress,
                                        postalCode: csvPostalCode,
                                        managerPhone: csvManagerPhone,
                                        managerName: csvManagerName,
                                        regionCode: regionCode,
                                        areaCode: areaCode
                                    }
                                })
                                branchId = newBranch.id
                            }
                        }
                    }
                }

                // 기존 키오스크 확인 (중복 시 업데이트)
                const existing = await prisma.kiosk.findUnique({
                    where: { serialNumber: serialNumber }
                })

                // 날짜 파싱 헬퍼 함수
                const parseDate = (dateStr: string | null | undefined): Date | null => {
                    if (!dateStr || !dateStr.trim()) return null
                    try {
                        const parsed = new Date(dateStr.trim())
                        return isNaN(parsed.getTime()) ? null : parsed
                    } catch {
                        return null
                    }
                }

                // acquisition 값 변환 (한국어/일본어 → 영어)
                let acquisitionValue = 'PURCHASE' // 기본값
                const acqStr = row.acquisition?.trim() || ''

                if (acqStr.toUpperCase() === 'PURCHASE' || acqStr === '구매' || acqStr === '購入') {
                    acquisitionValue = 'PURCHASE'
                } else if (acqStr.toUpperCase() === 'LEASE' || acqStr === '리스' || acqStr === 'リース') {
                    acquisitionValue = 'LEASE'
                } else if (acqStr.toUpperCase() === 'RENTAL' || acqStr === '렌탈' || acqStr === '貸出') {
                    acquisitionValue = 'RENTAL'
                }

                const kioskData = {
                    serialNumber: serialNumber,
                    kioskNumber: row.kioskNumber?.trim() || null,
                    anydeskId: row.anydeskId?.trim() || null,
                    brandName: brandName,
                    branchId: branchId,
                    branchName: row.branchName?.trim() || null,
                    regionCode: regionCode,
                    areaCode: areaCode,
                    acquisition: acquisitionValue,
                    salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
                    orderRequestDate: parseDate(row.orderRequestDate),
                    deliveryDueDate: row.deliveryDueDate?.trim() || null,  // 텍스트 형식 지원
                    deliveryStatus: 'PENDING',
                    status: 'IN_STOCK'
                }

                if (existing) {
                    // 기존 데이터 업데이트
                    await prisma.kiosk.update({
                        where: { id: existing.id },
                        data: kioskData
                    })
                } else {
                    // 신규 생성
                    await prisma.kiosk.create({
                        data: kioskData
                    })
                }

                successCount++
            } catch (rowError: any) {
                failedCount++
                errors.push(`${row.serialNumber}: ${rowError.message}`)
            }
        }

        return NextResponse.json({
            success: true,
            count: successCount,
            failed: failedCount,
            errors: errors.slice(0, 10) // 처음 10개 에러만 반환
        })
    } catch (error: any) {
        console.error("Bulk import error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
