'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'

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
    corporationId: string | null
    corporationName: string | null
    branchId: string | null
    branchName: string | null
    brandName: string | null
    postalCode: string | null
    address: string | null
    contact: string | null
    kioskCount: number
    plateCount: number
    acquisition: string | null
    leaseCompanyId: string | null
    status: string
    memo: string | null
    createdAt: string
    updatedAt: string
    // 복수 납품처 정보
    items: DeliveryItem[] | null
}

// memo 필드에서 실제 비고 내용만 추출
const parseNotes = (memo: string | null): string => {
    if (!memo) return ''
    try {
        const parsed = JSON.parse(memo)
        return parsed.notes || ''
    } catch {
        // JSON이 아니면 그대로 반환
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

export default function OrderDetailPage() {
    const params = useParams()
    const router = useRouter()
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
                } else {
                    console.error('Order not found')
                }
            } catch (error) {
                console.error('Failed to fetch order:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchOrder()
    }, [params.id])

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

    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, { color: string, bgColor: string, label: string, labelJa: string }> = {
            'PENDING': { color: '#6c757d', bgColor: '#f8f9fa', label: '정보입력', labelJa: '情報入力' },
            'APPROVAL': { color: '#0dcaf0', bgColor: '#e7feff', label: '품의', labelJa: '稟議' },
            'ORDERED': { color: '#0d6efd', bgColor: '#e7f1ff', label: '발주', labelJa: '発注' },
            'SHIPPING': { color: '#fd7e14', bgColor: '#fff3e6', label: '배송', labelJa: '配送' },
            'DELIVERED': { color: '#198754', bgColor: '#e8f5e9', label: '설치완료', labelJa: '設置完了' }
        }
        return statusMap[status] || { color: '#6c757d', bgColor: '#f8f9fa', label: status, labelJa: status }
    }

    const handleDelete = async () => {
        if (!order) return

        const confirmMsg = locale === 'ja'
            ? `発注 ${order.orderNumber} を削除しますか？\n関連するキオスクも削除されます。`
            : `발주 ${order.orderNumber}를 삭제하시겠습니까?\n관련 키오스크도 함께 삭제됩니다.`

        if (!confirm(confirmMsg)) return

        try {
            const res = await fetch(`/api/order/${order.id}`, { method: 'DELETE' })
            if (res.ok) {
                alert(locale === 'ja' ? '削除しました' : '삭제되었습니다')
                router.push('/dashboard/order')
            } else {
                alert(locale === 'ja' ? '削除に失敗しました' : '삭제에 실패했습니다')
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert(locale === 'ja' ? 'エラーが発生しました' : '오류가 발생했습니다')
        }
    }

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="container-xl">
                <div className="page-header d-print-none">
                    <div className="row align-items-center">
                        <div className="col-auto">
                            <Link href="/dashboard/order" className="btn btn-ghost-secondary btn-sm mb-2">
                                <i className="ti ti-arrow-left me-1"></i>
                                {locale === 'ja' ? '一覧に戻る' : '목록으로'}
                            </Link>
                            <h2 className="page-title">
                                {locale === 'ja' ? '発注が見つかりません' : '발주를 찾을 수 없습니다'}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 금액 계산
    const kioskTotal = (order.kioskUnitPrice || 0) * (order.kioskCount || 0)
    const plateTotal = (order.plateUnitPrice || 0) * (order.plateCount || 0)
    const subtotal = kioskTotal + plateTotal

    const statusInfo = getStatusInfo(order.status)

    // 납품 항목 (복수 또는 단일)
    const deliveryItems: DeliveryItem[] = order.items || [{
        corporationId: order.corporationId,
        corporationName: order.corporationName,
        branchId: order.branchId,
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
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/order" className="text-muted small">
                            <i className="ti ti-arrow-left me-1"></i>
                            Back
                        </Link>
                        <h2 className="page-title mt-1">
                            {locale === 'ja' ? '納品依頼書' : '납품 의뢰서'} - No.{order.orderNumber.replace('ORD-', '')}
                        </h2>
                    </div>
                    <div className="col-auto ms-auto">
                        <div className="btn-list">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => window.open(`/dashboard/order/${order.id}/pdf`, '_blank')}
                            >
                                <i className="ti ti-file-type-pdf me-1"></i>
                                PDF {locale === 'ja' ? '出力' : '출력'}
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                <i className="ti ti-trash me-1"></i>
                                {locale === 'ja' ? '削除' : '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* 납품 의뢰서 카드 */}
                <div className="card" style={{ margin: '0 auto' }}>
                    {/* 문서 제목 - 일본어 고정 */}
                    <div className="card-body text-center py-4" style={{ borderBottom: '2px solid #e9ecef' }}>
                        <h1 className="mb-0" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                            納品依頼書
                        </h1>
                    </div>

                    <div className="card-body">
                        {/* 기본 정보 테이블 - 일본어 고정 */}
                        <table className="table table-bordered mb-4" style={{ fontSize: '0.9rem' }}>
                            <tbody>
                                <tr>
                                    <td className="bg-light fw-bold" style={{ width: '15%' }}>No</td>
                                    <td style={{ width: '35%' }}>{order.orderNumber.replace('ORD-', '')}</td>
                                    <td className="bg-light fw-bold" style={{ width: '15%' }}>発注日</td>
                                    <td style={{ width: '35%' }}>
                                        {formatDateJa(order.orderRequestDate)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-light fw-bold">納品依頼者</td>
                                    <td>{order.requesterName || '-'}</td>
                                    <td className="bg-light fw-bold">キオスク単価</td>
                                    <td>
                                        {(order.kioskUnitPrice || 0).toLocaleString()} 円
                                        <span className="text-muted ms-1">(税抜)</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-light fw-bold">件名</td>
                                    <td colSpan={3}>{order.title || '-'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* 납품 항목 - 일본어 고정 */}
                        <h5 className="fw-bold mb-3">
                            <i className="ti ti-package me-2"></i>
                            納品項目
                        </h5>
                        <div className="table-responsive">
                            <table className="table table-bordered mb-4" style={{ fontSize: '0.8rem', tableLayout: 'fixed', width: '100%' }}>
                                <thead className="bg-light">
                                    <tr>
                                        <th style={{ width: '30px', textAlign: 'center' }}>NO</th>
                                        <th style={{ width: '110px' }}>法人名</th>
                                        <th style={{ width: '70px' }}>支店名</th>
                                        <th style={{ width: '60px' }}>ブランド名</th>
                                        <th style={{ width: '250px' }}>住所</th>
                                        <th style={{ width: '90px' }}>連絡先</th>
                                        <th style={{ width: '75px' }}>取得形態</th>
                                        <th style={{ width: '110px' }}>リース会社</th>
                                        <th style={{ width: '70px' }}>納期希望日</th>
                                        <th style={{ width: '45px', textAlign: 'center' }}>キオスク</th>
                                        <th style={{ width: '35px', textAlign: 'center' }}>金具</th>
                                        <th style={{ width: '70px', textAlign: 'right' }}>単価合計</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryItems.map((item, idx) => {
                                        const itemTotal = (order.kioskUnitPrice || 0) * item.kioskCount + (order.plateUnitPrice || 0) * item.plateCount
                                        return (
                                            <tr key={idx}>
                                                <td className="text-center">{idx + 1}</td>
                                                <td style={{ fontSize: '0.75rem' }}>{item.corporationName || '-'}</td>
                                                <td style={{ fontSize: '0.75rem' }}>{item.branchName || '-'}</td>
                                                <td style={{ fontSize: '0.75rem' }}>{item.brandName || '-'}</td>
                                                <td style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                                    {item.postalCode && <span>〒{item.postalCode} </span>}
                                                    {item.address || '-'}
                                                </td>
                                                <td style={{ fontSize: '0.75rem' }}>{item.contact || '-'}</td>
                                                <td style={{ fontSize: '0.75rem' }}>{item.acquisition ? getAcquisitionLabel(item.acquisition) : '-'}</td>
                                                <td style={{ fontSize: '0.7rem' }}>{item.leaseCompanyName || '-'}</td>
                                                <td style={{ fontSize: '0.75rem' }}>{formatDateJa(item.desiredDeliveryDate ?? null)}</td>
                                                <td className="text-center">{item.kioskCount}</td>
                                                <td className="text-center">{item.plateCount}</td>
                                                <td className="text-end">{itemTotal.toLocaleString()}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-light fw-bold">
                                        <td colSpan={9} className="text-end">合計</td>
                                        <td className="text-center">{order.kioskCount}</td>
                                        <td className="text-center">{order.plateCount}</td>
                                        <td className="text-end">{subtotal.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* 총 금액 - 일본어 고정 */}
                        <div className="d-flex justify-content-end mb-4">
                            <table className="table table-bordered" style={{ width: 'auto', minWidth: '300px', fontSize: '0.9rem' }}>
                                <tbody>
                                    <tr>
                                        <td className="bg-light fw-bold text-end" style={{ width: '150px' }}>
                                            総金額
                                        </td>
                                        <td className="text-end" style={{ width: '150px' }}>
                                            <span className="fs-4 fw-bold text-primary">
                                                {subtotal.toLocaleString()}
                                            </span>
                                            <span className="ms-1">円</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 비고 - 일본어 고정 */}
                        {(() => {
                            const actualNotes = parseNotes(order.memo)
                            return actualNotes ? (
                                <>
                                    <h5 className="fw-bold mb-3">
                                        <i className="ti ti-note me-2"></i>
                                        備考
                                    </h5>
                                    <div
                                        className="border rounded p-3 mb-4"
                                        style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa', fontSize: '0.9rem' }}
                                    >
                                        {actualNotes}
                                    </div>
                                </>
                            ) : null
                        })()}

                        {/* 메타 정보 - 일본어 고정 */}
                        <div className="text-muted small border-top pt-3">
                            <div className="row">
                                <div className="col-auto">
                                    作成日時: {new Date(order.createdAt).toLocaleString('ja-JP')}
                                </div>
                                <div className="col-auto">
                                    更新日時: {new Date(order.updatedAt).toLocaleString('ja-JP')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
