// /administrator/usuarios — Gestión de usuarios (admin)
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase/server';
import { UsuariosTableClient } from './UsuariosTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsuariosPage() {
  const serverSupabase = await createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  const supabase = createAdminSupabase();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, phone, role, preferred_locale, bio, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    console.error('Error fetching profiles:', error);
  }

  const list = (profiles || []) as any[];

  const admins = list.filter((u) => u.role === 'admin').length;
  const organizers = list.filter((u) => u.role === 'organizer').length;
  const attendees = list.filter((u) => u.role === 'attendee').length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Usuarios</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} total · {admins} admin{admins !== 1 ? 's' : ''} · {organizers} organizador{organizers !== 1 ? 'es' : ''} · {attendees} asistente{attendees !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Total usuarios</p>
          <p className="text-2xl font-bold mt-1">{list.length}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Admins</p>
          <p className="text-2xl font-bold mt-1">{admins}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Organizadores</p>
          <p className="text-2xl font-bold mt-1">{organizers}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Asistentes</p>
          <p className="text-2xl font-bold mt-1">{attendees}</p>
        </div>
      </div>

      <UsuariosTableClient users={list} currentUserId={user?.id ?? null} />
    </div>
  );
}
