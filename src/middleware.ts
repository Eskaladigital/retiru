// ============================================================================
// RETIRU · Next.js Middleware
// Handles: locale redirect, auth protection, session refresh
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

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
  '/api',
];

function isPublicPath(pathname: string): boolean {
  // API routes always public (for webhooks etc)
  if (pathname.startsWith('/api')) return true;
  // Static assets
  if (pathname.startsWith('/_next') || pathname.includes('.')) return true;
  // Check if it matches a public path or starts with one followed by /
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Root → redirect to /es
  if (pathname === '/') {
    // Detect language from Accept-Language header
    const acceptLang = request.headers.get('accept-language') || '';
    const prefersEnglish = acceptLang.toLowerCase().startsWith('en');
    const locale = prefersEnglish ? 'en' : 'es';
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // 2. Refresh Supabase session (updates cookies)
  const response = await updateSession(request);

  // 3. Protected routes → check auth (skip if Supabase not configured)
  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';

  if (!isPublicPath(pathname) && supabaseConfigured) {
    const { createServerClient } = await import('@supabase/ssr');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const locale = pathname.startsWith('/en') ? 'en' : 'es';
      const loginPath = locale === 'en' ? '/en/login' : '/es/login';
      const url = new URL(loginPath, request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // 4. Organizer panel → check organizer role
    if (pathname.includes('/panel') || pathname.includes('/organizer-panel')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'organizer' && profile?.role !== 'admin') {
        const locale = pathname.startsWith('/en') ? 'en' : 'es';
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
    }

    // 5. Admin / Administrator → check admin role
    if (pathname.includes('/admin') || pathname.includes('/administrator')) {
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
