import { NextResponse } from 'next/server'

// OpenAI API 또는 다른 AI 서비스 연동
// 현재는 Anthropic Claude API 사용 가정

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// 시스템 프롬프트 - CRM 컨텍스트 (언어별)
const SYSTEM_PROMPTS: Record<string, string> = {
    ko: `당신은 Kiosk Asset CRM 시스템의 AI 어시스턴트입니다. 반드시 한국어로 응답하세요.

## 시스템 개요
- 키오스크 자산 관리 시스템 (렌터카 업계 대상)
- 주요 기능: 발주/납품 관리, 자산 관리, 거래처 관리, 통계

## 주요 개념
- FC (프랜차이즈): 니폰렌터카, 토요타렌터카 등 본사
- 법인: FC 산하 별도 법인
- 지점: 실제 키오스크가 설치된 점포
- 독립 거래처: FC에 소속되지 않은 단독 법인

## 구조
- FC 소속: FC → 법인 → 지점
- 독립 거래처: 법인(거래처) → 지점

## 자주 발생하는 오류와 해결책
1. "삭제할 수 없습니다" - 연결된 키오스크나 주문이 있음. 먼저 연결 해제 필요
2. "권한이 없습니다" - 관리자 계정으로 로그인 필요
3. CSV 업로드 실패 - 파일 형식 확인 (UTF-8, 필수 컬럼 확인)

## 응답 스타일
- 친절하고 명확하게 답변
- 단계별 안내 제공
- 관련 메뉴 경로 안내 (예: 거래처 관리 → FC/법인/지점)
- 스크린샷이 첨부되면 화면을 분석하여 구체적으로 안내

사용자의 질문에 위 컨텍스트를 바탕으로 도움을 제공하세요.`,

    ja: `あなたはKiosk Asset CRMシステムのAIアシスタントです。必ず日本語で応答してください。

## システム概要
- キオスク資産管理システム（レンタカー業界向け）
- 主要機能：発注/納品管理、資産管理、取引先管理、統計

## 主要概念
- FC（フランチャイズ）：ニッポンレンタカー、トヨタレンタカーなど本社
- 法人：FC傘下の別法人
- 支店：実際にキオスクが設置された店舗
- 独立取引先：FCに所属しない単独法人

## 構造
- FC所属：FC → 法人 → 支店
- 独立取引先：法人（取引先）→ 支店

## よくあるエラーと解決策
1. 「削除できません」- 関連するキオスクや注文があります。まず関連を解除してください
2. 「権限がありません」- 管理者アカウントでログインしてください
3. CSVアップロード失敗 - ファイル形式を確認（UTF-8、必須カラム確認）

## 応答スタイル
- 親切で明確に回答
- ステップバイステップの案内を提供
- 関連メニューパスを案内（例：取引先管理 → FC/法人/支店）
- スクリーンショットが添付された場合、画面を分析して具体的に案内

上記のコンテキストに基づいてユーザーの質問にサポートを提供してください。`
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const message = formData.get('message') as string || ''
        const historyStr = formData.get('history') as string
        const history = historyStr ? JSON.parse(historyStr) : []
        const locale = (formData.get('locale') as string) || 'ja' // 기본값은 일본어

        // 첨부 파일 처리
        const attachments: { type: string; name: string; base64?: string; mimeType?: string }[] = []
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('file_') && value instanceof File) {
                const buffer = await value.arrayBuffer()
                const base64 = Buffer.from(buffer).toString('base64')
                const isImage = value.type.startsWith('image/')
                attachments.push({
                    type: isImage ? 'image' : 'file',
                    name: value.name,
                    base64,
                    mimeType: value.type || 'image/png'
                })
            }
        }

        // AI API 호출
        let response: string

        if (ANTHROPIC_API_KEY) {
            response = await callAnthropic(message, history, attachments, locale)
        } else if (OPENAI_API_KEY) {
            response = await callOpenAI(message, history, attachments, locale)
        } else {
            // API 키가 없으면 기본 응답
            response = generateFallbackResponse(message, attachments, locale)
        }

        return NextResponse.json({ response })
    } catch (error) {
        console.error('AI Chat error:', error)
        return NextResponse.json(
            { error: 'AI 응답 생성 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}

// Anthropic Claude API 호출
async function callAnthropic(
    message: string,
    history: { role: string; content: string }[],
    attachments: { type: string; name: string; base64?: string; mimeType?: string }[],
    locale: string
): Promise<string> {
    // 이전 대화 히스토리 변환 (assistant 메시지는 반드시 user 뒤에 와야 함)
    const messages: { role: 'user' | 'assistant'; content: any }[] = []

    history.forEach((msg: { role: string; content: string }) => {
        const role = msg.role === 'user' ? 'user' : 'assistant'
        messages.push({
            role,
            content: msg.content
        })
    })

    // 현재 메시지 구성
    const currentContent: any[] = []

    // 이미지 첨부 (Claude Vision 지원)
    attachments.forEach(att => {
        if (att.type === 'image' && att.base64) {
            // 지원되는 미디어 타입: image/jpeg, image/png, image/gif, image/webp
            let mediaType = att.mimeType || 'image/png'
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
                mediaType = 'image/png'
            }

            currentContent.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: att.base64
                }
            })
        }
    })

    // 텍스트 메시지
    if (message) {
        currentContent.push({ type: 'text', text: message })
    }

    // 이미지만 있고 텍스트가 없는 경우 (언어별)
    const analyzeText = locale === 'ko'
        ? '이 화면을 분석해주세요.'
        : 'この画面を分析してください。'
    const analyzeWithHelpText = locale === 'ko'
        ? '이 화면/이미지를 분석해주세요. 문제가 있다면 해결 방법을 알려주세요.'
        : 'この画面/画像を分析してください。問題があれば解決方法を教えてください。'

    if (currentContent.length === 0) {
        currentContent.push({ type: 'text', text: analyzeText })
    } else if (currentContent.length > 0 && !message && attachments.length > 0) {
        currentContent.push({ type: 'text', text: analyzeWithHelpText })
    }

    messages.push({ role: 'user', content: currentContent })

    console.log('Calling Anthropic API with', messages.length, 'messages, locale:', locale)

    // 언어에 맞는 시스템 프롬프트 선택
    const systemPrompt = SYSTEM_PROMPTS[locale] || SYSTEM_PROMPTS.ja

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            messages
        })
    })

    if (!res.ok) {
        const errorBody = await res.text()
        console.error('Anthropic API error:', res.status, errorBody)
        throw new Error(`Anthropic API error: ${res.status} - ${errorBody}`)
    }

    const data = await res.json()
    const noResponseText = locale === 'ko' ? '응답을 생성할 수 없습니다.' : '応答を生成できません。'
    return data.content[0]?.text || noResponseText
}

// OpenAI API 호출
async function callOpenAI(
    message: string,
    history: { role: string; content: string }[],
    attachments: { type: string; name: string; base64?: string }[],
    locale: string
): Promise<string> {
    // 언어에 맞는 시스템 프롬프트 선택
    const systemPrompt = SYSTEM_PROMPTS[locale] || SYSTEM_PROMPTS.ja

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: { role: string; content: string | any[] }[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((msg: { role: string; content: string }) => ({
            role: msg.role,
            content: msg.content
        }))
    ]

    // 현재 메시지
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentContent: any[] = []

    // 이미지 첨부
    attachments.forEach(att => {
        if (att.type === 'image' && att.base64) {
            currentContent.push({
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${att.base64}` }
            })
        }
    })

    // 텍스트 메시지
    if (message) {
        currentContent.push({ type: 'text', text: message })
    }

    const fallbackMessage = locale === 'ko' ? '(첨부 파일만 전송됨)' : '(添付ファイルのみ送信)'
    const userContent = currentContent.length > 0
        ? currentContent
        : (message || fallbackMessage)
    messages.push({
        role: 'user',
        content: userContent as string
    })

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages,
            max_tokens: 1024
        })
    })

    if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status}`)
    }

    const data = await res.json()
    const noResponseText = locale === 'ko' ? '응답을 생성할 수 없습니다.' : '応答を生成できません。'
    return data.choices[0]?.message?.content || noResponseText
}

// API 키 없을 때 기본 응답
function generateFallbackResponse(message: string, attachments: { type: string; name: string }[], locale: string): string {
    const lowerMessage = message.toLowerCase()
    const isJa = locale === 'ja'

    // 첨부파일 있으면
    if (attachments.length > 0) {
        return isJa
            ? `スクリーンショット/ファイルを確認しました。\n\n現在AIサービスが接続されていないため、自動分析ができません。\n\n以下の情報を追加でお知らせいただければサポートできます:\n1. どんな作業をしようとしましたか？\n2. どんなエラーメッセージが表示されましたか？\n3. 期待した動作は何でしたか？`
            : `스크린샷/파일을 확인했습니다.\n\n현재 AI 서비스가 연결되지 않아 자동 분석이 불가합니다.\n\n다음 정보를 추가로 알려주시면 도움을 드릴 수 있습니다:\n1. 어떤 작업을 하려고 했나요?\n2. 어떤 오류 메시지가 표시되었나요?\n3. 예상한 동작은 무엇이었나요?`
    }

    // 키워드 기반 응답 (한국어)
    if (lowerMessage.includes('삭제') && (lowerMessage.includes('안됨') || lowerMessage.includes('안 됨') || lowerMessage.includes('실패'))) {
        return `삭제가 안 되는 경우 다음을 확인해주세요:\n\n1. **연결된 키오스크 확인**\n   - 해당 거래처/지점에 키오스크가 등록되어 있으면 삭제할 수 없습니다\n   - 먼저 자산 관리에서 키오스크의 소속을 변경하세요\n\n2. **연결된 주문 확인**\n   - 발주/납품 이력이 있으면 삭제할 수 없습니다\n\n3. **권한 확인**\n   - 관리자 계정으로 로그인했는지 확인하세요`
    }

    // 키워드 기반 응답 (일본어)
    if (lowerMessage.includes('削除') && (lowerMessage.includes('できない') || lowerMessage.includes('失敗'))) {
        return `削除できない場合は以下を確認してください:\n\n1. **関連キオスクの確認**\n   - 該当取引先/支店にキオスクが登録されていると削除できません\n   - まず資産管理でキオスクの所属を変更してください\n\n2. **関連注文の確認**\n   - 発注/納品履歴がある場合は削除できません\n\n3. **権限確認**\n   - 管理者アカウントでログインしているか確認してください`
    }

    if (lowerMessage.includes('fc') || lowerMessage.includes('법인') || lowerMessage.includes('지점')) {
        return `**거래처 구조 안내**\n\n📌 **FC 소속 (3단계)**\nFC → 법인 → 지점\n예: 니폰렌터카 → 니폰렌터카홋카이도 → 삿포로역앞영업소\n\n📌 **독립 거래처 (2단계)**\n법인(거래처) → 지점\n예: ABC주식회사 → 도쿄본점\n\n**관리 메뉴**: 거래처/지점 관리`
    }

    if (lowerMessage.includes('fc') || lowerMessage.includes('法人') || lowerMessage.includes('支店')) {
        return `**取引先構造のご案内**\n\n📌 **FC所属（3段階）**\nFC → 法人 → 支店\n例：ニッポンレンタカー → ニッポンレンタカー北海道 → 札幌駅前営業所\n\n📌 **独立取引先（2段階）**\n法人（取引先）→ 支店\n例：ABC株式会社 → 東京本店\n\n**管理メニュー**: 取引先/支店管理`
    }

    if (lowerMessage.includes('csv') || lowerMessage.includes('업로드') || lowerMessage.includes('일괄')) {
        return `**CSV 일괄 등록 안내**\n\n1. 거래처/지점 관리 페이지에서 "CSV 일괄등록" 클릭\n2. 샘플 CSV 다운로드하여 형식 확인\n3. 필수 컬럼: type, name\n4. 파일 인코딩: UTF-8\n\n**주의사항**:\n- FC/CORP/BRANCH/PARTNER 타입 지정 필수\n- 소속 FC/법인명을 정확히 입력`
    }

    if (lowerMessage.includes('csv') || lowerMessage.includes('アップロード') || lowerMessage.includes('一括')) {
        return `**CSV一括登録のご案内**\n\n1. 取引先/支店管理ページで「CSV一括登録」をクリック\n2. サンプルCSVをダウンロードして形式を確認\n3. 必須カラム: type, name\n4. ファイルエンコーディング: UTF-8\n\n**注意事項**:\n- FC/CORP/BRANCH/PARTNERタイプの指定が必須\n- 所属FC/法人名を正確に入力`
    }

    if (lowerMessage.includes('납품') || lowerMessage.includes('발주') || lowerMessage.includes('배송')) {
        return `**발주/납품 프로세스 안내**\n\n1. **발주의뢰** → 발주 요청 등록\n2. **납품현황** → 배송 상태 관리\n3. **D-7, D-3, D-1** 자동 알림 (이메일)\n\n**Google Calendar 연동**:\n- API 설정에서 Calendar 설정 가능\n- 납기일 자동 등록`
    }

    if (lowerMessage.includes('納品') || lowerMessage.includes('発注') || lowerMessage.includes('配送')) {
        return `**発注/納品プロセスのご案内**\n\n1. **発注依頼** → 発注リクエスト登録\n2. **納品状況** → 配送状態管理\n3. **D-7, D-3, D-1** 自動アラート（メール）\n\n**Google Calendar連携**:\n- API設定でCalendar設定可能\n- 納期日自動登録`
    }

    return isJa
        ? `こんにちは！Kiosk CRM AIアシスタントです。\n\n現在AIサービスが接続されていないため、基本応答のみ可能です。\n\n**よくある質問**:\n- 「削除できません」- 関連データの確認が必要\n- 「FC/法人/支店構造」- 階層構造の説明\n- 「CSVアップロード」- 一括登録方法\n\n具体的なエラーメッセージやスクリーンショットを添付していただければ、より正確なご案内が可能です。`
        : `안녕하세요! Kiosk CRM AI 어시스턴트입니다.\n\n현재 AI 서비스가 연결되지 않아 기본 응답만 가능합니다.\n\n**자주 묻는 질문**:\n- "삭제가 안 돼요" - 연결된 데이터 확인 필요\n- "FC/법인/지점 구조" - 계층 구조 설명\n- "CSV 업로드" - 일괄 등록 방법\n\n구체적인 오류 메시지나 스크린샷을 첨부해주시면 더 정확한 안내가 가능합니다.`
}
