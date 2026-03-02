// /api/checkout — Create Stripe checkout session
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, priceInCents, attendeeName, attendeeEmail, locale = 'es' } = body;

    if (!eventId || !priceInCents || !attendeeEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // TODO: Validate event exists and has availability via Supabase
    // TODO: Create Stripe checkout session
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'payment',
    //   payment_method_types: ['card'],
    //   line_items: [{ price_data: { currency: 'eur', product_data: { name: `Cuota gestión - ${eventId}` }, unit_amount: priceInCents }, quantity: 1 }],
    //   customer_email: attendeeEmail,
    //   success_url: `${process.env.NEXT_PUBLIC_URL}/${locale}/mis-reservas?success=true`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_URL}/${locale}/retiros/${eventId}?cancelled=true`,
    //   metadata: { eventId, attendeeName, attendeeEmail },
    // })

    return NextResponse.json({
      // url: session.url,
      message: 'Checkout session placeholder — integrate Stripe keys to activate',
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
