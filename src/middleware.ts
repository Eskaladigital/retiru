// ============================================================================
// RETIRU · Next.js Middleware
// Handles: locale redirect, auth protection, session refresh
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PUBLIC_PATHS = [
  '/',
  '/es',
  '/en',
  '/es/buscar',
  '/en/search',
  '/es/retiro',
  '/en/retreat',
  '/es/centros-retiru',
  '/en/centers-retiru',
  '/es/tienda',
  '/en/shop',
  '/es/retiros-retiru',
  '/en/retreats-retiru',
  '/es/destinos',
  '/en/destinations',
  '/es/organizador',
  '/en/organizer',
  '/es/para-organizadores',
  '/en/for-organizers',
  '/es/ayuda',
  '/en/help',
  '/es/blog',
  '/en/blog',
  '/es/sobre-nosotros',
  '/en/about',
  '/es/contacto',
  '/en/contact',
  '/es/condiciones',
  '/en/condiciones',
  '/es/legal',
  '/en/legal',
  '/es/login',
  '/en/login',
  '/es/registro',
  '/en/register',
  '/es/centro',
  '/en/center',
  '/es/reclamar',
  '/en/claim',
  '/api',
];

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/api')) return true;
  if (pathname.startsWith('/_next') || pathname.includes('.')) return true;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Root → redirect to locale
  if (pathname === '/') {
    const acceptLang = request.headers.get('accept-language') || '';
    const prefersEnglish = acceptLang.toLowerCase().startsWith('en');
    const locale = prefersEnglish ? 'en' : 'es';
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // 2. Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(
    supabaseUrl && supabaseKey &&
    supabaseUrl !== 'your_supabase_url' &&
    supabaseKey !== 'your_supabase_anon_key'
  );

  if (!supabaseConfigured) {
    return NextResponse.next();
  }

  // 3. Create a SINGLE Supabase client for both session refresh and auth checks
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // 4. Refresh session + get user (single call, reuses the same client)
  const { data: { user } } = await supabase.auth.getUser();

  // 5. Protected routes → check auth
  if (!isPublicPath(pathname)) {
    if (!user) {
      const locale = pathname.startsWith('/en') ? 'en' : 'es';
      const loginPath = locale === 'en' ? '/en/login' : '/es/login';
      const url = new URL(loginPath, request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Admin / Administrator → check admin role
    if (pathname.startsWith('/administrator') || pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        const locale = pathname.startsWith('/en') ? 'en' : 'es';
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|icons).*)'],
};
