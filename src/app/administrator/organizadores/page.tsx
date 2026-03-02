// /administrator/organizadores
export default function AdminOrganizadoresPage() {
  const ORGS = [
    { name: 'Ibiza Yoga Retreats', email: 'info@ibizayoga.com', events: 12, status: 'verified', joined: 'Ene 2025' },
    { name: 'Grazalema Wellness', email: 'hola@grazalemawellness.com', events: 5, status: 'verified', joined: 'Mar 2025' },
    { name: 'Yoga Sol Ibiza', email: 'contact@yogasol.es', events: 0, status: 'pending', joined: 'Hoy' },
    { name: 'Asturias Wild', email: 'info@asturiaswild.com', events: 0, status: 'pending', joined: 'Hoy' },
  ];
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Organizadores</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">{ORGS.length} organizadores registrados</p>
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Nombre</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Email</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Retiros</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Registro</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
          </tr></thead>
          <tbody>{ORGS.map((o, i) => (
            <tr key={i} className="border-b border-sand-100 hover:bg-sand-50/50">
              <td className="py-3 px-4 font-medium">{o.name}</td>
              <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{o.email}</td>
              <td className="py-3 px-4 text-center">{o.events}</td>
              <td className="py-3 px-4 text-center"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${o.status === 'verified' ? 'bg-sage-100 text-sage-700' : 'bg-amber-100 text-amber-700'}`}>{o.status === 'verified' ? 'Verificado' : 'Pendiente'}</span></td>
              <td className="py-3 px-4 text-[#a09383]">{o.joined}</td>
              <td className="py-3 px-4 text-right"><button className="text-xs font-semibold text-terracotta-600 hover:underline">{o.status === 'pending' ? 'Verificar' : 'Detalle'}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
