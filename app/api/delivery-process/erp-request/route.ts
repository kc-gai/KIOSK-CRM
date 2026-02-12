import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 키오스크 판매 유형 한글 변환
const saleTypeDisplay = (type: string | null | undefined) => {
    switch (type) {
        case 'FREE': return '無償(무상)'
        case 'PAID': return '有償(유상)'
        case 'FREE_TO_PAID': return '無償→有償(무상→유상전환)'
        default: return '-'
    }
}

type ContractInfo = {
    partnerName: string
    partnerNameJa: string
    kioskSaleType: string
    kioskSalePrice: string
    kioskFreeCondition: string
    saleTerms: string
    maintenanceTerms: string
    commissionTerms: string
    feeChangeTerms: string
    pmsRate: string
    otaRate: string
}

// POST: 여러 납품 프로세스에 대한 ERP 통계 요청 마크다운 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { ids } = body // 납품 프로세스 ID 배열

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No process IDs provided' }, { status: 400 })
        }

        // 납품 프로세스들 조회
        const processes = await prisma.deliveryProcess.findMany({
            where: { id: { in: ids } },
            include: {
                orderProcess: {
                    include: {
                        client: true
                    }
                }
            }
        })

        if (processes.length === 0) {
            return NextResponse.json({ error: 'No processes found' }, { status: 404 })
        }

        // 각 프로세스에 대해 데이터 수집
        const rows: string[] = []
        const contractDetails: string[] = []
        const dataItems: Array<{
            processNumber: string
            serialNumber: string
            userId: string
            areaCode: string
            regionCode: string
            companyName: string
            pmsRate: string
            contractInfo: ContractInfo
        }> = []

        for (const process of processes) {
            // 시리얼 번호로 키오스크 정보 조회
            const kiosk = await prisma.kiosk.findFirst({
                where: { serialNumber: process.serialNumber },
                include: {
                    currentPartner: true
                }
            })

            // 관할 지역/사무실 정보 조회
            let region = null
            let area = null
            if (kiosk?.regionCode) {
                region = await prisma.region.findUnique({ where: { code: kiosk.regionCode } })
            }
            if (kiosk?.areaCode) {
                area = await prisma.area.findUnique({ where: { code: kiosk.areaCode } })
            }

            // Partner(거래처) 정보
            const partner = kiosk?.currentPartner || process.orderProcess?.client
            const pmsRate = partner?.pmsRate ? `${partner.pmsRate}%` : '-'

            // 회사명 구성 (FC/브랜드명 + 지점명)
            const brandName = kiosk?.brandName || ''
            const branchName = kiosk?.branchName || ''
            const companyName = brandName && branchName
                ? `${brandName}/${branchName}`
                : brandName || branchName || partner?.nameJa || partner?.name || '-'

            // 사용자ID 구성 (지점명)
            const userId = branchName || kiosk?.branchName || partner?.nameJa || '-'

            // 관할지점CODE
            const areaCodeDisplay = area ? `${area.name}(${area.code})` : (kiosk?.areaCode || '-')

            // 지역CODE
            const regionCodeDisplay = region ? `${region.name}(${region.code})` : (kiosk?.regionCode || '-')

            // 계약 조건 정보
            const contractInfo: ContractInfo = {
                partnerName: partner?.name || '-',
                partnerNameJa: partner?.nameJa || '-',
                kioskSaleType: saleTypeDisplay(partner?.kioskSaleType),
                kioskSalePrice: partner?.kioskSalePrice ? `${partner.kioskSalePrice}万円` : '-',
                kioskFreeCondition: partner?.kioskFreeCondition || '-',
                saleTerms: partner?.saleTerms || '-',
                maintenanceTerms: partner?.maintenanceTerms || '-',
                commissionTerms: partner?.commissionTerms || '-',
                feeChangeTerms: partner?.feeChangeTerms || '-',
                pmsRate: pmsRate,
                otaRate: partner?.otaRate ? `${partner.otaRate}%` : '-',
            }

            rows.push(`${userId} | ${areaCodeDisplay} | ${regionCodeDisplay} | ${companyName} | ${pmsRate}`)

            // 계약 상세 정보 추가
            contractDetails.push(`
### ${companyName}
- **거래처명**: ${partner?.name || '-'} ${partner?.nameJa ? `(${partner.nameJa})` : ''}
- **시리얼번호**: ${process.serialNumber}
- **키오스크 판매**: ${contractInfo.kioskSaleType} / ${contractInfo.kioskSalePrice}
- **무상조건**: ${contractInfo.kioskFreeCondition}
- **유지보수 조건**: ${contractInfo.maintenanceTerms}
- **ERP 수수료**: PMS ${pmsRate} / OTA ${contractInfo.otaRate}
- **수수료 조건**: ${contractInfo.commissionTerms}
- **수수료 변경조건**: ${contractInfo.feeChangeTerms}
`)

            dataItems.push({
                processNumber: process.processNumber,
                serialNumber: process.serialNumber,
                userId,
                areaCode: areaCodeDisplay,
                regionCode: regionCodeDisplay,
                companyName,
                pmsRate,
                contractInfo
            })
        }

        // 오늘 날짜
        const today = new Date()
        const dateStr = `${today.getMonth() + 1}월${today.getDate()}일`

        // 마크다운 생성
        const markdown = `[PMS ERP 대쉬보드] 릴리즈 업체 업데이트 요청 ${dateStr}

## 1. 통계변경사항

사용자ID|관할지점CODE|지역CODE|会社회사명|PMS수수료율
--|--|--|--|--
${rows.join('\n')}

---

## 2. 계약 조건 상세
${contractDetails.join('\n---\n')}

---

> 🤖 자동 생성됨 - Kiosk CRM (총 ${processes.length}건)
`

        return NextResponse.json({
            success: true,
            markdown,
            count: processes.length,
            data: dataItems
        })
    } catch (error) {
        console.error('Failed to generate bulk ERP request markdown:', error)
        return NextResponse.json({ error: 'Failed to generate ERP request' }, { status: 500 })
    }
}
