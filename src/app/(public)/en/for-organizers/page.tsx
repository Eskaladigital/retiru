// ============================================================================
// RETIRU · FOR CENTERS & ORGANIZERS — /en/for-organizers
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { forOrganizersEN } from '@/lib/seo/page-metadata';
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
  { q: 'Is it really free for organizers?', a: 'Yes. We don\'t charge any commission or subscription to organizers. Our revenue comes from the 20% the attendee pays as a booking management fee.' },
  { q: 'How does the center directory work?', a: 'Your center appears in our directory with a full profile: photos, services, hours, location and reviews. Users can find you by area, discipline type or name. If your center is already on Retiru, claim it from its listing. If it is not listed, logged-in users can propose it from "My centers"; our team reviews it before publication.' },
  { q: 'How much does a directory listing cost?', a: 'We currently offer 6 months of free membership to selected centers. After that period, we\'ll assess the impact with you and you can continue with an affordable monthly fee.' },
  { q: 'Can I be both a center and an organizer?', a: 'Yes. If you\'re a center that organizes retreats or events, you can have your directory listing and also publish events with all the panel tools.' },
  { q: 'How do I get paid?', a: 'When someone books a retreat, they pay 20% to Retiru. You collect the remaining 80% directly from the attendee before the retreat, by bank transfer or your preferred method.' },
  { q: 'Do I need to get verified to publish retreats?', a: 'No documents required. Simply create your account, create your first retreat and our team will review it within 24-48h. Once your first retreat is approved, you become a verified organizer and can keep publishing.' },
  { q: 'How do I claim or add my center?', a: 'If your center is already listed, search for it and use "Claim this center" (or sign up first). If it is not listed, sign in, go to "My centers", choose "Propose new center" and pick the place in Google Maps; we review the proposal and, once approved, you can manage the listing.' },
  { q: 'What if an attendee cancels?', a: 'You configure your cancellation policy per retreat. Retiru handles refunds automatically according to that policy.' },
];

export default function ForOrganizersPageEN() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sage-800 via-sage-900 to-sage-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(200,90,48,0.15),transparent_70%)]" />
        <div className="container-narrow relative py-20 md:py-32 text-center">
          <span className="inline-block text-sm bg-white/10 text-sage-200 px-4 py-1.5 rounded-full mb-6">
            For centers &amp; organizers
          </span>
          <h1 className="font-serif text-4xl font-bold md:text-6xl md:leading-[1.1]">
            Grow your project<br />
            <span className="text-terracotta-400">with Retiru</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-sage-300 leading-relaxed">
            Whether you run a yoga, meditation or ayurveda center, or you organize retreats and events in that space,
            Retiru is your platform. No commissions. No subscriptions.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="#centers" className="bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base">
              I have a center
            </a>
            <a href="#organizers" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base">
              I organize events
            </a>
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
            Publish your retreats or events <span className="text-terracotta-600">100% free</span>
          </h2>
          <p className="text-[#7a6b5d] max-w-2xl mb-12">
            If you create yoga, meditation or ayurveda retreats and events, Retiru gives you a
            complete management panel without charging you a single euro.
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
                  ['Organizer commission', '0%', '20-30%', '10-25%'],
                  ['Management panel', 'Complete & free', 'Basic', 'Limited'],
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
              { s: '01', t: 'Create your account', d: 'Sign up with your email and verify your account. Any user can create retreats or other events from their dashboard.' },
              { s: '02', t: 'Create your first retreat or event', d: 'Use our step-by-step wizard to create your retreat or another event. Add photos, schedule, prices and configure your cancellation policy.' },
              { s: '03', t: 'We review & publish', d: 'Our team reviews your first retreat within 24-48h to ensure quality. Once approved, it goes live and you become a verified organizer.' },
              { s: '04', t: 'Receive bookings & get paid', d: 'Attendees pay 20% to Retiru to secure their spot. You collect the remaining 80% directly from the attendee before the retreat. No intermediaries.' },
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

      {/* ═══ Final CTA ═══ */}
      <section className="py-20 bg-gradient-to-br from-terracotta-600 to-terracotta-700 text-white text-center">
        <div className="container-narrow">
          <h2 className="font-serif text-3xl md:text-4xl font-bold">Join Retiru</h2>
          <p className="mx-auto mt-4 max-w-lg text-terracotta-100">
            Whether you&apos;re a yoga, meditation or ayurveda center or an organizer in that space, Retiru gives you the tools
            and visibility you need. Free.
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
