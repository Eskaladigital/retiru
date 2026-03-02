// /es/perfil — Edición de perfil
export default function PerfilPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Mi perfil</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Gestiona tu información personal</p>

      <div className="max-w-2xl space-y-8">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-sage-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-sage-700">MG</div>
          <div>
            <button className="text-sm font-semibold text-terracotta-600 hover:underline">Cambiar foto</button>
            <p className="text-xs text-[#a09383] mt-0.5">JPG, PNG. Máximo 2MB.</p>
          </div>
        </div>

        <form className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nombre completo</label>
              <input type="text" defaultValue="María García" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" defaultValue="maria@email.com" disabled className="w-full px-4 py-3 rounded-xl border border-sand-200 text-[15px] bg-sand-50 text-[#a09383]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Teléfono</label>
            <input type="tel" placeholder="+34 600 000 000" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Sobre mí</label>
            <textarea rows={3} placeholder="Cuéntanos algo sobre ti..." className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all resize-none" />
          </div>
          <button type="submit" className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">Guardar cambios</button>
        </form>

        {/* Cambiar contraseña */}
        <div className="pt-8 border-t border-sand-200">
          <h2 className="font-serif text-xl mb-4">Cambiar contraseña</h2>
          <form className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña actual</label>
              <input type="password" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nueva contraseña</label>
              <input type="password" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <button type="submit" className="bg-white border border-sand-300 text-foreground font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-sand-50 transition-colors">Actualizar contraseña</button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="pt-8 border-t border-sand-200">
          <h2 className="font-serif text-xl mb-2 text-red-600">Zona peligrosa</h2>
          <p className="text-sm text-[#7a6b5d] mb-4">Eliminar tu cuenta es permanente y no se puede deshacer.</p>
          <button className="text-sm text-red-500 font-medium border border-red-200 rounded-xl px-5 py-2.5 hover:bg-red-50 transition-colors">Eliminar mi cuenta</button>
        </div>
      </div>
    </div>
  );
}
