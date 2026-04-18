// ============================================================================
// RETIRU · Supabase Auth Callback
// Intercambia el código OAuth por sesión y redirige
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const locale = requestUrl.searchParams.get('locale') || 'es';
  const type = requestUrl.searchParams.get('type');
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
      const loginPath = locale === 'en' ? '/en/login' : '/es/login';
      const url = new URL(loginPath, request.url);
      url.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(url);
    }

    if (type === 'recovery') {
      const newPasswordPath = locale === 'en' ? '/en/new-password' : '/es/nueva-password';
      return NextResponse.redirect(new URL(newPasswordPath, request.url));
    }

    if (data?.user) {
      const [{ data: profile }, { data: adminRole }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, created_at')
          .eq('id', data.user.id)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .maybeSingle(),
      ]);

      const isNewUser = profile?.created_at &&
        (Date.now() - new Date(profile.created_at).getTime()) < 5 * 60 * 1000;

      if (isNewUser && data.user.email) {
        try {
          await sendWelcomeEmail({
            to: data.user.email,
            locale: (locale as 'es' | 'en') || 'es',
            fullName: profile?.full_name || data.user.user_metadata?.full_name || 'amigo/a',
          });
        } catch (err) {
          console.error('[auth/callback] Welcome email failed:', err);
        }
      }

      if (adminRole) {
        return NextResponse.redirect(new URL('/administrator', request.url));
      }
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
