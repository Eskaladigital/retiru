// /administrator/centros — Gestión de centros (admin)
const CENTERS = [
  { name: 'Yoga Sala Madrid', city: 'Madrid', plan: 'featured', status: 'active', mrr: 65, since: 'Ene 2026' },
  { name: 'Espacio Zen Barcelona', city: 'Barcelona', plan: 'featured', status: 'active', mrr: 65, since: 'Feb 2026' },
  { name: 'Bienestar Integral', city: 'Valencia', plan: 'basic', status: 'active', mrr: 50, since: 'Mar 2026' },
  { name: 'Om Yoga Sevilla', city: 'Sevilla', plan: 'featured', status: 'active', mrr: 65, since: 'Ene 2026' },
  { name: 'Spa Termal Murcia', city: 'Murcia', plan: 'basic', status: 'active', mrr: 50, since: 'Feb 2026' },
  { name: 'Shala Yoga Málaga', city: 'Málaga', plan: 'basic', status: 'pending_payment', mrr: 0, since: 'Mar 2026' },
];
export default function AdminCentrosPage() {
  const totalMRR = CENTERS.reduce((s, c) => s + c.mrr, 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Centros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">{CENTERS.length} centros · MRR: {totalMRR}€/mes</p>
        </div>
        <button className="bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors">➕ Añadir centro</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">MRR Centros</p>
          <p className="text-2xl font-bold mt-1">{totalMRR}€</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Centros activos</p>
          <p className="text-2xl font-bold mt-1">{CENTERS.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Destacados</p>
          <p className="text-2xl font-bold mt-1">{CENTERS.filter(c => c.plan === 'featured').length}</p>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Centro</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Ciudad</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Plan</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">MRR</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Desde</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
          </tr></thead>
          <tbody>{CENTERS.map((c, i) => (
            <tr key={i} className="border-b border-sand-100 hover:bg-sand-50/50">
              <td className="py-3 px-4 font-medium">{c.name}</td>
              <td className="py-3 px-4 text-[#7a6b5d]">{c.city}</td>
              <td className="py-3 px-4 text-center"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.plan === 'featured' ? 'bg-amber-100 text-amber-700' : 'bg-sand-200 text-[#7a6b5d]'}`}>{c.plan === 'featured' ? '⭐ Destacado' : 'Básico'}</span></td>
              <td className="py-3 px-4 text-center"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-sage-100 text-sage-700' : 'bg-red-100 text-red-600'}`}>{c.status === 'active' ? 'Activo' : 'Pago pendiente'}</span></td>
              <td className="py-3 px-4 text-right font-semibold">{c.mrr}€</td>
              <td className="py-3 px-4 text-[#a09383]">{c.since}</td>
              <td className="py-3 px-4 text-right"><button className="text-xs font-semibold text-terracotta-600 hover:underline">Editar</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
