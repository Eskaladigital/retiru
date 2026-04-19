'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, AlertTriangle, ShieldCheck, LifeBuoy } from 'lucide-react';
import { getOrganizerFirstName } from '@/lib/utils';

interface MessageItem {
  id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'template';
  is_read: boolean;
  created_at: string;
  profiles?: { id: string; full_name: string; avatar_url?: string };
}

interface ConversationData {
  id: string;
  is_support?: boolean;
  retreat?: { id: string; title_es: string; slug: string } | null;
  user_profile?: { id: string; full_name: string; avatar_url?: string } | null;
  organizer?: { id: string; business_name: string; logo_url?: string; user_id: string } | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ConversacionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [myRole, setMyRole] = useState<'user' | 'organizer' | 'admin'>('user');
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = () => {
    fetch(`/api/messages/conversations/${id}`)
      .then(r => r.json())
      .then(data => {
        setConversation(data.conversation || null);
        setMessages(data.messages || []);
        setMyRole(data.my_role || 'user');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMsg('');
        inputRef.current?.focus();
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="h-16 bg-sand-100 animate-pulse rounded-xl mb-4" />
        <div className="flex-1 space-y-4 p-4">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-sand-100 animate-pulse rounded-xl w-2/3" />)}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Conversación no encontrada</p>
        <Link href="/es/mensajes" className="btn-outline mt-4 inline-block text-sm">Volver a mensajes</Link>
      </div>
    );
  }

  const isSupport = !!conversation.is_support;
  const otherName = isSupport
    ? 'Andrea - Soporte Retiru'
    : myRole === 'user'
      ? getOrganizerFirstName(conversation.organizer?.business_name) || 'Organizador'
      : conversation.user_profile?.full_name ?? 'Usuario';

  // Group messages by date
  const grouped: { date: string; msgs: MessageItem[] }[] = [];
  messages.forEach(m => {
    const dateStr = new Date(m.created_at).toDateString();
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateStr) {
      last.msgs.push(m);
    } else {
      grouped.push({ date: dateStr, msgs: [m] });
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] pt-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-sand-200 mb-4 shrink-0">
        <button onClick={() => router.push('/es/mensajes')} className="p-2 hover:bg-sand-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        {isSupport && (
          <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center shrink-0">
            <LifeBuoy size={20} className="text-sage-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{otherName}</h2>
          {isSupport ? (
            <p className="text-xs text-sage-600">Soporte Retiru</p>
          ) : conversation.retreat ? (
            <Link href={`/es/retiro/${conversation.retreat.slug}`} className="text-xs text-terracotta-600 hover:underline truncate block">
              {conversation.retreat.title_es}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Banner de soporte */}
      {isSupport && (
        <div className="shrink-0 mb-3 rounded-xl bg-sage-50 border border-sage-200 px-4 py-3 flex gap-2 items-start">
          <LifeBuoy size={16} className="text-sage-500 shrink-0 mt-0.5" />
          <div className="text-xs text-sage-700 leading-relaxed space-y-1">
            <p>Estás hablando con el equipo de Retiru. Responderemos lo antes posible.</p>
            <p>
              Este chat es solo para hablar con el soporte de Retiru. Si quieres contactar con el organizador de un retiro,
              hazlo desde el botón <strong>«Preguntar al organizador»</strong> en la ficha del evento.
            </p>
          </div>
        </div>
      )}

      {/* Info banner — solo para usuario en conversaciones normales */}
      {!isSupport && myRole === 'user' && (
        <div className="shrink-0 mb-3 rounded-xl bg-sage-50 border border-sage-200 px-4 py-3 flex gap-2 items-start">
          <ShieldCheck size={16} className="text-sage-500 shrink-0 mt-0.5" />
          <p className="text-xs text-sage-700 leading-relaxed">
            Bienvenido a la conversación. Por motivos de seguridad y privacidad, no compartas información personal sensible como teléfono o email.
          </p>
        </div>
      )}

      {/* Warning banner — solo para organizador en conversaciones normales */}
      {!isSupport && myRole === 'organizer' && (
        <div className="shrink-0 mb-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2 items-start">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Importante:</strong> Toda comunicación debe realizarse a través de este chat.
            Compartir datos de contacto, teléfono, email o redes sociales, o intentar contactar por canales externos a Retiru,
            puede conllevar la suspensión de la cuenta. <Link href="/es/condiciones" className="underline font-medium">Más info</Link>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 min-h-0">
        {grouped.map((group, gi) => (
          <div key={gi}>
            <div className="flex items-center justify-center my-4">
              <span className="text-[11px] text-[#a09383] bg-sand-100 px-3 py-1 rounded-full">{formatDateGroup(group.msgs[0].created_at)}</span>
            </div>
            <div className="space-y-2">
              {group.msgs.map(m => {
                if (m.message_type === 'system') {
                  if (!isSupport && myRole !== 'organizer') return null;
                  return (
                    <div key={m.id} className="flex justify-center my-3">
                      <div className={`rounded-xl px-4 py-2.5 max-w-md text-center ${
                        isSupport
                          ? 'bg-sage-50 border border-sage-200'
                          : 'bg-amber-50 border border-amber-200'
                      }`}>
                        {isSupport
                          ? <LifeBuoy size={14} className="inline mr-1.5 text-sage-500" />
                          : <AlertTriangle size={14} className="inline mr-1.5 text-amber-500" />
                        }
                        <span className={`text-xs ${isSupport ? 'text-sage-700' : 'text-amber-700'}`}>{m.content}</span>
                      </div>
                    </div>
                  );
                }

                const senderIsCurrentUser = isSupport
                  ? m.sender_id === conversation.user_profile?.id
                  : (myRole === 'user' && m.sender_id === conversation.user_profile?.id) ||
                    (myRole === 'organizer' && m.sender_id === conversation.organizer?.user_id);

                return (
                  <div key={m.id} className={`flex ${senderIsCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      senderIsCurrentUser
                        ? 'bg-terracotta-500 text-white rounded-br-md'
                        : 'bg-white border border-sand-200 text-foreground rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${senderIsCurrentUser ? 'text-white/60' : 'text-[#a09383]'}`}>
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      {myRole !== 'admin' && (
        <div className="shrink-0 pt-4 border-t border-sand-200 mt-4">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-sand-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 bg-white"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              className="p-3 rounded-xl bg-terracotta-500 text-white hover:bg-terracotta-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
