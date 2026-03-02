// /administrator/reembolsos
export default function AdminReembolsosPage() {
  const REFUNDS = [
    { id: 'REF-001', attendee: 'Pedro Sánchez L.', event: 'Yoga Retreat Ibiza', amount: 158, reason: 'Cancelación > 30 días', status: 'processed', date: '28 Feb 2026' },
    { id: 'REF-002', attendee: 'Clara Ruiz', event: 'Detox Grazalema', amount: 90, reason: 'Retiro cancelado por organizador', status: 'pending', date: '1 Mar 2026' },
    { id: 'REF-003', attendee: 'John Smith', event: 'Wellness Retreat', amount: 220, reason: 'Cancelación < 7 días (50%)', status: 'pending', date: '2 Mar 2026' },
  ];
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Reembolsos</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">{REFUNDS.filter(r => r.status === 'pending').length} pendientes de procesar</p>
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">ID</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Asistente</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Retiro</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Motivo</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Importe</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
          </tr></thead>
          <tbody>{REFUNDS.map((r) => (
            <tr key={r.id} className="border-b border-sand-100 hover:bg-sand-50/50">
              <td className="py-3 px-4 font-medium">{r.id}</td>
              <td className="py-3 px-4">{r.attendee}</td>
              <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{r.event}</td>
              <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{r.reason}</td>
              <td className="py-3 px-4 text-right font-semibold">{r.amount}€</td>
              <td className="py-3 px-4 text-center"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.status === 'processed' ? 'bg-sage-100 text-sage-700' : 'bg-amber-100 text-amber-700'}`}>{r.status === 'processed' ? 'Procesado' : 'Pendiente'}</span></td>
              <td className="py-3 px-4 text-right">{r.status === 'pending' && <button className="text-xs font-semibold text-terracotta-600 hover:underline">Procesar</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
