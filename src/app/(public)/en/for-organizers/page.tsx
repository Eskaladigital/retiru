// ============================================================================
// RETIRU · FOR CENTERS & ORGANIZERS — /en/for-organizers
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { forOrganizersEN } from '@/lib/seo/page-metadata';
import { jsonLdFAQ, jsonLdScript } from '@/lib/seo';
export const metadata: Metadata = forOrganizersEN;

const CENTER_BENEFITS = [
  { icon: '📍', title: 'Directory listing', desc: 'Detailed profile with hours, services, photos, reviews and map location.' },
  { icon: '🌐', title: 'SEO visibility', desc: 'Your center appears in Google searches. Bilingual ES/EN optimized profile.' },
  { icon: '⭐', title: 'Verified reviews', desc: 'Users can rate your center. Good reviews boost your visibility.' },
  { icon: '✅', title: 'Verified center badge', desc: 'A verification badge builds trust with potential clients.' },
  { icon: '📞', title: 'Direct contact', desc: 'Interested people contact you directly: phone, email, website and social media.' },
  { icon: '📅', title: 'Publish events', desc: 'Besides the directory, publish retreats and events from your center profile.' },
];

const ORGANIZER_FEATURES = [
  { icon: '📝', title: 'Creation Wizard', desc: 'Publish your retreat step by step with real-time preview.' },
  { icon: '👥', title: 'Attendee CRM', desc: 'Data, forms, internal notes and segmentation of your attendees.' },
  { icon: '💬', title: 'Integrated Messaging', desc: '1-on-1 chat and mass messages with predefined templates.' },
  { icon: '📱', title: 'QR Check-in', desc: 'Attendance list and QR codes per booking for the day of the retreat.' },
  { icon: '📈', title: 'Analytics', desc: 'Views, conversions, bookings and cancellations for each retreat.' },
  { icon: '⭐', title: 'Review Management', desc: 'See and respond publicly to your attendees\' reviews.' },
];

const FAQS = [
  { q: 'Is there a subscription or listing fee?', a: "No: publishing and the dashboard have no fixed fee. Plus, your first retreat is completely free (0% commission); the second has a 10% fee; and from the third onward the standard commission is 20% of the PVP. The attendee always pays the PVP with no hidden surcharges." },
  { q: 'What price should I enter for my retreat?', a: 'The final per-person price you want on the listing—that is the PVP. The form shows the breakdown based on your commission tier (0%, 10% or 20%).' },
  { q: 'How does the center directory work?', a: 'Your center appears in our directory with a full profile: photos, services, hours, location and reviews. Users can find you by area, discipline type or name. If your center is already on Retiru, claim it from its listing. If it is not listed, logged-in users can propose it from "My centers"; our team reviews it before publication.' },
  { q: 'How much does a directory listing cost?', a: 'The directory has a monthly fee of €20/month. During the launch phase, selected centers enjoy 6 months of courtesy. After that, centers that wish to keep their listing active move to the monthly fee.' },
  { q: 'Can I be both a center and an organizer?', a: 'Yes. If you\'re a center that organizes retreats or events, you can have your directory listing and also publish events with all the panel tools.' },
  { q: 'How do I get paid?', a: 'The attendee pays the PVP through the platform (or holds a spot without payment if you set a minimum group size that is not yet reached). When card payment applies, Retiru retains the commission for your tier (0%, 10% or 20%) and transfers the net per your settlement agreement.' },
  { q: 'Do I need to get verified to publish retreats?', a: 'Yes, in two parts. First you must accept the organizer agreement with Retiru in "My events" before you can create events. For a retreat to go live, our team must validate your profile with the documents you upload (ID, business registration, civil liability insurance, tax and bank details) and approve the retreat content. You can work on your retreat and upload documents in parallel; the retreat is only published once both checks are complete.' },
  { q: 'Can I create a retreat before my organizer profile is validated?', a: 'Yes. After accepting the agreement you can save drafts and send them for review while you upload documents. We will review the retreat, but it cannot be approved or published until your organizer profile has been documentally verified.' },
  { q: 'How do I claim or add my center?', a: 'If your center is already listed, search for it and use "Claim this center" (or sign up first). If it is not listed, sign in, go to "My centers", choose "Propose new center" and pick the place in Google Maps; we review the proposal and, once approved, you can manage the listing.' },
  { q: 'What if an attendee cancels?', a: "You set the cancellation policy (deadlines and percentages on the amount paid). If a refund applies, the attendee receives that amount in full. Compensation for Retiru's commission in those cases is governed by our commercial agreement with you—not as an extra deduction from the attendee's refund." },
];

export default function ForOrganizersPageEN() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative min-h-[70vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-para-organizadores.png"
            alt="Yoga retreat organizer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] md:via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:via-[rgba(254,253,251,0.8)] max-md:to-[rgba(254,253,251,0.4)]" />
        </div>
        <div className="container-wide relative z-10 py-12 md:py-16">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200 text-sage-700 text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-sage-400 rounded-full" />
              For centers &amp; organizers
            </div>
            <h1 className="font-serif text-[clamp(36px,6vw,56px)] leading-[1.2] tracking-[-0.01em] text-foreground mb-5">
              Grow your project<br />
              <span className="text-sage-700">with Retiru</span>
            </h1>
            <p className="text-lg text-[#7a6b5d] leading-[1.7] mb-9 max-w-[560px]">
              Whether you run a yoga, meditation or ayurveda center, or you organize retreats and events in that space,
              Retiru is your platform. <strong className="font-semibold text-foreground">No subscription</strong> to publish.
              Your <strong className="font-semibold text-foreground">first retreat is free</strong> (0% commission),
              the second at <strong className="font-semibold text-foreground">10%</strong>,
              and from the third onward the standard <strong className="font-semibold text-foreground">20%</strong> fee applies.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#centers" className="btn-primary bg-sage-700 hover:bg-sage-800 px-8 py-4 text-base text-white">
                I have a center
              </a>
              <a href="#organizers" className="btn-primary bg-white hover:bg-sand-50 border border-sand-300 px-8 py-4 text-base text-foreground">
                I organize events
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CENTERS ═══ */}
      <section id="centers" className="py-20 bg-cream-100">
        <div className="container-wide">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏢</span>
            <span className="text-sm font-bold uppercase tracking-widest text-sage-600">For centers</span>
          </div>
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3">
            Put your center on the map
          </h2>
          <p className="text-[#7a6b5d] max-w-2xl mb-12">
            If you have a yoga, meditation or ayurveda center,
            we include you in our directory so thousands of people can find you.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {CENTER_BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-sand-200 bg-white p-6 hover:shadow-soft transition-shadow">
                <span className="text-2xl mb-3 block">{b.icon}</span>
                <h3 className="mb-2 font-semibold">{b.title}</h3>
                <p className="text-sm text-[#7a6b5d] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-sage-800 to-sage-900 text-white p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="font-serif text-2xl font-bold mb-3">Is your center already on Retiru?</h3>
              <p className="text-sage-300 leading-relaxed max-w-lg">
                Search for your center in our directory and claim it to manage your listing, respond to reviews and publish events.
                Not listed yet? Sign in and propose it from &quot;My centers&quot; (we review before publishing) or contact us for help.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link href="/en/centers" className="bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-center">
                📍 Find my center
              </Link>
              <Link href="/en/contact" className="text-sage-400 text-xs text-center hover:text-sage-200 transition-colors">
                Can&apos;t find it? Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ORGANIZERS ═══ */}
      <section id="organizers" className="py-20">
        <div className="container-wide">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">✨</span>
            <span className="text-sm font-bold uppercase tracking-widest text-terracotta-500">For organizers</span>
          </div>
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3">
            Publish your retreats <span className="text-terracotta-600">with no listing fee</span>
          </h2>
          <p className="text-[#7a6b5d] max-w-2xl mb-12">
            If you create yoga, meditation or ayurveda retreats and events, Retiru gives you a full management panel
            with no subscription or signup fee. Your <strong className="text-foreground">first retreat is free</strong> (0% commission); the second at 10%; from the third onward, 20% of the PVP. The breakdown is visible in the form before you publish.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white mb-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-300 bg-sand-50">
                  <th className="py-4 px-5 text-left font-semibold"></th>
                  <th className="py-4 px-5 text-center font-bold text-terracotta-600 text-lg">Retiru</th>
                  <th className="py-4 px-5 text-center text-[#7a6b5d]">BookRetreats</th>
                  <th className="py-4 px-5 text-center text-[#7a6b5d]">Others</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Subscription / listing fee', 'No (€0)', 'Yes / varies', 'Varies'],
                  ['Commission on sales (PVP)', '0% → 10% → 20%', '20–30%', '10–25%'],
                  ['First retreat free (no commission)', '✓', '✗', '✗'],
                  ['Management panel', 'Full, no fixed fee', 'Basic', 'Limited'],
                  ['Attendee CRM', '✓', '✗', '✗'],
                  ['Integrated messaging', '✓', 'Limited', '✗'],
                  ['QR Check-in', '✓', '✗', '✗'],
                  ['Bilingual ES/EN', '✓', 'EN only', 'Varies'],
                  ['Post-booking forms', '✓', '✗', '✗'],
                  ['Analytics', '✓', 'Basic', '✗'],
                ].map(([f, r, b, o], i) => (
                  <tr key={i} className="border-b border-sand-200 last:border-0">
                    <td className="py-3 px-5 font-medium">{f}</td>
                    <td className="py-3 px-5 text-center font-semibold text-sage-700">{r}</td>
                    <td className="py-3 px-5 text-center text-[#7a6b5d]">{b}</td>
                    <td className="py-3 px-5 text-center text-[#7a6b5d]">{o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tiered commission visual */}
          <div className="mb-12 rounded-2xl border-2 border-sand-200 bg-white p-6 md:p-8">
            <h3 className="font-serif text-xl font-bold text-foreground mb-6 text-center">Progressive commissions: start for free</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">1st retreat</p>
                <p className="text-4xl font-bold text-emerald-700">0%</p>
                <p className="text-sm text-emerald-800 mt-2">No commission. You receive <strong>100%</strong> of the PVP.</p>
              </div>
              <div className="rounded-xl bg-sky-50 border border-sky-200 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700 mb-2">2nd retreat</p>
                <p className="text-4xl font-bold text-sky-700">10%</p>
                <p className="text-sm text-sky-800 mt-2">Reduced commission. You receive <strong>90%</strong> of the PVP.</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">3rd retreat onward</p>
                <p className="text-4xl font-bold text-amber-700">20%</p>
                <p className="text-sm text-amber-800 mt-2">Standard commission. You receive <strong>80%</strong> of the PVP.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Each retreat permanently keeps its commission tier. No fine print.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {ORGANIZER_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-sand-200 bg-white p-6 hover:shadow-soft transition-shadow">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-[#7a6b5d] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section id="how-it-works" className="py-20 bg-cream-100">
        <div className="container-narrow">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold">How does it work for organizers?</h2>
          <div className="space-y-8">
            {[
              { s: '01', t: 'Create your account', d: 'Sign up with your email and verify your account. From "My events" you can start the organizer onboarding.' },
              { s: '02', t: 'Agreement & documents', d: 'In "My events" you accept the organizer agreement with Retiru. You then upload the required documents (ID, business registration, civil liability insurance, tax and bank details). Your profile stays pending validation until our team verifies it; in parallel you can already prepare your events.' },
              { s: '03', t: 'Build your retreat and send for review', d: 'Use the step-by-step wizard: cover image and up to eight photos (the cover is the main image in listings and at the top of the page; the rest form the gallery). You can generate the cover with AI or, if you add no photos, a cover is created automatically when you save. Add schedule, PVP per person (with on-screen commission breakdown), optional minimum attendees and cancellation policy. When ready, send the retreat for review.' },
              { s: '04', t: 'Validation, go-live & bookings', d: 'We validate your document profile and review the retreat for quality and consistency. A retreat only goes live when your organizer profile is verified and the retreat is approved (often within 24-48h per track once documents are complete). Once live, attendees book through the platform: Retiru retains the commission for your tier (0%, 10% or 20%) and settles the net per your settlement agreement.' },
            ].map(({ s, t, d }) => (
              <div key={s} className="flex gap-6 items-start">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta-600 text-lg font-bold text-white">{s}</span>
                <div>
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-[#7a6b5d] leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQs ═══ */}
      <section className="py-20">
        <div className="container-narrow">
          <h2 className="mb-10 text-center font-serif text-3xl font-bold">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <details key={i} className="group bg-white border border-sand-200 rounded-xl">
                <summary className="flex items-center justify-between p-5 font-semibold cursor-pointer [&::-webkit-details-marker]:hidden text-[15px]">
                  {q}
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90 text-[#a09383] shrink-0 ml-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </summary>
                <p className="px-5 pb-5 text-sm text-[#7a6b5d] leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(jsonLdFAQ(FAQS.map(({ q, a }) => ({ question: q, answer: a })))),
        }}
      />

      {/* ═══ Final CTA ═══ */}
      <section className="py-20 bg-gradient-to-br from-terracotta-600 to-terracotta-700 text-white text-center">
        <div className="container-narrow">
          <h2 className="font-serif text-3xl md:text-4xl font-bold">Join Retiru</h2>
          <p className="mx-auto mt-4 max-w-lg text-terracotta-100">
            Whether you&apos;re a yoga, meditation or ayurveda center or an organizer in that space, Retiru gives you the tools
            and visibility you need. No subscription to list; your first retreat is free, the second at 10%, then 20% standard.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/en/centers" className="inline-block bg-white text-terracotta-700 font-bold px-8 py-4 rounded-xl hover:bg-sand-100 transition-colors">
              I&apos;m a center — Find my listing
            </Link>
            <Link href="/en/register" className="inline-block bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-xl transition-colors">
              I&apos;m an organizer — Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
