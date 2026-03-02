// /administrator/reporting
export default function AdminReportingPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Reporting</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Métricas globales de la plataforma</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'GMV total (mes)', value: '142.500€', change: '+18%' },
          { label: 'Ingresos Retiru', value: '28.500€', change: '+18%' },
          { label: 'Nuevos usuarios', value: '234', change: '+22%' },
          { label: 'Tasa cancelación', value: '4.2%', change: '-0.8%' },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-sand-200 rounded-2xl p-5">
            <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">{m.label}</p>
            <p className="text-2xl font-bold mt-1">{m.value}</p>
            <p className="text-xs font-semibold mt-1 text-sage-600">{m.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4">Reservas por mes</h3>
          <div className="h-48 bg-sand-100 rounded-xl flex items-center justify-center text-sm text-[#a09383]">📊 Gráfico mensual (Recharts)</div>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4">Top categorías</h3>
          <div className="space-y-3">
            {[{ name: 'Yoga', pct: 38, count: 49 }, { name: 'Naturaleza', pct: 22, count: 28 }, { name: 'Meditación', pct: 18, count: 23 }, { name: 'Detox', pct: 12, count: 15 }, { name: 'Gastronomía', pct: 10, count: 13 }].map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1"><span>{c.name}</span><span className="text-[#7a6b5d]">{c.count} reservas · {c.pct}%</span></div>
                <div className="h-1.5 bg-sand-200 rounded-full"><div className="h-full bg-terracotta-500 rounded-full" style={{ width: `${c.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6">
        <h3 className="font-serif text-lg mb-4">Top organizadores por reservas</h3>
        <div className="space-y-3">
          {[{ name: 'Ibiza Yoga Retreats', bookings: 89, revenue: '70.310€' }, { name: 'Grazalema Wellness', bookings: 45, revenue: '20.250€' }, { name: 'Priorat Experiences', bookings: 23, revenue: '14.950€' }].map((o, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0 text-sm">
              <span className="font-medium">{o.name}</span>
              <div className="flex gap-6 text-[#7a6b5d]"><span>{o.bookings} reservas</span><span className="font-semibold text-foreground">{o.revenue}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
