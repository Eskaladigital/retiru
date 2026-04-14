// /administrator/usuarios — Gestión de usuarios (admin)
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase/server';
import { UsuariosTableClient } from './UsuariosTableClient';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/** Último inicio de sesión conocido por Supabase Auth (`last_sign_in_at`), paginado. */
async function fetchAuthLastSignInMap(admin: SupabaseClient): Promise<Record<string, string | null>> {
  const map: Record<string, string | null> = {};
  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('Error listUsers (auth):', error);
      break;
    }
    const users = data?.users ?? [];
    for (const u of users) {
      map[u.id] = u.last_sign_in_at ?? null;
    }
    if (users.length < perPage) break;
    page += 1;
  }
  return map;
}

export default async function AdminUsuariosPage() {
  const serverSupabase = await createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  const supabase = createAdminSupabase();

  const [{ data: profiles, error }, { data: allRoles }, lastSignInByUserId] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, phone, preferred_locale, bio, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase
      .from('user_roles')
      .select('user_id, role'),
    fetchAuthLastSignInMap(supabase),
  ]);

  if (error) {
    console.error('Error fetching profiles:', error);
  }

  const rolesMap: Record<string, string[]> = {};
  for (const r of (allRoles || [])) {
    if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
    rolesMap[r.user_id].push(r.role);
  }

  const list = (profiles || []).map((p: any) => ({
    ...p,
    roles: rolesMap[p.id] || ['attendee'],
    last_sign_in_at: lastSignInByUserId[p.id] ?? null,
  }));

  const admins = list.filter((u: any) => u.roles.includes('admin')).length;
  const organizers = list.filter((u: any) => u.roles.includes('organizer')).length;
  const centers = list.filter((u: any) => u.roles.includes('center')).length;
  const attendees = list.filter((u: any) => u.roles.includes('attendee')).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Usuarios</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} total · {admins} admin{admins !== 1 ? 's' : ''} · {organizers} organizador{organizers !== 1 ? 'es' : ''} · {centers} centro{centers !== 1 ? 's' : ''} · {attendees} asistente{attendees !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Centros</p>
          <p className="text-2xl font-bold mt-1">{centers}</p>
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
