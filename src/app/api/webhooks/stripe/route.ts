// /api/webhooks/stripe — Stripe webhook handler
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    // TODO: Verify webhook signature
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

    // switch (event.type) {
    //   case 'checkout.session.completed':
    //     // Create booking in Supabase
    //     // Send confirmation email
    //     // Notify organizer
    //     break;
    //   case 'charge.refunded':
    //     // Update booking status
    //     // Send refund confirmation email
    //     break;
    // }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}
