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
    // 품의 관련 필드
    approvalRequestId: string | null
    approvalStatus: string | null
    approvalDate: string | null
    approvalComment: string | null
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
    const [approvalId, setApprovalId] = useState('')
    const [approvalSaving, setApprovalSaving] = useState(false)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [syncingApproval, setSyncingApproval] = useState(false)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/order/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setOrder(data)
                    setApprovalId(data.approvalRequestId || '')
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

    // 품의번호 저장
    const handleSaveApproval = async () => {
        if (!order) return
        setApprovalSaving(true)
        try {
            const res = await fetch(`/api/order/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvalRequestId: approvalId,
                    approvalStatus: approvalId ? 'PENDING' : null,
                    status: approvalId ? 'APPROVAL' : order.status
                })
            })
            if (res.ok) {
                // 데이터 새로고침
                const refreshRes = await fetch(`/api/order/${order.id}`)
                if (refreshRes.ok) {
                    const data = await refreshRes.json()
                    setOrder(data)
                }
            }
        } catch (error) {
            console.error('Failed to save approval:', error)
        } finally {
            setApprovalSaving(false)
        }
    }

    // 품의 상태 업데이트
    const handleApprovalStatusChange = async (newStatus: string) => {
        if (!order) return
        try {
            const res = await fetch(`/api/order/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvalStatus: newStatus,
                    status: newStatus === 'APPROVED' ? 'APPROVED' : order.status
                })
            })
            if (res.ok) {
                const refreshRes = await fetch(`/api/order/${order.id}`)
                if (refreshRes.ok) {
                    const data = await refreshRes.json()
                    setOrder(data)
                }
            }
        } catch (error) {
            console.error('Failed to update approval status:', error)
        }
    }

    // Jobcan 품의 상태 확인
    const handleSyncApproval = async () => {
        if (!order) return
        setSyncingApproval(true)
        try {
            const res = await fetch(`/api/order/${order.id}/approval-sync`, { method: 'POST' })
            const result = await res.json()
            if (res.ok) {
                const refreshRes = await fetch(`/api/order/${order.id}`)
                if (refreshRes.ok) setOrder(await refreshRes.json())
                if (result.changed) {
                    alert(locale === 'ja'
                        ? `承認状態が更新されました: ${result.currentStatus}`
                        : `승인 상태가 업데이트됐습니다: ${result.currentStatus}`)
                } else {
                    alert(locale === 'ja' ? '状態に変更はありません' : '상태 변경 없음')
                }
            } else {
                alert(result.error || (locale === 'ja' ? 'エラーが発生しました' : '오류가 발생했습니다'))
            }
        } catch {
            alert(locale === 'ja' ? '接続エラー' : '연결 오류')
        } finally {
            setSyncingApproval(false)
        }
    }

    // 발주통지 메일 발송
    const handleSendNotification = async () => {
        if (!order) return
        const confirmMsg = locale === 'ja'
            ? '発注通知メールを送信しますか？'
            : '발주통지 메일을 발송하시겠습니까?'
        if (!confirm(confirmMsg)) return

        setSendingEmail(true)
        try {
            const res = await fetch(`/api/order/${order.id}/notify`, { method: 'POST' })
            const result = await res.json()
            if (res.ok) {
                alert(locale === 'ja' ? 'メールを送信しました' : '메일을 발송했습니다')
                const refreshRes = await fetch(`/api/order/${order.id}`)
                if (refreshRes.ok) setOrder(await refreshRes.json())
            } else {
                alert(result.message || (locale === 'ja' ? '送信に失敗しました' : '발송에 실패했습니다'))
            }
        } catch {
            alert(locale === 'ja' ? 'エラーが発生しました' : '오류가 발생했습니다')
        } finally {
            setSendingEmail(false)
        }
    }

    // 납품의뢰서용 취득형태 라벨 (납품처 관점 표현)
    // DB에는 우리 입장 (무상제공, 무상제공(리스), 유상제공, 렌탈)으로 저장
    // 납품의뢰서에는 납품처 입장 (구매, 리스, 렌탈)으로 표시
    const getAcquisitionLabel = (acquisition: string) => {
        const map: Record<string, string> = {
            'PAID': '購入',           // 유상제공 → 납품처 입장: 구매
            'PURCHASE': '購入',       // 기존 호환
            'FREE': '購入',           // 무상제공 → 납품처 입장: 구매 (납품처는 구매하는 것처럼 받음)
            'LEASE': 'リース',        // 기존 호환
            'LEASE_FREE': 'リース',   // 무상제공(리스) → 납품처 입장: 리스
            'RENTAL': 'レンタル'      // 렌탈 → 납품처 입장: 렌탈
        }
        return map[acquisition] || acquisition
    }

    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, { color: string, bgColor: string, label: string, labelJa: string }> = {
            'PENDING': { color: '#6c757d', bgColor: '#f8f9fa', label: '정보입력', labelJa: '情報入力' },
            'ORDERED': { color: '#0d6efd', bgColor: '#e7f1ff', label: '발주(PDF)', labelJa: '発注（PDF）' },
            'APPROVAL': { color: '#0dcaf0', bgColor: '#e7feff', label: '품의중', labelJa: '稟議中' },
            'APPROVED': { color: '#fd7e14', bgColor: '#fff3e6', label: '품의완료', labelJa: '稟議完了' },
            'NOTIFIED': { color: '#198754', bgColor: '#e8f5e9', label: '발주통지', labelJa: '発注通知' }
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
                                        <th style={{ width: '90px' }}>法人名</th>
                                        <th style={{ width: '90px' }}>支店名</th>
                                        <th style={{ width: '280px' }}>住所</th>
                                        <th style={{ width: '100px' }}>連絡先</th>
                                        <th style={{ width: '60px' }}>取得</th>
                                        <th style={{ width: '130px' }}>リース会社</th>
                                        <th style={{ width: '80px' }}>納期</th>
                                        <th style={{ width: '55px', textAlign: 'center' }}>KIOSK</th>
                                        <th style={{ width: '40px', textAlign: 'center' }}>金具</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryItems.map((item, idx) => {
                                        const itemTotal = (order.kioskUnitPrice || 0) * item.kioskCount + (order.plateUnitPrice || 0) * item.plateCount
                                        return (
                                            <tr key={idx}>
                                                <td style={{ fontSize: '0.75rem' }}>{item.corporationName || '-'}</td>
                                                <td style={{ fontSize: '0.75rem' }}>{item.branchName || '-'}</td>
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
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-light fw-bold">
                                        <td colSpan={7} className="text-end">合計</td>
                                        <td className="text-center">{order.kioskCount}</td>
                                        <td className="text-center">{order.plateCount}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* 총 금액 - 일본어 고정 */}
                        <div className="d-flex justify-content-end mb-4">
                            <table className="table table-bordered" style={{ width: 'auto', minWidth: '300px', fontSize: '0.9rem' }}>
                                <tbody>
                                    <tr>
                                        <td className="bg-light fw-bold text-end" style={{ width: '150px' }}>税抜</td>
                                        <td className="text-end" style={{ width: '150px' }}>
                                            {subtotal.toLocaleString()} <span className="text-muted">円</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="bg-light fw-bold text-end">消費税</td>
                                        <td className="text-end">
                                            {Math.floor(subtotal * 0.1).toLocaleString()} <span className="text-muted">円</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="bg-light fw-bold text-end">総額</td>
                                        <td className="text-end">
                                            <span className="fs-4 fw-bold text-primary">
                                                {Math.floor(subtotal * 1.1).toLocaleString()}
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

                        {/* 품의 섹션 */}
                        <div className="border rounded p-3 mb-4" style={{ backgroundColor: '#f0f7ff' }}>
                            <h5 className="fw-bold mb-3">
                                <i className="ti ti-file-check me-2"></i>
                                {locale === 'ja' ? '稟議情報' : '품의 정보'}
                            </h5>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">
                                        {locale === 'ja' ? '稟議番号（Jobcan）' : '품의번호 (Jobcan)'}
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={locale === 'ja' ? '稟議番号を入力' : '품의번호 입력'}
                                            value={approvalId}
                                            onChange={e => setApprovalId(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSaveApproval}
                                            disabled={approvalSaving}
                                        >
                                            {approvalSaving ? (
                                                <span className="spinner-border spinner-border-sm" />
                                            ) : (
                                                <><i className="ti ti-device-floppy me-1"></i>{locale === 'ja' ? '保存' : '저장'}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">
                                        {locale === 'ja' ? '承認状態' : '승인 상태'}
                                    </label>
                                    <div>
                                        {order.approvalStatus === 'APPROVED' ? (
                                            <span className="badge bg-success fs-6">
                                                <i className="ti ti-check me-1"></i>
                                                {locale === 'ja' ? '承認済' : '승인됨'}
                                            </span>
                                        ) : order.approvalStatus === 'REJECTED' ? (
                                            <span className="badge bg-danger fs-6">
                                                <i className="ti ti-x me-1"></i>
                                                {locale === 'ja' ? '却下' : '반려'}
                                            </span>
                                        ) : order.approvalStatus === 'PENDING' ? (
                                            <span className="badge bg-warning fs-6">
                                                <i className="ti ti-clock me-1"></i>
                                                {locale === 'ja' ? '保留中' : '대기중'}
                                            </span>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </div>
                                </div>
                                {order.approvalRequestId && order.approvalStatus === 'PENDING' && (
                                    <div className="col-md-5">
                                        <label className="form-label small fw-bold">
                                            {locale === 'ja' ? '承認確認' : '승인 확인'}
                                        </label>
                                        <div className="btn-group">
                                            <button
                                                className="btn btn-info btn-sm"
                                                onClick={handleSyncApproval}
                                                disabled={syncingApproval}
                                            >
                                                {syncingApproval ? (
                                                    <span className="spinner-border spinner-border-sm me-1" />
                                                ) : (
                                                    <i className="ti ti-refresh me-1"></i>
                                                )}
                                                {locale === 'ja' ? 'Jobcan確認' : 'Jobcan 확인'}
                                            </button>
                                            <button
                                                className="btn btn-outline-success btn-sm"
                                                onClick={() => handleApprovalStatusChange('APPROVED')}
                                                title={locale === 'ja' ? '手動承認' : '수동 승인'}
                                            >
                                                <i className="ti ti-check"></i>
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleApprovalStatusChange('REJECTED')}
                                                title={locale === 'ja' ? '手動却下' : '수동 반려'}
                                            >
                                                <i className="ti ti-x"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {order.approvalDate && (
                                <div className="mt-2 small text-muted">
                                    {locale === 'ja' ? '承認日' : '승인일'}: {new Date(order.approvalDate).toLocaleString('ja-JP')}
                                    {order.approvalComment && (
                                        <span className="ms-3">
                                            {locale === 'ja' ? 'コメント' : '코멘트'}: {order.approvalComment}
                                        </span>
                                    )}
                                </div>
                            )}
                            {order.approvalStatus === 'APPROVED' && (
                                <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={handleSendNotification}
                                        disabled={sendingEmail}
                                    >
                                        {sendingEmail ? (
                                            <span className="spinner-border spinner-border-sm me-1" />
                                        ) : (
                                            <i className="ti ti-mail-forward me-1"></i>
                                        )}
                                        {locale === 'ja' ? '発注通知メール送信' : '발주통지 메일 발송'}
                                    </button>
                                    {order.status === 'NOTIFIED' && (
                                        <span className="badge bg-success">
                                            <i className="ti ti-check me-1"></i>
                                            {locale === 'ja' ? '送信済み' : '발송완료'}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 캘린더 연동 정보 */}
                        {order.desiredDeliveryDate && (
                            <div className="border rounded p-3 mb-4" style={{ backgroundColor: '#f0fff4' }}>
                                <h6 className="fw-bold mb-2">
                                    <i className="ti ti-calendar me-2"></i>
                                    {locale === 'ja' ? 'カレンダー連携' : '캘린더 연동'}
                                </h6>
                                <div className="small text-muted">
                                    {locale === 'ja'
                                        ? `納期予定日（${new Date(order.desiredDeliveryDate).toLocaleDateString('ja-JP')}）がGoogle Calendarに自動登録されます。`
                                        : `납기예정일（${new Date(order.desiredDeliveryDate).toLocaleDateString('ja-JP')}）이 Google Calendar에 자동 등록됩니다.`
                                    }
                                </div>
                            </div>
                        )}

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
