// /es/panel/asistentes — CRM de asistentes
const ATTENDEES = [
  { name: 'María García', email: 'maria@email.com', events: 2, totalSpent: 1580, lastEvent: 'Jun 2026', tags: ['Repetidor'] },
  { name: 'Carlos López', email: 'carlos@email.com', events: 1, totalSpent: 790, lastEvent: 'Jun 2026', tags: [] },
  { name: 'Anna Schmidt', email: 'anna@email.com', events: 1, totalSpent: 1100, lastEvent: 'Jul 2026', tags: ['Internacional'] },
  { name: 'Laura Martín', email: 'laura@email.com', events: 3, totalSpent: 2100, lastEvent: 'Sep 2025', tags: ['Repetidor', 'VIP'] },
];
export default function AsistentesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="font-serif text-3xl text-foreground">Asistentes</h1><p className="text-sm text-[#7a6b5d] mt-1">{ATTENDEES.length} asistentes registrados</p></div>
        <button className="text-sm font-medium bg-white border border-sand-300 px-4 py-2 rounded-xl hover:bg-sand-50">📥 Exportar CSV</button>
      </div>
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Nombre</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Email</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Retiros</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Total</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Tags</th>
          </tr></thead>
          <tbody>{ATTENDEES.map((a, i) => (
            <tr key={i} className="border-b border-sand-100 hover:bg-sand-50/50">
              <td className="py-3 px-4 font-medium">{a.name}</td>
              <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{a.email}</td>
              <td className="py-3 px-4 text-center">{a.events}</td>
              <td className="py-3 px-4 text-right font-semibold">{a.totalSpent}€</td>
              <td className="py-3 px-4 hidden md:table-cell"><div className="flex gap-1">{a.tags.map(t => <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{t}</span>)}</div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
