// GET /api/organizer/events/[id]/bookings/export — Export bookings as CSV
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: retreatId } = await params;

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

    const { data: retreat } = await admin
      .from('retreats')
      .select('id, title_es, post_booking_form')
      .eq('id', retreatId)
      .eq('organizer_id', orgProfile.id)
      .single();

    if (!retreat) return NextResponse.json({ error: 'Retreat not found' }, { status: 404 });

    const { data: bookings } = await admin
      .from('bookings')
      .select(`
        booking_number, status, total_price, platform_fee, organizer_amount,
        platform_payment_status, remaining_payment_status,
        form_responses, organizer_notes, created_at,
        profiles!attendee_id(full_name, email, phone)
      `)
      .eq('retreat_id', retreatId)
      .order('created_at', { ascending: true });

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: 'No bookings to export' }, { status: 404 });
    }

    const formFields = (retreat.post_booking_form as any[]) || [];
    const formHeaders = formFields.map((f: any) => f.label_es || f.id);

    const STATUS_LABELS: Record<string, string> = {
      confirmed: 'Confirmada',
      pending_confirmation: 'Pendiente',
      pending_payment: 'Pago pendiente',
      completed: 'Completada',
      cancelled_by_attendee: 'Cancelada',
      cancelled_by_organizer: 'Cancelada',
      rejected: 'Rechazada',
    };

    const headers = [
      'Nº Reserva', 'Nombre', 'Email', 'Teléfono', 'Estado',
      'Precio total', 'Comisión Retiru (€)', 'Neto organizador (€)',
      'Notas organizador', 'Fecha reserva',
      ...formHeaders,
    ];

    const rows = bookings.map((b: any) => {
      const profile = b.profiles || {};
      const responses = (b.form_responses as Record<string, unknown>) || {};

      const formValues = formFields.map((f: any) => {
        const val = responses[f.id];
        return val !== undefined && val !== null ? String(val) : '';
      });

      return [
        b.booking_number,
        profile.full_name || '',
        profile.email || '',
        profile.phone || '',
        STATUS_LABELS[b.status] || b.status,
        b.total_price,
        b.platform_fee ?? '',
        b.organizer_amount ?? '',
        b.organizer_notes || '',
        new Date(b.created_at).toLocaleDateString('es-ES'),
        ...formValues,
      ];
    });

    function escapeCsv(val: unknown): string {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }

    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row: unknown[]) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const bom = '\uFEFF';

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="asistentes-${retreat.title_es.slice(0, 30)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
