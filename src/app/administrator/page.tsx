// /administrator — Dashboard admin
export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Panel de administración</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Resumen general de la plataforma</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Organizadores activos', value: '47', icon: '👥' },
          { label: 'Retiros publicados', value: '128', icon: '📅' },
          { label: 'Reservas este mes', value: '342', icon: '📋' },
          { label: 'Ingresos Retiru (mes)', value: '28.450€', icon: '💰' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-sand-200 rounded-2xl p-5">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-2xl font-bold mt-2">{k.value}</p>
            <p className="text-xs text-[#a09383] mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h2 className="font-serif text-lg mb-4">Organizadores pendientes de verificación</h2>
          <div className="space-y-3">
            {[{ name: 'Yoga Sol Ibiza', date: 'Hace 2h' }, { name: 'Asturias Wild', date: 'Hace 5h' }].map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0">
                <span className="text-sm font-medium">{o.name}</span>
                <div className="flex gap-2"><span className="text-xs text-[#a09383]">{o.date}</span><button className="text-xs text-sage-600 font-semibold hover:underline">Revisar</button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h2 className="font-serif text-lg mb-4">Retiros pendientes de revisión</h2>
          <div className="space-y-3">
            {[{ name: 'Retiro Silencioso en Navarra', org: 'ZenSpace', date: 'Hace 1h' }, { name: 'Surf & Yoga Galicia', org: 'Atlantic Retreats', date: 'Hace 3h' }].map((e, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0">
                <div><span className="text-sm font-medium">{e.name}</span><br /><span className="text-xs text-[#a09383]">{e.org}</span></div>
                <div className="flex gap-2"><span className="text-xs text-[#a09383]">{e.date}</span><button className="text-xs text-sage-600 font-semibold hover:underline">Revisar</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
