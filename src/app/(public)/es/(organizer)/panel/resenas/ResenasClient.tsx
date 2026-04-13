'use client';

import { useState } from 'react';

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  response?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  attendeeName: string;
  attendeeAvatar?: string | null;
  retreatTitle: string;
  retreatSlug?: string;
}

export function ResenasClient({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleRespond(reviewId: string) {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizer/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText.trim() }),
      });
      if (res.ok) {
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId
              ? { ...r, response: responseText.trim(), respondedAt: new Date().toISOString() }
              : r
          )
        );
        setRespondingTo(null);
        setResponseText('');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al responder');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const dateStr = new Date(r.createdAt).toLocaleDateString('es', { month: 'short', year: 'numeric' });
        const isResponding = respondingTo === r.id;

        return (
          <div key={r.id} className="bg-white border border-sand-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700">
                  {r.attendeeName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{r.attendeeName}</p>
                  <p className="text-xs text-[#a09383]">
                    {r.retreatTitle} · {dateStr}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
            </div>

            {r.title && <p className="font-semibold text-sm mb-1">{r.title}</p>}
            <p className="text-sm text-[#7a6b5d] leading-relaxed mb-3">{r.content}</p>

            {r.response && (
              <div className="bg-cream-50 border-l-2 border-terracotta-300 pl-4 py-2 mb-3">
                <p className="text-xs font-semibold text-[#7a6b5d] mb-1">Tu respuesta:</p>
                <p className="text-sm text-foreground">{r.response}</p>
              </div>
            )}

            {!r.response && !isResponding && (
              <button
                onClick={() => setRespondingTo(r.id)}
                className="text-sm font-medium text-terracotta-600 hover:underline"
              >
                Responder públicamente
              </button>
            )}

            {isResponding && (
              <div className="mt-3">
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escribe tu respuesta pública..."
                  className="w-full border border-sand-300 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleRespond(r.id)}
                    disabled={submitting || !responseText.trim()}
                    className="bg-terracotta-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {submitting ? 'Enviando...' : 'Publicar respuesta'}
                  </button>
                  <button
                    onClick={() => {
                      setRespondingTo(null);
                      setResponseText('');
                    }}
                    disabled={submitting}
                    className="border border-sand-300 text-[#7a6b5d] font-semibold px-4 py-2 rounded-xl hover:bg-sand-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {r.respondedAt && (
              <p className="text-xs text-sage-600 font-medium mt-2">✓ Respondida</p>
            )}
          </div>
        );
      })}

      {reviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-sm text-[#7a6b5d]">Aún no tienes reseñas</p>
        </div>
      )}
    </div>
  );
}
