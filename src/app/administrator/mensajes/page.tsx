'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Search, Eye, AlertTriangle, Send, LifeBuoy, X, Trash2 } from 'lucide-react';
import { EmailLink } from '@/components/ui/email-link';

interface AdminConversation {
  id: string;
  retreat_id: string;
  user_id: string;
  organizer_id: string;
  is_support?: boolean;
  last_message_at: string | null;
  total_unread: number;
  created_at: string;
  retreat?: { id: string; title_es: string; slug: string } | null;
  user_profile?: { id: string; full_name: string; email: string } | null;
  organizer?: { id: string; business_name: string } | null;
  last_message?: { content: string; created_at: string; message_type: string } | null;
}

interface ConvMessages {
  conversation: any;
  messages: any[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function AdminMensajesPage() {
  const searchParams = useSearchParams();
  const openConvId = searchParams.get('open');

  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [convDetail, setConvDetail] = useState<ConvMessages | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConversations = () =>
    fetch('/api/admin/messages')
      .then(r => r.json())
      .then(data => setConversations(data.conversations || []))
      .catch(() => {});

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!openConvId || loading) return;
    openConversation(openConvId);
    window.history.replaceState({}, '', '/administrator/mensajes');
  }, [openConvId, loading]);

  const openConversation = async (convId: string) => {
    setSelectedConv(convId);
    setLoadingDetail(true);
    setReplyMsg('');
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`);
      const data = await res.json();
      setConvDetail(data);
      fetchConversations();
    } catch {
      setConvDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAdminReply = async () => {
    if (!replyMsg.trim() || sending || !selectedConv) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedConv}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyMsg.trim() }),
      });
      if (res.ok) {
        setReplyMsg('');
        openConversation(selectedConv);
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('¿Borrar este mensaje?')) return;
    setDeletingId(messageId);
    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, { method: 'DELETE' });
      if (res.ok && selectedConv) {
        openConversation(selectedConv);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.retreat?.title_es?.toLowerCase().includes(q) ||
      c.user_profile?.full_name?.toLowerCase().includes(q) ||
      c.user_profile?.email?.toLowerCase().includes(q) ||
      c.organizer?.business_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Mensajes</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">Moderación de conversaciones entre usuarios y organizadores</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="px-3 py-1 bg-sage-100 text-sage-700 rounded-full font-medium">
            {conversations.length} conversaciones
          </span>
          <span className="px-3 py-1 bg-terracotta-100 text-terracotta-700 rounded-full font-medium">
            {conversations.filter(c => c.total_unread > 0).length} con no leídos
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09383]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por retiro, usuario u organizador..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300"
        />
      </div>

      {/* Conversation list — always full width */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-sand-100 animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle size={48} className="mx-auto mb-4 text-sand-300" />
          <p className="text-muted-foreground">No hay conversaciones{search ? ' que coincidan' : ''}</p>
        </div>
      ) : (
        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`bg-white border border-sand-200 rounded-2xl p-4 space-y-2 cursor-pointer transition-colors ${selectedConv === c.id ? 'bg-terracotta-50 border-terracotta-200' : 'hover:bg-sand-50'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{c.user_profile?.full_name ?? '—'}</p>
                  <p className="text-xs text-[#7a6b5d] truncate">
                    {c.is_support
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage-700"><LifeBuoy size={12} /> Soporte</span>
                      : (c.organizer?.business_name ?? '—')
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.total_unread > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-terracotta-500 text-white text-[11px] font-bold rounded-full">{c.total_unread}</span>
                  )}
                  <Eye size={16} className="text-[#7a6b5d]" />
                </div>
              </div>
              <p className="text-xs text-terracotta-600 truncate">{c.is_support ? 'Soporte' : (c.retreat?.title_es ?? '—')}</p>
              {c.last_message && (
                <div className="flex items-center justify-between gap-2 text-xs text-[#a09383]">
                  <p className="truncate">{c.last_message.content}</p>
                  <span className="shrink-0 text-[10px]">{timeAgo(c.last_message.created_at)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block border border-sand-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sand-50 border-b border-sand-200">
                <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Organizador</th>
                <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Retiro</th>
                <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Último msg</th>
                <th className="text-center px-4 py-3 font-semibold text-[#7a6b5d]">No leídos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className={`border-b border-sand-100 hover:bg-sand-50 cursor-pointer transition-colors ${selectedConv === c.id ? 'bg-terracotta-50' : ''}`} onClick={() => openConversation(c.id)}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.user_profile?.full_name ?? '—'}</div>
                    {c.user_profile?.email && <EmailLink email={c.user_profile.email} className="text-xs text-[#a09383] hover:text-terracotta-600 hover:underline break-all" />}
                  </td>
                  <td className="px-4 py-3">{c.is_support ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage-700 bg-sage-100 px-2 py-0.5 rounded-full"><LifeBuoy size={12} /> Soporte</span> : (c.organizer?.business_name ?? '—')}</td>
                  <td className="px-4 py-3"><span className="text-xs text-terracotta-600">{c.is_support ? 'Soporte' : (c.retreat?.title_es ?? '—')}</span></td>
                  <td className="px-4 py-3">{c.last_message ? <div><p className="truncate max-w-[200px] text-xs">{c.last_message.content}</p><span className="text-[10px] text-[#a09383]">{timeAgo(c.last_message.created_at)}</span></div> : <span className="text-xs text-[#a09383]">—</span>}</td>
                  <td className="px-4 py-3 text-center">{c.total_unread > 0 ? <span className="inline-flex items-center justify-center w-6 h-6 bg-terracotta-500 text-white text-[11px] font-bold rounded-full">{c.total_unread}</span> : <span className="text-xs text-[#a09383]">0</span>}</td>
                  <td className="px-4 py-3"><button className="p-1.5 hover:bg-sand-100 rounded-lg transition-colors" title="Ver conversación"><Eye size={16} className="text-[#7a6b5d]" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chat overlay — modal flotante */}
      {selectedConv && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => { setSelectedConv(null); setConvDetail(null); }} />
          <div className="fixed inset-4 md:inset-auto md:bottom-6 md:right-6 z-50 md:w-[420px] bg-white rounded-2xl shadow-2xl border border-sand-200 flex flex-col md:max-h-[calc(100vh-100px)]" style={{ height: 'min(560px, calc(100vh - 100px))' }}>
            <div className="px-5 py-4 border-b border-sand-200 flex items-center justify-between shrink-0 rounded-t-2xl bg-sand-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">
                    {convDetail?.conversation?.is_support ? 'Soporte' : (convDetail?.conversation?.retreat?.title_es ?? 'Conversación')}
                  </h3>
                  {convDetail?.conversation?.is_support && (
                    <span className="text-[10px] font-bold bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Soporte</span>
                  )}
                </div>
                <p className="text-xs text-[#a09383]">
                  {convDetail?.conversation?.is_support
                    ? convDetail?.conversation?.user_profile?.full_name ?? 'Usuario'
                    : `${convDetail?.conversation?.user_profile?.full_name ?? ''} ↔ ${convDetail?.conversation?.organizer?.business_name ?? ''}`
                  }
                </p>
              </div>
              <button
                onClick={() => { setSelectedConv(null); setConvDetail(null); }}
                className="p-1.5 hover:bg-sand-200 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X size={18} className="text-[#7a6b5d]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
              {loadingDetail ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 bg-sand-100 animate-pulse rounded-xl w-2/3" />)}
                </div>
              ) : (convDetail?.messages || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageCircle size={32} className="text-sand-300 mb-3" />
                  <p className="text-xs text-[#a09383]">No hay mensajes todavía.<br />Escribe el primer mensaje.</p>
                </div>
              ) : (
                (convDetail?.messages || []).map((m: any) => {
                  const isDeleting = deletingId === m.id;
                  const deleteBtn = (
                    <button
                      key={`del-${m.id}`}
                      onClick={(e) => { e.stopPropagation(); handleDeleteMessage(m.id); }}
                      disabled={isDeleting}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Borrar mensaje"
                    >
                      <Trash2 size={14} />
                    </button>
                  );
                  if (m.message_type === 'system') {
                    return (
                      <div key={m.id} className="flex justify-center items-center gap-1 my-2 group">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-center">
                          <AlertTriangle size={12} className="inline mr-1 text-amber-500" />
                          <span className="text-[11px] text-amber-700">{m.content}</span>
                        </div>
                        <span className="opacity-60 hover:opacity-100 transition-opacity">{deleteBtn}</span>
                      </div>
                    );
                  }

                  const isSupportConv = convDetail?.conversation?.is_support;
                  const isFromUser = m.sender_id === convDetail?.conversation?.user_profile?.id;
                  const senderLabel = isSupportConv
                    ? (isFromUser ? (convDetail?.conversation?.user_profile?.full_name ?? 'Usuario') : 'Andrea - Soporte')
                    : (isFromUser ? (convDetail?.conversation?.user_profile?.full_name ?? 'Usuario') : (convDetail?.conversation?.organizer?.business_name ?? 'Organizador'));
                  return (
                    <div key={m.id} className={`flex ${isFromUser ? 'justify-start' : 'justify-end'} items-end gap-1 group`}>
                      {isFromUser && <span className="opacity-60 hover:opacity-100 transition-opacity shrink-0">{deleteBtn}</span>}
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                        isFromUser ? 'bg-sand-100 text-foreground rounded-bl-md' : 'bg-terracotta-500 text-white rounded-br-md'
                      }`}>
                        <p className={`text-[11px] font-semibold mb-0.5 ${isFromUser ? 'text-[#a09383]' : 'text-white/70'}`}>
                          {senderLabel}
                        </p>
                        <p className="text-xs whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-[9px] mt-0.5 ${isFromUser ? 'text-[#a09383]' : 'text-white/50'}`}>
                          {new Date(m.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!isFromUser && <span className="opacity-60 hover:opacity-100 transition-opacity shrink-0">{deleteBtn}</span>}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-3 border-t border-sand-200 shrink-0 rounded-b-2xl">
              {convDetail?.conversation?.is_support ? (
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyMsg}
                    onChange={e => setReplyMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdminReply(); } }}
                    placeholder="Responder como Andrea..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-sand-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 bg-white"
                    style={{ maxHeight: '80px' }}
                  />
                  <button
                    onClick={handleAdminReply}
                    disabled={!replyMsg.trim() || sending}
                    className="p-2.5 rounded-xl bg-terracotta-500 text-white hover:bg-terracotta-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-[#a09383] text-center">Vista de solo lectura — Modo administrador</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
