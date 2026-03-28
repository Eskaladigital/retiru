// /es/panel/analiticas
export default function AnaliticasPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Analíticas</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Rendimiento de tus retiros en los últimos 30 días</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Visitas a fichas', value: '1.245', change: '+12%', up: true },
          { label: 'Reservas', value: '23', change: '+8%', up: true },
          { label: 'Tasa conversión', value: '1.8%', change: '-0.2%', up: false },
          { label: 'Ingresos estimados', value: '18.170€', change: '+15%', up: true },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-sand-200 rounded-2xl p-5">
            <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">{m.label}</p>
            <p className="text-2xl font-bold mt-1">{m.value}</p>
            <p className={`text-xs font-semibold mt-1 ${m.up ? 'text-sage-600' : 'text-red-500'}`}>{m.change} vs mes anterior</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Visitas y reservas</h3>
        <div className="h-64 bg-sand-100 rounded-xl flex items-center justify-center text-sm text-[#a09383]">📊 Gráfico de visitas y conversiones (Recharts)</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4">Top retiros</h3>
          <div className="space-y-3">
            {[{ name: 'Retiro Yoga Ibiza', views: 834, bookings: 13 }, { name: 'Retiro meditación Sierra', views: 411, bookings: 8 }].map((e, i) => (
              <div key={i} className="flex justify-between text-sm"><span>{e.name}</span><span className="text-[#7a6b5d]">{e.views} visitas · {e.bookings} reservas</span></div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4">Origen del tráfico</h3>
          <div className="space-y-3">
            {[{ source: 'Google Orgánico', pct: 45 }, { source: 'Directo', pct: 28 }, { source: 'Instagram', pct: 15 }, { source: 'Otros', pct: 12 }].map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1"><span>{s.source}</span><span className="font-semibold">{s.pct}%</span></div>
                <div className="h-1.5 bg-sand-200 rounded-full"><div className="h-full bg-terracotta-500 rounded-full" style={{ width: `${s.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
