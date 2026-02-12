import { NextRequest, NextResponse } from 'next/server'
import { testCalendarConnection } from '@/lib/google-calendar'
import { testEmailConnection, sendTestEmail } from '@/lib/email'
import { testJobcanConnection } from '@/lib/jobcan'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/test-connection
 * 각종 서비스 연결 테스트
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, testEmail } = body

        switch (type) {
            case 'GOOGLE_CALENDAR': {
                const result = await testCalendarConnection()
                return NextResponse.json(result)
            }

            case 'EMAIL': {
                const result = await testEmailConnection()
                return NextResponse.json(result)
            }

            case 'EMAIL_SEND': {
                if (!testEmail) {
                    return NextResponse.json(
                        { success: false, message: '테스트 이메일 주소를 입력해주세요.' },
                        { status: 400 }
                    )
                }
                const sent = await sendTestEmail(testEmail)
                return NextResponse.json({
                    success: sent,
                    message: sent ? `테스트 메일이 ${testEmail}로 발송되었습니다.` : '메일 발송에 실패했습니다.'
                })
            }

            case 'SLACK': {
                const webhookUrl = body.webhookUrl
                if (!webhookUrl) {
                    return NextResponse.json(
                        { success: false, message: 'Webhook URL이 필요합니다.' },
                        { status: 400 }
                    )
                }

                try {
                    const response = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text: '🔔 *Kiosk CRM 연결 테스트*\n정상적으로 연결되었습니다!'
                        })
                    })

                    if (response.ok) {
                        return NextResponse.json({ success: true, message: 'Slack 연결 성공' })
                    } else {
                        return NextResponse.json({ success: false, message: `Slack 응답 오류: ${response.status}` })
                    }
                } catch (error: any) {
                    return NextResponse.json({ success: false, message: `연결 실패: ${error.message}` })
                }
            }

            case 'DATABASE': {
                try {
                    // 간단한 쿼리로 DB 연결 테스트
                    const result = await prisma.$queryRaw`SELECT 1 as test`
                    return NextResponse.json({
                        success: true,
                        message: 'Supabase PostgreSQL 연결 성공!'
                    })
                } catch (error: any) {
                    return NextResponse.json({
                        success: false,
                        message: `DB 연결 실패: ${error.message}`
                    })
                }
            }

            case 'AI_CHATBOT': {
                // 환경변수에서 API 키 확인
                const anthropicKey = process.env.ANTHROPIC_API_KEY
                const openaiKey = process.env.OPENAI_API_KEY

                if (!anthropicKey && !openaiKey) {
                    return NextResponse.json({
                        success: false,
                        message: 'AI API 키가 설정되지 않았습니다. Anthropic 또는 OpenAI API 키를 환경변수에 설정해주세요.'
                    })
                }

                // Anthropic API 테스트
                if (anthropicKey) {
                    try {
                        const response = await fetch('https://api.anthropic.com/v1/messages', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': anthropicKey,
                                'anthropic-version': '2023-06-01'
                            },
                            body: JSON.stringify({
                                model: 'claude-3-haiku-20240307',
                                max_tokens: 10,
                                messages: [{ role: 'user', content: 'Hi' }]
                            })
                        })

                        if (response.ok) {
                            return NextResponse.json({
                                success: true,
                                message: 'Anthropic Claude API 연결 성공! AI 챗봇을 사용할 수 있습니다.'
                            })
                        } else {
                            const errorData = await response.json().catch(() => ({}))
                            return NextResponse.json({
                                success: false,
                                message: `Anthropic API 오류: ${errorData.error?.message || response.status}`
                            })
                        }
                    } catch (error: any) {
                        return NextResponse.json({
                            success: false,
                            message: `Anthropic API 연결 실패: ${error.message}`
                        })
                    }
                }

                // OpenAI API 테스트
                if (openaiKey) {
                    try {
                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${openaiKey}`
                            },
                            body: JSON.stringify({
                                model: 'gpt-3.5-turbo',
                                max_tokens: 10,
                                messages: [{ role: 'user', content: 'Hi' }]
                            })
                        })

                        if (response.ok) {
                            return NextResponse.json({
                                success: true,
                                message: 'OpenAI API 연결 성공! AI 챗봇을 사용할 수 있습니다.'
                            })
                        } else {
                            const errorData = await response.json().catch(() => ({}))
                            return NextResponse.json({
                                success: false,
                                message: `OpenAI API 오류: ${errorData.error?.message || response.status}`
                            })
                        }
                    } catch (error: any) {
                        return NextResponse.json({
                            success: false,
                            message: `OpenAI API 연결 실패: ${error.message}`
                        })
                    }
                }

                return NextResponse.json({
                    success: false,
                    message: 'API 연결을 테스트할 수 없습니다.'
                })
            }

            case 'JOBCAN': {
                const jobcanResult = await testJobcanConnection()
                return NextResponse.json(jobcanResult)
            }

            case 'VERTEX_AI': {
                // DB에서 Vertex AI 설정 조회
                const vertexSettings = await prisma.systemSetting.findMany({
                    where: { category: 'VERTEX' }
                })
                const vertexApiKey = vertexSettings.find(s => s.key === 'VERTEX_API_KEY')?.value
                const vertexProjectId = vertexSettings.find(s => s.key === 'VERTEX_PROJECT_ID')?.value
                const vertexLocation = vertexSettings.find(s => s.key === 'VERTEX_LOCATION')?.value || 'asia-northeast1'

                if (!vertexApiKey) {
                    return NextResponse.json({
                        success: false,
                        message: 'Vertex AI API 키가 설정되지 않았습니다.'
                    })
                }

                try {
                    // Vertex AI Gemini API로 간단한 테스트
                    const url = `https://${vertexLocation}-aiplatform.googleapis.com/v1/projects/${vertexProjectId}/locations/${vertexLocation}/publishers/google/models/gemini-2.0-flash:generateContent?key=${vertexApiKey}`

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: 'Hi' }] }],
                            generationConfig: { maxOutputTokens: 10 }
                        })
                    })

                    if (response.ok) {
                        return NextResponse.json({
                            success: true,
                            message: `Vertex AI 연결 성공! (${vertexLocation}, Project: ${vertexProjectId})`
                        })
                    } else {
                        const errorData = await response.json().catch(() => ({}))
                        return NextResponse.json({
                            success: false,
                            message: `Vertex AI 오류: ${errorData.error?.message || response.status}`
                        })
                    }
                } catch (error: any) {
                    return NextResponse.json({
                        success: false,
                        message: `Vertex AI 연결 실패: ${error.message}`
                    })
                }
            }

            default:
                return NextResponse.json(
                    { success: false, message: '지원하지 않는 연결 타입입니다.' },
                    { status: 400 }
                )
        }
    } catch (error: any) {
        console.error('Connection test error:', error)
        return NextResponse.json(
            { success: false, message: error.message || '테스트 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
