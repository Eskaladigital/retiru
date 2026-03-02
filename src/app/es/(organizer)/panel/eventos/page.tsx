// /es/panel/eventos — Lista de eventos del organizador
import Link from 'next/link';

const EVENTS = [
  { id: '1', title: 'Retiro de Yoga y Meditación frente al mar', status: 'published', dates: '15–20 Jun 2026', bookings: 13, maxAttendees: 16, price: 790, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300&q=80' },
  { id: '2', title: 'Wellness & Spa Retreat en Ibiza', status: 'published', dates: '1–7 Jul 2026', bookings: 8, maxAttendees: 12, price: 1100, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=80' },
  { id: '3', title: 'Retiro de Meditación Silenciosa', status: 'draft', dates: '15–18 Sep 2026', bookings: 0, maxAttendees: 10, price: 480, img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=300&q=80' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  published: { label: 'Publicado', color: 'bg-sage-100 text-sage-700' },
  draft: { label: 'Borrador', color: 'bg-sand-200 text-[#7a6b5d]' },
  pending_review: { label: 'En revisión', color: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function PanelEventosPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Mis retiros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">{EVENTS.length} retiros</p>
        </div>
        <Link href="/es/panel/eventos/nuevo" className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
          ➕ Nuevo retiro
        </Link>
      </div>

      <div className="space-y-3">
        {EVENTS.map((e) => {
          const s = STATUS_MAP[e.status] || STATUS_MAP.draft;
          const occupancy = Math.round((e.bookings / e.maxAttendees) * 100);
          return (
            <div key={e.id} className="flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft transition-all">
              <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0">
                <img src={e.img} alt={e.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-serif text-base leading-tight">{e.title}</h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>
                </div>
                <p className="text-sm text-[#7a6b5d] mb-2">📅 {e.dates} · {e.price}€/persona</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-[200px]">
                    <div className="flex justify-between text-xs mb-1"><span className="text-[#a09383]">Ocupación</span><span className="font-semibold">{e.bookings}/{e.maxAttendees}</span></div>
                    <div className="h-2 bg-sand-200 rounded-full overflow-hidden"><div className="h-full bg-terracotta-500 rounded-full transition-all" style={{ width: `${occupancy}%` }} /></div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/es/panel/eventos/${e.id}`} className="text-xs font-medium text-terracotta-600 hover:underline">Editar</Link>
                    <Link href={`/es/panel/eventos/${e.id}/reservas`} className="text-xs font-medium text-terracotta-600 hover:underline">Reservas</Link>
                    <Link href={`/es/panel/eventos/${e.id}/checkin`} className="text-xs font-medium text-terracotta-600 hover:underline">Check-in</Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
