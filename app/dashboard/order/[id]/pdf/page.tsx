'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

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

// 날짜 문자열을 일본어 형식으로 변환
const formatDateJa = (dateStr: string | null): string => {
    if (!dateStr) return '-'
    if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        return `${year}年${parseInt(month)}月${parseInt(day)}日`
    }
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 날짜 짧은 형식
const formatDateShort = (dateStr: string | null): string => {
    if (!dateStr) return '-'
    if (/^\d{8}$/.test(dateStr)) {
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        return `${parseInt(month)}/${parseInt(day)}`
    }
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return `${date.getMonth() + 1}/${date.getDate()}`
}

export default function OrderPdfPage() {
    const params = useParams()
    const [order, setOrder] = useState<OrderData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDownloading, setIsDownloading] = useState(false)
    const docRef = useRef<HTMLDivElement>(null)

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
        if (!isLoading && order) {
            const orderNo = order.orderNumber.replace('ORD-', '')
            document.title = `KC-${orderNo}`
            setTimeout(() => {
                window.print()
            }, 500)
        }
        return () => {
            document.title = 'Kiosk Asset CRM'
        }
    }, [isLoading, order])

    const handleDownloadPdf = useCallback(async () => {
        if (!docRef.current || !order) return
        setIsDownloading(true)
        try {
            const canvas = await html2canvas(docRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            })

            // A4 landscape: 297mm x 210mm
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            })

            const pdfWidth = 297
            const pdfHeight = 210
            const imgWidth = canvas.width
            const imgHeight = canvas.height
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
            const width = imgWidth * ratio
            const height = imgHeight * ratio
            const x = (pdfWidth - width) / 2
            const y = (pdfHeight - height) / 2

            const imgData = canvas.toDataURL('image/png')
            pdf.addImage(imgData, 'PNG', x, y, width, height)

            const docNo = order.orderNumber.replace('ORD-', '')
            pdf.save(`KC-${docNo}.pdf`)
        } catch (error) {
            console.error('PDF download failed:', error)
            alert('PDFダウンロードに失敗しました')
        } finally {
            setIsDownloading(false)
        }
    }, [order])

    const getAcquisitionLabel = (acquisition: string) => {
        const map: Record<string, string> = {
            'PAID': '購入',
            'PURCHASE': '購入',
            'FREE': '購入',
            'LEASE': 'リース',
            'LEASE_FREE': 'リース',
            'RENTAL': 'レンタル'
        }
        return map[acquisition] || acquisition
    }

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div>読み込み中...</div>
            </div>
        )
    }

    if (!order) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <p>発注が見つかりません</p>
            </div>
        )
    }

    const kioskUnitPrice = order.kioskUnitPrice || 0
    const plateUnitPrice = order.plateUnitPrice || 0
    const subtotal = kioskUnitPrice * (order.kioskCount || 0) + plateUnitPrice * (order.plateCount || 0)
    const tax = Math.floor(subtotal * 0.1)
    const totalAmount = subtotal + tax

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

    const today = new Date()
    const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
    const docNo = order.orderNumber.replace('ORD-', '')
    const actualNotes = parseNotes(order.memo)

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 8mm 10mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0;
                        padding: 0;
                    }
                    .no-print { display: none !important; }
                }
                * { box-sizing: border-box; }
                .doc {
                    width: 277mm;
                    min-height: 190mm;
                    margin: 0 auto;
                    padding: 6mm 8mm;
                    font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
                    font-size: 10px;
                    line-height: 1.5;
                    color: #222;
                    background: #fff;
                }
                /* ========== 문서 제목 ========== */
                .doc-title {
                    text-align: center;
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: 8px;
                    padding-bottom: 6px;
                    border-bottom: 3px double #333;
                    margin-bottom: 12px;
                }
                /* ========== 헤더 2단 ========== */
                .doc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                .doc-header-left { width: 45%; }
                .doc-header-right { width: 50%; text-align: right; }
                .doc-recipient {
                    font-size: 15px;
                    font-weight: 700;
                    border-bottom: 1px solid #333;
                    padding-bottom: 4px;
                    margin-bottom: 4px;
                    display: inline-block;
                }
                .doc-recipient-suffix {
                    font-size: 13px;
                    margin-left: 8px;
                    font-weight: 400;
                }
                .doc-info-row {
                    font-size: 10px;
                    color: #444;
                    margin-bottom: 2px;
                }
                .doc-issuer {
                    font-size: 11px;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                /* ========== 인감란 ========== */
                .stamp-area {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 4px;
                }
                .stamp-table {
                    border-collapse: collapse;
                }
                .stamp-table th {
                    border: 1px solid #888;
                    padding: 2px 10px;
                    font-size: 9px;
                    font-weight: 600;
                    background: #f5f5f5;
                    text-align: center;
                }
                .stamp-table td {
                    border: 1px solid #888;
                    width: 52px;
                    height: 52px;
                    text-align: center;
                    vertical-align: middle;
                }
                /* ========== 금액 요약 ========== */
                .amount-bar {
                    display: flex;
                    align-items: center;
                    border: 2px solid #333;
                    margin-bottom: 10px;
                    font-size: 11px;
                }
                .amount-bar-label {
                    background: #333;
                    color: #fff;
                    padding: 6px 14px;
                    font-weight: 700;
                    white-space: nowrap;
                }
                .amount-bar-value {
                    flex: 1;
                    text-align: center;
                    padding: 6px 14px;
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
                /* ========== 기본정보 테이블 ========== */
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px;
                    font-size: 10px;
                }
                .info-table th {
                    background: #f0f0f0;
                    border: 1px solid #bbb;
                    padding: 4px 8px;
                    font-weight: 600;
                    text-align: left;
                    width: 12%;
                    white-space: nowrap;
                }
                .info-table td {
                    border: 1px solid #bbb;
                    padding: 4px 8px;
                }
                /* ========== 납품항목 테이블 ========== */
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 6px;
                    font-size: 9px;
                    table-layout: fixed;
                }
                .items-table thead th {
                    background: #3a3a3a;
                    color: #fff;
                    border: 1px solid #555;
                    padding: 5px 4px;
                    text-align: center;
                    font-weight: 600;
                    font-size: 9px;
                }
                .items-table tbody td {
                    border: 1px solid #ccc;
                    padding: 4px 5px;
                    text-align: center;
                    font-size: 8.5px;
                    vertical-align: middle;
                }
                .items-table tbody tr:nth-child(even) {
                    background: #fafafa;
                }
                .items-table tbody tr:hover {
                    background: #f0f7ff;
                }
                .items-table tfoot td {
                    border: 1px solid #999;
                    padding: 4px 5px;
                    background: #f0f0f0;
                    font-weight: 700;
                    text-align: center;
                    font-size: 9px;
                }
                .td-left { text-align: left !important; }
                .td-right { text-align: right !important; }
                /* ========== 금액 내역 ========== */
                .price-summary {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 8px;
                }
                .price-summary-table {
                    border-collapse: collapse;
                    font-size: 10px;
                }
                .price-summary-table th {
                    background: #f0f0f0;
                    border: 1px solid #bbb;
                    padding: 4px 12px;
                    text-align: right;
                    font-weight: 600;
                }
                .price-summary-table td {
                    border: 1px solid #bbb;
                    padding: 4px 16px;
                    text-align: right;
                    font-weight: 700;
                    min-width: 110px;
                }
                .price-summary-table tr:last-child td {
                    font-size: 13px;
                    background: #fefce8;
                }
                /* ========== 비고 ========== */
                .notes-section {
                    margin-bottom: 8px;
                }
                .notes-label {
                    font-size: 10px;
                    font-weight: 600;
                    background: #f0f0f0;
                    border: 1px solid #bbb;
                    border-bottom: none;
                    padding: 3px 8px;
                    display: inline-block;
                }
                .notes-body {
                    border: 1px solid #bbb;
                    padding: 6px 8px;
                    min-height: 30px;
                    font-size: 9px;
                    white-space: pre-wrap;
                }
                /* ========== footer ========== */
                .doc-footer {
                    border-top: 1px solid #ccc;
                    padding-top: 4px;
                    font-size: 8px;
                    color: #888;
                    display: flex;
                    justify-content: space-between;
                }
                /* ========== 인쇄 버튼 ========== */
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
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-print:hover { background: #1a5eb8; }
                .btn-back {
                    position: fixed;
                    bottom: 20px;
                    right: 180px;
                    padding: 12px 24px;
                    background: #666;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-back:hover { background: #555; }
                .btn-download {
                    position: fixed;
                    bottom: 20px;
                    right: 340px;
                    padding: 12px 24px;
                    background: #16a34a;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-download:hover { background: #15803d; }
                .btn-download:disabled { background: #9ca3af; cursor: not-allowed; }
            `}</style>

            <div className="doc" ref={docRef}>
                {/* ===== 문서 제목 ===== */}
                <div className="doc-title">納 品 依 頼 書</div>

                {/* ===== 헤더: 수신처 + 발행처/인감 ===== */}
                <div className="doc-header">
                    <div className="doc-header-left">
                        {/* 수신처 */}
                        <div className="doc-recipient">
                            {deliveryItems.length === 1 && deliveryItems[0].corporationName
                                ? deliveryItems[0].corporationName
                                : (order.title || '各位')}
                            <span className="doc-recipient-suffix">御中</span>
                        </div>
                        <div className="doc-info-row">件名: {order.title || '-'}</div>
                        <div className="doc-info-row">
                            下記の通りご依頼申し上げます。
                        </div>
                    </div>

                    <div className="doc-header-right">
                        <div className="doc-info-row" style={{ marginBottom: '4px' }}>
                            No. <strong>{docNo}</strong>
                            &nbsp;&nbsp;&nbsp;
                            発行日: {todayStr}
                        </div>
                        <div className="doc-issuer">株式会社AntiGravity</div>
                        <div className="doc-info-row">担当: {order.requesterName || '-'}</div>

                        {/* 인감란 */}
                        <div className="stamp-area" style={{ marginTop: '6px' }}>
                            <table className="stamp-table">
                                <thead>
                                    <tr>
                                        <th>承認</th>
                                        <th>確認</th>
                                        <th>作成</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ===== 금액 요약 바 ===== */}
                <div className="amount-bar">
                    <div className="amount-bar-label">合計金額（税込）</div>
                    <div className="amount-bar-value">¥ {totalAmount.toLocaleString()}-</div>
                </div>

                {/* ===== 기본 정보 ===== */}
                <table className="info-table">
                    <tbody>
                        <tr>
                            <th>発注日</th>
                            <td style={{ width: '22%' }}>{formatDateJa(order.orderRequestDate)}</td>
                            <th>KIOSK単価</th>
                            <td style={{ width: '22%' }}>{kioskUnitPrice.toLocaleString()} 円（税抜）</td>
                        </tr>
                        <tr>
                            <th>依頼者</th>
                            <td>{order.requesterName || '-'}</td>
                            <th>金具単価</th>
                            <td>{plateUnitPrice > 0 ? `${plateUnitPrice.toLocaleString()} 円（税抜）` : '-'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* ===== 납품 항목 ===== */}
                <table className="items-table">
                    <thead>
                        <tr>
                            <th style={{ width: '4%' }}>No</th>
                            <th style={{ width: '12%' }}>法人名</th>
                            <th style={{ width: '11%' }}>支店名</th>
                            <th style={{ width: '24%' }}>住所</th>
                            <th style={{ width: '10%' }}>連絡先</th>
                            <th style={{ width: '6%' }}>取得</th>
                            <th style={{ width: '11%' }}>リース会社</th>
                            <th style={{ width: '7%' }}>納期</th>
                            <th style={{ width: '5%' }}>KIOSK</th>
                            <th style={{ width: '5%' }}>金具</th>
                            <th style={{ width: '8%' }}>小計</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveryItems.map((item, idx) => {
                            const itemSubtotal = kioskUnitPrice * item.kioskCount + plateUnitPrice * item.plateCount
                            return (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td className="td-left" style={{ fontSize: '8px' }}>{item.corporationName || '-'}</td>
                                    <td className="td-left" style={{ fontSize: '8px' }}>{item.branchName || '-'}</td>
                                    <td className="td-left" style={{ fontSize: '7.5px', wordBreak: 'break-all' }}>
                                        {item.postalCode && `〒${item.postalCode} `}
                                        {item.address || '-'}
                                    </td>
                                    <td style={{ fontSize: '7.5px' }}>{item.contact || '-'}</td>
                                    <td>{item.acquisition ? getAcquisitionLabel(item.acquisition) : '-'}</td>
                                    <td className="td-left" style={{ fontSize: '7.5px', wordBreak: 'break-all' }}>{item.leaseCompanyName || '-'}</td>
                                    <td>{formatDateShort(item.desiredDeliveryDate ?? null)}</td>
                                    <td>{item.kioskCount}</td>
                                    <td>{item.plateCount}</td>
                                    <td className="td-right">{itemSubtotal > 0 ? `${itemSubtotal.toLocaleString()}` : '-'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'right', paddingRight: '10px' }}>合計</td>
                            <td>{order.kioskCount}</td>
                            <td>{order.plateCount}</td>
                            <td className="td-right">{subtotal.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* ===== 금액 내역 ===== */}
                <div className="price-summary">
                    <table className="price-summary-table">
                        <tbody>
                            <tr>
                                <th>小計（税抜）</th>
                                <td>{subtotal.toLocaleString()} 円</td>
                            </tr>
                            <tr>
                                <th>消費税（10%）</th>
                                <td>{tax.toLocaleString()} 円</td>
                            </tr>
                            <tr>
                                <th>合計（税込）</th>
                                <td>{totalAmount.toLocaleString()} 円</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ===== 비고 ===== */}
                <div className="notes-section">
                    <div className="notes-label">備考</div>
                    <div className="notes-body">
                        {actualNotes || '　'}
                    </div>
                </div>

                {/* ===== footer ===== */}
                <div className="doc-footer">
                    <span>※ 本書は納品依頼の確認書類です。</span>
                    <span>株式会社AntiGravity / Kiosk Asset CRM</span>
                </div>
            </div>

            {/* ===== 화면용 버튼 ===== */}
            <button className="btn-download no-print" onClick={handleDownloadPdf} disabled={isDownloading}>
                {isDownloading ? '生成中...' : 'PDF ダウンロード'}
            </button>
            <a href={`/dashboard/order/${order.id}`} className="btn-back no-print">
                ← 戻る
            </a>
            <button className="btn-print no-print" onClick={() => window.print()}>
                印刷
            </button>
        </>
    )
}
