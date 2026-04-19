'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, LifeBuoy } from 'lucide-react';
import { getOrganizerFirstName } from '@/lib/utils';

interface ConversationItem {
  id: string;
  retreat_id: string;
  is_support?: boolean;
  my_role: 'user' | 'organizer';
  unread_count: number;
  last_message_at: string | null;
  retreat?: { id: string; title_es: string; slug: string } | null;
  other_participant?: { id: string; full_name?: string; business_name?: string; avatar_url?: string; logo_url?: string } | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function MensajesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingSupport, setOpeningSupport] = useState(false);

  useEffect(() => {
    fetch('/api/messages/conversations')
      .then(r => r.json())
      .then(data => setConversations(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openSupport = async () => {
    setOpeningSupport(true);
    try {
      const res = await fetch('/api/messages/support', { method: 'POST' });
      const data = await res.json();
      if (data.conversation_id) router.push(`/es/mensajes/${data.conversation_id}`);
    } finally {
      setOpeningSupport(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground mb-2">Mensajes</h1>
          <p className="text-sm text-[#7a6b5d]">Conversaciones sobre retiros</p>
        </div>
        <button
          onClick={openSupport}
          disabled={openingSupport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-700 text-sm font-medium hover:bg-sage-100 transition-colors disabled:opacity-50 shrink-0"
        >
          <LifeBuoy size={16} />
          {openingSupport ? 'Abriendo...' : 'Contactar soporte'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-sand-100 animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle size={48} className="mx-auto mb-4 text-sand-300" />
          <h3 className="font-serif text-xl mb-2">Sin mensajes</h3>
          <p className="text-sm text-[#7a6b5d] max-w-sm mx-auto">
            Tus conversaciones con organizadores aparecerán aquí. Explora retiros y contacta con los organizadores.
          </p>
          <Link href="/es/retiros-retiru" className="btn-primary mt-6 inline-block text-sm">
            Explorar retiros
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => {
            const name = c.my_role === 'user'
              ? getOrganizerFirstName((c.other_participant as any)?.business_name) || 'Organizador'
              : (c.other_participant as any)?.full_name ?? 'Usuario';
            const initial = name[0]?.toUpperCase() ?? '?';
            const avatar = c.my_role === 'user'
              ? (c.other_participant as any)?.logo_url
              : (c.other_participant as any)?.avatar_url;

            return (
              <Link
                key={c.id}
                href={`/es/mensajes/${c.id}`}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-soft ${
                  c.unread_count > 0
                    ? 'bg-terracotta-50/50 border-terracotta-200'
                    : 'bg-white border-sand-200'
                }`}
              >
                {avatar ? (
                  <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center text-lg font-bold text-sage-700 shrink-0">
                    {initial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm ${c.unread_count > 0 ? 'font-bold' : 'font-semibold'}`}>{name}</h3>
                    {c.last_message_at && (
                      <span className="text-xs text-[#a09383]">{timeAgo(c.last_message_at)}</span>
                    )}
                  </div>
                  <p className="text-xs text-terracotta-600 truncate">{c.is_support ? 'Soporte Retiru' : (c.retreat?.title_es ?? 'Retiro')}</p>
                </div>
                {c.unread_count > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 bg-terracotta-500 text-white text-[10px] font-bold rounded-full shrink-0">
                    {c.unread_count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
