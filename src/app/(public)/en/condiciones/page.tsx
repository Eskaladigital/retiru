// ============================================================================
// RETIRU · Conditions — /en/condiciones
// How pricing works, how the app receives remuneration
// ============================================================================

import Link from 'next/link';

export const metadata = {
  title: 'Conditions and pricing',
  description: 'How pricing works on Retiru. What you pay, to whom, and how the platform is funded. Full transparency.',
};

export default function CondicionesPageEn() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/en" className="hover:text-terracotta-600">Home</Link>
        <span>›</span>
        <span className="text-foreground">Conditions</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
        Conditions and pricing
      </h1>
      <p className="text-muted-foreground mb-12">
        Full transparency on how charges and Retiru&apos;s remuneration work
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            How charges work
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            The organizer sets the total price of the retreat (minimum €50). That&apos;s the price you see on the retreat page. When booking, the attendee makes two separate payments:
          </p>

          <div className="bg-sand-100 rounded-2xl p-6 md:p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Immediate payment to Retiru (20%)</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    Charged by card via Stripe when booking. Retiru issues an invoice to the attendee. This payment secures your spot and covers intermediation and booking management.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Payment to organizer (80%)</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    Paid directly to the organizer before the retreat starts, by transfer or whichever method they specify. Outside the platform. Retiru does not handle this payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            How Retiru receives its remuneration
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            Retiru is funded exclusively by the 20% paid by the attendee when booking. It is our only source of income.
          </p>

          <div className="bg-terracotta-50 border border-terracotta-100 rounded-2xl p-6 md:p-8">
            <ul className="space-y-3 text-[15px] leading-relaxed">
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>The organizer pays nothing:</strong> no commission, no subscription, no fee. Publishing and managing retreats is 100% free.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>The attendee pays 20% to Retiru</strong> as an intermediation and booking management fee. This covers the platform, payment processing, support and development.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>The 80% goes in full to the organizer.</strong> Retiru does not retain a single euro from that portion.</span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Practical example
          </h2>
          <div className="bg-white border-2 border-sand-200 rounded-2xl p-6 md:p-8">
            <p className="text-sm font-semibold text-muted-foreground mb-4">€500 retreat</p>
            <div className="space-y-3 text-[15px]">
              <div className="flex justify-between items-center py-3 border-b border-sand-100">
                <span className="flex items-center gap-2">
                  Booking management fee
                  <span className="text-[11px] font-semibold uppercase bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full">Retiru</span>
                </span>
                <span className="font-bold text-terracotta-600">€100</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-sand-100">
                <span className="flex items-center gap-2">
                  Payment to organizer
                  <span className="text-[11px] font-semibold uppercase bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Organizer</span>
                </span>
                <span className="font-bold">€400</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-foreground">
                <span className="font-semibold">Total retreat price</span>
                <span className="text-xl font-bold">€500</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              When you book you pay €100 to Retiru. The remaining €400 you pay directly to the organizer before the retreat starts. No hidden costs.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Bookings, confirmation and cancellations
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Booking:</strong> Your spot is secured after paying the 20%. If the retreat has instant confirmation, your spot is confirmed immediately. If it requires manual confirmation, the organizer has a deadline (default 48h) to confirm or reject.
            </p>
            <p>
              <strong className="text-foreground">Cancellation by attendee:</strong> The 20% fee paid to Retiru is non-refundable. Refunds of the 80% (if applicable) depend on each retreat&apos;s cancellation policy.
            </p>
            <p>
              <strong className="text-foreground">Cancellation by organizer:</strong> You will receive a full refund of the 20% automatically.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/en/legal/terminos" className="text-sm text-terracotta-600 hover:underline">
          Legal terms
        </Link>
        <Link href="/en/legal/privacidad" className="text-sm text-terracotta-600 hover:underline">
          Privacy policy
        </Link>
        <Link href="/en/help" className="text-sm text-terracotta-600 hover:underline">
          Help center
        </Link>
      </div>
    </div>
  );
}
