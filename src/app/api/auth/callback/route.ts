// ============================================================================
// RETIRU · Supabase Auth Callback
// Intercambia el código OAuth por sesión y redirige
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const locale = requestUrl.searchParams.get('locale') || 'es';
  const redirectTo = requestUrl.searchParams.get('redirect') || `/${locale}`;

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
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
              // Route Handler puede establecer cookies
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {
              // Route Handler
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback]', error.message);
      // Redirigir a login con error
      const loginPath = locale === 'en' ? '/en/login' : '/es/login';
      const url = new URL(loginPath, request.url);
      url.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(url);
    }

    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/administrator', request.url));
      }
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
