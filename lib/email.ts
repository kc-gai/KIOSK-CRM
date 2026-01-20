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
