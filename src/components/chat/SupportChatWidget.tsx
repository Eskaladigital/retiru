'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, LifeBuoy } from 'lucide-react';

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
    empty: '¿Necesitas ayuda? Escríbenos y te responderemos lo antes posible.',
    loginRequired: 'Inicia sesión para contactar con soporte.',
    login: 'Iniciar sesión',
  },
  en: {
    title: 'Retiru Support',
    subtitle: 'Andrea · Customer service',
    placeholder: 'Write your message...',
    empty: 'Need help? Write to us and we\'ll reply as soon as possible.',
    loginRequired: 'Log in to contact support.',
    login: 'Log in',
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

  const handleSend = async () => {
    if (!msg.trim() || sending || !convId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg.trim() }),
      });
      if (res.ok) {
        setMsg('');
        await fetchMessages(convId);
      }
    } finally { setSending(false); }
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
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-terracotta-500 text-white shadow-lg hover:bg-terracotta-600 transition-all hover:scale-105 flex items-center justify-center"
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
        <div className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-sand-200 flex flex-col overflow-hidden" style={{ height: 'min(480px, calc(100vh - 140px))' }}>
          {/* Header */}
          <div className="px-4 py-3 bg-terracotta-500 text-white shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <LifeBuoy size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{i.title}</h3>
                <p className="text-[11px] text-white/70">{i.subtitle}</p>
              </div>
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
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <LifeBuoy size={32} className="text-sand-300 mb-3" />
                <p className="text-xs text-[#a09383]">{i.empty}</p>
              </div>
            ) : (
              messages.filter(m => m.message_type !== 'system').map(m => {
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
              })
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
