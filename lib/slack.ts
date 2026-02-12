// Slack API Integration for KPI Tracking
// Requires: SLACK_BOT_TOKEN, SLACK_DEMO_CHANNEL_ID, SLACK_INQUIRY_CHANNEL_ID

export type SlackAttachment = {
  fallback?: string
  title?: string
  text?: string
  pretext?: string
}

export type SlackMessage = {
  ts: string
  text: string
  user?: string
  bot_id?: string
  reply_count?: number
  thread_ts?: string
  attachments?: SlackAttachment[]
  blocks?: any[]
}

export type SlackChannelResponse = {
  ok: boolean
  messages: SlackMessage[]
  has_more?: boolean
  response_metadata?: {
    next_cursor?: string
  }
}

export type KPICountResult = {
  demoCount: number
  inquiryCount: number
  totalLeads: number
  demoDetails: { date: string; company?: string; person?: string }[]
  inquiryDetails: { date: string; company?: string; person?: string }[]
}

const SLACK_API_BASE = 'https://slack.com/api'

// Slack Bot Token from environment
function getSlackToken(): string {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    throw new Error('SLACK_BOT_TOKEN is not configured')
  }
  return token
}

// Fetch messages from a Slack channel
export async function fetchChannelMessages(
  channelId: string,
  oldest?: string,
  latest?: string
): Promise<SlackMessage[]> {
  const token = getSlackToken()
  const allMessages: SlackMessage[] = []
  let cursor: string | undefined

  do {
    const params = new URLSearchParams({
      channel: channelId,
      limit: '200',
    })

    if (oldest) params.append('oldest', oldest)
    if (latest) params.append('latest', latest)
    if (cursor) params.append('cursor', cursor)

    const response = await fetch(`${SLACK_API_BASE}/conversations.history?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data: SlackChannelResponse = await response.json()

    if (!data.ok) {
      throw new Error(`Slack API error: ${JSON.stringify(data)}`)
    }

    allMessages.push(...data.messages)
    cursor = data.response_metadata?.next_cursor
  } while (cursor)

  return allMessages
}

// Get reply count for a message (thread)
export async function getMessageReplies(
  channelId: string,
  threadTs: string
): Promise<number> {
  const token = getSlackToken()

  const params = new URLSearchParams({
    channel: channelId,
    ts: threadTs,
    limit: '1',
  })

  const response = await fetch(`${SLACK_API_BASE}/conversations.replies?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()

  if (!data.ok) {
    return 0
  }

  // First message is the parent, so replies = total - 1
  return Math.max(0, (data.messages?.length || 1) - 1)
}

// Parse timestamp to date string
function tsToDate(ts: string): string {
  const timestamp = parseFloat(ts) * 1000
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

// Extract company/person from demo message
function parseDemoMessage(text: string): { company?: string; person?: string } {
  const result: { company?: string; person?: string } = {}

  // Pattern: "株式会社ヨシノ自動車\n太田　秀人"
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.includes('株式会社') || line.includes('会社')) {
      result.company = line.trim()
    }
  }

  return result
}

// Extract company/person from inquiry message
function parseInquiryMessage(text: string): { company?: string; person?: string } {
  const result: { company?: string; person?: string } = {}

  // Pattern: "氏名:\n小山 優希" or "企業名・団体名:\nジーコネクトソリューションズ株式会社"
  const nameMatch = text.match(/氏名[:：]\s*\n?([^\n]+)/i)
  if (nameMatch) {
    result.person = nameMatch[1].trim()
  }

  const companyMatch = text.match(/企業名[・・]?団体名[:：]\s*\n?([^\n]+)/i)
  if (companyMatch) {
    result.company = companyMatch[1].trim()
  }

  return result
}

// Count demo requests from #07_デモ依頼
// Condition: Message contains "さんが予定を追加しました" and has 1+ thread replies
export async function countDemoRequests(
  channelId: string,
  startDate: Date,
  endDate: Date
): Promise<{ count: number; details: { date: string; company?: string; person?: string }[] }> {
  const oldest = (startDate.getTime() / 1000).toString()
  const latest = (endDate.getTime() / 1000).toString()

  const messages = await fetchChannelMessages(channelId, oldest, latest)
  const details: { date: string; company?: string; person?: string }[] = []

  for (const msg of messages) {
    const fullText = getFullMessageText(msg)

    // Check if this is a demo request message (from TimeRex)
    const isDemoRequest = fullText.includes('さんが予定を追加しました') ||
                          fullText.includes('予定を追加') ||
                          fullText.includes('デモ依頼')

    if (isDemoRequest) {
      // Check for thread replies
      const replyCount = msg.reply_count ?? await getMessageReplies(channelId, msg.ts)

      if (replyCount >= 1) {
        const parsed = parseDemoMessage(fullText)
        details.push({
          date: tsToDate(msg.ts),
          ...parsed,
        })
      }
    }
  }

  return { count: details.length, details }
}

// Get full message text including attachments
function getFullMessageText(msg: SlackMessage): string {
  let fullText = msg.text || ''

  // Check attachments (Jotform uses this)
  if (msg.attachments) {
    for (const att of msg.attachments) {
      if (att.fallback) fullText += '\n' + att.fallback
      if (att.title) fullText += '\n' + att.title
      if (att.text) fullText += '\n' + att.text
      if (att.pretext) fullText += '\n' + att.pretext
    }
  }

  // Check blocks (some apps use blocks)
  if (msg.blocks) {
    for (const block of msg.blocks) {
      if (block.text?.text) fullText += '\n' + block.text.text
      if (block.elements) {
        for (const el of block.elements) {
          if (el.text) fullText += '\n' + el.text
        }
      }
    }
  }

  return fullText
}

// Count inquiries from #08_お問い合わせ
// Condition: Message contains "KAFLIX CLOUD お問い合わせフォーム" or is from Jotform, and has 1+ thread replies
export async function countInquiries(
  channelId: string,
  startDate: Date,
  endDate: Date
): Promise<{ count: number; details: { date: string; company?: string; person?: string }[] }> {
  const oldest = (startDate.getTime() / 1000).toString()
  const latest = (endDate.getTime() / 1000).toString()

  const messages = await fetchChannelMessages(channelId, oldest, latest)
  const details: { date: string; company?: string; person?: string }[] = []

  for (const msg of messages) {
    const fullText = getFullMessageText(msg)

    // Check if this is an inquiry message (from Jotform)
    // Also check for bot messages with attachments containing form data
    const isInquiry = fullText.includes('KAFLIX CLOUD お問い合わせフォーム') ||
                      fullText.includes('お問い合わせフォーム') ||
                      (msg.bot_id && fullText.includes('氏名'))

    if (isInquiry) {
      // Check for thread replies
      const replyCount = msg.reply_count ?? await getMessageReplies(channelId, msg.ts)

      if (replyCount >= 1) {
        const parsed = parseInquiryMessage(fullText)
        details.push({
          date: tsToDate(msg.ts),
          ...parsed,
        })
      }
    }
  }

  return { count: details.length, details }
}

// =======================================
// Slack メッセージ送信機能
// =======================================

// Slackチャンネルにメッセージ送信
export async function postSlackMessage(
  channelId: string,
  text: string,
  blocks?: Record<string, unknown>[]
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const token = getSlackToken()

  const body: Record<string, unknown> = {
    channel: channelId,
    text,
  }
  if (blocks) body.blocks = blocks

  const response = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return response.json()
}

// メール返信通知をSlackに送信
export async function notifyEmailReply(params: {
  companyName: string
  fromEmail: string
  subject: string
  bodyPreview: string
  receivedAt: Date
}): Promise<boolean> {
  const channelId = process.env.SLACK_EMAIL_REPLY_CHANNEL_ID || process.env.SLACK_INQUIRY_CHANNEL_ID
  if (!channelId) {
    console.warn('No Slack channel configured for email reply notifications')
    return false
  }

  const receivedStr = params.receivedAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '\ud83d\udce9 \u30e1\u30fc\u30eb\u8fd4\u4fe1\u304c\u5c4a\u304d\u307e\u3057\u305f', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*\u4f1a\u793e\u540d:*\n${params.companyName || '\u4e0d\u660e'}` },
        { type: 'mrkdwn', text: `*\u9001\u4fe1\u5143:*\n${params.fromEmail}` },
        { type: 'mrkdwn', text: `*\u4ef6\u540d:*\n${params.subject || '(\u4ef6\u540d\u306a\u3057)'}` },
        { type: 'mrkdwn', text: `*\u53d7\u4fe1\u6642\u523b:*\n${receivedStr}` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*\u30d7\u30ec\u30d3\u30e5\u30fc:*\n>${params.bodyPreview.substring(0, 200)}` },
    },
  ]

  try {
    const result = await postSlackMessage(
      channelId,
      `\u30e1\u30fc\u30eb\u8fd4\u4fe1: ${params.companyName || params.fromEmail} - ${params.subject}`,
      blocks
    )
    return result.ok
  } catch (error) {
    console.error('Slack notification error:', error)
    return false
  }
}

// Get all KPI counts for a given month
export async function getMonthlyKPICounts(
  demoChannelId: string,
  inquiryChannelId: string,
  year: number,
  month: number // 1-12
): Promise<KPICountResult> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59) // Last day of month

  const [demoResult, inquiryResult] = await Promise.all([
    countDemoRequests(demoChannelId, startDate, endDate),
    countInquiries(inquiryChannelId, startDate, endDate),
  ])

  return {
    demoCount: demoResult.count,
    inquiryCount: inquiryResult.count,
    totalLeads: demoResult.count + inquiryResult.count,
    demoDetails: demoResult.details,
    inquiryDetails: inquiryResult.details,
  }
}
