import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 법인명 전체 번역 매핑 (일본어 법인명 → 한국어)
const CORP_NAME_MAP: Record<string, string> = {
    'スカイレンタリース株式会社': '스카이렌탈리스 주식회사',
    'スカイレンタカー九州株式会社': '스카이렌터카 규슈 주식회사',
    'スカイレンタカー関東株式会社': '스카이렌터카 간토 주식회사',
    'モビリティレンタリース株式会社': '모빌리티렌탈리스 주식회사',
    'スカイレンタカー京阪株式会社': '스카이렌터카 게이한 주식회사',
    'スカイレンタカー四国株式会社': '스카이렌터카 시코쿠 주식회사',
    'スカイオートリンク株式会社': '스카이오토링크 주식회사',
    '株式会社グロウイング': '그로잉 주식회사',
    '株式会社GCLコーポレーション': 'GCL코퍼레이션',
    '株式会社レンタカーふくたろう': '렌터카 후쿠타로 주식회사',
    '大庄グループおおきにレンタカー大阪ゆいまーる店': '오오쇼그룹 오오키니렌터카 오사카 유이마루점',
    '株式会社おおきにレンタカー': '오오키니렌터카 주식회사',
    '株式会社ホンダカーリース関西': '혼다카리스 간사이 주식회사',
    '株式会社ラシマレンタカー': '라시마렌터카 주식회사',
    '花菱ソーイング株式会社': '하나비시소잉 주식회사',
    '株式会社かるのり': '카루노리 주식회사',
    '株式会社ワールドネットレンタカー': '월드넷렌터카 주식회사',
    '株式会社Kisser': 'Kisser 주식회사',
    '株式会社フジ・コーポレーション': '후지코퍼레이션',
    '株式会社沖創工': '오키소코 주식회사',
    '株式会社ガリバーインターナショナル': '걸리버인터내셔널 주식회사',
    '株式会社ニコニコモータース': '니코니코모터스 주식회사',
    '株式会社ドラゴン': '드래곤 주식회사',
    'JR西日本レンタカー&リース株式会社': 'JR서일본렌터카&리스 주식회사',
    '株式会社日産カーレンタルソリューション': '닛산카렌탈솔루션 주식회사',
    '株式会社駅レンタカー関西': '에키렌터카간사이 주식회사',
    '株式会社HIP\'s': 'HIP\'s 주식회사',
    '合同会社トライザ': '트라이저 합동회사',
    '株式会社ハレバレ': '하레바레 주식회사',
    '株式会社K2service.R': 'K2서비스.R 주식회사',
    '株式会社アイックス': '아익스 주식회사',
    '株式会社リルモビ': '리루모비 주식회사',
    '有限会社JAレンタカー': 'JA렌터카 유한회사',
    // 추가 법인
    'HIPsレンタカー株式会社': 'HIPs렌터카 주식회사',
    'JR東日本レンタリース株式会社': 'JR동일본렌탈리스 주식회사',
    'イトウ建機リース株式会社': '이토건기리스 주식회사',
    'エムセブングループ株式会社': '엠세븐그룹 주식회사',
    'カルノリレンタカー株式会社': '카루노리렌터카 주식회사',
    'グッドカーライフ株式会社': '굿카라이프 주식회사',
    'ワールドネット株式会社': '월드넷 주식회사',
    '有限会社ライズ': '라이즈 유한회사',
    '東林貿易株式会社': '동림무역 주식회사',
    '株式会社 IDOM Caas Technology': 'IDOM Caas Technology 주식회사',
    '株式会社 River': 'River 주식회사',
    '株式会社G-WORKS': 'G-WORKS 주식회사',
    '株式会社JR北海道ソリューションズ': 'JR홋카이도솔루션즈 주식회사',
    '株式会社JR홋카이도ソリューションズ': 'JR홋카이도솔루션즈 주식회사',
    '株式会社N2': 'N2 주식회사',
    '株式会社SSY': 'SSY 주식회사',
    '株式会社しんれんリース': '신렌리스 주식회사',
    '株式会社スリースターズ': '쓰리스타즈 주식회사',
    '株式会社ラシーマ': '라시마 주식회사',
    '株式会社レンタス': '렌타스 주식회사',
    '株式会社九州はればれ': '규슈하레바레 주식회사',
    '株式会社규슈はればれ': '규슈하레바레 주식회사',
}

// 일본어 → 한국어 지명/지점 번역 매핑
const JA_TO_KO_MAP: Record<string, string> = {
    // 지역명 (도도부현)
    '北海道': '홋카이도',
    '青森': '아오모리',
    '岩手': '이와테',
    '宮城': '미야기',
    '秋田': '아키타',
    '山形': '야마가타',
    '福島': '후쿠시마',
    '茨城': '이바라키',
    '栃木': '도치기',
    '群馬': '군마',
    '埼玉': '사이타마',
    '千葉': '치바',
    '東京': '도쿄',
    '神奈川': '가나가와',
    '新潟': '니가타',
    '富山': '도야마',
    '石川': '이시카와',
    '福井': '후쿠이',
    '山梨': '야마나시',
    '長野': '나가노',
    '岐阜': '기후',
    '静岡': '시즈오카',
    '愛知': '아이치',
    '三重': '미에',
    '滋賀': '시가',
    '京都': '교토',
    '大阪': '오사카',
    '兵庫': '효고',
    '奈良': '나라',
    '和歌山': '와카야마',
    '鳥取': '돗토리',
    '島根': '시마네',
    '岡山': '오카야마',
    '広島': '히로시마',
    '山口': '야마구치',
    '徳島': '도쿠시마',
    '香川': '가가와',
    '愛媛': '에히메',
    '高知': '고치',
    '福岡': '후쿠오카',
    '佐賀': '사가',
    '長崎': '나가사키',
    '熊本': '구마모토',
    '大分': '오이타',
    '宮崎': '미야자키',
    '鹿児島': '가고시마',
    '沖縄': '오키나와',
    // 주요 도시
    '札幌': '삿포로',
    '仙台': '센다이',
    '横浜': '요코하마',
    '名古屋': '나고야',
    '神戸': '고베',
    '那覇': '나하',
    '奄美': '아마미',
    '石垣': '이시가키',
    '宮古島': '미야코지마',
    '宮古': '미야코',
    '小倉': '고쿠라',
    '博多': '하카타',
    '高松': '다카마츠',
    '松山': '마츠야마',
    '新千歳': '신치토세',
    '成田': '나리타',
    '羽田': '하네다',
    '関西': '간사이',
    '中部': '주부',
    // 추가 도시/지명
    '函館': '하코다테',
    '旭川': '아사히카와',
    '帯広': '오비히로',
    '釧路': '구시로',
    '苫小牧': '도마코마이',
    '室蘭': '무로란',
    '東室蘭': '히가시무로란',
    '洞爺': '도야',
    '小樽': '오타루',
    '新函館北斗': '신하코다테호쿠토',
    '八戸': '하치노헤',
    '盛岡': '모리오카',
    '一ノ関': '이치노세키',
    '北上': '기타카미',
    '古川': '후루카와',
    '上田': '우에다',
    '松本': '마츠모토',
    '宇都宮': '우쓰노미야',
    '小山': '오야마',
    '上毛高原': '조모고원',
    '新白河': '신시라카와',
    '燕三条': '쓰바메산조',
    '勝浦': '가쓰우라',
    '泉大津宮町': '이즈미오츠미야마치',
    '小淵沢': '고부치자와',
    '福間': '후쿠마',
    'りんくう': '링쿠',
    'てだこ浦西': '테다코우라니시',
    // 일반 용어
    '空港': '공항',
    '駅前': '역앞',
    '駅': '역',
    '営業所': '영업소',
    '店': '점',
    '支店': '지점',
    '本店': '본점',
    '中央': '중앙',
    '東口': '동쪽출구',
    '西口': '서쪽출구',
    '南口': '남쪽출구',
    '北口': '북쪽출구',
    '女神': '메가미',
    '花園': '하나조노',
    '恩納村': '온나손',
    '国頭郡': '구니가미군',
    '笠利町': '가사리초',
    '万屋': '요로즈야',
    // 기타 자주 사용되는 단어
    '九州': '규슈',
    '四国': '시코쿠',
    '関東': '간토',
    '東北': '도호쿠',
    '北陸': '호쿠리쿠',
    '中国': '주고쿠',
    'カウンター': '카운터',
    'ホテル': '호텔',
    'グランデ': '그란데',
    'タワー': '타워',
}

// 일본어 텍스트를 한국어로 변환
function translateJaToKo(text: string): string {
    if (!text) return text

    let result = text

    // 긴 단어부터 먼저 변환 (예: 鹿児島 → 가고시마 를 먼저 처리)
    const sortedEntries = Object.entries(JA_TO_KO_MAP).sort((a, b) => b[0].length - a[0].length)

    for (const [ja, ko] of sortedEntries) {
        result = result.replace(new RegExp(ja, 'g'), ko)
    }

    return result
}

// 일본어가 포함되어 있는지 확인
function containsJapanese(text: string): boolean {
    // 히라가나, 가타카나, 한자 범위 체크
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)
}

/**
 * POST /api/translate-names
 * 기존 법인/지점의 일본어 이름을 한국어로 번역
 */
export async function POST() {
    try {
        const results = {
            corporations: { updated: 0, skipped: 0, details: [] as string[] },
            branches: { updated: 0, skipped: 0, details: [] as string[] }
        }

        // 1. 법인 번역
        const corporations = await prisma.corporation.findMany()
        for (const corp of corporations) {
            // name에 일본어가 포함되어 있는 경우 번역
            if (containsJapanese(corp.name)) {
                // 먼저 전체 법인명 매핑에서 찾기
                let translatedName = CORP_NAME_MAP[corp.name]

                // 매핑에 없으면 부분 번역
                if (!translatedName) {
                    translatedName = translateJaToKo(corp.name)
                }

                if (translatedName !== corp.name) {
                    await prisma.corporation.update({
                        where: { id: corp.id },
                        data: { name: translatedName }
                    })
                    results.corporations.details.push(`${corp.name} → ${translatedName}`)
                    results.corporations.updated++
                } else {
                    results.corporations.skipped++
                }
            } else {
                results.corporations.skipped++
            }
        }

        // 2. 지점 번역
        const branches = await prisma.branch.findMany()
        for (const branch of branches) {
            // name에 일본어가 포함되어 있는 경우 번역
            if (containsJapanese(branch.name)) {
                const translatedName = translateJaToKo(branch.name)

                if (translatedName !== branch.name) {
                    await prisma.branch.update({
                        where: { id: branch.id },
                        data: { name: translatedName }
                    })
                    results.branches.details.push(`${branch.name} → ${translatedName}`)
                    results.branches.updated++
                } else {
                    results.branches.skipped++
                }
            } else {
                results.branches.skipped++
            }
        }

        return NextResponse.json({
            message: '번역 완료',
            results
        })

    } catch (error) {
        console.error('Translate error:', error)
        return NextResponse.json(
            { error: '번역 중 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/translate-names
 * 번역 미리보기
 */
export async function GET() {
    try {
        const corporations = await prisma.corporation.findMany({
            select: { id: true, name: true, nameJa: true }
        })
        const branches = await prisma.branch.findMany({
            select: { id: true, name: true, nameJa: true }
        })

        const preview = {
            corporations: corporations
                .filter(c => c.name === c.nameJa && c.nameJa)
                .map(c => ({
                    id: c.id,
                    current: c.name,
                    translated: translateJaToKo(c.nameJa || '')
                })),
            branches: branches
                .filter(b => b.name === b.nameJa && b.nameJa)
                .map(b => ({
                    id: b.id,
                    current: b.name,
                    translated: translateJaToKo(b.nameJa || '')
                }))
        }

        return NextResponse.json({
            totalToTranslate: {
                corporations: preview.corporations.length,
                branches: preview.branches.length
            },
            preview
        })

    } catch (error) {
        console.error('Preview error:', error)
        return NextResponse.json(
            { error: '미리보기 중 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}
