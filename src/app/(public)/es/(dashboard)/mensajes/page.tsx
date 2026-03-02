// /es/mensajes — Bandeja de mensajes del usuario
import Link from 'next/link';

const CONVERSATIONS = [
  { id: '1', name: 'Ibiza Yoga Retreats', lastMsg: 'Perfecto, te esperamos el día 15. ¿Alguna alergia alimentaria?', time: 'Hace 2h', unread: true, img: null },
  { id: '2', name: 'Grazalema Wellness', lastMsg: 'Tu reserva está pendiente de confirmación. Te confirmamos en 24h.', time: 'Ayer', unread: false, img: null },
];

export default function MensajesPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Mensajes</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Conversaciones con organizadores</p>

      <div className="space-y-2">
        {CONVERSATIONS.map((c) => (
          <Link key={c.id} href={`/es/mensajes?chat=${c.id}`} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-soft ${c.unread ? 'bg-terracotta-50/50 border-terracotta-200' : 'bg-white border-sand-200'}`}>
            <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center text-lg font-bold text-sage-700 shrink-0">{c.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm ${c.unread ? 'font-bold' : 'font-semibold'}`}>{c.name}</h3>
                <span className="text-xs text-[#a09383]">{c.time}</span>
              </div>
              <p className="text-sm text-[#7a6b5d] truncate">{c.lastMsg}</p>
            </div>
            {c.unread && <span className="w-2.5 h-2.5 bg-terracotta-500 rounded-full shrink-0" />}
          </Link>
        ))}
      </div>

      {CONVERSATIONS.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">💬</p>
          <h3 className="font-serif text-xl mb-2">Sin mensajes</h3>
          <p className="text-sm text-[#7a6b5d]">Tus conversaciones con organizadores aparecerán aquí después de tu primera reserva.</p>
        </div>
      )}
    </div>
  );
}
