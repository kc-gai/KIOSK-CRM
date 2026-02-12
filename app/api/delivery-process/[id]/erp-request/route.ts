import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: ERP 통계 요청 마크다운 생성
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        // 납품 프로세스 조회
        const process = await prisma.deliveryProcess.findUnique({
            where: { id },
            include: {
                orderProcess: {
                    include: {
                        client: true
                    }
                }
            }
        })

        if (!process) {
            return NextResponse.json({ error: 'Process not found' }, { status: 404 })
        }

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

        // PMS 수수료율
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

        // 거래처 계약 조건 정보
        const contractInfo = {
            // 1. 키오스크 판매대금/조건
            kioskSaleType: partner?.kioskSaleType || '-',
            kioskSalePrice: partner?.kioskSalePrice ? `${partner.kioskSalePrice}万円` : '-',
            kioskFreeCondition: partner?.kioskFreeCondition || '-',
            saleTerms: partner?.saleTerms || '-',

            // 2. 키오스크 유지보수 비용/조건
            maintenanceTerms: partner?.maintenanceTerms || '-',

            // 3. ERP 수수료 조건
            commissionTerms: partner?.commissionTerms || '-',
            feeChangeTerms: partner?.feeChangeTerms || '-',
            otaRate: partner?.otaRate ? `${partner.otaRate}%` : '-',
        }

        // 키오스크 판매 유형 한글 변환
        const saleTypeDisplay = (type: string | null | undefined) => {
            switch (type) {
                case 'FREE': return '無償(무상)'
                case 'PAID': return '有償(유상)'
                case 'FREE_TO_PAID': return '無償→有償(무상→유상전환)'
                default: return '-'
            }
        }

        // 오늘 날짜
        const today = new Date()
        const dateStr = `${today.getMonth() + 1}월${today.getDate()}일`

        // 마크다운 생성
        const markdown = `[PMS ERP 대쉬보드] 릴리즈 업체 업데이트 요청 ${dateStr}

## 1. 통계변경사항

사용자ID|관할지점CODE|지역CODE|会社회사명|PMS수수료율
--|--|--|--|--
${userId} | ${areaCodeDisplay} | ${regionCodeDisplay} | ${companyName} | ${pmsRate}

---

## 2. 계약 조건 상세

### 거래처 정보
- **거래처명**: ${partner?.name || '-'} ${partner?.nameJa ? `(${partner.nameJa})` : ''}
- **계약일**: ${partner?.contractDate ? new Date(partner.contractDate).toLocaleDateString('ko-KR') : '-'}
- **서비스 시작일**: ${partner?.contractStartDate ? new Date(partner.contractStartDate).toLocaleDateString('ko-KR') : '-'}

### 키오스크 판매 조건
- **판매유형**: ${saleTypeDisplay(contractInfo.kioskSaleType)}
- **판매단가**: ${contractInfo.kioskSalePrice}
- **무상조건**: ${contractInfo.kioskFreeCondition}
- **판매조건 상세**: ${contractInfo.saleTerms}

### 유지보수 조건
- **유지보수 계약조건**: ${contractInfo.maintenanceTerms}

### ERP 수수료 조건
- **PMS 수수료율**: ${pmsRate}
- **OTA 수수료율**: ${contractInfo.otaRate}
- **수수료 조건**: ${contractInfo.commissionTerms}
- **수수료 변경 조건**: ${contractInfo.feeChangeTerms}

---

## 3. 납품 정보
- **납품번호**: ${process.processNumber}
- **시리얼번호**: ${process.serialNumber}
- **모델명**: ${process.modelName || '-'}
- **납품일**: ${process.actualArrival ? new Date(process.actualArrival).toLocaleDateString('ko-KR') : '-'}
- **검수결과**: ${process.inspectionPassed ? '합격' : (process.inspectionPassed === false ? '불합격' : '미검수')}

---

> 🤖 자동 생성됨 - Kiosk CRM
`

        return NextResponse.json({
            success: true,
            markdown,
            data: {
                processNumber: process.processNumber,
                serialNumber: process.serialNumber,
                userId,
                areaCode: areaCodeDisplay,
                regionCode: regionCodeDisplay,
                companyName,
                pmsRate,
                deliveryDate: process.actualArrival,
                inspectionPassed: process.inspectionPassed,
                // 계약 조건 정보 추가
                contractInfo: {
                    partnerName: partner?.name || '-',
                    partnerNameJa: partner?.nameJa || '-',
                    contractDate: partner?.contractDate,
                    contractStartDate: partner?.contractStartDate,
                    ...contractInfo,
                    kioskSaleTypeDisplay: saleTypeDisplay(contractInfo.kioskSaleType)
                }
            }
        })
    } catch (error) {
        console.error('Failed to generate ERP request markdown:', error)
        return NextResponse.json({ error: 'Failed to generate ERP request' }, { status: 500 })
    }
}
