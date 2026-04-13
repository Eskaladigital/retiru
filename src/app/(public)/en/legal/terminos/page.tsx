// ============================================================================
// RETIRU · Terms and conditions — /en/legal/terminos
// ============================================================================

import Link from 'next/link';
import { termsEN } from '@/lib/seo/page-metadata';

export const metadata = termsEN;

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
      <p className="text-muted-foreground mb-12">Last updated: April 2026</p>

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
                <span><strong>The organizer sets the PVP</strong> (listed price per person, minimum €50). That&apos;s what you see on the retreat page, with no surcharges added at checkout.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold shrink-0">2.</span>
                <span><strong>When payment is due, you pay the PVP by card</strong> via Stripe in one step (or within the deadline if you had reserved without payment until a minimum group size was met). Retiru settles the organizer&apos;s net share under our payout agreement—no second platform fee.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold shrink-0">3.</span>
                <span><strong>What you see is what you pay</strong> for the booking transaction: one charge, no hidden booking fees on top of the listed price.</span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-white rounded-xl border border-sand-200">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Example: €500 retreat</p>
              <div className="space-y-2 text-[15px]">
                <div className="flex justify-between">
                  <span>Commission (Retiru)</span>
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
              There is no subscription to publish. Commission is progressive: <strong>0%</strong> on the first retreat, <strong>10%</strong> on the second, <strong>20%</strong> from the third onward — always on the PVP paid by the guest. See our{' '}
              <Link href="/en/condiciones" className="text-terracotta-600 hover:underline font-medium">Terms &amp; pricing</Link>{' '}
              for detail and examples.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Bookings and confirmation
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground mb-4">
            When you book, your spot is secured after the required payment is completed (immediate PVP payment, or payment by the deadline after a no-payment hold when a minimum group size applies). If the retreat requires manual confirmation, the organizer has a deadline (default 48h) to confirm or reject. If it has instant confirmation, your spot is confirmed immediately.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Cancellations
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground mb-4">
            Refunds when you cancel depend on each retreat&apos;s cancellation policy (percentages and deadlines applied to the total amount you paid). If a refund applies under that policy, you receive that amount in full to your original payment method. Retiru&apos;s remuneration in cancellation cases is governed by our agreement with the organizer and is not an extra deduction from your refund. If the organizer cancels the retreat, you receive a full automatic refund of what you paid.
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
