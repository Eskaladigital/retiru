'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, LifeBuoy, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface Props {
  locale: 'es' | 'en';
}

const t = {
  es: {
    title: 'Soporte Retiru',
    subtitle: 'Andrea · Atención al cliente',
    placeholder: 'Escribe tu mensaje...',
    greeting: 'Hola, soy Andrea, responsable de atención al cliente de Retiru. ¿En qué puedo ayudarte?',
    scopeNotice: 'Este chat es solo para hablar con el soporte de Retiru. Si quieres contactar con el organizador de un retiro, usa el botón «Preguntar al organizador» en la ficha del evento.',
    empty: 'Elige una opción o escríbenos directamente:',
    loginRequired: 'Inicia sesión para contactar con soporte.',
    login: 'Iniciar sesión',
    clearTitle: 'Cerrar esta conversación',
    clearConfirm: '¿Cerrar esta conversación? Dejarás de verla aquí, pero podrás volver a escribirnos cuando quieras. El equipo de Retiru conservará el historial.',
    quickReplies: [
      'Tengo una duda sobre una reserva',
      'Necesito ayuda con un retiro',
      'Problema con un pago o reembolso',
    ],
  },
  en: {
    title: 'Retiru Support',
    subtitle: 'Andrea · Customer service',
    placeholder: 'Write your message...',
    greeting: "Hi, I'm Andrea from Retiru's customer support team. How can I help you?",
    scopeNotice: "This chat is only for talking to Retiru support. To contact a retreat organizer, use the “Ask the organizer” button on the retreat page.",
    empty: 'Pick an option or write to us directly:',
    loginRequired: 'Log in to contact support.',
    login: 'Log in',
    clearTitle: 'Close this conversation',
    clearConfirm: "Close this conversation? You won't see it here anymore, but you can write to us again whenever you want. The Retiru team will keep the history.",
    quickReplies: [
      'I have a question about a booking',
      'I need help with a retreat',
      'Issue with a payment or refund',
    ],
  },
};

export default function SupportChatWidget({ locale }: Props) {
  const i = t[locale];
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const visibleMessages = messages.filter(m => m.message_type !== 'system');
  const isEmpty = visibleMessages.length === 0;

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  const fetchMessages = async (cId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${cId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      setMyId(data.conversation?.user_profile?.id ?? null);
      scrollToBottom();
    } catch { /* ignore */ }
  };

  const initConversation = async () => {
    if (initialized.current) return;
    initialized.current = true;
    setLoading(true);
    try {
      const res = await fetch('/api/messages/support', { method: 'POST' });
      if (res.status === 401) {
        setNotLoggedIn(true);
        return;
      }
      const data = await res.json();
      if (data.conversation_id) {
        setConvId(data.conversation_id);
        await fetchMessages(data.conversation_id);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (open && !convId && !notLoggedIn) {
      initConversation();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !convId) return;
    const interval = setInterval(() => fetchMessages(convId), 8000);
    return () => clearInterval(interval);
  }, [open, convId]);

  const sendContent = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending || !convId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        setMsg('');
        await fetchMessages(convId);
      }
    } finally { setSending(false); }
  };

  const handleSend = () => sendContent(msg);

  const handleQuickReply = (text: string) => {
    if (sending) return;
    sendContent(text);
  };

  const handleClear = async () => {
    if (!convId || sending) return;
    if (typeof window !== 'undefined' && !window.confirm(i.clearConfirm)) return;
    try {
      const res = await fetch('/api/messages/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      if (res.ok) {
        setMessages([]);
      }
    } catch { /* ignore */ }
  };

  const handleToggle = () => {
    setOpen(!open);
    if (!open) setUnread(0);
  };

  return (
    <>
      {/* Burbuja */}
      <button
        onClick={handleToggle}
        className="mobile-float-above-cta fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-terracotta-500 text-white shadow-lg hover:bg-terracotta-600 transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Soporte"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Panel de chat */}
      {open && (
        <div className="mobile-panel-above-cta fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-sand-200 flex flex-col overflow-hidden" style={{ height: 'min(480px, calc(100vh - 140px))' }}>
          {/* Header */}
          <div className="px-4 py-3 bg-terracotta-500 text-white shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <LifeBuoy size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{i.title}</h3>
                <p className="text-[11px] text-white/70">{i.subtitle}</p>
              </div>
              {!notLoggedIn && !isEmpty && (
                <button
                  onClick={handleClear}
                  title={i.clearTitle}
                  aria-label={i.clearTitle}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors shrink-0"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 bg-sand-50/50">
            {notLoggedIn ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <LifeBuoy size={32} className="text-sand-300 mb-3" />
                <p className="text-xs text-[#a09383] mb-4">{i.loginRequired}</p>
                <a
                  href={`/${locale === 'en' ? 'en' : 'es'}/login`}
                  className="px-4 py-2 bg-terracotta-500 text-white text-sm font-medium rounded-xl hover:bg-terracotta-600 transition-colors"
                >
                  {i.login}
                </a>
              </div>
            ) : loading ? (
              <div className="space-y-3 py-4">
                {[1, 2].map(x => <div key={x} className="h-10 bg-sand-100 animate-pulse rounded-xl w-2/3" />)}
              </div>
            ) : (
              <>
                {/* Saludo de Andrea (siempre visible cuando hay conversación inicializada) */}
                {convId && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white border border-sand-200 text-foreground">
                      <p className="text-sm whitespace-pre-wrap break-words">{i.greeting}</p>
                    </div>
                  </div>
                )}

                {/* Mensajes */}
                {visibleMessages.map(m => {
                  const isMe = m.sender_id === myId;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                        isMe
                          ? 'bg-terracotta-500 text-white rounded-br-md'
                          : 'bg-white border border-sand-200 text-foreground rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`text-[9px] mt-1 ${isMe ? 'text-white/50' : 'text-[#a09383]'}`}>
                          {new Date(m.created_at).toLocaleTimeString(locale === 'en' ? 'en-GB' : 'es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Aviso de alcance + quick replies: solo mientras el usuario no ha escrito nada todavía */}
                {convId && isEmpty && (
                  <div className="pt-2 space-y-3">
                    <div className="rounded-xl bg-sand-100/70 border border-sand-200 px-3 py-2">
                      <p className="text-[11px] leading-snug text-[#6b5f50]">{i.scopeNotice}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] text-[#a09383] px-1">{i.empty}</p>
                      <div className="flex flex-wrap gap-2">
                        {i.quickReplies.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickReply(q)}
                            disabled={sending}
                            className="text-xs px-3 py-1.5 rounded-full border border-terracotta-200 text-terracotta-600 bg-white hover:bg-terracotta-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          {!notLoggedIn && (
            <div className="px-3 py-3 border-t border-sand-200 shrink-0 bg-white">
              <div className="flex gap-2 items-end">
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={i.placeholder}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-sand-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 bg-white"
                  style={{ maxHeight: '80px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!msg.trim() || sending}
                  className="p-2.5 rounded-xl bg-terracotta-500 text-white hover:bg-terracotta-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
