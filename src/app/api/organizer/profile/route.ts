// PATCH /api/organizer/profile — Actualizar perfil público del organizador
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });

    const body = await req.json();
    const { business_name, bio, location, website, instagram, phone, languages } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (business_name !== undefined) updates.business_name = business_name.trim();
    if (bio !== undefined) updates.description_es = bio.trim();
    if (location !== undefined) updates.location = location.trim();
    if (website !== undefined) updates.website = website.trim();
    if (instagram !== undefined) updates.instagram = instagram.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (languages !== undefined && Array.isArray(languages)) updates.languages = languages;

    const { error: updateError } = await admin
      .from('organizer_profiles')
      .update(updates)
      .eq('id', orgProfile.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
