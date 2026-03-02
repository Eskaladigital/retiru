// ============================================================================
// RETIRU · Supabase client — Server (Server Components, Route Handlers, Server Actions)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente Supabase para generateStaticParams, sitemap, etc.
 * Sin cookies — solo para lectura de datos públicos en build time.
 */
export function createStaticSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component — can't set cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Server Component
          }
        },
      },
    }
  );
}

/**
 * Obtiene el usuario actual para el Header (name, role).
 * Retorna null si no hay sesión.
 */
export async function getCurrentUserForHeader(): Promise<{ name: string; role: string } | null> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();
    return {
      name: profile?.full_name || user.email?.split('@')[0] || 'Usuario',
      role: profile?.role || 'user',
    };
  } catch {
    return null;
  }
}

/**
 * Admin client with service role key — use only in server-side code
 * (webhooks, cron jobs, admin operations)
 */
export function createAdminSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
