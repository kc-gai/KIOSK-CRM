'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type DeliveryItem = {
    corporationId: string | null
    corporationName: string | null
    branchId: string | null
    branchName: string | null
    brandName: string | null
    postalCode: string | null
    address: string | null
    contact: string | null
    acquisition: string
    kioskCount: number
    plateCount: number
    desiredDeliveryDate?: string | null
    leaseCompanyId?: string | null
    leaseCompanyName?: string | null
}

type OrderData = {
    id: string
    orderNumber: string
    title: string | null
    requesterName: string | null
    kioskUnitPrice: number | null
    plateUnitPrice: number | null
    taxIncluded: boolean
    totalAmount: number | null
    orderRequestDate: string | null
    desiredDeliveryDate: string | null
    corporationName: string | null
    branchName: string | null
    brandName: string | null
    postalCode: string | null
    address: string | null
    contact: string | null
    kioskCount: number
    plateCount: number
    acquisition: string | null
    status: string
    memo: string | null
    createdAt: string
    items: DeliveryItem[] | null
}

// memo 필드에서 실제 비고 내용만 추출
const parseNotes = (memo: string | null): string => {
    if (!memo) return ''
    try {
        const parsed = JSON.parse(memo)
        return parsed.notes || ''
    } catch {
        return memo
    }
}

// 날짜 문자열을 일본어 형식으로 변환 (YYYYMMDD 또는 ISO 형식 지원)
const formatDateJa = (dateStr: string | null): string => {
    if (!dateStr) return '-'

    // YYYYMMDD 형식 (예: "20260122")
    if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        return `${year}/${parseInt(month)}/${parseInt(day)}`
    }

    // ISO 형식 또는 기타 형식
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('ja-JP')
}

export default function OrderPdfPage() {
    const params = useParams()
    const [order, setOrder] = useState<OrderData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/order/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setOrder(data)
                }
            } catch (error) {
                console.error('Failed to fetch order:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchOrder()
    }, [params.id])

    useEffect(() => {
        // 데이터 로딩 후 자동 인쇄 다이얼로그 표시
        if (!isLoading && order) {
            setTimeout(() => {
                window.print()
            }, 500)
        }
    }, [isLoading, order])

    // 일본어 고정
    const getAcquisitionLabel = (acquisition: string) => {
        const map: Record<string, string> = {
            'PAID': '有償販売',
            'PURCHASE': '有償販売',
            'FREE': '無償提供',
            'LEASE': 'リース',
            'LEASE_FREE': '無償提供(リース)',
            'RENTAL': 'レンタル'
        }
        return map[acquisition] || acquisition
    }

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <p>発注が見つかりません</p>
            </div>
        )
    }

    // 금액 계산
    const subtotal = (order.kioskUnitPrice || 0) * (order.kioskCount || 0) + (order.plateUnitPrice || 0) * (order.plateCount || 0)

    // 납품 항목 (복수 또는 단일)
    const deliveryItems: DeliveryItem[] = order.items || [{
        corporationId: null,
        corporationName: order.corporationName,
        branchId: null,
        branchName: order.branchName,
        brandName: order.brandName,
        postalCode: order.postalCode,
        address: order.address,
        contact: order.contact,
        acquisition: order.acquisition || 'FREE',
        kioskCount: order.kioskCount,
        plateCount: order.plateCount
    }]

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .pdf-stamp-area {
                        display: none !important;
                    }
                }
                .pdf-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                    font-family: 'Noto Sans JP', 'Malgun Gothic', sans-serif;
                    font-size: 12px;
                    line-height: 1.6;
                }
                .pdf-header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .pdf-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .pdf-subtitle {
                    font-size: 14px;
                    color: #666;
                }
                .pdf-section {
                    margin-bottom: 25px;
                }
                .pdf-section-title {
                    font-size: 14px;
                    font-weight: bold;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                    margin-bottom: 15px;
                }
                .pdf-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .pdf-table th, .pdf-table td {
                    border: 1px solid #ddd;
                    padding: 8px 12px;
                    text-align: left;
                }
                .pdf-table th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                    width: 140px;
                }
                .pdf-table-items th {
                    background-color: #f5f5f5;
                    text-align: center;
                }
                .pdf-table-items td {
                    text-align: center;
                }
                .pdf-table-items td.text-right {
                    text-align: right;
                }
                .pdf-total {
                    margin-top: 20px;
                    text-align: right;
                }
                .pdf-total-row {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 5px;
                }
                .pdf-total-label {
                    width: 100px;
                    text-align: right;
                    margin-right: 20px;
                }
                .pdf-total-value {
                    width: 120px;
                    text-align: right;
                    font-weight: bold;
                }
                .pdf-footer {
                    margin-top: 50px;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                    font-size: 11px;
                    color: #666;
                }
                .pdf-stamp-area {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 40px;
                }
                .pdf-stamp-box {
                    width: 80px;
                    height: 80px;
                    border: 1px solid #ddd;
                    margin-left: 20px;
                    text-align: center;
                    padding-top: 60px;
                    font-size: 10px;
                    color: #999;
                }
                .btn-print {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 12px 24px;
                    background: #206bc4;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                .btn-print:hover {
                    background: #1a5eb8;
                }
            `}</style>

            <div className="pdf-container">
                <div className="pdf-header">
                    <div className="pdf-title">納品依頼書</div>
                    <div className="pdf-subtitle">No. {order.orderNumber.replace('ORD-', '')}</div>
                </div>

                {/* 기본 정보 - 일본어 고정 */}
                <div className="pdf-section">
                    <div className="pdf-section-title">基本情報</div>
                    <table className="pdf-table">
                        <tbody>
                            <tr>
                                <th style={{ width: '15%' }}>No</th>
                                <td style={{ width: '35%' }}>{order.orderNumber.replace('ORD-', '')}</td>
                                <th style={{ width: '15%' }}>発注日</th>
                                <td style={{ width: '35%' }}>{formatDateJa(order.orderRequestDate)}</td>
                            </tr>
                            <tr>
                                <th>納品依頼者</th>
                                <td>{order.requesterName || '-'}</td>
                                <th>キオスク単価</th>
                                <td>{(order.kioskUnitPrice || 0).toLocaleString()} 円 (税抜)</td>
                            </tr>
                            <tr>
                                <th>件名</th>
                                <td colSpan={3}>{order.title || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 납품 항목 - 일본어 고정 */}
                <div className="pdf-section">
                    <div className="pdf-section-title">納品項目</div>
                    <table className="pdf-table pdf-table-items" style={{ fontSize: '9px', tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '3%' }}>NO</th>
                                <th style={{ width: '10%' }}>法人名</th>
                                <th style={{ width: '7%' }}>支店名</th>
                                <th style={{ width: '7%' }}>ブランド名</th>
                                <th style={{ width: '22%' }}>住所</th>
                                <th style={{ width: '9%' }}>連絡先</th>
                                <th style={{ width: '8%' }}>取得形態</th>
                                <th style={{ width: '10%' }}>リース会社</th>
                                <th style={{ width: '7%' }}>納期希望日</th>
                                <th style={{ width: '5%' }}>キオスク</th>
                                <th style={{ width: '4%' }}>金具</th>
                                <th style={{ width: '8%' }}>単価合計</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryItems.map((item, idx) => {
                                const itemTotal = (order.kioskUnitPrice || 0) * item.kioskCount + (order.plateUnitPrice || 0) * item.plateCount
                                return (
                                    <tr key={idx}>
                                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                        <td style={{ fontSize: '8px', wordBreak: 'break-all' }}>{item.corporationName || '-'}</td>
                                        <td style={{ fontSize: '8px' }}>{item.branchName || '-'}</td>
                                        <td style={{ fontSize: '8px' }}>{item.brandName || '-'}</td>
                                        <td style={{ fontSize: '7px', wordBreak: 'break-all' }}>
                                            {item.postalCode && <span>〒{item.postalCode} </span>}
                                            {item.address || '-'}
                                        </td>
                                        <td style={{ fontSize: '8px' }}>{item.contact || '-'}</td>
                                        <td style={{ fontSize: '8px' }}>{item.acquisition ? getAcquisitionLabel(item.acquisition) : '-'}</td>
                                        <td style={{ fontSize: '7px', wordBreak: 'break-all' }}>{item.leaseCompanyName || '-'}</td>
                                        <td style={{ fontSize: '8px' }}>{formatDateJa(item.desiredDeliveryDate ?? null)}</td>
                                        <td style={{ textAlign: 'center' }}>{item.kioskCount}</td>
                                        <td style={{ textAlign: 'center' }}>{item.plateCount}</td>
                                        <td style={{ textAlign: 'right' }}>{itemTotal.toLocaleString()}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                <td colSpan={9} style={{ textAlign: 'right' }}>合計</td>
                                <td style={{ textAlign: 'center' }}>{order.kioskCount}</td>
                                <td style={{ textAlign: 'center' }}>{order.plateCount}</td>
                                <td style={{ textAlign: 'right' }}>{subtotal.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* 총 금액 */}
                <div className="pdf-total">
                    <div className="pdf-total-row" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        <span className="pdf-total-label">総金額:</span>
                        <span className="pdf-total-value">{subtotal.toLocaleString()} 円</span>
                    </div>
                </div>

                {/* 비고 */}
                {(() => {
                    const actualNotes = parseNotes(order.memo)
                    return actualNotes ? (
                        <div className="pdf-section">
                            <div className="pdf-section-title">備考</div>
                            <div style={{ whiteSpace: 'pre-wrap', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
                                {actualNotes}
                            </div>
                        </div>
                    ) : null
                })()}

                <div className="pdf-stamp-area">
                    <div className="pdf-stamp-box">承認</div>
                    <div className="pdf-stamp-box">確認</div>
                    <div className="pdf-stamp-box">担当</div>
                </div>

                <div className="pdf-footer">
                    <p>発行日: {new Date().toLocaleDateString('ja-JP')}</p>
                    <p>※本書は納品依頼の確認書類です。</p>
                </div>
            </div>

            <button className="btn-print no-print" onClick={() => window.print()}>
                <i className="ti ti-printer me-2"></i>
                印刷 / PDF保存
            </button>
        </>
    )
}
