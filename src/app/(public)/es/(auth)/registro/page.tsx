// /es/registro
import Link from 'next/link';

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/es" className="inline-flex items-center gap-[3px]">
            <span className="font-serif text-[32px] text-terracotta-700 tracking-[-0.02em]">retiru</span>
            <span className="w-2 h-2 bg-terracotta-600 rounded-full animate-[float_3s_ease-in-out_infinite] -mb-0.5" />
          </Link>
          <h1 className="font-serif text-2xl mt-4">Crear cuenta</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">Únete y descubre tu próximo retiro</p>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-8 shadow-soft">
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nombre completo</label>
              <input type="text" placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" placeholder="tu@email.com" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
              <input type="password" placeholder="Mínimo 8 caracteres" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirmar contraseña</label>
              <input type="password" placeholder="Repite tu contraseña" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-sand-300 text-terracotta-600" />
              <span className="text-xs text-[#7a6b5d] leading-relaxed">Acepto los <Link href="/es/legal/terminos" className="text-terracotta-600 underline">Términos de uso</Link> y la <Link href="/es/legal/privacidad" className="text-terracotta-600 underline">Política de privacidad</Link></span>
            </label>
            <button type="submit" className="w-full bg-terracotta-600 text-white font-semibold py-3.5 rounded-xl hover:bg-terracotta-700 transition-colors shadow-[0_2px_8px_rgba(200,90,48,0.3)]">
              Crear cuenta
            </button>
          </form>

          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sand-200" /></div><div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[#a09383]">o regístrate con</span></div></div>

          <button className="w-full flex items-center justify-center gap-3 bg-white border border-sand-300 py-3 rounded-xl text-sm font-medium hover:bg-sand-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
        </div>

        <p className="text-center text-sm text-[#7a6b5d] mt-6">
          ¿Ya tienes cuenta? <Link href="/es/login" className="text-terracotta-600 font-semibold hover:underline">Inicia sesión</Link>
        </p>

        <div className="mt-8 bg-sage-50 border border-sage-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-sage-800 mb-1">¿Organizas retiros?</p>
          <p className="text-xs text-[#7a6b5d] mb-3">Crea tu cuenta y luego solicita acceso como organizador</p>
          <Link href="/es/para-organizadores" className="text-sm font-semibold text-sage-700 hover:underline">Saber más →</Link>
        </div>
      </div>
    </div>
  );
}
