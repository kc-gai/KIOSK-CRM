import { NextRequest, NextResponse } from 'next/server'

// 주소로 우편번호를 검색하는 API
// 일본 주소를 받아서 우편번호를 반환

// 도도부현 목록 (우편번호 앞자리 매핑용)
const PREFECTURE_CODES: Record<string, string[]> = {
    '北海道': ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'],
    '青森': ['03'],
    '岩手': ['02'],
    '宮城': ['98', '98'],
    '秋田': ['01'],
    '山形': ['99'],
    '福島': ['96', '97'],
    '茨城': ['30', '31'],
    '栃木': ['32'],
    '群馬': ['37'],
    '埼玉': ['33', '34', '35', '36'],
    '千葉': ['26', '27', '28', '29'],
    '東京': ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    '神奈川': ['21', '22', '23', '24', '25'],
    '新潟': ['94', '95'],
    '富山': ['93'],
    '石川': ['92'],
    '福井': ['91'],
    '山梨': ['40'],
    '長野': ['38', '39'],
    '岐阜': ['50'],
    '静岡': ['41', '42', '43'],
    '愛知': ['44', '45', '46', '47', '48', '49'],
    '三重': ['51'],
    '滋賀': ['52'],
    '京都': ['60', '61', '62'],
    '大阪': ['53', '54', '55', '56', '57', '58', '59'],
    '兵庫': ['65', '66', '67'],
    '奈良': ['63'],
    '和歌山': ['64'],
    '鳥取': ['68'],
    '島根': ['69'],
    '岡山': ['70', '71'],
    '広島': ['72', '73'],
    '山口': ['74', '75'],
    '徳島': ['77'],
    '香川': ['76'],
    '愛媛': ['79'],
    '高知': ['78'],
    '福岡': ['80', '81', '82', '83'],
    '佐賀': ['84'],
    '長崎': ['85'],
    '熊本': ['86'],
    '大分': ['87'],
    '宮崎': ['88'],
    '鹿児島': ['89'],
    '沖縄': ['90'],
}

// 주소에서 도도부현 추출
function extractPrefecture(address: string): string | null {
    for (const pref of Object.keys(PREFECTURE_CODES)) {
        if (address.includes(pref)) {
            return pref
        }
    }
    // 県/都/府/道로 끝나는 패턴
    const match = address.match(/^(.+?[県都府道])/)
    if (match) {
        return match[1].replace(/[県都府道]$/, '')
    }
    return null
}

// Google Geocoding API를 사용한 주소→우편번호 변환 (무료 대안)
// 여기서는 zipcloud의 역검색 기능이 없으므로,
// 주소에서 키워드를 추출하여 검색하는 방식 사용

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const addresses: string[] = body.addresses || []

        if (!addresses || addresses.length === 0) {
            return NextResponse.json({
                error: '주소 목록이 필요합니다',
                results: []
            }, { status: 400 })
        }

        const results: { address: string; postalCode: string | null; error?: string }[] = []

        for (const address of addresses) {
            if (!address || address.trim() === '') {
                results.push({ address, postalCode: null, error: '빈 주소' })
                continue
            }

            try {
                // 주소에서 도도부현과 시구정촌 추출
                const prefecture = extractPrefecture(address)

                if (!prefecture) {
                    results.push({ address, postalCode: null, error: '도도부현을 찾을 수 없음' })
                    continue
                }

                // 시/구/정/촌 추출 시도
                const cityMatch = address.match(/[県都府道](.+?[市区町村郡])/)
                const city = cityMatch ? cityMatch[1] : ''

                // 정목 추출
                const townMatch = address.match(/[市区町村郡](.+?[0-9０-９丁目番地])/) ||
                                  address.match(/[市区町村郡](.+?)(?:[0-9０-９]|$)/)
                const town = townMatch ? townMatch[1].replace(/[0-9０-９丁目番地\-－]+.*$/, '') : ''

                // zipcloud API로 검색 (우편번호로 검색하는 것이 원래 용도이지만,
                // 주소 검색을 위해 다른 방법 필요)

                // 일본 우편번호 검색 (postal-code.ninja 또는 유사 서비스)
                // 여기서는 간단히 주소 패턴 매칭으로 처리

                // 실제 구현에서는 외부 API 호출이 필요
                // 임시로 null 반환
                results.push({
                    address,
                    postalCode: null,
                    error: '주소 역검색 API 미구현 - 수동 입력 필요'
                })

            } catch (e) {
                results.push({ address, postalCode: null, error: '처리 중 오류' })
            }
        }

        return NextResponse.json({ results })

    } catch (error) {
        console.error('Reverse postal code search error:', error)
        return NextResponse.json(
            { error: '처리 중 오류가 발생했습니다', results: [] },
            { status: 500 }
        )
    }
}
