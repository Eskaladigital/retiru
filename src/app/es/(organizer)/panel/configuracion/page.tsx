import Link from 'next/link';

export default function ConfiguracionPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Configuración</h1>
        <p className="text-sm text-[#7a6b5d] mt-1">Gestiona tu perfil de organizador y preferencias</p>
      </div>

      {/* Perfil público */}
      <section className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-serif text-xl mb-4">Perfil público</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">Esta información será visible para los asistentes.</p>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nombre de la organización *</label>
            <input type="text" defaultValue="Ibiza Yoga Retreats" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Descripción</label>
            <textarea
              rows={4}
              defaultValue="Organizamos retiros de yoga y meditación en las mejores villas de Ibiza desde 2018."
              className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Ubicación</label>
              <input type="text" defaultValue="Ibiza, Baleares" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Idiomas</label>
              <input type="text" defaultValue="Español, Inglés" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Foto de perfil</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center text-xl font-bold text-sage-700">I</div>
              <button type="button" className="text-sm font-semibold text-terracotta-600 hover:underline">Cambiar foto</button>
            </div>
          </div>

          <button type="submit" className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">
            Guardar cambios
          </button>
        </form>
      </section>

      {/* Notificaciones */}
      <section className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-serif text-xl mb-4">Notificaciones</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">Elige qué notificaciones quieres recibir por email.</p>

        <div className="space-y-4">
          {[
            { label: 'Nueva reserva', description: 'Cuando un asistente reserva plaza en tu retiro', default: true },
            { label: 'Cancelación', description: 'Cuando un asistente cancela su reserva', default: true },
            { label: 'Nuevo mensaje', description: 'Cuando recibes un mensaje de un asistente', default: true },
            { label: 'Nueva reseña', description: 'Cuando un asistente deja una reseña', default: false },
            { label: 'Recordatorios de pago', description: 'Recordatorios sobre pagos pendientes del 80%', default: true },
            { label: 'Informes mensuales', description: 'Resumen mensual de rendimiento de tus retiros', default: false },
          ].map((notif) => (
            <label key={notif.label} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked={notif.default} className="mt-0.5 w-4 h-4 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-500" />
              <div>
                <p className="text-sm font-medium text-foreground">{notif.label}</p>
                <p className="text-xs text-[#a09383]">{notif.description}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Datos fiscales */}
      <section className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-serif text-xl mb-4">Datos fiscales</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">Información para la facturación del 80% que cobras a los asistentes.</p>

        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">NIF / CIF</label>
              <input type="text" placeholder="12345678A" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Razón social</label>
              <input type="text" placeholder="Tu empresa S.L." className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Dirección fiscal</label>
            <input type="text" placeholder="Calle, número, CP, Ciudad" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">IBAN</label>
            <input type="text" placeholder="ES00 0000 0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
          </div>
          <button type="submit" className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">
            Actualizar datos
          </button>
        </form>
      </section>

      {/* Danger zone */}
      <section className="bg-white border border-red-200 rounded-2xl p-6">
        <h2 className="font-serif text-xl mb-2 text-red-600">Zona peligrosa</h2>
        <p className="text-sm text-[#7a6b5d] mb-4">Desactivar tu cuenta de organizador hará que todos tus retiros dejen de ser visibles. Las reservas existentes no se verán afectadas.</p>
        <button className="text-sm text-red-500 font-medium border border-red-200 rounded-xl px-5 py-2.5 hover:bg-red-50 transition-colors">
          Desactivar cuenta de organizador
        </button>
      </section>
    </div>
  );
}
