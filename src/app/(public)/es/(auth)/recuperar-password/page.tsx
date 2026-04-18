// /es/recuperar-password
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = email.trim();
    if (!value) { setError('Introduce tu email'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(value, {
        redirectTo: `${window.location.origin}/api/auth/callback?type=recovery&locale=es`,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } catch {
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Link href="/es" className="inline-flex items-center gap-[3px]">
            <span className="font-serif text-[32px] text-terracotta-700 tracking-[-0.02em]">retiru</span>
            <span className="w-2 h-2 bg-terracotta-600 rounded-full animate-[float_3s_ease-in-out_infinite] -mb-0.5" />
          </Link>
          <div className="bg-white border border-sand-200 rounded-2xl p-8 shadow-soft mt-8">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl mb-2">Revisa tu email</h2>
            <p className="text-sm text-[#7a6b5d] mb-2">
              Si existe una cuenta asociada a <span className="font-semibold text-foreground break-all">{email.trim()}</span>, te enviaremos un enlace para restablecer la contraseña.
            </p>
            <p className="text-xs text-[#a09383]">Si no lo ves en unos minutos, revisa tu carpeta de spam.</p>
          </div>
          <p className="text-center text-sm text-[#7a6b5d] mt-6">
            <Link href="/es/login" className="text-terracotta-600 font-semibold hover:underline">Volver a iniciar sesión</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/es" className="inline-flex items-center gap-[3px]">
            <span className="font-serif text-[32px] text-terracotta-700 tracking-[-0.02em]">retiru</span>
            <span className="w-2 h-2 bg-terracotta-600 rounded-full animate-[float_3s_ease-in-out_infinite] -mb-0.5" />
          </Link>
          <h1 className="font-serif text-2xl mt-4">Recuperar contraseña</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">Introduce tu email y te enviaremos un enlace para restablecerla</p>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-8 shadow-soft">
          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta-600 text-white font-semibold py-3.5 rounded-xl hover:bg-terracotta-700 transition-colors shadow-[0_2px_8px_rgba(200,90,48,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#7a6b5d] mt-6">
          <Link href="/es/login" className="text-terracotta-600 font-semibold hover:underline">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
