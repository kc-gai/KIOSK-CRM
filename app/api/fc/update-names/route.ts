import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// FC code → brand 영문명 매핑 (CSV brand 컬럼 기준)
const FC_BRAND_MAP: Record<string, string> = {
    'FC001': 'SKY',           // スカイ
    'FC002': 'FACTORY',       // ファクトリー
    'FC003': 'GCL',           // グッドカーライフ
    'FC004': 'Ookini',        // お沖に
    'FC005': 'Lacima',        // ラシーマ
    'FC006': 'Karnori',       // カルノリ
    'FC007': 'WDN',           // ワールドネット
    'FC008': 'Amami',         // 奄美
    'FC009': 'Okinawa',       // オキナワ
    'FC010': 'Gulliver',      // ガリバー
    'FC011': 'Dragon',        // ドラゴン
    'FC012': 'EKI',           // 駅
    'FC013': 'M7',            // M7
    'FC014': 'JA',            // JA
    'FC015': 'Monaco',        // モナコ
    'FC016': 'Suzuki',        // スズキ
    'FC017': 'HIPs',          // HIPs
    'FC018': 'ThreeStars',    // スリースターズ
    'FC019': 'Fukutaro',      // 福大郎
    'FC020': 'Harepare',      // ハレバレ
    'FC021': 'NicoNico',      // ニコニコ
    'FC022': 'Lilmobi',       // リルモビ
    'FC023': 'Aix',           // アイックス
}

/**
 * POST /api/fc/update-names
 * FC 이름을 영문 brand로 일괄 업데이트
 */
export async function POST() {
    try {
        const results = {
            updated: 0,
            skipped: 0,
            errors: [] as string[]
        }

        // 모든 FC 조회
        const fcs = await prisma.fC.findMany()

        for (const fc of fcs) {
            const brandName = FC_BRAND_MAP[fc.code]

            if (brandName && brandName !== fc.code) {
                try {
                    await prisma.fC.update({
                        where: { id: fc.id },
                        data: {
                            name: `${brandName}렌터카`,
                            nameJa: fc.nameJa // 일본어 이름은 유지
                        }
                    })
                    results.updated++
                } catch (error) {
                    results.errors.push(`${fc.code}: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            } else {
                results.skipped++
            }
        }

        return NextResponse.json({
            message: `업데이트 완료: ${results.updated}건, 스킵: ${results.skipped}건`,
            results
        })

    } catch (error) {
        console.error('FC update error:', error)
        return NextResponse.json(
            { error: 'FC 업데이트 중 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/fc/update-names
 * 현재 FC 목록과 매핑 정보 확인
 */
export async function GET() {
    try {
        const fcs = await prisma.fC.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                nameJa: true
            },
            orderBy: { code: 'asc' }
        })

        const mappingInfo = fcs.map(fc => ({
            code: fc.code,
            currentName: fc.name,
            nameJa: fc.nameJa,
            newName: FC_BRAND_MAP[fc.code] ? `${FC_BRAND_MAP[fc.code]}렌터카` : fc.name,
            willUpdate: FC_BRAND_MAP[fc.code] && FC_BRAND_MAP[fc.code] !== fc.code
        }))

        return NextResponse.json({
            totalFcs: fcs.length,
            mapping: mappingInfo
        })

    } catch (error) {
        console.error('FC list error:', error)
        return NextResponse.json(
            { error: 'FC 목록 조회 중 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}
