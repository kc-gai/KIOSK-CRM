'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'

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
    leaseCompanyId: string | null
    status: string
    memo: string | null
    createdAt: string
    updatedAt: string
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

// 비고 내용을 업데이트한 memo JSON 생성
const updateNotesInMemo = (originalMemo: string | null, newNotes: string): string => {
    if (!originalMemo) return newNotes
    try {
        const parsed = JSON.parse(originalMemo)
        parsed.notes = newNotes
        return JSON.stringify(parsed)
    } catch {
        return newNotes
    }
}

export default function OrderEditPage() {
    const params = useParams()
    const router = useRouter()
    const locale = useLocale()
    const [order, setOrder] = useState<OrderData | null>(null)
    const [originalMemo, setOriginalMemo] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // 편집 가능한 필드
    const [formData, setFormData] = useState({
        title: '',
        status: '',
        desiredDeliveryDate: '',
        memo: ''  // 실제 비고 텍스트만 저장
    })

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/order/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setOrder(data)
                    setOriginalMemo(data.memo)  // 원본 memo JSON 저장
                    setFormData({
                        title: data.title || '',
                        status: data.status || 'PENDING',
                        desiredDeliveryDate: data.desiredDeliveryDate ? new Date(data.desiredDeliveryDate).toISOString().split('T')[0] : '',
                        memo: parseNotes(data.memo)  // JSON에서 notes만 추출
                    })
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

    const handleSave = async () => {
        if (!order) return

        setIsSaving(true)
        try {
            const res = await fetch(`/api/order/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    status: formData.status,
                    desiredDeliveryDate: formData.desiredDeliveryDate || null,
                    memo: updateNotesInMemo(originalMemo, formData.memo)  // JSON에 notes 업데이트
                })
            })

            if (res.ok) {
                alert(locale === 'ja' ? '保存しました' : '저장되었습니다')
                router.push(`/dashboard/order/${order.id}`)
            } else {
                const error = await res.json()
                alert(error.message || (locale === 'ja' ? '保存に失敗しました' : '저장에 실패했습니다'))
            }
        } catch (error) {
            console.error('Save error:', error)
            alert(locale === 'ja' ? 'エラーが発生しました' : '오류가 발생했습니다')
        } finally {
            setIsSaving(false)
        }
    }

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

    return (
        <div className="container-xl">
            <div className="page-header d-print-none">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href={`/dashboard/order/${order.id}`} className="btn btn-ghost-secondary btn-sm mb-2">
                            <i className="ti ti-arrow-left me-1"></i>
                            {locale === 'ja' ? '詳細に戻る' : '상세로 돌아가기'}
                        </Link>
                        <h2 className="page-title">
                            <i className="ti ti-edit me-2"></i>
                            {locale === 'ja' ? '発注編集' : '발주 편집'}
                        </h2>
                        <div className="text-muted mt-1">
                            {order.orderNumber}
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div className="row">
                    {/* 편집 가능 필드 */}
                    <div className="col-lg-8">
                        <div className="card mb-3">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <i className="ti ti-forms me-2"></i>
                                    {locale === 'ja' ? '編集' : '편집'}
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        {locale === 'ja' ? 'タイトル' : '제목'}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        {locale === 'ja' ? '状態' : '상태'}
                                    </label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="PENDING">{locale === 'ja' ? '情報入力' : '정보입력'}</option>
                                        <option value="ORDERED">{locale === 'ja' ? '発注（PDF）' : '발주(PDF)'}</option>
                                        <option value="APPROVAL">{locale === 'ja' ? '稟議中' : '품의중'}</option>
                                        <option value="APPROVED">{locale === 'ja' ? '稟議完了' : '품의완료'}</option>
                                        <option value="NOTIFIED">{locale === 'ja' ? '発注通知' : '발주통지'}</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        {locale === 'ja' ? '納品希望日' : '납품희망일'}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={formData.desiredDeliveryDate}
                                        onChange={e => setFormData({ ...formData, desiredDeliveryDate: e.target.value })}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        {locale === 'ja' ? '備考' : '비고'}
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows={5}
                                        value={formData.memo}
                                        onChange={e => setFormData({ ...formData, memo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="card-footer d-flex justify-content-end gap-2">
                                <Link href={`/dashboard/order/${order.id}`} className="btn btn-ghost-secondary">
                                    {locale === 'ja' ? 'キャンセル' : '취소'}
                                </Link>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {locale === 'ja' ? '保存中...' : '저장 중...'}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ti ti-device-floppy me-1"></i>
                                            {locale === 'ja' ? '保存' : '저장'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 읽기 전용 정보 */}
                    <div className="col-lg-4">
                        <div className="card mb-3">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <i className="ti ti-info-circle me-2"></i>
                                    {locale === 'ja' ? '発注情報(読み取り専用)' : '발주정보(읽기전용)'}
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? '発注番号' : '발주번호'}</div>
                                    <div className="fw-bold">{order.orderNumber}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? '依頼者' : '의뢰자'}</div>
                                    <div>{order.requesterName || '-'}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? '依頼日' : '의뢰일'}</div>
                                    <div>{order.orderRequestDate ? new Date(order.orderRequestDate).toLocaleDateString() : '-'}</div>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? '法人名' : '법인명'}</div>
                                    <div>{order.corporationName || '-'}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? '支店名' : '지점명'}</div>
                                    <div>{order.branchName || '-'}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? 'ブランド' : '브랜드'}</div>
                                    <div>{order.brandName || '-'}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? '取得形態' : '취득형태'}</div>
                                    <div>{order.acquisition ? getAcquisitionLabel(order.acquisition) : '-'}</div>
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? 'キオスク数量' : '키오스크 수량'}</div>
                                    <div>{order.kioskCount || 0} {locale === 'ja' ? '台' : '대'}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-muted small">{locale === 'ja' ? '金具数量' : '금구 수량'}</div>
                                    <div>{order.plateCount || 0} {locale === 'ja' ? '個' : '개'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
