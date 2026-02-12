import prisma from '@/lib/prisma'

// DB에서 Jobcan 설정 가져오기 (환경변수 fallback)
async function getJobcanConfig() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { category: 'JOBCAN' }
        })

        const config: Record<string, string> = {}
        settings.forEach(s => {
            config[s.key] = s.value
        })

        return {
            baseUrl: config.JOBCAN_BASE_URL || process.env.JOBCAN_BASE_URL || 'https://ssl.wf.jobcan.jp/wf_api',
            apiToken: config.JOBCAN_API_TOKEN || process.env.JOBCAN_API_TOKEN,
        }
    } catch {
        return {
            baseUrl: process.env.JOBCAN_BASE_URL || 'https://ssl.wf.jobcan.jp/wf_api',
            apiToken: process.env.JOBCAN_API_TOKEN,
        }
    }
}

export interface JobcanApprovalStatus {
    requestId: string
    status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'WITHDRAWN' | 'UNKNOWN'
    title?: string
    approverName?: string
    approvalDate?: string
    comment?: string
}

// Jobcan API 상태값 → 내부 상태값 매핑
const STATUS_MAP: Record<string, JobcanApprovalStatus['status']> = {
    'completed': 'APPROVED',       // 完了(승인)
    'approved': 'APPROVED',
    'rejected': 'REJECTED',        // 却下
    'canceled': 'WITHDRAWN',       // 取り消し
    'returned': 'REJECTED',        // 差し戻し
    'canceled_after_completion': 'WITHDRAWN', // 完了後取消
    'in_progress': 'PENDING',      // 進行中
    'processing': 'PENDING',
    'pending': 'PENDING',
}

/**
 * Jobcan 품의 상태 조회
 * API: GET /v2/requests/?id={requestId}
 */
export async function getApprovalStatus(requestId: string): Promise<JobcanApprovalStatus | null> {
    const config = await getJobcanConfig()
    if (!config.apiToken) {
        console.warn('Jobcan API token not configured')
        return null
    }

    try {
        // 개별 품의 조회
        const response = await fetch(`${config.baseUrl}/v2/requests/?id=${encodeURIComponent(requestId)}`, {
            headers: {
                'Authorization': `Token ${config.apiToken}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            console.error(`Jobcan API error: ${response.status} ${response.statusText}`)
            return null
        }

        const data = await response.json()

        // v2 API는 results 배열로 반환
        const result = data.results?.[0] || data
        if (!result) return null

        return {
            requestId,
            status: STATUS_MAP[result.status] || 'UNKNOWN',
            title: result.title || result.form_name,
            approverName: result.approver_name,
            approvalDate: result.completed_at || result.updated_at,
            comment: result.comment,
        }
    } catch (error) {
        console.error('Failed to query Jobcan:', error)
        return null
    }
}

/**
 * Jobcan API 연결 테스트
 * API: GET /test/
 */
export async function testJobcanConnection(): Promise<{ success: boolean; message: string }> {
    const config = await getJobcanConfig()
    if (!config.apiToken) {
        return { success: false, message: 'Jobcan API トークンが設定されていません' }
    }

    try {
        const response = await fetch(`${config.baseUrl}/test/`, {
            headers: {
                'Authorization': `Token ${config.apiToken}`,
                'Content-Type': 'application/json'
            }
        })

        if (response.ok) {
            return { success: true, message: 'Jobcan API 接続成功' }
        } else if (response.status === 401) {
            return { success: false, message: 'APIトークンが無効です' }
        } else {
            return { success: false, message: `Jobcan API 応答エラー: ${response.status}` }
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '不明なエラー'
        return { success: false, message: `接続失敗: ${message}` }
    }
}
