-- Una sola reserva activa por asistente y ocurrencia (evita doble inscripción por race).
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_one_active_per_attendee_retreat
  ON public.bookings (retreat_id, attendee_id)
  WHERE status IN (
    'reserved_no_payment',
    'pending_payment',
    'pending_confirmation',
    'confirmed'
  );
