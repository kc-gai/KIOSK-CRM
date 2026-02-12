import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from 'xlsx'

// 정규화: 앞뒤 공백 제거, 연속된 공백을 하나로
function normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ')
}

// 지점명에서 "店" 또는 "점" 제거
function cleanBranchName(text: string): string {
    const cleaned = text.replace(/店$/g, '').replace(/점$/g, '')
    return normalizeText(cleaned)
}

// CSV 파싱
function parseCSV(csvText: string): Record<string, string>[] {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    // BOM 제거
    const header = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().replace(/"/g, ''))
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        if (values.length === header.length) {
            const row: Record<string, string> = {}
            header.forEach((h, idx) => {
                row[h] = values[idx]
            })
            rows.push(row)
        }
    }

    return rows
}

// XLSX 파싱
function parseXLSX(buffer: ArrayBuffer): Record<string, string>[] {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 시트를 JSON으로 변환 (첫 행을 헤더로 사용)
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' })

    // 모든 값을 문자열로 변환
    return jsonData.map(row => {
        const stringRow: Record<string, string> = {}
        for (const [key, value] of Object.entries(row)) {
            stringRow[key] = String(value ?? '')
        }
        return stringRow
    })
}

/**
 * POST /api/clients/csv-import
 * CSV/XLSX 파일로 거래처 일괄 등록 (통합)
 *
 * 통합 CSV 형식:
 * corpName,branchName,brand,zip,address,contact,managerName,managerPhone
 *
 * - brand: FC 코드로 사용 (SKY, FACTORY 등)
 * - corpName: 법인명 (필수)
 * - branchName: 지점명 (선택)
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'CSV 또는 XLSX 파일이 필요합니다' },
                { status: 400 }
            )
        }

        // 파일 확장자 확인
        const fileName = file.name.toLowerCase()
        const isXlsx = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

        let rows: Record<string, string>[]

        if (isXlsx) {
            const buffer = await file.arrayBuffer()
            rows = parseXLSX(buffer)
        } else {
            const csvText = await file.text()
            rows = parseCSV(csvText)
        }

        if (rows.length === 0) {
            return NextResponse.json(
                { error: '파일이 비어있거나 형식이 잘못되었습니다' },
                { status: 400 }
            )
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
            created: {
                fc: 0,
                corporation: 0,
                branch: 0
            }
        }

        // 캐시 (코드 → ID 매핑)
        const fcCache = new Map<string, string>()
        const corpCache = new Map<string, string>()

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const rowNum = i + 2

            try {
                // 컬럼 값 추출
                const corpName = row['corpName'] || row['법인명'] || ''  // 일본어 법인명
                const corpNameKo = row['corpNameKo'] || row['법인명(한국어)'] || ''  // 한국어 법인명
                const branchName = row['branchName'] || row['지점명'] || ''  // 일본어 지점명
                const branchNameKo = row['branchNameKo'] || row['지점명(한국어)'] || ''  // 한국어 지점명
                const brand = row['brand'] || row['브랜드'] || ''
                const zip = row['zip'] || row['postalCode'] || row['우편번호'] || ''
                const address = row['address'] || row['주소'] || ''
                const contact = row['contact'] || row['연락처'] || ''
                const managerName = row['managerName'] || row['담당자명'] || ''
                const managerPhone = row['managerPhone'] || row['담당자연락처'] || ''

                // 필수 체크: 법인명
                if (!corpName) {
                    results.errors.push(`${rowNum}행: 법인명이 필요합니다`)
                    results.failed++
                    continue
                }

                // 1. FC 처리 (brand가 있는 경우)
                let fcId: string | null = null
                if (brand) {
                    fcId = fcCache.get(brand) || null

                    if (!fcId) {
                        // DB에서 찾기
                        let fc = await prisma.fC.findFirst({
                            where: {
                                OR: [
                                    { code: brand },
                                    { name: { contains: brand } }
                                ]
                            }
                        })

                        if (!fc) {
                            // FC 자동 생성 - 기존 FC 수를 확인하여 중복 방지
                            const existingFcCount = await prisma.fC.count()
                            const fcCode = `FC${String(existingFcCount + 1).padStart(3, '0')}`

                            try {
                                fc = await prisma.fC.create({
                                    data: {
                                        code: fcCode,
                                        name: brand,
                                        nameJa: brand,
                                        fcType: 'RENTAL_CAR'
                                    }
                                })
                                results.created.fc++
                            } catch (createError) {
                                // unique 제약 위반 시 타임스탬프 사용
                                if (createError instanceof Error && createError.message.includes('Unique')) {
                                    const retryCode = `FC_${brand}_${Date.now() % 10000}`
                                    fc = await prisma.fC.create({
                                        data: {
                                            code: retryCode,
                                            name: brand,
                                            nameJa: brand,
                                            fcType: 'RENTAL_CAR'
                                        }
                                    })
                                    results.created.fc++
                                } else {
                                    throw createError
                                }
                            }
                        }

                        fcId = fc.id
                        fcCache.set(brand, fc.id)
                    }
                }

                // 2. 법인 처리 (필수)
                let corpId = corpCache.get(corpName) || null

                if (!corpId) {
                    // DB에서 찾기
                    let corp = await prisma.corporation.findFirst({
                        where: {
                            OR: [
                                { nameJa: corpName },
                                { name: corpName },
                                { nameJa: { contains: normalizeText(corpName) } }
                            ]
                        }
                    })

                    if (!corp) {
                        // 법인 자동 생성
                        const corpCode = `CORP_${brand || 'IND'}_${String(results.created.corporation + 1).padStart(3, '0')}`
                        corp = await prisma.corporation.create({
                            data: {
                                code: corpCode,
                                name: corpNameKo || corpName,  // 한국어명 우선, 없으면 일본어명
                                nameJa: corpName,  // 일본어명
                                fcId: fcId
                            }
                        })
                        results.created.corporation++
                    }

                    corpId = corp.id
                    corpCache.set(corpName, corp.id)
                }

                // 3. 지점 처리 (있는 경우만)
                if (branchName && branchName.trim()) {
                    const branchNameCleaned = cleanBranchName(branchName)

                    // 중복 체크: 동일 법인 내 동일 지점명만 체크
                    const existingBranch = await prisma.branch.findFirst({
                        where: {
                            corporationId: corpId,
                            OR: [
                                { nameJa: branchNameCleaned },
                                { name: branchNameCleaned }
                            ]
                        }
                    })

                    if (existingBranch) {
                        // 이미 존재하면 건너뛰되 success로 카운트 (FC/법인은 처리됨)
                        results.success++
                        continue
                    }

                    // branchCode: CSV에서 읽거나, 법인 기반 순번 형식으로 자동 생성
                    const branchCodeFromCsv = row['branchCode'] || row['지점코드'] || ''
                    // 해당 법인의 현재 지점 수 조회
                    const currentBranchCount = await prisma.branch.count({
                        where: { corporationId: corpId }
                    })

                    // 법인 코드 가져오기
                    const corpData = await prisma.corporation.findUnique({
                        where: { id: corpId },
                        select: { code: true }
                    })
                    const branchCode = branchCodeFromCsv || `${corpData?.code || 'CORP'}_${String(currentBranchCount + 1).padStart(3, '0')}`

                    // 한국어 지점명 처리
                    const branchNameKoCleaned = branchNameKo ? cleanBranchName(branchNameKo) : ''

                    try {
                        await prisma.branch.create({
                            data: {
                                code: branchCode,
                                name: branchNameKoCleaned || branchNameCleaned,  // 한국어명 우선, 없으면 일본어명
                                nameJa: branchNameCleaned,  // 일본어명
                                corporationId: corpId,
                                postalCode: zip || null,
                                address: address,
                                managerName: managerName || contact || null,
                                managerPhone
                            }
                        })
                        results.created.branch++
                    } catch (createError) {
                        // unique 제약 위반 시 다른 코드로 재시도
                        if (createError instanceof Error && createError.message.includes('Unique')) {
                            const retryCode = `${corpData?.code || 'CORP'}_${Date.now() % 10000}`
                            await prisma.branch.create({
                                data: {
                                    code: retryCode,
                                    name: branchNameKoCleaned || branchNameCleaned,  // 한국어명 우선
                                    nameJa: branchNameCleaned,  // 일본어명
                                    corporationId: corpId,
                                    postalCode: zip || null,
                                    address: address,
                                    managerName: managerName || contact || null,
                                    managerPhone
                                }
                            })
                            results.created.branch++
                        } else {
                            throw createError
                        }
                    }
                }

                results.success++

            } catch (error) {
                console.error(`Row ${rowNum} error:`, error)
                results.errors.push(`${rowNum}행: 처리 중 오류 발생 - ${error instanceof Error ? error.message : ''}`)
                results.failed++
            }
        }

        return NextResponse.json({
            message: `처리 완료: 성공 ${results.success}건, 실패 ${results.failed}건`,
            results
        })

    } catch (error) {
        console.error('CSV import error:', error)
        return NextResponse.json(
            { error: '파일 처리 중 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}
