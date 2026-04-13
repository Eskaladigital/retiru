// GET /api/admin/organizers/[id]/doc-url?path=... — URL firmada para documento
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!adminRole) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: _orgId } = await params;
  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath) {
    return NextResponse.json({ error: 'path requerido' }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin.storage
    .from('organizer-docs')
    .createSignedUrl(filePath, 300); // 5 minutes

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
