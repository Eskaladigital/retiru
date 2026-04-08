// ============================================================================
// RETIRU · Stripe server utilities
// ============================================================================

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

/**
 * Create a Stripe Checkout Session for a booking (full price)
 */
export async function createCheckoutSession({
  bookingId,
  eventTitle,
  totalPrice,
  currency,
  customerEmail,
  locale,
  successUrl,
  cancelUrl,
}: {
  bookingId: string;
  eventTitle: string;
  totalPrice: number;
  currency: string;
  customerEmail: string;
  locale: 'es' | 'en';
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    locale: locale === 'es' ? 'es' : 'en',
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(totalPrice * 100),
          product_data: {
            name: locale === 'es'
              ? `Reserva — ${eventTitle}`
              : `Booking — ${eventTitle}`,
            description: locale === 'es'
              ? `Reserva completa para ${eventTitle} a través de Retiru`
              : `Full booking for ${eventTitle} via Retiru`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      booking_id: bookingId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Issue a refund for a booking
 */
export async function issueRefund({
  paymentIntentId,
  amount,
  reason,
}: {
  paymentIntentId: string;
  amount?: number; // In EUR, not cents. If omitted = full refund
  reason?: string;
}) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount: Math.round(amount * 100) }),
    reason: 'requested_by_customer',
    metadata: { internal_reason: reason || '' },
  });

  return refund;
}
