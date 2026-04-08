'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EmailLink } from '@/components/ui/email-link';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const;

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
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const initials = useMemo(() => initialsFromName(fullName), [fullName]);

  useEffect(() => {
    setAvatarUrl(initial.avatar_url);
  }, [initial.avatar_url]);

  async function persistProfile(body: Record<string, unknown>, okMessage: string) {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBanner({ type: 'err', text: json.error || 'No se pudo guardar' });
        return false;
      }
      if (json.profile?.full_name) {
        setFullName(json.profile.full_name);
      }
      setBanner({ type: 'ok', text: okMessage });
      router.refresh();
      return true;
    } catch {
      setBanner({ type: 'err', text: 'Error de red. Inténtalo de nuevo.' });
      return false;
    }
  }

  async function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!(AVATAR_ACCEPT as readonly string[]).includes(file.type)) {
      setBanner({ type: 'err', text: 'Formato no válido. Usa JPG, PNG o WebP.' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setBanner({ type: 'err', text: 'La imagen supera 2MB.' });
      return;
    }

    setUploadingAvatar(true);
    setBanner(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBanner({ type: 'err', text: 'Sesión caducada. Vuelve a iniciar sesión.' });
        return;
      }

      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type,
      });

      if (upErr) {
        const msg = upErr.message || '';
        setBanner({
          type: 'err',
          text:
            msg.includes('row-level security') || msg.includes('RLS') || msg.includes('Bucket not found')
              ? 'No se pudo subir la foto. Comprueba que exista el bucket público «avatars» en Supabase.'
              : `Error al subir: ${msg}`,
        });
        return;
      }

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const ok = await persistProfile(
        {
          full_name: fullName,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          avatar_url: publicUrl,
        },
        'Foto de perfil actualizada.',
      );
      if (ok) setAvatarUrl(publicUrl);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeAvatar() {
    if (!avatarUrl) return;
    if (!confirm('¿Quitar la foto de perfil?')) return;
    setUploadingAvatar(true);
    setBanner(null);
    try {
      const ok = await persistProfile(
        {
          full_name: fullName,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          avatar_url: null,
        },
        'Foto eliminada.',
      );
      if (ok) setAvatarUrl(null);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setSaving(true);
    try {
      await persistProfile(
        {
          full_name: fullName,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
        },
        'Cambios guardados.',
      );
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
          {avatarUrl ? (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-sand-100 ring-1 ring-sand-200">
              <Image
                key={avatarUrl}
                src={avatarUrl}
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
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={avatarInputRef}
                type="file"
                accept={AVATAR_ACCEPT.join(',')}
                className="hidden"
                onChange={onAvatarFile}
              />
              <button
                type="button"
                disabled={uploadingAvatar || saving}
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700 disabled:opacity-50"
              >
                <Camera size={18} aria-hidden />
                {uploadingAvatar ? 'Subiendo…' : 'Cambiar foto'}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  disabled={uploadingAvatar || saving}
                  onClick={removeAvatar}
                  className="text-sm font-medium text-[#a09383] hover:text-red-600 disabled:opacity-50"
                >
                  Quitar foto
                </button>
              ) : null}
            </div>
            <p className="text-xs text-[#a09383]">JPG, PNG o WebP. Máximo 2MB.</p>
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
              <div
                id="perfil-email"
                className="w-full px-4 py-3 rounded-xl border border-sand-200 text-[15px] bg-sand-50 min-h-[48px] flex items-center"
              >
                <EmailLink
                  email={initial.email}
                  className="text-[#7a6b5d] hover:text-terracotta-600 hover:underline break-all"
                  emptyLabel="—"
                />
              </div>
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
