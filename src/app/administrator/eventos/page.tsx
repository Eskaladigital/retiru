// /administrator/eventos
export default function AdminEventosPage() {
  const EVENTS = [
    { title: 'Retiro de Yoga y Meditación frente al mar', org: 'Ibiza Yoga Retreats', status: 'published', bookings: 13, date: '15 Jun 2026' },
    { title: 'Escapada Detox en Sierra de Grazalema', org: 'Grazalema Wellness', status: 'published', bookings: 8, date: '22 Jul 2026' },
    { title: 'Retiro Silencioso en Navarra', org: 'ZenSpace', status: 'pending_review', bookings: 0, date: '10 Oct 2026' },
    { title: 'Surf & Yoga Galicia', org: 'Atlantic Retreats', status: 'pending_review', bookings: 0, date: '1 Ago 2026' },
  ];
  const S: Record<string, { l: string; c: string }> = { published: { l: 'Publicado', c: 'bg-sage-100 text-sage-700' }, pending_review: { l: 'Pendiente revisión', c: 'bg-amber-100 text-amber-700' }, rejected: { l: 'Rechazado', c: 'bg-red-100 text-red-700' } };
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Retiros</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">{EVENTS.length} retiros · {EVENTS.filter(e => e.status === 'pending_review').length} pendientes de revisión</p>
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Retiro</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Organizador</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Reservas</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Fecha</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
          </tr></thead>
          <tbody>{EVENTS.map((e, i) => {
            const s = S[e.status] || S.published;
            return (
              <tr key={i} className="border-b border-sand-100 hover:bg-sand-50/50">
                <td className="py-3 px-4 font-medium">{e.title}</td>
                <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{e.org}</td>
                <td className="py-3 px-4 text-center"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.c}`}>{s.l}</span></td>
                <td className="py-3 px-4 text-center">{e.bookings}</td>
                <td className="py-3 px-4 text-[#a09383]">{e.date}</td>
                <td className="py-3 px-4 text-right"><button className="text-xs font-semibold text-terracotta-600 hover:underline">{e.status === 'pending_review' ? 'Revisar' : 'Ver'}</button></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
