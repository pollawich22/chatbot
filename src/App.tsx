import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

type Role = 'user' | 'assistant'
type Message = { id: string; role: Role; content: string }

const suggestions = [
  { icon: '✦', title: 'ช่วยสรุปเรื่องยาก', text: 'ช่วยอธิบาย Machine Learning ให้เข้าใจง่ายหน่อย' },
  { icon: '⌘', title: 'ช่วยเขียนโค้ด', text: 'ช่วยแนะนำวิธีเริ่มทำโปรเจกต์ React สำหรับมือใหม่' },
  { icon: '◎', title: 'ฝึกภาษาอังกฤษ', text: 'ช่วยตั้งคำถามภาษาอังกฤษให้ฉันฝึกตอบหน่อย' },
  { icon: '↗', title: 'ระดมไอเดีย', text: 'มีไอเดียโปรเจกต์ AI ที่ทำเป็น portfolio ได้ไหม' },
]

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const conversationVersion = useRef(0)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  const sendMessage = async (text = draft) => {
    const content = text.trim()
    if (!content || loading) return

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content }
    const nextMessages = [...messages, userMessage]
    const requestVersion = conversationVersion.current
    setMessages(nextMessages)
    setDraft('')
    setError('')
    setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })) }),
      })
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.toLowerCase().includes('json')) {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับข้อมูลผิดรูปแบบ (HTTP ${response.status}) ตรวจว่า FastAPI ทำงานอยู่และ Vite proxy ชี้ไปที่ backend`)
      }

      let data: { reply?: string; detail?: unknown }
      try {
        data = await response.json()
      } catch {
        throw new Error(`อ่านคำตอบจากเซิร์ฟเวอร์ไม่ได้ (HTTP ${response.status}) กรุณาลองอีกครั้ง`)
      }

      const detail = typeof data.detail === 'string' ? data.detail : ''
      if (!response.ok) {
        if (/^the string did not match the expected pattern\.?$/i.test(detail.trim())) {
          throw new Error(`เซิร์ฟเวอร์ตอบกลับข้อมูลผิดรูปแบบ (HTTP ${response.status}) ตรวจว่า FastAPI ทำงานอยู่และ Vite proxy ชี้ไปที่ backend`)
        }
        throw new Error(detail || `ส่งข้อความไม่สำเร็จ (HTTP ${response.status}) กรุณาลองอีกครั้ง`)
      }
      if (!data.reply) throw new Error('AI ยังไม่ได้ส่งคำตอบกลับมา กรุณาลองอีกครั้ง')
      if (requestVersion !== conversationVersion.current) return
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: data.reply! }])
    } catch (cause) {
      if (requestVersion === conversationVersion.current) {
        setError(cause instanceof TypeError ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend กำลังทำงานอยู่' : cause instanceof Error ? cause.message : 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
      }
    } finally {
      if (requestVersion === conversationVersion.current) {
        setLoading(false)
        textareaRef.current?.focus()
      }
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const handleDraft = (value: string) => {
    setDraft(value)
    setError('')
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
    }
  }

  const resetChat = () => {
    conversationVersion.current += 1
    setMessages([])
    setDraft('')
    setError('')
    setLoading(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="ใจดี หน้าแรก">
          <span className="brand-mark">จ</span>
          <span className="brand-copy"><strong>ใจดี</strong><small>THAI AI ASSISTANT</small></span>
        </a>
        <button className="new-chat" onClick={resetChat}><span className="plus">＋</span> เริ่มแชตใหม่</button>
        <div className="sidebar-note">
          <span className="note-icon">✳</span>
          <p>พื้นที่เล็ก ๆ สำหรับ<br />ทุกคำถามของคุณ</p>
        </div>
        <div className="sidebar-bottom">
          <div className="avatar">AI</div>
          <div><strong>ผู้ช่วยใจดี</strong><small>พร้อมช่วยคุณเสมอ</small></div>
          <span className="online-dot" aria-label="ออนไลน์" />
        </div>
      </aside>

      <main className="main-panel" id="top">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">จ</span><strong>ใจดี</strong></div>
          <div className="model-pill"><span className="online-dot" /> AI Assistant <span className="pill-chevron">⌄</span></div>
          <button className="mobile-new" onClick={resetChat} aria-label="เริ่มแชตใหม่">＋</button>
        </header>

        <section className={`conversation ${messages.length ? 'has-messages' : 'is-empty'}`} aria-live="polite">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-spark">✳</div>
              <p className="eyebrow">ยินดีที่ได้รู้จักนะ</p>
              <h1>วันนี้ให้ใจดี<br /><span>ช่วยอะไรดี?</span></h1>
              <p className="welcome-copy">ถามได้ทุกเรื่องเลยนะ จะเรื่องเรียน งาน หรือไอเดียใหม่ ๆ<br className="desktop-break" /> เราพร้อมช่วยคิดไปด้วยกัน</p>
              <div className="suggestions">
                {suggestions.map((item) => (
                  <button className="suggestion" key={item.title} onClick={() => void sendMessage(item.text)}>
                    <span className="suggestion-icon">{item.icon}</span>
                    <span className="suggestion-text"><strong>{item.title}</strong><small>{item.text}</small></span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message-row ${message.role}`} key={message.id}>
                  {message.role === 'assistant' && <div className="message-avatar">จ</div>}
                  <div className="message-content">
                    {message.role === 'assistant' && <span className="message-name">ใจดี</span>}
                    <div className="bubble">{message.content}</div>
                  </div>
                  {message.role === 'user' && <div className="user-avatar">คุณ</div>}
                </article>
              ))}
              {loading && <article className="message-row assistant"><div className="message-avatar">จ</div><div className="message-content"><span className="message-name">ใจดีกำลังคิด</span><div className="bubble typing"><i /><i /><i /></div></div></article>}
              <div ref={endRef} />
            </div>
          )}
        </section>

        <div className="composer-wrap">
          {error && <div className="error-banner" role="alert"><span>!</span>{error}<button onClick={() => setError('')} aria-label="ปิดข้อความผิดพลาด">×</button></div>}
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => handleDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์ข้อความที่นี่..."
              aria-label="พิมพ์ข้อความถึงใจดี"
              rows={1}
              maxLength={4000}
              disabled={loading}
            />
            <div className="composer-footer">
              <span className="composer-hint">กด <kbd>Enter</kbd> เพื่อส่ง <span>·</span> <kbd>Shift + Enter</kbd> เพื่อขึ้นบรรทัดใหม่</span>
              <button className="send-button" type="submit" disabled={!draft.trim() || loading} aria-label="ส่งข้อความ">
                <span>{loading ? '…' : '↑'}</span>
              </button>
            </div>
          </form>
          <p className="disclaimer">ใจดีอาจตอบผิดพลาดได้ โปรดตรวจสอบข้อมูลสำคัญอีกครั้ง</p>
        </div>
      </main>
    </div>
  )
}

export default App
