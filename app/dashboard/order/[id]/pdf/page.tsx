'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'

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
    kioskCount: number
    plateCount: number
    acquisition: string | null
    status: string
    memo: string | null
    createdAt: string
}

export default function OrderPdfPage() {
    const params = useParams()
    const locale = useLocale()
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

    const getAcquisitionLabel = (acquisition: string) => {
        const map: Record<string, { ko: string, ja: string }> = {
            'PAID': { ko: '유상판매', ja: '有償販売' },
            'FREE': { ko: '무상제공', ja: '無償提供' },
            'LEASE_FREE': { ko: '무상제공(리스)', ja: '無償提供(リース)' },
            'RENTAL': { ko: '렌탈', ja: 'レンタル' }
        }
        const label = map[acquisition] || { ko: acquisition, ja: acquisition }
        return locale === 'ja' ? label.ja : label.ko
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
                <p>{locale === 'ja' ? '発注が見つかりません' : '발주를 찾을 수 없습니다'}</p>
            </div>
        )
    }

    // 금액 계산
    const kioskTotal = (order.kioskUnitPrice || 0) * (order.kioskCount || 0)
    const plateTotal = (order.plateUnitPrice || 0) * (order.plateCount || 0)
    const subtotal = kioskTotal + plateTotal
    const tax = Math.floor(subtotal * 0.1)
    const total = subtotal + tax

    return (
        <>
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
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
                    <div className="pdf-title">
                        {locale === 'ja' ? '発注依頼書' : '발주의뢰서'}
                    </div>
                    <div className="pdf-subtitle">
                        {locale === 'ja' ? '発注番号' : '발주번호'}: {order.orderNumber}
                    </div>
                </div>

                <div className="pdf-section">
                    <div className="pdf-section-title">
                        {locale === 'ja' ? '基本情報' : '기본정보'}
                    </div>
                    <table className="pdf-table">
                        <tbody>
                            <tr>
                                <th>{locale === 'ja' ? 'タイトル' : '제목'}</th>
                                <td colSpan={3}>{order.title || '-'}</td>
                            </tr>
                            <tr>
                                <th>{locale === 'ja' ? '依頼者' : '의뢰자'}</th>
                                <td>{order.requesterName || '-'}</td>
                                <th>{locale === 'ja' ? '依頼日' : '의뢰일'}</th>
                                <td>{order.orderRequestDate ? new Date(order.orderRequestDate).toLocaleDateString() : '-'}</td>
                            </tr>
                            <tr>
                                <th>{locale === 'ja' ? '納品希望日' : '납품희망일'}</th>
                                <td colSpan={3}>{order.desiredDeliveryDate ? new Date(order.desiredDeliveryDate).toLocaleDateString() : '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="pdf-section">
                    <div className="pdf-section-title">
                        {locale === 'ja' ? '納品先情報' : '납품처 정보'}
                    </div>
                    <table className="pdf-table">
                        <tbody>
                            <tr>
                                <th>{locale === 'ja' ? '法人名' : '법인명'}</th>
                                <td>{order.corporationName || '-'}</td>
                                <th>{locale === 'ja' ? '支店名' : '지점명'}</th>
                                <td>{order.branchName || '-'}</td>
                            </tr>
                            <tr>
                                <th>{locale === 'ja' ? 'ブランド' : '브랜드'}</th>
                                <td>{order.brandName || '-'}</td>
                                <th>{locale === 'ja' ? '取得形態' : '취득형태'}</th>
                                <td>{order.acquisition ? getAcquisitionLabel(order.acquisition) : '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="pdf-section">
                    <div className="pdf-section-title">
                        {locale === 'ja' ? '注文内容' : '주문내용'}
                    </div>
                    <table className="pdf-table pdf-table-items">
                        <thead>
                            <tr>
                                <th>{locale === 'ja' ? '品目' : '품목'}</th>
                                <th>{locale === 'ja' ? '単価' : '단가'}</th>
                                <th>{locale === 'ja' ? '数量' : '수량'}</th>
                                <th>{locale === 'ja' ? '金額' : '금액'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{locale === 'ja' ? 'キオスク端末' : '키오스크 단말기'}</td>
                                <td className="text-right">{(order.kioskUnitPrice || 0).toLocaleString()} {locale === 'ja' ? '円' : '원'}</td>
                                <td>{order.kioskCount || 0} {locale === 'ja' ? '台' : '대'}</td>
                                <td className="text-right">{kioskTotal.toLocaleString()} {locale === 'ja' ? '円' : '원'}</td>
                            </tr>
                            <tr>
                                <td>{locale === 'ja' ? '金具' : '금구'}</td>
                                <td className="text-right">{(order.plateUnitPrice || 0).toLocaleString()} {locale === 'ja' ? '円' : '원'}</td>
                                <td>{order.plateCount || 0} {locale === 'ja' ? '個' : '개'}</td>
                                <td className="text-right">{plateTotal.toLocaleString()} {locale === 'ja' ? '円' : '원'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="pdf-total">
                        <div className="pdf-total-row">
                            <span className="pdf-total-label">{locale === 'ja' ? '小計' : '소계'}:</span>
                            <span className="pdf-total-value">{subtotal.toLocaleString()} {locale === 'ja' ? '円' : '원'}</span>
                        </div>
                        <div className="pdf-total-row">
                            <span className="pdf-total-label">{locale === 'ja' ? '消費税(10%)' : '부가세(10%)'}:</span>
                            <span className="pdf-total-value">{tax.toLocaleString()} {locale === 'ja' ? '円' : '원'}</span>
                        </div>
                        <div className="pdf-total-row" style={{ fontSize: '16px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                            <span className="pdf-total-label">{locale === 'ja' ? '合計' : '합계'}:</span>
                            <span className="pdf-total-value">{total.toLocaleString()} {locale === 'ja' ? '円' : '원'}</span>
                        </div>
                    </div>
                </div>

                {order.memo && (
                    <div className="pdf-section">
                        <div className="pdf-section-title">
                            {locale === 'ja' ? '備考' : '비고'}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
                            {order.memo}
                        </div>
                    </div>
                )}

                <div className="pdf-stamp-area">
                    <div className="pdf-stamp-box">{locale === 'ja' ? '承認' : '승인'}</div>
                    <div className="pdf-stamp-box">{locale === 'ja' ? '確認' : '확인'}</div>
                    <div className="pdf-stamp-box">{locale === 'ja' ? '担当' : '담당'}</div>
                </div>

                <div className="pdf-footer">
                    <p>{locale === 'ja' ? '発行日' : '발행일'}: {new Date().toLocaleDateString()}</p>
                    <p>{locale === 'ja' ? '※本書は発注依頼の確認書類です。' : '※본 서류는 발주의뢰 확인서류입니다.'}</p>
                </div>
            </div>

            <button className="btn-print no-print" onClick={() => window.print()}>
                <i className="ti ti-printer me-2"></i>
                {locale === 'ja' ? '印刷 / PDF保存' : '인쇄 / PDF 저장'}
            </button>
        </>
    )
}
