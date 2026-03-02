// /es/mis-reservas
import Link from 'next/link';

const BOOKINGS = [
  { id: 'RET-001', event: 'Retiro de Yoga y Meditación frente al mar', organizer: 'Ibiza Yoga Retreats', dates: '15–20 Jun 2026', status: 'confirmed', fee: 158, remaining: 632, total: 790, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80' },
  { id: 'RET-002', event: 'Escapada Detox en Sierra de Grazalema', organizer: 'Grazalema Wellness', dates: '22–25 Jul 2026', status: 'pending_confirmation', fee: 90, remaining: 360, total: 450, img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80' },
];

const STATUS: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmada', color: 'bg-sage-100 text-sage-700' },
  pending_confirmation: { label: 'Pendiente confirmación', color: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Completada', color: 'bg-sand-200 text-foreground' },
};

export default function MisReservasPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Mis reservas</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">{BOOKINGS.length} reservas</p>

      <div className="space-y-4">
        {BOOKINGS.map((b) => {
          const s = STATUS[b.status] || STATUS.confirmed;
          return (
            <Link key={b.id} href={`/es/mis-reservas/${b.id}`} className="flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all group">
              <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden shrink-0">
                <img src={b.img} alt={b.event} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-serif text-lg leading-tight">{b.event}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>
                </div>
                <p className="text-sm text-[#7a6b5d] mb-2">{b.organizer} · 📅 {b.dates}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span className="text-[#a09383]">Pagado a Retiru:</span> <span className="font-semibold">{b.fee}€</span></div>
                  <div><span className="text-[#a09383]">Pendiente al organizador:</span> <span className="font-semibold">{b.remaining}€</span></div>
                  <div><span className="text-[#a09383]">Total:</span> <span className="font-bold">{b.total}€</span></div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {BOOKINGS.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🧘</p>
          <h3 className="font-serif text-xl mb-2">Aún no tienes reservas</h3>
          <p className="text-sm text-[#7a6b5d] mb-6">Explora los retiros disponibles y encuentra tu experiencia perfecta</p>
          <Link href="/es/buscar" className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">Explorar retiros</Link>
        </div>
      )}
    </div>
  );
}
