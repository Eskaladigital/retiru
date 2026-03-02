// /api/auth/callback — Supabase auth callback handler
import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const locale = requestUrl.searchParams.get('locale') || 'es';

  if (code) {
    // TODO: Exchange code for session using Supabase
    // const supabase = createServerClient(...)
    // await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
