-- 053: Confirmación manual sin pago por adelantado
-- Las reservas de retiros con confirmation_type='manual' entran como
-- reserved_no_payment (solicitud). El organizador aprueba o rechaza ANTES
-- de que exista pago; al aprobar (y con el mínimo cubierto) se envía el
-- enlace de pago con plazo, reutilizando la maquinaria de payment_deadline.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS organizer_approved_at timestamptz;

COMMENT ON COLUMN bookings.organizer_approved_at IS
  'Momento en que el organizador aprobó la solicitud (flujo de confirmación manual sin pago por adelantado). NULL = sin aprobar o no aplica.';
