import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'

// DB에서 이메일 설정 가져오기 (환경변수 fallback)
async function getEmailConfig() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { category: 'EMAIL' }
        })

        const config: Record<string, string> = {}
        settings.forEach(s => {
            config[s.key] = s.value
        })

        return {
            host: config.SMTP_HOST || process.env.SMTP_HOST,
            port: parseInt(config.SMTP_PORT || process.env.SMTP_PORT || '587'),
            user: config.SMTP_USER || process.env.SMTP_USER,
            pass: config.SMTP_PASSWORD || process.env.SMTP_PASSWORD,
            from: config.SMTP_FROM || process.env.SMTP_FROM,
            notificationEmails: config.NOTIFICATION_EMAILS || process.env.NOTIFICATION_EMAILS
        }
    } catch {
        // DB 연결 실패 시 환경변수만 사용
        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
            from: process.env.SMTP_FROM,
            notificationEmails: process.env.NOTIFICATION_EMAILS
        }
    }
}

// SMTP Transporter 생성
const getTransporter = async () => {
    const config = await getEmailConfig()
    const { host, port, user, pass } = config

    if (!host || !user || !pass) {
        console.warn('SMTP credentials not configured')
        return null
    }

    return {
        transporter: nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass }
        }),
        config
    }
}

export interface DeliveryReminderData {
    requestNumber: string
    title: string
    requesterName: string
    desiredDeliveryDate: Date
    daysRemaining: number
    items: {
        locationName: string
        address: string
        quantity: number
    }[]
    totalQuantity: number
}

/**
 * 납기 알림 메일 발송
 */
export async function sendDeliveryReminder(data: DeliveryReminderData): Promise<boolean> {
    const result = await getTransporter()
    if (!result) return false

    const { transporter, config } = result
    const from = config.from || config.user
    const to = config.notificationEmails?.split(',').map(e => e.trim()) || []

    if (to.length === 0) {
        console.warn('No notification emails configured')
        return false
    }

    const dateStr = data.desiredDeliveryDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    })

    const urgencyLabel = data.daysRemaining <= 1
        ? '【緊急】'
        : data.daysRemaining <= 3
        ? '【重要】'
        : ''

    const subject = `${urgencyLabel}納期まであと${data.daysRemaining}日 - ${data.requestNumber}`

    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.locationName}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.address}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        </tr>
    `).join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #206bc4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 18px; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; }
        .info-box { background: white; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
        .label { color: #666; font-size: 12px; margin-bottom: 4px; }
        .value { font-size: 16px; font-weight: bold; }
        .urgent { color: #d63939; }
        .warning { color: #f59f00; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #e9ecef; padding: 10px; border: 1px solid #ddd; text-align: left; }
        .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
        .btn { display: inline-block; padding: 10px 20px; background: #206bc4; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>納期リマインダー</h1>
        </div>
        <div class="content">
            <div class="info-box">
                <div class="label">依頼番号</div>
                <div class="value">${data.requestNumber}</div>
            </div>
            <div class="info-box">
                <div class="label">件名</div>
                <div class="value">${data.title}</div>
            </div>
            <div class="info-box">
                <div class="label">依頼者</div>
                <div class="value">${data.requesterName}</div>
            </div>
            <div class="info-box">
                <div class="label">納期予定日</div>
                <div class="value ${data.daysRemaining <= 1 ? 'urgent' : data.daysRemaining <= 3 ? 'warning' : ''}">
                    ${dateStr}
                    <span style="margin-left: 10px; padding: 4px 8px; background: ${data.daysRemaining <= 1 ? '#d63939' : data.daysRemaining <= 3 ? '#f59f00' : '#206bc4'}; color: white; border-radius: 4px; font-size: 14px;">
                        あと${data.daysRemaining}日
                    </span>
                </div>
            </div>

            <h3 style="margin-top: 20px;">納品先一覧 (計${data.totalQuantity}台)</h3>
            <table>
                <thead>
                    <tr>
                        <th>納品場所</th>
                        <th>住所</th>
                        <th style="width: 60px; text-align: center;">数量</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/delivery-request" class="btn">
                    詳細を確認する
                </a>
            </div>
        </div>
        <div class="footer">
            このメールは Kiosk Asset CRM から自動送信されています。
        </div>
    </div>
</body>
</html>
    `

    try {
        await transporter.sendMail({
            from,
            to: to.join(', '),
            subject,
            html
        })
        console.log(`Delivery reminder sent for ${data.requestNumber}`)
        return true
    } catch (error) {
        console.error('Failed to send delivery reminder:', error)
        return false
    }
}

// ========== 발주통지 메일 ==========

export interface OrderNotificationData {
    orderNumber: string
    title: string
    requesterName: string
    orderRequestDate: string
    items: {
        corporationName: string | null
        branchName: string | null
        address: string | null
        acquisition: string
        kioskCount: number
        plateCount: number
        desiredDeliveryDate: string | null
    }[]
    totalKioskCount: number
    totalPlateCount: number
    kioskUnitPrice: number
    plateUnitPrice: number
    subtotal: number
    totalAmount: number
    recipientEmails?: string[]
}

/**
 * 발주통지 메일 발송
 */
export async function sendOrderNotification(data: OrderNotificationData): Promise<boolean> {
    const result = await getTransporter()
    if (!result) return false

    const { transporter, config } = result
    const from = config.from || config.user
    const to = data.recipientEmails?.length
        ? data.recipientEmails
        : config.notificationEmails?.split(',').map(e => e.trim()) || []

    if (to.length === 0) {
        console.warn('No notification emails configured')
        return false
    }

    const acquisitionMap: Record<string, string> = {
        'FREE': '無償提供', 'PAID': '有償', 'LEASE_FREE': 'リース(無償)',
        'LEASE': 'リース', 'RENTAL': 'レンタル', 'PURCHASE': '購入'
    }

    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-size: 13px;">${item.corporationName || '-'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-size: 13px;">${item.branchName || '-'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${item.address || '-'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-size: 13px; text-align: center;">${acquisitionMap[item.acquisition] || item.acquisition}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.kioskCount}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.plateCount}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-size: 13px;">${item.desiredDeliveryDate || '-'}</td>
        </tr>
    `).join('')

    const subject = `【発注通知】${data.orderNumber} - ${data.title}`

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #198754; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 18px; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #ddd; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .info-box { background: white; padding: 12px; border-radius: 4px; }
        .label { color: #666; font-size: 12px; margin-bottom: 4px; }
        .value { font-size: 15px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #e9ecef; padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 13px; }
        .total-box { background: white; padding: 15px; border-radius: 4px; margin-top: 15px; text-align: right; }
        .total-amount { font-size: 20px; font-weight: bold; color: #198754; }
        .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
        .btn { display: inline-block; padding: 10px 20px; background: #198754; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>発注通知 - ${data.orderNumber}</h1>
        </div>
        <div class="content">
            <div class="info-grid">
                <div class="info-box">
                    <div class="label">発注番号</div>
                    <div class="value">${data.orderNumber}</div>
                </div>
                <div class="info-box">
                    <div class="label">発注日</div>
                    <div class="value">${data.orderRequestDate}</div>
                </div>
                <div class="info-box">
                    <div class="label">件名</div>
                    <div class="value">${data.title}</div>
                </div>
                <div class="info-box">
                    <div class="label">依頼者</div>
                    <div class="value">${data.requesterName}</div>
                </div>
            </div>

            <h3 style="margin-top: 20px;">納品先一覧 (KIOSK ${data.totalKioskCount}台 / 金具 ${data.totalPlateCount}個)</h3>
            <table>
                <thead>
                    <tr>
                        <th>法人名</th>
                        <th>支店名</th>
                        <th>住所</th>
                        <th style="text-align: center;">取得</th>
                        <th style="text-align: center; width: 50px;">KIOSK</th>
                        <th style="text-align: center; width: 50px;">金具</th>
                        <th>納期</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="total-box">
                <div>小計（税抜）: ${data.subtotal.toLocaleString()} 円</div>
                <div>消費税: ${Math.floor(data.subtotal * 0.1).toLocaleString()} 円</div>
                <div style="margin-top: 8px;">
                    総額: <span class="total-amount">${data.totalAmount.toLocaleString()} 円</span>
                </div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/order" class="btn">
                    発注詳細を確認する
                </a>
            </div>
        </div>
        <div class="footer">
            このメールは Kiosk Asset CRM から自動送信されています。
        </div>
    </div>
</body>
</html>
    `

    try {
        await transporter.sendMail({
            from,
            to: to.join(', '),
            subject,
            html
        })
        console.log(`Order notification sent for ${data.orderNumber}`)
        return true
    } catch (error) {
        console.error('Failed to send order notification:', error)
        return false
    }
}

/**
 * 품의 승인/반려 상태 변경 알림 메일
 */
export async function sendApprovalStatusEmail(data: {
    orderNumber: string
    title: string
    approvalStatus: 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
    approverName?: string
    approvalDate?: string
    comment?: string
    recipientEmails?: string[]
}): Promise<boolean> {
    const result = await getTransporter()
    if (!result) return false

    const { transporter, config } = result
    const from = config.from || config.user

    const notificationEmails = config.notificationEmails || process.env.NOTIFICATION_EMAILS || ''
    const to = data.recipientEmails || notificationEmails.split(',').map((e: string) => e.trim()).filter(Boolean)
    if (to.length === 0) return false

    const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
        'APPROVED': { label: '承認済み', color: '#28a745', icon: '✅' },
        'REJECTED': { label: '却下', color: '#dc3545', icon: '❌' },
        'WITHDRAWN': { label: '取り消し', color: '#6c757d', icon: '⚠️' },
    }

    const status = statusLabels[data.approvalStatus] || statusLabels['WITHDRAWN']
    const subject = `${status.icon}【稟議${status.label}】${data.orderNumber} - ${data.title}`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: ${status.color}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">${status.icon} 稟議${status.label}</h1>
        </div>
        <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 8px 0; color: #666; width: 120px;">発注番号</td><td style="padding: 8px 0; font-weight: bold;">${data.orderNumber}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">件名</td><td style="padding: 8px 0;">${data.title}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">稟議状態</td><td style="padding: 8px 0;"><span style="color: ${status.color}; font-weight: bold;">${status.label}</span></td></tr>
                ${data.approverName ? `<tr><td style="padding: 8px 0; color: #666;">承認者</td><td style="padding: 8px 0;">${data.approverName}</td></tr>` : ''}
                ${data.approvalDate ? `<tr><td style="padding: 8px 0; color: #666;">日時</td><td style="padding: 8px 0;">${new Date(data.approvalDate).toLocaleString('ja-JP')}</td></tr>` : ''}
                ${data.comment ? `<tr><td style="padding: 8px 0; color: #666;">コメント</td><td style="padding: 8px 0;">${data.comment}</td></tr>` : ''}
            </table>
            <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/order"
                   style="display: inline-block; padding: 10px 24px; background: ${status.color}; color: white; text-decoration: none; border-radius: 4px;">
                    発注詳細を確認する
                </a>
            </div>
        </div>
        <div style="background: #f8f9fa; padding: 12px; text-align: center; font-size: 12px; color: #999;">
            このメールは Kiosk Asset CRM から自動送信されています。
        </div>
    </div>
</body>
</html>
    `

    try {
        await transporter.sendMail({ from, to: to.join(', '), subject, html })
        console.log(`Approval status email sent for ${data.orderNumber}: ${data.approvalStatus}`)
        return true
    } catch (error) {
        console.error('Failed to send approval status email:', error)
        return false
    }
}

/**
 * SMTP 연결 테스트
 */
export async function testEmailConnection(): Promise<{ success: boolean; message: string }> {
    const result = await getTransporter()
    if (!result) {
        return { success: false, message: 'SMTP 설정이 없습니다.' }
    }

    try {
        await result.transporter.verify()
        return { success: true, message: 'SMTP 연결 성공' }
    } catch (error: any) {
        return { success: false, message: `연결 실패: ${error.message || '알 수 없는 오류'}` }
    }
}

/**
 * 테스트 메일 발송
 */
export async function sendTestEmail(to: string): Promise<boolean> {
    const result = await getTransporter()
    if (!result) return false

    const { transporter, config } = result
    const from = config.from || config.user

    try {
        await transporter.sendMail({
            from,
            to,
            subject: '[Kiosk CRM] テストメール',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>テストメール</h2>
                    <p>このメールはKiosk Asset CRMからの接続テストです。</p>
                    <p>正常に受信できていれば、メール設定は正しく動作しています。</p>
                    <hr>
                    <small style="color: #666;">送信時刻: ${new Date().toLocaleString('ja-JP')}</small>
                </div>
            `
        })
        return true
    } catch (error) {
        console.error('Failed to send test email:', error)
        return false
    }
}
