// ============================================================================
// RETIRU · Terms and conditions — /en/legal/terminos
// ============================================================================

import Link from 'next/link';

export const metadata = {
  title: 'Terms and conditions',
  description: 'Retiru terms of use and service conditions. How pricing, bookings and payments work.',
};

export default function TerminosPageEn() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/en" className="hover:text-terracotta-600">Home</Link>
        <span>›</span>
        <span className="text-foreground">Terms and conditions</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
        Terms and conditions
      </h1>
      <p className="text-muted-foreground mb-12">Last updated: March 2025</p>

      <div className="prose prose-sand max-w-none space-y-12">
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            How prices work
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            At Retiru we want you to understand exactly what you pay and to whom. Our pricing model is 100% transparent.
          </p>

          <div className="bg-sand-100 rounded-2xl p-6 md:p-8 mb-6">
            <h3 className="font-semibold text-foreground mb-4">Price breakdown</h3>
            <ul className="space-y-3 text-[15px] leading-relaxed">
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold shrink-0">1.</span>
                <span><strong>The organizer sets the total price</strong> of the retreat (minimum €50). That&apos;s the price you see on the retreat page.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold shrink-0">2.</span>
                <span><strong>When you book, you pay 20% to Retiru</strong> as an intermediation and booking management fee. This payment is made by card via Stripe and Retiru will issue you an invoice.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold shrink-0">3.</span>
                <span><strong>The remaining 80% is paid directly to the organizer</strong> before the retreat starts, by transfer or whichever method they specify. Outside the platform.</span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-white rounded-xl border border-sand-200">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Example: €500 retreat</p>
              <div className="space-y-2 text-[15px]">
                <div className="flex justify-between">
                  <span>Booking fee (Retiru)</span>
                  <span className="font-bold text-terracotta-600">€100</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment to organizer</span>
                  <span className="font-bold">€400</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-sand-200 font-semibold">
                  <span>Total price</span>
                  <span>€500</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              The organizer pays no commission or subscription. Retiru is funded solely by the 20% paid by the attendee when booking.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Bookings and confirmation
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground mb-4">
            When you book, your spot is secured after paying the 20%. If the retreat requires manual confirmation, the organizer has a deadline (default 48h) to confirm or reject. If it has instant confirmation, your spot is confirmed immediately.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Cancellations
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground mb-4">
            The 20% fee paid to Retiru is non-refundable. Refunds of the 80% (if applicable) depend on each retreat&apos;s cancellation policy, which you can check before booking. If the organizer cancels the retreat, you will receive a full refund of the 20% automatically.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Contact
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            For questions about these terms: <a href="mailto:legal@retiru.com" className="text-terracotta-600 hover:underline">legal@retiru.com</a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/en/legal/privacidad" className="text-sm text-terracotta-600 hover:underline">
          Privacy policy
        </Link>
        <Link href="/en/legal/cookies" className="text-sm text-terracotta-600 hover:underline">
          Cookie policy
        </Link>
        <Link href="/en/help" className="text-sm text-terracotta-600 hover:underline">
          Help center
        </Link>
      </div>
    </div>
  );
}
