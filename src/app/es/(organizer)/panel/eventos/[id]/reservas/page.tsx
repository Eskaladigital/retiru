// /es/panel/eventos/[id]/reservas — Lista reservas de un evento
import Link from 'next/link';
const BOOKINGS = [
  { id: 'RET-001', name: 'María García', email: 'maria@email.com', date: '12 Mar 2026', status: 'confirmed', amount: 790 },
  { id: 'RET-002', name: 'Carlos López', email: 'carlos@email.com', date: '13 Mar 2026', status: 'confirmed', amount: 790 },
  { id: 'RET-003', name: 'Anna Schmidt', email: 'anna@email.com', date: '14 Mar 2026', status: 'pending_confirmation', amount: 790 },
];
export default function ReservasEventoPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Link href={`/es/panel/eventos/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium mb-6">← Volver al retiro</Link>
      <h1 className="font-serif text-2xl text-foreground mb-6">Reservas del retiro</h1>
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Asistente</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Email</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Fecha</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Importe</th>
          </tr></thead>
          <tbody>{BOOKINGS.map((b) => (
            <tr key={b.id} className="border-b border-sand-100">
              <td className="py-3 px-4 font-medium">{b.name}</td>
              <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{b.email}</td>
              <td className="py-3 px-4 text-[#7a6b5d]">{b.date}</td>
              <td className="py-3 px-4"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-sage-100 text-sage-700' : 'bg-amber-100 text-amber-700'}`}>{b.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}</span></td>
              <td className="py-3 px-4 text-right font-semibold">{b.amount}€</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
