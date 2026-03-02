// /es/mis-reservas/[id] — Detalle de reserva
import Link from 'next/link';

const B = {
  id: 'RET-001', status: 'confirmed', event: { title: 'Retiro de Yoga y Meditación frente al mar', slug: 'retiro-yoga-ibiza', dates: '15–20 Jun 2026', duration: '6 días · 5 noches', location: 'Santa Eulalia, Ibiza', img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80' },
  organizer: { name: 'Ibiza Yoga Retreats', slug: 'ibiza-yoga-retreats' },
  attendee: { name: 'María García', email: 'maria@email.com' },
  payment: { total: 790, fee: 158, remaining: 632, feePaid: true, remainingPaid: false },
  qrCode: 'RET-001-QR',
  createdAt: '12 Mar 2026',
};

export default function ReservaDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Link href="/es/mis-reservas" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Mis reservas
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Reserva {B.id}</h1>
          <p className="text-sm text-[#7a6b5d]">Realizada el {B.createdAt}</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sage-100 text-sage-700">✓ Confirmada</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Retiro */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
            <div className="h-48 overflow-hidden">
              <img src={B.event.img} alt={B.event.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <h2 className="font-serif text-xl mb-2">{B.event.title}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-[#7a6b5d]">
                <span>📍 {B.event.location}</span>
                <span>📅 {B.event.dates}</span>
                <span>🕐 {B.event.duration}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <Link href={`/es/retiro/${B.event.slug}`} className="text-sm font-medium text-terracotta-600 hover:underline">Ver retiro</Link>
                <Link href={`/es/organizador/${B.organizer.slug}`} className="text-sm font-medium text-terracotta-600 hover:underline">Ver organizador</Link>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-serif text-lg mb-3">Chat con {B.organizer.name}</h3>
            <div className="bg-sand-100 rounded-xl p-4 text-center text-sm text-[#7a6b5d]">
              <p>Habla directamente con el organizador para coordinar los detalles de tu retiro.</p>
              <Link href="/es/mensajes" className="inline-flex mt-3 bg-terracotta-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-terracotta-700 transition-colors">Ir al chat</Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6 text-center">
            <h3 className="font-serif text-lg mb-3">Tu código QR</h3>
            <div className="w-40 h-40 mx-auto bg-sand-100 rounded-xl flex items-center justify-center text-[#a09383] text-sm">
              QR Code<br />{B.qrCode}
            </div>
            <p className="text-xs text-[#7a6b5d] mt-3">Muéstralo al organizador para hacer check-in</p>
          </div>

          {/* Desglose pago */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-serif text-lg mb-4">Desglose del pago</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#7a6b5d]">Cuota Retiru (20%)</span>
                <span className="font-semibold text-sage-600">✓ {B.payment.fee}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7a6b5d]">Al organizador (80%)</span>
                <span className={`font-semibold ${B.payment.remainingPaid ? 'text-sage-600' : 'text-amber-600'}`}>
                  {B.payment.remainingPaid ? '✓' : '⏳'} {B.payment.remaining}€
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-sand-200 font-bold">
                <span>Total</span><span>{B.payment.total}€</span>
              </div>
            </div>
            {!B.payment.remainingPaid && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                Recuerda pagar los {B.payment.remaining}€ al organizador antes del retiro.
              </p>
            )}
          </div>

          {/* Cancelar */}
          <button className="w-full text-sm text-red-500 font-medium border border-red-200 rounded-xl py-3 hover:bg-red-50 transition-colors">
            Cancelar reserva
          </button>
        </div>
      </div>
    </div>
  );
}
