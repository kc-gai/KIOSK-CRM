'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { MessageCircle, X, Send, Paperclip, Image, Trash2, Minimize2, Maximize2, Camera } from 'lucide-react'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    attachments?: {
        type: 'image' | 'file'
        name: string
        url: string
    }[]
    timestamp: Date
}

const INITIAL_MESSAGES: Record<string, string> = {
    ko: '안녕하세요! Kiosk CRM AI 어시스턴트입니다.\n\n오류 메시지, 사용 방법, 기능 문의 등 무엇이든 질문해주세요.\n\n📎 파일이나 🖼️ 스크린샷을 첨부하시면 더 정확한 도움을 드릴 수 있습니다.',
    ja: 'こんにちは！Kiosk CRM AIアシスタントです。\n\nエラーメッセージ、使い方、機能に関するご質問など、何でもお気軽にどうぞ。\n\n📎 ファイルや🖼️ スクリーンショットを添付していただくと、より正確なサポートが可能です。'
}

const RESET_MESSAGES: Record<string, string> = {
    ko: '대화가 초기화되었습니다.\n\n무엇을 도와드릴까요?',
    ja: '会話がリセットされました。\n\n何かお手伝いできることはありますか？'
}

const PLACEHOLDER_MESSAGES: Record<string, string> = {
    ko: '메시지를 입력하세요... (Ctrl+V: 스크린샷)',
    ja: 'メッセージを入力... (Ctrl+V: スクリーンショット)'
}

const TITLE_MESSAGES: Record<string, string> = {
    ko: 'AI 어시스턴트',
    ja: 'AIアシスタント'
}

export default function AIChatbot() {
    const locale = useLocale()
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: INITIAL_MESSAGES[locale] || INITIAL_MESSAGES.ja,
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [attachments, setAttachments] = useState<{ type: 'image' | 'file', name: string, url: string, file: File }[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() && attachments.length === 0) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            attachments: attachments.map(a => ({ type: a.type, name: a.name, url: a.url })),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setAttachments([])
        setIsLoading(true)

        try {
            // FormData로 파일 포함 전송
            const formData = new FormData()
            formData.append('message', input)
            formData.append('history', JSON.stringify(messages.slice(-10))) // 최근 10개 메시지
            formData.append('locale', locale) // 현재 언어 설정 전달

            attachments.forEach((att, i) => {
                formData.append(`file_${i}`, att.file)
            })

            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMessage])
            } else {
                const errorData = await res.json().catch(() => ({}))
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `죄송합니다. 오류가 발생했습니다.\n\n${errorData.error || '잠시 후 다시 시도해주세요.'}`,
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMessage])
            }
        } catch (error) {
            console.error('Chat error:', error)
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const files = e.target.files
        if (!files) return

        Array.from(files).forEach(file => {
            const url = URL.createObjectURL(file)
            setAttachments(prev => [...prev, { type, name: file.name, url, file }])
        })

        e.target.value = ''
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => {
            const newAttachments = [...prev]
            URL.revokeObjectURL(newAttachments[index].url)
            newAttachments.splice(index, 1)
            return newAttachments
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const clearChat = () => {
        setMessages([{
            id: '1',
            role: 'assistant',
            content: RESET_MESSAGES[locale] || RESET_MESSAGES.ja,
            timestamp: new Date()
        }])
    }

    // 스크린샷 캡처 (클립보드에서)
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) {
                    const url = URL.createObjectURL(file)
                    setAttachments(prev => [...prev, {
                        type: 'image',
                        name: `screenshot_${Date.now()}.png`,
                        url,
                        file
                    }])
                }
            }
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="position-fixed d-flex align-items-center justify-content-center"
                style={{
                    bottom: '24px',
                    right: '24px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #206bc4 0%, #4299e1 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(32, 107, 196, 0.4)',
                    cursor: 'pointer',
                    zIndex: 1050,
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(32, 107, 196, 0.5)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(32, 107, 196, 0.4)'
                }}
                title="AI 어시스턴트"
            >
                <MessageCircle size={24} color="white" />
            </button>
        )
    }

    return (
        <div
            className="position-fixed card"
            style={{
                bottom: '24px',
                right: '24px',
                width: isMinimized ? '300px' : '380px',
                height: isMinimized ? 'auto' : '520px',
                zIndex: 1050,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* 헤더 */}
            <div
                className="card-header d-flex align-items-center justify-content-between py-2"
                style={{ background: 'linear-gradient(135deg, #206bc4 0%, #4299e1 100%)', cursor: 'pointer' }}
                onClick={() => isMinimized && setIsMinimized(false)}
            >
                <div className="d-flex align-items-center gap-2">
                    <div className="avatar avatar-sm bg-white-lt">
                        <MessageCircle size={16} className="text-white" />
                    </div>
                    <span className="text-white fw-medium">{TITLE_MESSAGES[locale] || TITLE_MESSAGES.ja}</span>
                </div>
                <div className="d-flex gap-1">
                    <button
                        className="btn btn-sm btn-icon text-white"
                        onClick={(e) => { e.stopPropagation(); clearChat() }}
                        title={locale === 'ko' ? '대화 초기화' : '会話リセット'}
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        className="btn btn-sm btn-icon text-white"
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}
                        title={isMinimized ? (locale === 'ko' ? '확장' : '展開') : (locale === 'ko' ? '최소화' : '最小化')}
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        className="btn btn-sm btn-icon text-white"
                        onClick={() => setIsOpen(false)}
                        title={locale === 'ko' ? '닫기' : '閉じる'}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* 메시지 영역 */}
                    <div
                        className="card-body p-2"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            background: '#f8f9fa'
                        }}
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`d-flex mb-2 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                            >
                                <div
                                    className={`p-2 rounded-3 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white border'}`}
                                    style={{ maxWidth: '85%', fontSize: '13px' }}
                                >
                                    {/* 첨부파일 */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mb-2">
                                            {msg.attachments.map((att, i) => (
                                                <div key={i} className="mb-1">
                                                    {att.type === 'image' ? (
                                                        <img
                                                            src={att.url}
                                                            alt={att.name}
                                                            className="rounded"
                                                            style={{ maxWidth: '100%', maxHeight: '150px' }}
                                                        />
                                                    ) : (
                                                        <div className="d-flex align-items-center gap-1 small">
                                                            <Paperclip size={12} />
                                                            <span>{att.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* 메시지 내용 */}
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                    <div className={`text-end mt-1 ${msg.role === 'user' ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '10px' }}>
                                        {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="d-flex justify-content-start mb-2">
                                <div className="bg-white border p-2 rounded-3">
                                    <div className="d-flex gap-1">
                                        <div className="spinner-grow spinner-grow-sm text-primary" style={{ width: '8px', height: '8px' }}></div>
                                        <div className="spinner-grow spinner-grow-sm text-primary" style={{ width: '8px', height: '8px', animationDelay: '0.1s' }}></div>
                                        <div className="spinner-grow spinner-grow-sm text-primary" style={{ width: '8px', height: '8px', animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 첨부파일 미리보기 */}
                    {attachments.length > 0 && (
                        <div className="border-top p-2 bg-light">
                            <div className="d-flex gap-2 flex-wrap">
                                {attachments.map((att, i) => (
                                    <div key={i} className="position-relative">
                                        {att.type === 'image' ? (
                                            <img
                                                src={att.url}
                                                alt={att.name}
                                                className="rounded border"
                                                style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div
                                                className="d-flex align-items-center justify-content-center bg-white border rounded"
                                                style={{ width: '48px', height: '48px' }}
                                            >
                                                <Paperclip size={16} className="text-muted" />
                                            </div>
                                        )}
                                        <button
                                            className="btn btn-sm btn-icon position-absolute"
                                            style={{ top: '-6px', right: '-6px', width: '18px', height: '18px', padding: 0, background: '#dc3545', borderRadius: '50%' }}
                                            onClick={() => removeAttachment(i)}
                                        >
                                            <X size={10} color="white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 입력 영역 */}
                    <div className="card-footer p-2">
                        <div className="d-flex gap-2">
                            <div className="d-flex gap-1">
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="d-none"
                                    onChange={(e) => handleFileChange(e, 'image')}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="d-none"
                                    onChange={(e) => handleFileChange(e, 'file')}
                                />
                                <button
                                    className="btn btn-sm btn-icon btn-ghost-secondary"
                                    onClick={() => imageInputRef.current?.click()}
                                    title={locale === 'ko' ? '이미지 첨부 (Ctrl+V로 스크린샷 붙여넣기)' : '画像添付 (Ctrl+Vでスクリーンショット貼り付け)'}
                                >
                                    <Image size={16} />
                                </button>
                                <button
                                    className="btn btn-sm btn-icon btn-ghost-secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    title={locale === 'ko' ? '파일 첨부' : 'ファイル添付'}
                                >
                                    <Paperclip size={16} />
                                </button>
                            </div>
                            <textarea
                                className="form-control form-control-sm"
                                placeholder={PLACEHOLDER_MESSAGES[locale] || PLACEHOLDER_MESSAGES.ja}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                rows={1}
                                style={{ resize: 'none', minHeight: '36px', maxHeight: '80px' }}
                            />
                            <button
                                className="btn btn-primary btn-sm btn-icon"
                                onClick={handleSend}
                                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <div className="text-muted text-center mt-1" style={{ fontSize: '10px' }}>
                            {locale === 'ko' ? 'Ctrl+V로 스크린샷 붙여넣기 가능' : 'Ctrl+Vでスクリーンショット貼り付け可能'}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}