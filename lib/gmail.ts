import { google } from 'googleapis'

// Gmail API用の認証（Service Account + Domain-wide Delegation）
// subject には実際のWorkspaceユーザーが必要（グループメール不可）
function getGmailAuth(scopes?: string[]) {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
  const delegateUser = process.env.GMAIL_DELEGATE_USER

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Google API credentials not configured')
  }
  if (!delegateUser) {
    throw new Error('GMAIL_DELEGATE_USER not configured (must be a real Workspace user, not a group email)')
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: scopes || ['https://www.googleapis.com/auth/gmail.send'],
    subject: delegateUser, // 実際のユーザーアカウントでimpersonate
  })
}

// Gmail受信メール読み取り用の認証
function getGmailReadAuth() {
  return getGmailAuth([
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ])
}

// テンプレート変数の定義 (re-export from shared constants)
export { TEMPLATE_VARIABLES } from './email-constants'

// 変数置換データ型
export type TemplateVariables = {
  companyName: string
  contactPerson?: string
  region?: string
  phone?: string
  email?: string
  contactRound: number
  systemInUse?: string
  senderName?: string
}

// テンプレート変数の置換
export function replaceTemplateVariables(template: string, vars: TemplateVariables): string {
  return template
    .replace(/\{\{会社名\}\}/g, vars.companyName || '')
    .replace(/\{\{担当者\}\}/g, vars.contactPerson || '')
    .replace(/\{\{地域\}\}/g, vars.region || '')
    .replace(/\{\{電話番号\}\}/g, vars.phone || '')
    .replace(/\{\{メール\}\}/g, vars.email || '')
    .replace(/\{\{接触回数\}\}/g, String(vars.contactRound))
    .replace(/\{\{システム\}\}/g, vars.systemInUse || '')
    .replace(/\{\{送信者名\}\}/g, vars.senderName || '')
}

// MIME形式のメール作成（multipart/alternative: HTML + Text）
function createMimeMessage(
  to: string,
  from: string,
  fromName: string,
  subject: string,
  bodyText: string,
  bodyHtml: string
): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2)}`

  const mimeMessage = [
    `From: =?UTF-8?B?${Buffer.from(fromName).toString('base64')}?= <${from}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(bodyText).toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(bodyHtml).toString('base64'),
    '',
    `--${boundary}--`,
  ].join('\r\n')

  return Buffer.from(mimeMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// メール送信結果
export type SendEmailResult = {
  success: boolean
  messageId?: string
  error?: string
  bounced?: boolean
}

// Gmail APIでメール送信
export async function sendEmail(
  senderEmail: string,
  senderName: string,
  recipientEmail: string,
  subject: string,
  bodyText: string,
  bodyHtml: string
): Promise<SendEmailResult> {
  try {
    const auth = getGmailAuth()
    const gmail = google.gmail({ version: 'v1', auth })

    const raw = createMimeMessage(
      recipientEmail,
      senderEmail,
      senderName,
      subject,
      bodyText,
      bodyHtml
    )

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    })

    return {
      success: true,
      messageId: response.data.id || undefined,
    }
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string; errors?: Array<{ reason?: string }> }
    const errorCode = err.code || 0
    const errorMessage = err.message || 'Unknown error'

    // バウンス検出
    const isBounce =
      errorCode === 550 || // User not found
      errorCode === 552 || // Mailbox full
      errorCode === 553 || // Invalid address
      errorMessage.includes('Invalid') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('does not exist') ||
      (err.errors && err.errors.some(e => e.reason === 'invalidArgument'))

    return {
      success: false,
      error: `[${errorCode}] ${errorMessage}`,
      bounced: isBounce,
    }
  }
}

// ランダム遅延（スパム防止用）
export function getRandomDelay(minSeconds: number, maxSeconds: number): number {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000
}

// ビジネス時間チェック（JST 9:00-17:00）
export function isBusinessHours(): boolean {
  const now = new Date()
  // JSTに変換
  const jstOffset = 9 * 60 // JST = UTC+9
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const jstMinutes = (utcMinutes + jstOffset) % (24 * 60)
  const jstHour = Math.floor(jstMinutes / 60)
  const jstDay = now.getUTCDay() // 0=Sun, 6=Sat

  // 平日 9:00-17:00 のみ
  return jstDay >= 1 && jstDay <= 5 && jstHour >= 9 && jstHour < 17
}

// バッチ送信用ヘルパー
export async function sendEmailBatch(
  emails: Array<{
    companyId: string
    companyName: string
    recipientEmail: string
    subject: string
    bodyText: string
    bodyHtml: string
  }>,
  senderEmail: string,
  senderName: string,
  intervalSeconds: number = 30
): Promise<Array<{ companyId: string; result: SendEmailResult }>> {
  const results: Array<{ companyId: string; result: SendEmailResult }> = []

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]

    const result = await sendEmail(
      senderEmail,
      senderName,
      email.recipientEmail,
      email.subject,
      email.bodyText,
      email.bodyHtml
    )

    results.push({ companyId: email.companyId, result })

    // 最後のメール以外はランダム遅延
    if (i < emails.length - 1) {
      const delay = getRandomDelay(
        Math.max(15, intervalSeconds - 10),
        intervalSeconds + 15
      )
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return results
}

// =======================================
// 受信メール（返信検知）機能
// =======================================

export type GmailMessage = {
  id: string
  threadId: string
  from: string
  fromName: string
  subject: string
  bodyPreview: string
  receivedAt: Date
}

// 受信メール一覧取得（返信検知用）
export async function listInboxMessages(
  query?: string,
  maxResults: number = 20
): Promise<GmailMessage[]> {
  const auth = getGmailReadAuth()
  const gmail = google.gmail({ version: 'v1', auth })

  const q = query || 'is:inbox is:unread'

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q,
    maxResults,
  })

  const messages: GmailMessage[] = []
  const messageIds = listRes.data.messages || []

  for (const msg of messageIds) {
    if (!msg.id) continue

    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      })

      const headers = detail.data.payload?.headers || []
      const fromHeader = headers.find((h) => h.name === 'From')?.value || ''
      const subject = headers.find((h) => h.name === 'Subject')?.value || ''
      const dateHeader = headers.find((h) => h.name === 'Date')?.value || ''

      // From ヘッダーからメールと名前を抽出
      const fromMatch = fromHeader.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/)
      const fromName = fromMatch?.[1]?.trim() || ''
      const fromEmail = fromMatch?.[2]?.trim() || fromHeader

      messages.push({
        id: msg.id,
        threadId: detail.data.threadId || '',
        from: fromEmail,
        fromName,
        subject,
        bodyPreview: detail.data.snippet || '',
        receivedAt: dateHeader ? new Date(dateHeader) : new Date(),
      })
    } catch {
      // skip individual message errors
    }
  }

  return messages
}

// 特定の送信先からの返信を検索
export async function findRepliesFromRecipients(
  recipientEmails: string[],
  afterDate?: Date
): Promise<GmailMessage[]> {
  if (recipientEmails.length === 0) return []

  // fromクエリ構築: from:(email1 OR email2 OR ...)
  const fromQuery = recipientEmails.map((e) => `from:${e}`).join(' OR ')
  const dateQuery = afterDate
    ? `after:${afterDate.getFullYear()}/${afterDate.getMonth() + 1}/${afterDate.getDate()}`
    : ''
  const query = `is:inbox ${fromQuery} ${dateQuery}`.trim()

  return listInboxMessages(query, 50)
}

// HTMLテンプレートのデフォルト（テキストをHTMLに変換）
export function textToHtml(text: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
${text.split('\n').map(line => `<p style="margin: 0 0 8px 0;">${line || '&nbsp;'}</p>`).join('\n')}
</body>
</html>`
}
