// ============================================================================
// RETIRU · Conditions — /en/condiciones
// How pricing works (full payment model) with tiered commissions
// ============================================================================

import Link from 'next/link';
import { conditionsEN } from '@/lib/seo/page-metadata';

export const metadata = conditionsEN;

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
            The organizer sets the <strong>PVP</strong> (listed price per person, minimum €50): that is what you see on the page, with <strong>no extra surcharges</strong>. For most retreats, when booking <strong>you pay 100% of the PVP by card</strong> via Stripe in one step. If the retreat has a minimum group size that is not yet met, you may reserve a spot without paying until the minimum is reached; you will then receive a link to pay within the stated deadline.
          </p>

          <div className="bg-sand-100 rounded-2xl p-6 md:p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-bold shrink-0">✓</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Payment when booking (or after minimum is met)</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    When immediate payment applies, you pay the full PVP by card (Stripe) in one step. If the retreat has a minimum group size that is not yet met, you first hold a spot without paying and pay the PVP within the deadline we send you. No hidden surcharges on the listed price.
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
            Retiru charges a <strong>progressive commission</strong> included in the PVP set by the organizer, so new organizers can try the platform risk-free:
          </p>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1">1st retreat</p>
              <p className="text-3xl font-bold text-emerald-700">0%</p>
              <p className="text-sm text-emerald-800 mt-1">100% for the organizer</p>
            </div>
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700 mb-1">2nd retreat</p>
              <p className="text-3xl font-bold text-sky-700">10%</p>
              <p className="text-sm text-sky-800 mt-1">90% for the organizer</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">3rd retreat onward</p>
              <p className="text-3xl font-bold text-amber-700">20%</p>
              <p className="text-sm text-amber-800 mt-1">80% for the organizer</p>
            </div>
          </div>

          <div className="bg-terracotta-50 border border-terracotta-100 rounded-2xl p-6 md:p-8">
            <ul className="space-y-3 text-[15px] leading-relaxed">
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>No subscription to publish:</strong> there is no fixed fee for the dashboard. The commission is progressive (0% → 10% → 20% of the PVP) and the attendee pays no surcharges.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>The attendee pays the listed PVP</strong> (no surcharges on top). If the retreat has a minimum group size, they may hold a spot without paying until it is met, then pay within the deadline.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>Retiru transfers the organizer&apos;s share</strong> once the booking is confirmed.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>Each retreat permanently keeps its tier.</strong> Your 1st retreat is always at 0%, the 2nd at 10%, regardless of how many you publish later.</span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Practical examples
          </h2>

          <div className="space-y-6">
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6 md:p-8">
              <p className="text-sm font-semibold text-emerald-700 mb-4">Your first retreat — €500 (0% commission)</p>
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span>The attendee pays</span>
                  <span className="text-xl font-bold">€500</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span className="flex items-center gap-2">
                    The organizer receives
                    <span className="text-[11px] font-semibold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">100%</span>
                  </span>
                  <span className="font-bold text-emerald-700">€500</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="flex items-center gap-2">
                    Retiru commission
                    <span className="text-[11px] font-semibold uppercase bg-sand-100 text-muted-foreground px-2 py-0.5 rounded-full">0%</span>
                  </span>
                  <span className="font-bold text-muted-foreground">€0</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-sky-200 rounded-2xl p-6 md:p-8">
              <p className="text-sm font-semibold text-sky-700 mb-4">Your second retreat — €500 (10% commission)</p>
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span>The attendee pays</span>
                  <span className="text-xl font-bold">€500</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span className="flex items-center gap-2">
                    The organizer receives
                    <span className="text-[11px] font-semibold uppercase bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">90%</span>
                  </span>
                  <span className="font-bold text-sky-700">€450</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="flex items-center gap-2">
                    Retiru commission
                    <span className="text-[11px] font-semibold uppercase bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">10%</span>
                  </span>
                  <span className="font-bold text-sky-600">€50</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-sand-200 rounded-2xl p-6 md:p-8">
              <p className="text-sm font-semibold text-muted-foreground mb-4">Third retreat onward — €500 (20% commission)</p>
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span>The attendee pays</span>
                  <span className="text-xl font-bold">€500</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span className="flex items-center gap-2">
                    The organizer receives
                    <span className="text-[11px] font-semibold uppercase bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">80%</span>
                  </span>
                  <span className="font-bold">€400</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="flex items-center gap-2">
                    Retiru commission
                    <span className="text-[11px] font-semibold uppercase bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full">20%</span>
                  </span>
                  <span className="font-bold text-terracotta-600">€100</span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            In every case the attendee pays €500. Retiru transfers the organizer&apos;s net and retains its commission based on the tier. One single payment, no additional costs.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Center directory
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Monthly fee:</strong> Being listed in the directory costs <strong>€20/month</strong>. During the launch phase, selected centers enjoy <strong>6 months of courtesy</strong> with all benefits active: SEO visibility, reviews, direct contact and management from your dashboard.
            </p>
            <p>
              <strong className="text-foreground">After the courtesy period:</strong> Centers that wish to keep their listing active move to the €20/month fee. If you don&apos;t wish to continue, your listing will be deactivated with no commitment.
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
              <strong className="text-foreground">Cancellation by attendee:</strong> Refunds follow each organizer&apos;s cancellation policy (percentages and deadlines applied to the total amount you paid). Check the retreat page before booking. If a refund applies, you receive that amount in full to your original payment method. Retiru&apos;s remuneration in these cases is governed by our agreement with the organizer and does not mean an extra deduction from your refund.
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
