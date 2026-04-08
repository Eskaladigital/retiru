// ============================================================================
// RETIRU · Conditions — /en/condiciones
// How pricing works (full payment model)
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
            The organizer sets the total price of the retreat (minimum €50). That&apos;s the price you see on the retreat page. When booking, <strong>you pay 100% of the price by card</strong> via Stripe in a single step. No additional payments needed.
          </p>

          <div className="bg-sand-100 rounded-2xl p-6 md:p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-bold shrink-0">✓</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Single payment when booking</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    The full amount is charged by card via Stripe. Your spot is confirmed instantly (or pending organizer confirmation, depending on the retreat). No surprises or later payments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            How Retiru is funded
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            Retiru charges a commission included in the price set by the organizer. This is how we fund the platform, support and development.
          </p>

          <div className="bg-terracotta-50 border border-terracotta-100 rounded-2xl p-6 md:p-8">
            <ul className="space-y-3 text-[15px] leading-relaxed">
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>The organizer pays no direct commission:</strong> publishing and managing retreats is free. Retiru retains its commission from the total price set by the organizer.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>The attendee pays the listed price.</strong> No extra fees or hidden costs.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>Retiru transfers the organizer&apos;s share</strong> once the booking is confirmed.</span>
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
                <span>The attendee pays</span>
                <span className="text-xl font-bold">€500</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-sand-100">
                <span className="flex items-center gap-2">
                  The organizer receives
                  <span className="text-[11px] font-semibold uppercase bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Organizer</span>
                </span>
                <span className="font-bold">€400</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-sand-100">
                <span className="flex items-center gap-2">
                  Retiru commission
                  <span className="text-[11px] font-semibold uppercase bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full">Retiru</span>
                </span>
                <span className="font-bold text-terracotta-600">€100</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              When you book you pay €500. Retiru transfers €400 to the organizer and retains €100 as a management fee. One single payment, no additional costs.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Center directory
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Free initial membership:</strong> Selected centers receive 6 months of free membership. During this period, your listing is active with all benefits: SEO visibility, reviews, direct contact and management from your dashboard.
            </p>
            <p>
              <strong className="text-foreground">After the free period:</strong> We&apos;ll assess the directory&apos;s impact on your business together. If you wish to continue, you&apos;ll move to an affordable monthly fee. If not, your listing will be deactivated with no commitment.
            </p>
            <p>
              <strong className="text-foreground">Claim your center:</strong> If your center already appears in the directory, you can claim it by creating an account and clicking &quot;Claim this center&quot; on your listing. Our team will verify your identity as the owner.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Bookings, confirmation and cancellations
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Booking:</strong> Your spot is secured after paying the full amount. If the retreat has instant confirmation, your spot is confirmed immediately. If it requires manual confirmation, the organizer has a deadline (default 48h) to confirm or reject.
            </p>
            <p>
              <strong className="text-foreground">Cancellation by attendee:</strong> Refunds depend on each retreat&apos;s cancellation policy. Check the details on the retreat page before booking.
            </p>
            <p>
              <strong className="text-foreground">Cancellation by organizer:</strong> You will receive a full refund automatically.
            </p>
            <p>
              <strong className="text-foreground">Rejection by organizer:</strong> If the organizer doesn&apos;t confirm your booking within the deadline, you&apos;ll receive a full automatic refund.
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
