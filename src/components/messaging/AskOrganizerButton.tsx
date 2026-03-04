'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  retreatId: string;
  locale: 'es' | 'en';
  compact?: boolean;
}

export default function AskOrganizerButton({ retreatId, locale, compact }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = locale === 'es' ? 'Preguntar al organizador' : 'Ask the organizer';
  const compactLabel = locale === 'es' ? 'Organizador' : 'Organizer';
  const loginPath = locale === 'es' ? '/es/registro' : '/en/register';
  const messagesPath = locale === 'es' ? '/es/mensajes' : '/en/messages';

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push(`${loginPath}?redirect=${encodeURIComponent(`/${locale === 'es' ? 'es/retiro' : 'en/retreat'}/${retreatId}`)}`);
        return;
      }

      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreat_id: retreatId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        const msg = err.error || 'Error al crear la conversación';
        console.error('Error creating conversation:', msg);
        setError(locale === 'es' ? msg : 'Could not start conversation');
        return;
      }

      const data = await res.json();
      if (!data.conversation_id) {
        setError(locale === 'es' ? 'No se pudo obtener la conversación' : 'Could not get conversation');
        return;
      }
      router.push(`${messagesPath}/${data.conversation_id}`);
    } catch (e) {
      console.error('AskOrganizerButton error:', e);
      setError(locale === 'es' ? 'Error de conexión. Inténtalo de nuevo.' : 'Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={compact
          ? 'btn-outline px-4 py-3 text-sm flex items-center justify-center gap-1.5 whitespace-nowrap'
          : 'btn-outline w-full py-3 text-sm flex items-center justify-center gap-2'}
        title={label}
      >
        <MessageCircle size={16} />
        {compact
          ? (loading ? '...' : compactLabel)
          : (loading ? (locale === 'es' ? 'Abriendo...' : 'Opening...') : label)}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
