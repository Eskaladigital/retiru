'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, RefreshCw, Send, X } from 'lucide-react'
import { parseChatLocale, type ChatLocale } from '@/lib/chatbot/config'
import {
  errorFallback,
  placeholder,
  topicMenus,
  welcomeMessage,
  type MenuItem,
} from '@/lib/chatbot/menus'
import { isInternalRetiruUrl, renderChatMarkdown } from '@/lib/chatbot/markdown'
import styles from './ChatWidget.module.css'

const ASSISTANT_NAME = process.env.NEXT_PUBLIC_CHATBOT_ASSISTANT_NAME?.trim() || 'Roy'

type ChatMsg = { id: string; role: 'user' | 'assistant'; content: string }
type UserLocation = { lat: number; lng: number }

function genSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function genMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function storageKeys(locale: ChatLocale) {
  return {
    session: `retiru_roy_session_${locale}`,
    conv: `retiru_roy_conversation_${locale}`,
    messages: `retiru_roy_messages_${locale}`,
  }
}

export default function ChatWidget() {
  const pathname = usePathname() || '/es'
  const router = useRouter()
  const locale = parseChatLocale(pathname.startsWith('/en') ? 'en' : 'es')
  const hidden =
    pathname.startsWith('/administrator') ||
    pathname.includes('/panel') ||
    pathname.includes('/login') ||
    pathname.includes('/registro') ||
    pathname.includes('/register')

  const keys = storageKeys(locale)
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [menuLevel, setMenuLevel] = useState<MenuItem[] | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<UserLocation | null>(null)

  useEffect(() => {
    locationRef.current = userLocation
  }, [userLocation])

  const requestLocation = useCallback(() => {
    if (locationRef.current || locationDenied) return
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationDenied(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        if (Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5) {
          setLocationDenied(true)
          return
        }
        setUserLocation({ lat, lng })
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300_000 }
    )
  }, [locationDenied])

  useEffect(() => {
    if (hidden) return
    const sid = localStorage.getItem(keys.session) || genSessionId()
    localStorage.setItem(keys.session, sid)
    setSessionId(sid)
    setConversationId(localStorage.getItem(keys.conv))
    // Molde Andrea: el hilo se restaura; el panel no. Al entrar a la página siempre se ve el icono.
    setOpen(false)
    try {
      const saved = localStorage.getItem(keys.messages)
      if (saved) setMessages(JSON.parse(saved))
      else setMessages([{ id: 'welcome', role: 'assistant', content: welcomeMessage(locale) }])
    } catch {
      setMessages([{ id: 'welcome', role: 'assistant', content: welcomeMessage(locale) }])
    }
  }, [hidden, keys.conv, keys.messages, keys.session, locale])

  useEffect(() => {
    if (!hidden && messages.length) {
      localStorage.setItem(keys.messages, JSON.stringify(messages))
    }
  }, [messages, hidden, keys.messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const persistOpen = (v: boolean) => {
    setOpen(v)
    // Molde casi cinco: pide GPS al abrir. En el clic (no useEffect) para que Safari/Chrome no lo maten.
    if (v) requestLocation()
  }

  const refreshConversation = () => {
    setConversationId(null)
    localStorage.removeItem(keys.conv)
    setMessages([{ id: genMsgId(), role: 'assistant', content: welcomeMessage(locale) }])
    setMenuLevel(null)
    setInput('')
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming || !sessionId) return

      const userMsg: ChatMsg = { id: genMsgId(), role: 'user', content: trimmed }
      const assistantId = genMsgId()
      setMessages((m) => [...m, userMsg, { id: assistantId, role: 'assistant', content: '' }])
      setInput('')
      setMenuLevel(null)
      setStreaming(true)

      try {
        const res = await fetch('/api/chatbot/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            conversationId: conversationId ?? undefined,
            text: trimmed,
            locale,
            location: locationRef.current ?? undefined,
          }),
        })

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Error de conexión')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let full = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            let evt: { type?: string; content?: string; conversationId?: string; error?: string }
            try {
              evt = JSON.parse(line.slice(6))
            } catch {
              continue
            }
            if (evt.type === 'token' && evt.content) {
              full += evt.content
              setMessages((m) =>
                m.map((msg) => (msg.id === assistantId ? { ...msg, content: full } : msg))
              )
            } else if (evt.type === 'done') {
              if (evt.conversationId) {
                setConversationId(evt.conversationId)
                localStorage.setItem(keys.conv, evt.conversationId)
              }
            } else if (evt.type === 'error') {
              throw new Error(evt.error)
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error'
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId
              ? { ...x, content: `${errorFallback(locale)} (${msg})` }
              : x
          )
        )
      } finally {
        setStreaming(false)
      }
    },
    [conversationId, keys.conv, locale, sessionId, streaming]
  )

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('a')
    if (!target) return
    const href = target.getAttribute('href')
    if (!href) return
    if (isInternalRetiruUrl(href)) {
      e.preventDefault()
      const path = href.startsWith('http') ? new URL(href).pathname : href
      // En móvil el panel cubre toda la pantalla: si no se cierra, parece que el enlace no ha hecho nada.
      if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 640px)').matches) {
        persistOpen(false)
      }
      router.push(path)
    }
  }

  if (hidden) return null

  const menus = topicMenus(locale)

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => persistOpen(true)}
          className={`${styles.fab} mobile-float-above-cta`}
          aria-label={locale === 'en' ? 'Open Roy chat' : 'Abrir chat de Roy'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/roy-avatar.png" alt="" className={styles.fabAvatar} width={28} height={28} />
          <span className={styles.fabLabel}>{locale === 'en' ? 'Chat with Roy' : 'Habla con Roy'}</span>
        </button>
      )}

      {open && (
        <div className={`${styles.panel} mobile-panel-above-cta`}>
          <div className={styles.header}>
            <div className={styles.headerIdentity}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/roy-avatar.png"
                alt={locale === 'en' ? 'Roy, Retiru guide' : 'Roy, guía de Retiru'}
                className={styles.avatar}
                width={44}
                height={44}
              />
              <div>
                <p className={styles.headerTitle}>{ASSISTANT_NAME} · Retiru</p>
                <p className={styles.headerSub}>
                  {locale === 'en' ? 'Centers, retreats and blog tips' : 'Centros, retiros y consejos del blog'}
                </p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button type="button" onClick={refreshConversation} className={styles.iconBtn} title={locale === 'en' ? 'New chat' : 'Nueva conversación'}>
                <RefreshCw className={styles.icon} />
              </button>
              <button type="button" onClick={() => persistOpen(false)} className={styles.iconBtn} aria-label={locale === 'en' ? 'Close' : 'Cerrar'}>
                <X className={styles.iconLg} />
              </button>
            </div>
          </div>

          <div className={`${styles.messages} chat-markdown`} onClick={handleLinkClick}>
            {userLocation && (
              <div className={styles.geoBanner} role="status">
                {locale === 'en'
                  ? 'Location shared — you can ask for places “near me”.'
                  : 'Ubicación compartida — puedes preguntar por sitios «cerca de mí».'}
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'user' ? styles.rowUser : styles.rowBot}
              >
                <div className={msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot}>
                  {msg.role === 'assistant' ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderChatMarkdown(msg.content || (streaming ? '…' : '')),
                      }}
                    />
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {!streaming && (
            <div className={styles.menus}>
              {menuLevel ? (
                <div>
                  <button
                    type="button"
                    className={styles.back}
                    onClick={() => setMenuLevel(null)}
                  >
                    <ChevronLeft className={styles.iconSm} /> {locale === 'en' ? 'Back' : 'Volver'}
                  </button>
                  <div className={styles.chips}>
                    {menuLevel.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={styles.chipActive}
                        onClick={() => {
                          if (item.message) sendMessage(item.message)
                          else if (item.children) setMenuLevel(item.children)
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.chips}>
                  {userLocation && (
                    <button
                      type="button"
                      className={styles.chip}
                      onClick={() =>
                        sendMessage(
                          locale === 'en'
                            ? 'Centers near me — yoga, meditation or ayurveda.'
                            : 'Centros cerca de mí: yoga, meditación o ayurveda.'
                        )
                      }
                    >
                      {locale === 'en' ? 'Near me' : 'Cerca de mí'}
                    </button>
                  )}
                  {menus.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={styles.chip}
                      onClick={() => {
                        if (t.message) sendMessage(t.message)
                        else if (t.children) setMenuLevel(t.children)
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.composer}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder={placeholder(locale)}
              rows={1}
              className={styles.input}
              disabled={streaming}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={streaming || !input.trim()}
              className={styles.send}
              aria-label={locale === 'en' ? 'Send' : 'Enviar'}
            >
              <Send className={styles.iconLg} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
