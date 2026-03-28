// /es/panel/eventos/nuevo — Wizard de creación de evento
import Link from 'next/link';

export default function NuevoEventoPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/es/panel/eventos" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">← Mis retiros</Link>
      <h1 className="font-serif text-3xl text-foreground mb-2">Nuevo retiro</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Completa la información paso a paso. Tu retiro será revisado antes de publicarse.</p>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-8">{['Información', 'Detalles', 'Programa', 'Fotos', 'Precio'].map((step, i) => (
        <div key={step} className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold ${i === 0 ? 'bg-terracotta-600 text-white' : 'bg-sand-200 text-[#a09383]'}`}>{step}</div>
      ))}</div>

      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Título del retiro (ES) *</label>
          <input type="text" placeholder="Ej: Retiro de Yoga y Meditación frente al mar" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Título del retiro (EN)</label>
          <input type="text" placeholder="Ej: Yoga and Meditation Retreat by the sea" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Resumen (ES) *</label>
          <textarea rows={3} placeholder="Descripción breve que aparecerá en las tarjetas de búsqueda..." className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Descripción completa (ES) *</label>
          <textarea rows={6} placeholder="Describe tu retiro en detalle: qué ofreces, a quién va dirigido, qué lo hace especial..." className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Fecha inicio *</label>
            <input type="date" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Fecha fin *</label>
            <input type="date" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Precio por persona (€) *</label>
            <input type="number" min="50" placeholder="790" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Plazas máximas *</label>
            <input type="number" min="1" placeholder="16" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Categorías *</label>
          <div className="flex flex-wrap gap-2">{['Yoga', 'Meditación', 'Ayurveda'].map((c) => (
            <label key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sand-300 text-sm cursor-pointer hover:border-terracotta-300 hover:bg-terracotta-50 transition-colors">
              <input type="checkbox" className="w-3.5 h-3.5 rounded border-sand-300 text-terracotta-600" /> {c}
            </label>
          ))}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Confirmación de reserva</label>
          <div className="flex gap-4">{[{ v: 'automatic', l: '⚡ Automática' }, { v: 'manual', l: '🔍 Manual (revisar cada solicitud)' }].map((o) => (
            <label key={o.v} className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="confirmation" value={o.v} className="text-terracotta-600" /> {o.l}</label>
          ))}</div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" className="bg-white border border-sand-300 text-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-sand-50 transition-colors">Guardar borrador</button>
          <button type="submit" className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">Enviar a revisión</button>
        </div>
      </form>
    </div>
  );
}
