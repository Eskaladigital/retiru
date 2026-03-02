// /es/panel — Dashboard organizador
import Link from 'next/link';

export default function PanelDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">¡Hola, Jorge! 👋</h1>
        <p className="text-[#7a6b5d] mt-1">Aquí tienes un resumen de tu actividad</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Retiros activos', value: '3', icon: '📅', color: 'bg-terracotta-50 border-terracotta-200' },
          { label: 'Reservas este mes', value: '12', icon: '📋', color: 'bg-sage-50 border-sage-200' },
          { label: 'Ingresos pendientes', value: '7.580€', icon: '💰', color: 'bg-amber-50 border-amber-200' },
          { label: 'Valoración media', value: '4.8', icon: '⭐', color: 'bg-sand-100 border-sand-300' },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.color}`}>
            <span className="text-2xl">{kpi.icon}</span>
            <p className="text-2xl font-bold mt-2">{kpi.value}</p>
            <p className="text-xs text-[#7a6b5d] mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl">Últimas reservas</h2>
          <Link href="/es/panel/eventos" className="text-sm text-terracotta-600 font-medium hover:underline">Ver todas</Link>
        </div>
        <div className="space-y-3">
          {[
            { name: 'María García', event: 'Retiro Yoga Ibiza', date: 'Hace 2h', amount: '790€', status: 'Confirmada' },
            { name: 'Carlos López', event: 'Retiro Yoga Ibiza', date: 'Hace 5h', amount: '790€', status: 'Confirmada' },
            { name: 'Anna Schmidt', event: 'Wellness Retreat Ibiza', date: 'Ayer', amount: '1.100€', status: 'Pendiente' },
          ].map((b, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-sand-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700">{b.name[0]}</div>
                <div><p className="text-sm font-medium">{b.name}</p><p className="text-xs text-[#a09383]">{b.event} · {b.date}</p></div>
              </div>
              <div className="text-right"><p className="text-sm font-semibold">{b.amount}</p><p className="text-xs text-[#a09383]">{b.status}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/es/panel/eventos/nuevo" className="flex items-center gap-3 bg-terracotta-600 text-white rounded-2xl p-5 hover:bg-terracotta-700 transition-colors">
          <span className="text-2xl">➕</span>
          <div><p className="font-semibold">Nuevo retiro</p><p className="text-xs text-terracotta-200">Crea y publica un retiro</p></div>
        </Link>
        <Link href="/es/panel/mensajes" className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl p-5 hover:shadow-soft transition-all">
          <span className="text-2xl">💬</span>
          <div><p className="font-semibold">2 mensajes nuevos</p><p className="text-xs text-[#a09383]">Responde a tus asistentes</p></div>
        </Link>
        <Link href="/es/panel/analiticas" className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl p-5 hover:shadow-soft transition-all">
          <span className="text-2xl">📈</span>
          <div><p className="font-semibold">Ver analíticas</p><p className="text-xs text-[#a09383]">Rendimiento de tus retiros</p></div>
        </Link>
      </div>
    </div>
  );
}
