// /api/checkout — Create Stripe Checkout session OR reserve-without-payment
// Accepts { retreatId, locale } for new bookings
// Accepts { bookingId, locale } to pay an existing reserved_no_payment booking
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe';
import { isOnlinePaymentEnabled } from '@/lib/payments';
import { addDaysIso, SERIES_BOOKING_HORIZON_DAYS } from '@/lib/series';
import {
  sendReservationConfirmedEmail,
  sendMinViableReachedEmail,
  sendMinViableReachedToOrganizerEmail,
  sendBookingRequestReceivedEmail,
  sendNewBookingToOrganizerEmail,
  sendSeriesReservationEmail,
} from '@/lib/email';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  HOLD_ENROLLMENT_STATUSES,
  enrolledFromConfirmedAndHolds,
} from '@/lib/utils';

function generateBookingNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RT-${y}${m}-${rand}`;
}

function computePaymentDeadline(startDate: string): Date {
  const now = new Date();
  const seventyTwoH = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const oneDayBefore = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000);
  return seventyTwoH < oneDayBefore ? seventyTwoH : oneDayBefore;
}

function formatDeadlineForEmail(d: Date, locale: 'es' | 'en'): string {
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const locale = (body.locale || 'es') as 'es' | 'en';

    // ─── PATH B: Pay an existing reserved_no_payment booking ─────────
    if (body.bookingId) {
      return handlePayExistingBooking(body.bookingId, user, locale);
    }

    // ─── PATH C: Reserve upcoming dates of a recurring series ────────
    // Con retreatIds reserva solo las fechas seleccionadas; sin él, todas.
    if (body.seriesId) {
      const selectedIds = Array.isArray(body.retreatIds)
        ? body.retreatIds.map((x: unknown) => String(x)).filter(Boolean)
        : null;
      return handleReserveSeries(String(body.seriesId), user, locale, selectedIds);
    }

    // ─── PATH A: New booking (reserve or pay) ────────────────────────
    const { retreatId } = body;
    if (!retreatId) {
      return NextResponse.json({ error: 'Missing retreatId' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    const { data: retreat, error: retreatError } = await admin
      .from('retreats')
      .select('id, title_es, title_en, slug, total_price, platform_fee, organizer_amount, currency, organizer_id, available_spots, confirmation_type, sla_hours, start_date, status, min_attendees, confirmed_bookings, max_attendees')
      .eq('id', retreatId)
      .single();

    if (retreatError || !retreat) {
      return NextResponse.json({ error: 'Retreat not found' }, { status: 404 });
    }

    if (retreat.status !== 'published') {
      return NextResponse.json({ error: 'Retreat is not available' }, { status: 400 });
    }

    if (retreat.available_spots <= 0) {
      return NextResponse.json({ error: 'No spots available' }, { status: 400 });
    }

    const { data: existingBooking } = await admin
      .from('bookings')
      .select('id')
      .eq('retreat_id', retreatId)
      .eq('attendee_id', user.id)
      .in('status', [...ACTIVE_ENROLLMENT_STATUSES])
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({
        error: locale === 'es' ? 'Ya tienes una reserva para este retiro' : 'You already have a booking for this retreat',
      }, { status: 409 });
    }

    const minAttendees = retreat.min_attendees ?? 1;
    const confirmedCount = retreat.confirmed_bookings ?? 0;
    const maxAttendees = retreat.max_attendees ?? 0;

    const { count: holdCount } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('retreat_id', retreatId)
      .in('status', [...HOLD_ENROLLMENT_STATUSES]);

    const totalEnrolled = enrolledFromConfirmedAndHolds(confirmedCount, holdCount ?? 0);
    const minAlreadyReached = totalEnrolled >= minAttendees;
    const isManual = retreat.confirmation_type === 'manual';
    // Modo lanzamiento: sin claves Stripe reales → inscripción sin cobro
    const launchNoPayment = !isOnlinePaymentEnabled();

    if (maxAttendees > 0 && totalEnrolled >= maxAttendees) {
      return NextResponse.json({
        error: locale === 'es' ? 'No quedan plazas disponibles' : 'No spots available',
      }, { status: 400 });
    }

    // ─── Reserve/request without payment ─────────────────────────────
    // Sin pago por adelantado cuando: (a) falta el mínimo de participantes,
    // (b) confirmación manual, o (c) modo lanzamiento (Stripe aún no activo).
    if ((!minAlreadyReached && minAttendees > 1) || isManual || launchNoPayment) {
      const bookingNumber = generateBookingNumber();
      const eventTitle = locale === 'es' ? retreat.title_es : (retreat.title_en || retreat.title_es);
      const slaHours = retreat.sla_hours || 48;

      const { data: booking, error: bookingError } = await admin
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          retreat_id: retreatId,
          attendee_id: user.id,
          organizer_id: retreat.organizer_id,
          total_price: retreat.total_price,
          platform_fee: retreat.platform_fee,
          organizer_amount: retreat.organizer_amount,
          currency: retreat.currency,
          status: 'reserved_no_payment',
          platform_payment_status: 'pending',
          remaining_payment_status: 'not_applicable',
          // Plazo del organizador para responder a la solicitud (solo manual)
          sla_deadline: isManual
            ? new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()
            : null,
        })
        .select('id')
        .single();

      if (bookingError || !booking) {
        console.error('Reservation creation error:', bookingError);
        if ((bookingError as { code?: string } | null)?.code === '23505') {
          return NextResponse.json({
            error: locale === 'es' ? 'Ya tienes una reserva para este retiro' : 'You already have a booking for this retreat',
          }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to reserve spot' }, { status: 500 });
      }

      const newTotalEnrolled = totalEnrolled + 1;

      // Email al asistente
      try {
        if (isManual) {
          await sendBookingRequestReceivedEmail({
            to: user.email!,
            locale,
            eventTitle,
            bookingNumber,
            slaHours,
          });
        } else {
          await sendReservationConfirmedEmail({
            to: user.email!,
            locale,
            eventTitle,
            bookingNumber,
            minAttendees,
            currentReserved: newTotalEnrolled,
            launchNoPayment,
          });
        }
      } catch (e) { console.error('reservation email failed:', e); }

      // Notificar al organizador: solicitud manual o inscripción en modo lanzamiento
      if (isManual || launchNoPayment) {
        try {
          const { data: orgProfile } = await admin
            .from('organizer_profiles')
            .select('user_id, profiles!user_id(email, full_name, preferred_locale)')
            .eq('id', retreat.organizer_id)
            .single();
          const orgUser = orgProfile?.profiles as any;
          const { data: attendeeProfile } = await admin
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          if (orgUser?.email) {
            await sendNewBookingToOrganizerEmail({
              to: orgUser.email,
              locale: (orgUser.preferred_locale || 'es') as 'es' | 'en',
              bookingNumber,
              eventTitle: retreat.title_es,
              attendeeName: attendeeProfile?.full_name || 'Asistente',
              requiresConfirmation: isManual,
              slaHours: isManual ? slaHours : undefined,
              noPaymentHold: launchNoPayment && !isManual,
            });
          }
        } catch (e) { console.error('sendNewBookingToOrganizerEmail failed:', e); }
      }

      // Check if THIS booking triggers the minimum (no en modo lanzamiento sin Stripe)
      if (!launchNoPayment && minAttendees > 1 && !minAlreadyReached && newTotalEnrolled >= minAttendees) {
        try {
          await triggerMinViableReached(admin, retreat, locale);
        } catch (e) {
          // La reserva ya está creada: no devolver 500 al usuario por un fallo de notificación
          console.error('triggerMinViableReached failed:', e);
        }
      }

      return NextResponse.json({ reserved: true, requested: isManual, bookingId: booking.id });
    }

    // ─── Min reached (or min=1) + automatic: normal Stripe checkout ──
    const bookingNumber = generateBookingNumber();

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        retreat_id: retreatId,
        attendee_id: user.id,
        organizer_id: retreat.organizer_id,
        total_price: retreat.total_price,
        platform_fee: retreat.platform_fee,
        organizer_amount: retreat.organizer_amount,
        currency: retreat.currency,
        status: 'pending_payment',
        platform_payment_status: 'pending',
        remaining_payment_status: 'not_applicable',
      })
      .select('id')
      .single();

    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const eventTitle = locale === 'es' ? retreat.title_es : (retreat.title_en || retreat.title_es);

    let session;
    try {
      session = await createCheckoutSession({
        bookingId: booking.id,
        eventTitle,
        totalPrice: retreat.total_price,
        currency: retreat.currency,
        customerEmail: user.email!,
        locale,
        successUrl: `${appUrl}/${locale}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}?booking=${booking.id}&success=true`,
        cancelUrl: `${appUrl}/${locale}/${locale === 'es' ? 'retiro' : 'retreat'}/${retreat.slug}?cancelled=true`,
      });
    } catch (stripeError) {
      console.error('Stripe checkout session error:', stripeError);
      // No dejar la reserva huérfana en pending_payment: bloquearía reintentos
      await admin.from('bookings').delete().eq('id', booking.id);
      return NextResponse.json({
        error: locale === 'es'
          ? 'No se pudo iniciar el pago. Inténtalo de nuevo en unos minutos.'
          : 'Could not start the payment. Please try again in a few minutes.',
      }, { status: 502 });
    }

    await admin
      .from('bookings')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', booking.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Reserve upcoming dates of a recurring series ────────────────────────────
// Crea una reserva sin pago (`reserved_no_payment`) por cada ocurrencia futura
// publicada con plaza libre en la que el usuario no esté ya inscrito. Si
// `selectedIds` llega, solo esas fechas (calendario); si no, todas. El pago
// (cuando el cobro online esté activo) se completa por fecha desde Mis reservas.

async function handleReserveSeries(
  seriesId: string,
  user: { id: string; email?: string },
  locale: 'es' | 'en',
  selectedIds: string[] | null = null,
) {
  const admin = createAdminSupabase();

  const { data: series } = await admin
    .from('retreat_series')
    .select('id, is_active, organizer_id')
    .eq('id', seriesId)
    .maybeSingle();
  if (!series) {
    return NextResponse.json({ error: locale === 'es' ? 'Serie no encontrada' : 'Series not found' }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);
  let occQuery = admin
    .from('retreats')
    .select('id, title_es, title_en, organizer_id, total_price, platform_fee, organizer_amount, currency, confirmation_type, sla_hours, start_date, min_attendees, max_attendees, confirmed_bookings')
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .gte('start_date', today)
    .lte('start_date', addDaysIso(today, SERIES_BOOKING_HORIZON_DAYS))
    .order('start_date', { ascending: true });
  if (selectedIds && selectedIds.length > 0) {
    occQuery = occQuery.in('id', selectedIds);
  }
  const { data: occurrences } = await occQuery;

  if (!occurrences || occurrences.length === 0) {
    return NextResponse.json({
      error: locale === 'es' ? 'No hay fechas próximas disponibles en esta serie' : 'No upcoming dates available in this series',
    }, { status: 400 });
  }

  const occIds = occurrences.map((o: { id: string }) => o.id);

  // Fechas donde el usuario ya tiene reserva activa
  const { data: mine } = await admin
    .from('bookings')
    .select('retreat_id')
    .eq('attendee_id', user.id)
    .in('retreat_id', occIds)
    .in('status', [...ACTIVE_ENROLLMENT_STATUSES]);
  const alreadyBooked = new Set((mine || []).map((b: { retreat_id: string }) => b.retreat_id));

  // Holds que ocupan plaza pero no están en confirmed_bookings
  const { data: holds } = await admin
    .from('bookings')
    .select('retreat_id')
    .in('retreat_id', occIds)
    .in('status', [...HOLD_ENROLLMENT_STATUSES]);
  const holdCount = new Map<string, number>();
  for (const h of holds || []) {
    holdCount.set(h.retreat_id as string, (holdCount.get(h.retreat_id as string) || 0) + 1);
  }

  const paymentsEnabled = isOnlinePaymentEnabled();
  const createdDates: string[] = [];
  let skippedFull = 0;
  let firstBookingNumber = '';

  for (const occ of occurrences) {
    if (alreadyBooked.has(occ.id)) continue;

    const enrolled = enrolledFromConfirmedAndHolds(occ.confirmed_bookings, holdCount.get(occ.id) || 0);
    if ((occ.max_attendees ?? 0) > 0 && enrolled >= (occ.max_attendees ?? 0)) {
      skippedFull++;
      continue;
    }

    const isManual = occ.confirmation_type === 'manual';
    // Con cobro activo, mínimo 1 y confirmación automática la reserva individual
    // cobraría al momento; en la inscripción de serie se aplaza con deadline para
    // reutilizar la maquinaria de «pagar reserva existente» + crons de plazo.
    const payDeadline = paymentsEnabled && !isManual && (occ.min_attendees ?? 1) <= 1
      ? computePaymentDeadline(occ.start_date as string)
      : null;

    const bookingNumber = generateBookingNumber();
    const { error: insErr } = await admin
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        retreat_id: occ.id,
        attendee_id: user.id,
        organizer_id: occ.organizer_id,
        total_price: occ.total_price,
        platform_fee: occ.platform_fee,
        organizer_amount: occ.organizer_amount,
        currency: occ.currency,
        status: 'reserved_no_payment',
        platform_payment_status: 'pending',
        remaining_payment_status: 'not_applicable',
        sla_deadline: isManual
          ? new Date(Date.now() + (occ.sla_hours || 48) * 60 * 60 * 1000).toISOString()
          : null,
        payment_deadline: payDeadline ? payDeadline.toISOString() : null,
      });

    if (insErr) {
      // 23505 = unique active booking (race); skip that date
      console.error('[checkout/series] error insertando reserva', occ.id, insErr.message);
      continue;
    }
    if (!firstBookingNumber) firstBookingNumber = bookingNumber;
    createdDates.push(occ.start_date as string);
    holdCount.set(occ.id, (holdCount.get(occ.id) || 0) + 1);
  }

  if (createdDates.length === 0) {
    return NextResponse.json({
      error: locale === 'es'
        ? (skippedFull > 0 ? 'No quedan plazas en las próximas fechas' : 'Ya estás inscrito en todas las próximas fechas')
        : (skippedFull > 0 ? 'No spots left on the upcoming dates' : 'You are already enrolled in all upcoming dates'),
    }, { status: 409 });
  }

  const master = occurrences[0];
  const eventTitle = locale === 'es' ? master.title_es : (master.title_en || master.title_es);
  const isManualSeries = master.confirmation_type === 'manual';

  // Email resumen al asistente (uno solo para toda la serie)
  try {
    await sendSeriesReservationEmail({
      to: user.email!,
      locale,
      eventTitle,
      bookingNumber: firstBookingNumber,
      dates: createdDates,
      manualConfirmation: isManualSeries,
      launchNoPayment: !paymentsEnabled,
    });
  } catch (e) { console.error('sendSeriesReservationEmail failed:', e); }

  // Aviso único al organizador
  try {
    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('user_id, profiles!user_id(email, preferred_locale)')
      .eq('id', master.organizer_id)
      .single();
    const orgUser = orgProfile?.profiles as any;
    const { data: attendeeProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    if (orgUser?.email) {
      await sendNewBookingToOrganizerEmail({
        to: orgUser.email,
        locale: (orgUser.preferred_locale || 'es') as 'es' | 'en',
        bookingNumber: firstBookingNumber,
        eventTitle: master.title_es,
        attendeeName: attendeeProfile?.full_name || 'Asistente',
        requiresConfirmation: isManualSeries,
        slaHours: isManualSeries ? (master.sla_hours || 48) : undefined,
        noPaymentHold: !paymentsEnabled && !isManualSeries,
        datesCount: createdDates.length,
      });
    }
  } catch (e) { console.error('sendNewBookingToOrganizerEmail (series) failed:', e); }

  return NextResponse.json({
    reserved: true,
    series: true,
    datesBooked: createdDates.length,
    requested: isManualSeries,
  });
}

// ─── Handle payment for an existing reserved_no_payment booking ──────────────

async function handlePayExistingBooking(
  bookingId: string,
  user: { id: string; email?: string },
  locale: 'es' | 'en',
) {
  if (!isOnlinePaymentEnabled()) {
    return NextResponse.json({
      error: locale === 'es'
        ? 'El pago online aún no está disponible. Tu plaza sigue reservada; te avisaremos por email cuando puedas pagar en Retiru.'
        : 'Online payment is not available yet. Your spot remains reserved; we\u2019ll email you when you can pay on Retiru.',
    }, { status: 503 });
  }

  const admin = createAdminSupabase();

  const { data: booking, error } = await admin
    .from('bookings')
    .select(`
      id, booking_number, retreat_id, attendee_id, total_price, platform_fee,
      organizer_amount, currency, payment_deadline, status, organizer_approved_at,
      retreats!retreat_id(title_es, title_en, slug, confirmation_type, sla_hours)
    `)
    .eq('id', bookingId)
    .eq('attendee_id', user.id)
    .eq('status', 'reserved_no_payment')
    .single();

  if (error || !booking) {
    return NextResponse.json({
      error: locale === 'es'
        ? 'Reserva no encontrada o ya pagada'
        : 'Booking not found or already paid',
    }, { status: 404 });
  }

  const retreat = booking.retreats as any;

  // Confirmación manual: no se puede pagar hasta que el organizador apruebe
  if (retreat?.confirmation_type === 'manual' && !booking.organizer_approved_at) {
    return NextResponse.json({
      error: locale === 'es'
        ? 'Tu solicitud aún está pendiente de aprobación del organizador'
        : 'Your request is still awaiting the organizer\u2019s approval',
    }, { status: 403 });
  }

  if (booking.payment_deadline && new Date(booking.payment_deadline) < new Date()) {
    return NextResponse.json({
      error: locale === 'es'
        ? 'El plazo de pago ha expirado. Tu plaza ha sido liberada.'
        : 'Payment deadline has expired. Your spot has been released.',
    }, { status: 410 });
  }

  await admin
    .from('bookings')
    .update({
      status: 'pending_payment',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const eventTitle = locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es);

  let session;
  try {
    session = await createCheckoutSession({
      bookingId: booking.id,
      eventTitle: eventTitle || 'Retiro',
      totalPrice: booking.total_price,
      currency: booking.currency,
      customerEmail: user.email!,
      locale,
      successUrl: `${appUrl}/${locale}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}?booking=${booking.id}&success=true`,
      cancelUrl: `${appUrl}/${locale}/${locale === 'es' ? 'retiro' : 'retreat'}/${retreat?.slug || ''}?cancelled=true`,
    });
  } catch (stripeError) {
    console.error('Stripe checkout session error (pay existing):', stripeError);
    // Devolver la reserva a su estado anterior para que pueda reintentar
    await admin
      .from('bookings')
      .update({ status: 'reserved_no_payment', sla_deadline: null, updated_at: new Date().toISOString() })
      .eq('id', bookingId);
    return NextResponse.json({
      error: locale === 'es'
        ? 'No se pudo iniciar el pago. Inténtalo de nuevo en unos minutos.'
        : 'Could not start the payment. Please try again in a few minutes.',
    }, { status: 502 });
  }

  await admin
    .from('bookings')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', bookingId);

  return NextResponse.json({ url: session.url });
}

// ─── Trigger min viable reached: set deadlines + notify ──────────────────────

async function triggerMinViableReached(
  admin: ReturnType<typeof createAdminSupabase>,
  retreat: any,
  locale: 'es' | 'en',
) {
  const deadline = computePaymentDeadline(retreat.start_date);
  const deadlineISO = deadline.toISOString();
  const deadlineStr = formatDeadlineForEmail(deadline, locale);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const isManual = retreat.confirmation_type === 'manual';

  // Set payment_deadline on reserved_no_payment bookings for this retreat.
  // En confirmación manual solo pagan las solicitudes ya aprobadas por el
  // organizador; el resto recibirá su enlace al ser aprobadas.
  let updateQuery = admin
    .from('bookings')
    .update({ payment_deadline: deadlineISO, updated_at: new Date().toISOString() })
    .eq('retreat_id', retreat.id)
    .eq('status', 'reserved_no_payment');
  if (isManual) updateQuery = updateQuery.not('organizer_approved_at', 'is', null);
  await updateQuery;

  // Fetch those bookings to send emails
  let fetchQuery = admin
    .from('bookings')
    .select('id, booking_number, attendee_id, total_price, profiles!attendee_id(email, preferred_locale)')
    .eq('retreat_id', retreat.id)
    .eq('status', 'reserved_no_payment');
  if (isManual) fetchQuery = fetchQuery.not('organizer_approved_at', 'is', null);
  const { data: reservedBookings } = await fetchQuery;

  const eventTitleEs = retreat.title_es;
  const eventTitleEn = retreat.title_en || retreat.title_es;

  for (const bk of reservedBookings || []) {
    const profile = bk.profiles as any;
    if (!profile?.email) continue;
    const bkLocale = (profile.preferred_locale || 'es') as 'es' | 'en';
    const payUrl = `${appUrl}/${bkLocale}/${bkLocale === 'es' ? 'mis-reservas' : 'my-bookings'}?pay=${bk.id}`;
    try {
      await sendMinViableReachedEmail({
        to: profile.email,
        locale: bkLocale,
        eventTitle: bkLocale === 'es' ? eventTitleEs : eventTitleEn,
        bookingNumber: bk.booking_number,
        deadline: formatDeadlineForEmail(deadline, bkLocale),
        payUrl,
        totalPrice: bk.total_price,
      });
    } catch (e) { console.error('sendMinViableReachedEmail failed:', e); }
  }

  // Notify organizer
  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('user_id, profiles!user_id(email, preferred_locale)')
    .eq('id', retreat.organizer_id)
    .single();

  const orgUser = orgProfile?.profiles as any;
  if (orgUser?.email) {
    const orgLocale = (orgUser.preferred_locale || 'es') as 'es' | 'en';
    const { count: totalReserved } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('retreat_id', retreat.id)
      .eq('status', 'reserved_no_payment');

    try {
      await sendMinViableReachedToOrganizerEmail({
        to: orgUser.email,
        locale: orgLocale,
        eventTitle: orgLocale === 'es' ? eventTitleEs : eventTitleEn,
        minAttendees: retreat.min_attendees ?? 1,
        reservedCount: (totalReserved ?? 0) + (retreat.confirmed_bookings ?? 0),
        deadline: deadlineStr,
      });
    } catch (e) { console.error('sendMinViableReachedToOrganizerEmail failed:', e); }
  }
}
