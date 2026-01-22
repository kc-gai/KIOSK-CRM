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
                                className="btn btn-warning"
                                onClick={() => router.push(`/dashboard/order/${order.id}/edit`)}
                            >
                                <i className="ti ti-edit me-1"></i>
                                {locale === 'ja' ? '編集' : '편집'}
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
                <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {/* 문서 제목 */}
                    <div className="card-body text-center py-4" style={{ borderBottom: '2px solid #e9ecef' }}>
                        <h1 className="mb-0" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                            {locale === 'ja' ? '納品依頼書' : '납품의뢰서'}
                        </h1>
                    </div>

                    <div className="card-body">
                        {/* 기본 정보 테이블 */}
                        <table className="table table-bordered mb-4" style={{ fontSize: '0.9rem' }}>
                            <tbody>
                                <tr>
                                    <td className="bg-light fw-bold" style={{ width: '15%' }}>No</td>
                                    <td style={{ width: '35%' }}>{order.orderNumber.replace('ORD-', '')}</td>
                                    <td className="bg-light fw-bold" style={{ width: '15%' }}>{locale === 'ja' ? '発注日' : '발주일'}</td>
                                    <td style={{ width: '35%' }}>
                                        {order.orderRequestDate ? new Date(order.orderRequestDate).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-light fw-bold">{locale === 'ja' ? '納品依頼者' : '납품의뢰자'}</td>
                                    <td>{order.requesterName || '-'}</td>
                                    <td className="bg-light fw-bold">{locale === 'ja' ? '納期希望日' : '납기희망일'}</td>
                                    <td>
                                        {order.desiredDeliveryDate ? new Date(order.desiredDeliveryDate).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-light fw-bold">{locale === 'ja' ? '状態' : '상태'}</td>
                                    <td>
                                        <span
                                            className="badge px-2 py-1"
                                            style={{
                                                backgroundColor: statusInfo.bgColor,
                                                color: statusInfo.color,
                                                border: `1px solid ${statusInfo.color}`
                                            }}
                                        >
                                            {locale === 'ja' ? statusInfo.labelJa : statusInfo.label}
                                        </span>
                                    </td>
                                    <td className="bg-light fw-bold">{locale === 'ja' ? '単価' : '단가'}</td>
                                    <td>
                                        {(order.kioskUnitPrice || 0).toLocaleString()} {locale === 'ja' ? '円' : '엔'}
                                        <span className="text-muted ms-1">({locale === 'ja' ? '税別' : '세금별도'})</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-light fw-bold">{locale === 'ja' ? '件名' : '건명'}</td>
                                    <td colSpan={3}>{order.title || '-'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* 납품 항목 */}
                        <h5 className="fw-bold mb-3">
                            <i className="ti ti-package me-2"></i>
                            {locale === 'ja' ? '納品項目' : '납품 항목'}
                        </h5>
                        <table className="table table-bordered mb-4" style={{ fontSize: '0.9rem' }}>
                            <thead className="bg-light">
                                <tr>
                                    <th style={{ width: '40px' }}>NO</th>
                                    <th>{locale === 'ja' ? '納品店舗' : '납품점포'}</th>
                                    <th style={{ width: '100px' }}>{locale === 'ja' ? '郵便番号' : '우편번호'}</th>
                                    <th>{locale === 'ja' ? '住所' : '주소'}</th>
                                    <th style={{ width: '100px' }}>{locale === 'ja' ? '取得形態' : '취득형태'}</th>
                                    <th style={{ width: '60px', textAlign: 'center' }}>{locale === 'ja' ? '台数' : '대수'}</th>
                                    <th style={{ width: '60px', textAlign: 'center' }}>{locale === 'ja' ? '金具' : '금구'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveryItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="text-center">{idx + 1}</td>
                                        <td>{item.branchName || item.corporationName || '-'}</td>
                                        <td>{item.postalCode || '-'}</td>
                                        <td>{item.address || '-'}</td>
                                        <td>{item.acquisition ? getAcquisitionLabel(item.acquisition) : '-'}</td>
                                        <td className="text-center">{item.kioskCount}</td>
                                        <td className="text-center">{item.plateCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-light fw-bold">
                                    <td colSpan={5} className="text-end">{locale === 'ja' ? '合計' : '합계'}</td>
                                    <td className="text-center">{order.kioskCount}</td>
                                    <td className="text-center">{order.plateCount}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* 총 금액 */}
                        <div className="d-flex justify-content-end mb-4">
                            <table className="table table-bordered" style={{ width: 'auto', minWidth: '300px', fontSize: '0.9rem' }}>
                                <tbody>
                                    <tr>
                                        <td className="bg-light fw-bold text-end" style={{ width: '150px' }}>
                                            {locale === 'ja' ? '総金額' : '총 금액'}
                                        </td>
                                        <td className="text-end" style={{ width: '150px' }}>
                                            <span className="fs-4 fw-bold text-primary">
                                                {subtotal.toLocaleString()}
                                            </span>
                                            <span className="ms-1">{locale === 'ja' ? '円' : '엔'}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 비고 */}
                        {order.memo && (
                            <>
                                <h5 className="fw-bold mb-3">
                                    <i className="ti ti-note me-2"></i>
                                    {locale === 'ja' ? '備考' : '비고'}
                                </h5>
                                <div
                                    className="border rounded p-3 mb-4"
                                    style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa', fontSize: '0.9rem' }}
                                >
                                    {order.memo}
                                </div>
                            </>
                        )}

                        {/* 메타 정보 */}
                        <div className="text-muted small border-top pt-3">
                            <div className="row">
                                <div className="col-auto">
                                    {locale === 'ja' ? '作成日時' : '생성일시'}: {new Date(order.createdAt).toLocaleString()}
                                </div>
                                <div className="col-auto">
                                    {locale === 'ja' ? '更新日時' : '수정일시'}: {new Date(order.updatedAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
