import { NextRequest, NextResponse } from 'next/server'

// 일본 우편번호 API (zipcloud.ibsnet.co.jp) 사용
// 무료 API로 우편번호로 주소 검색 가능

type ZipCloudResult = {
    address1: string  // 도도부현
    address2: string  // 시구정촌
    address3: string  // 정목
    kana1: string
    kana2: string
    kana3: string
    prefcode: string
    zipcode: string
}

type ZipCloudResponse = {
    message: string | null
    results: ZipCloudResult[] | null
    status: number
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const postalCode = searchParams.get('code')?.replace('-', '') || ''

    if (!postalCode || postalCode.length !== 7) {
        return NextResponse.json({
            error: '유효한 우편번호를 입력하세요 (7자리)',
            results: []
        }, { status: 400 })
    }

    try {
        // zipcloud API 호출
        const response = await fetch(
            `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`,
            {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 86400 } // 24시간 캐시
            }
        )

        if (!response.ok) {
            throw new Error('API 호출 실패')
        }

        const data: ZipCloudResponse = await response.json()

        if (data.status !== 200 || !data.results) {
            return NextResponse.json({
                error: data.message || '검색 결과가 없습니다',
                results: []
            })
        }

        // 결과 변환
        const results = data.results.map((r, index) => ({
            id: index + 1,
            postalCode: r.zipcode.slice(0, 3) + '-' + r.zipcode.slice(3),
            prefecture: r.address1,      // 도도부현 (예: 埼玉県)
            city: r.address2,            // 시구정촌 (예: 春日部市)
            town: r.address3,            // 정목 (예: 粕壁東)
            fullAddress: `${r.address1}${r.address2}${r.address3}`,
            prefectureKana: r.kana1,
            cityKana: r.kana2,
            townKana: r.kana3,
        }))

        return NextResponse.json({ results })
    } catch (error) {
        console.error('Postal code search error:', error)
        return NextResponse.json({
            error: '우편번호 검색 중 오류가 발생했습니다',
            results: []
        }, { status: 500 })
    }
}
