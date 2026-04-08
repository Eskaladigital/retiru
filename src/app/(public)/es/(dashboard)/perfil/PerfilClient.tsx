'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';

export type PerfilInitial = {
  full_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}

export function PerfilClient({ initial }: { initial: PerfilInitial }) {
  const [fullName, setFullName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const initials = useMemo(() => initialsFromName(fullName), [fullName]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBanner({ type: 'err', text: json.error || 'No se pudo guardar' });
        return;
      }
      if (json.profile?.full_name) {
        setFullName(json.profile.full_name);
      }
      setBanner({ type: 'ok', text: 'Cambios guardados.' });
    } catch {
      setBanner({ type: 'err', text: 'Error de red. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Mi perfil</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Gestiona tu información personal</p>

      {banner && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            banner.type === 'ok' ? 'bg-sage-100 text-sage-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="max-w-2xl space-y-8">
        <div className="flex items-center gap-6">
          {initial.avatar_url ? (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-sand-100">
              <Image
                src={initial.avatar_url}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-sage-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-sage-700 shrink-0">
              {initials}
            </div>
          )}
          <div>
            <button type="button" className="text-sm font-semibold text-[#a09383] cursor-not-allowed" disabled>
              Cambiar foto
            </button>
            <p className="text-xs text-[#a09383] mt-0.5">Próximamente. JPG, PNG. Máximo 2MB.</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={onSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="perfil-nombre" className="block text-sm font-medium text-foreground mb-1.5">
                Nombre completo
              </label>
              <input
                id="perfil-nombre"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="perfil-email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="perfil-email"
                type="email"
                value={initial.email}
                readOnly
                disabled
                className="w-full px-4 py-3 rounded-xl border border-sand-200 text-[15px] bg-sand-50 text-[#a09383]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="perfil-tel" className="block text-sm font-medium text-foreground mb-1.5">
              Teléfono
            </label>
            <input
              id="perfil-tel"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
            />
          </div>
          <div>
            <label htmlFor="perfil-bio" className="block text-sm font-medium text-foreground mb-1.5">
              Sobre mí
            </label>
            <textarea
              id="perfil-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos algo sobre ti..."
              className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>

        <div className="pt-8 border-t border-sand-200">
          <h2 className="font-serif text-xl mb-4">Cambiar contraseña</h2>
          <form
            className="space-y-4 max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña actual</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
              />
            </div>
            <button
              type="button"
              disabled
              className="bg-white border border-sand-300 text-[#a09383] font-semibold px-6 py-2.5 rounded-xl text-sm cursor-not-allowed"
            >
              Actualizar contraseña
            </button>
            <p className="text-xs text-[#a09383]">Próximamente desde tu cuenta.</p>
          </form>
        </div>

        <div className="pt-8 border-t border-sand-200">
          <h2 className="font-serif text-xl mb-2 text-red-600">Zona peligrosa</h2>
          <p className="text-sm text-[#7a6b5d] mb-4">Eliminar tu cuenta es permanente y no se puede deshacer.</p>
          <button
            type="button"
            disabled
            className="text-sm text-[#a09383] font-medium border border-sand-200 rounded-xl px-5 py-2.5 cursor-not-allowed"
          >
            Eliminar mi cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
