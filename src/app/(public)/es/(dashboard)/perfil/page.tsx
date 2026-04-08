// /es/perfil — Edición de perfil (datos desde Supabase)
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { PerfilClient } from './PerfilClient';

export default async function PerfilPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login?redirect=/es/perfil');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, email, phone, bio, avatar_url')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return (
      <div>
        <h1 className="font-serif text-3xl text-foreground mb-2">Mi perfil</h1>
        <p className="text-sm text-red-700">
          No se encontró tu perfil en la base de datos. Si acabas de registrarte, espera unos segundos o contacta con soporte.
        </p>
      </div>
    );
  }

  return (
    <PerfilClient
      initial={{
        full_name: profile.full_name,
        email: user.email || profile.email || '',
        phone: profile.phone,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
      }}
    />
  );
}
