import type { UserRole } from '@/types';

export function hasRole(roles: UserRole[] | string[], role: string): boolean {
  return roles.includes(role as UserRole);
}

export function isAdmin(roles: UserRole[] | string[]): boolean {
  return hasRole(roles, 'admin');
}

export function isOrganizer(roles: UserRole[] | string[]): boolean {
  return hasRole(roles, 'organizer');
}

export function isCenter(roles: UserRole[] | string[]): boolean {
  return hasRole(roles, 'center');
}

/**
 * Queries user_roles for a given user and returns the array of role strings.
 * Works with any Supabase client (server, admin, or browser).
 */
export async function getRolesFromSupabase(
  supabase: { from: (table: string) => any },
  userId: string,
): Promise<UserRole[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (!data || data.length === 0) return ['attendee'];
  return data.map((r: { role: string }) => r.role as UserRole);
}

/**
 * Inserts a role for a user (idempotent — ON CONFLICT does nothing).
 * Requires admin/service-role client for insert permissions.
 */
export async function assignRole(
  adminSupabase: { from: (table: string) => any },
  userId: string,
  role: UserRole,
): Promise<void> {
  await adminSupabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
}
