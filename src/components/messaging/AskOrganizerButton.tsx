'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  retreatId: string;
  locale: 'es' | 'en';
}

export default function AskOrganizerButton({ retreatId, locale }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const label = locale === 'es' ? 'Preguntar al organizador' : 'Ask the organizer';
  const loginPath = locale === 'es' ? '/es/registro' : '/en/register';
  const messagesPath = locale === 'es' ? '/es/mensajes' : '/es/mensajes';

  const handleClick = async () => {
    setLoading(true);
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
        const err = await res.json();
        console.error('Error creating conversation:', err);
        return;
      }

      const data = await res.json();
      router.push(`${messagesPath}/${data.conversation_id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-outline w-full py-3 text-sm flex items-center justify-center gap-2"
    >
      <MessageCircle size={16} />
      {loading ? (locale === 'es' ? 'Abriendo...' : 'Opening...') : label}
    </button>
  );
}
