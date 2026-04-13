// ============================================================================
// RETIRU · FOR ATTENDEES — /en/for-attendees
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield, CreditCard, CheckCircle2, Search, Heart, Headphones,
  ChevronRight, Star, Users, Clock, Award, Lock, BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import { forAttendeesEN } from '@/lib/seo/page-metadata';
import { jsonLdFAQ, jsonLdScript } from '@/lib/seo';
export const metadata: Metadata = forAttendeesEN;

const GUARANTEES = [
  {
    icon: Lock,
    title: 'Secure escrow payment',
    desc: 'Your money is held safely until the retreat is confirmed. The organizer doesn\u2019t receive your payment until minimum conditions are met.',
    detail: 'We use Stripe as our payment gateway and an escrow system that keeps funds locked until the event meets the requirements to go ahead. If something goes wrong, you receive an automatic refund without having to file a claim.',
    accent: 'bg-emerald-100 text-emerald-700',
    image: '/images/att-pago-seguro.png',
  },
  {
    icon: BadgeCheck,
    title: 'Verified events',
    desc: 'Every retreat goes through a review process: we verify the organizer\u2019s identity and documents, and approve the content before it goes live.',
    detail: 'We check identity, business registration, civil liability insurance and tax details. Then our editorial team reviews photos, schedule and description to ensure information is accurate and high quality.',
    accent: 'bg-sky-100 text-sky-700',
    image: '/images/att-eventos-verificados.png',
  },
  {
    icon: Headphones,
    title: 'Dedicated support',
    desc: 'Our team is with you before, during and after booking. Chat, email and personalized attention.',
    detail: 'You\u2019re never on your own: if you have questions about a retreat, need to change dates or encounter any issue, our support team responds quickly and liaises with the organizer on your behalf when needed.',
    accent: 'bg-amber-100 text-amber-700',
    image: '/images/att-soporte.png',
  },
  {
    icon: Shield,
    title: 'Transparent cancellation policy',
    desc: 'Every retreat displays its cancellation terms upfront. If you\u2019re entitled to a refund, you receive the full amount.',
    detail: 'Before paying you can see exactly what happens if you cancel: deadlines, percentages and refund method. If the organizer cancels the retreat, you receive 100% of your payment back with zero additional steps.',
    accent: 'bg-violet-100 text-violet-700',
    image: '/images/att-cancelacion-transparente.png',
  },
];

const WHY_RETIRU = [
  {
    icon: CheckCircle2,
    title: 'Verified organizers',
    desc: 'Identity, business registration, civil liability insurance and tax details \u2014 all checked by our team.',
    detail: 'Before publishing any retreat we documentarily verify the organizer. This eliminates scams, improvised experiences and the "is this legit?" feeling that comes with social-media bookings.',
    image: '/images/att-organizadores-verificados.png',
  },
  {
    icon: CreditCard,
    title: 'One payment, no surprises',
    desc: 'You pay the price shown on the listing. No hidden fees, no bank transfers to strangers.',
    detail: 'The price on the listing is the total: accommodation, meals and activities as described. You pay by card via Stripe and receive your invoice by email. Zero dodgy transfers, zero Venmo-ing strangers.',
    image: '/images/att-pago-unico.png',
  },
  {
    icon: Star,
    title: 'Authentic reviews',
    desc: 'Only people who actually attended can leave a review. Ratings reflect real experiences.',
    detail: 'Our verified review system prevents fake opinions: it\u2019s only enabled after attendance is confirmed. So you can compare retreats with total confidence in the scores.',
    image: '/images/att-resenas-reales.png',
  },
  {
    icon: Users,
    title: 'Minimum group guarantee',
    desc: 'For retreats with a minimum group size, your spot is held at no cost until the minimum is reached.',
    detail: 'Reserve your spot for free. If the minimum is reached you receive a payment link; if not, you pay nothing and the reservation is released automatically. Zero risk, zero upfront commitments.',
    image: '/images/att-minimo-viable.png',
  },
  {
    icon: Search,
    title: 'Curated selection',
    desc: 'We don\u2019t publish everything: we filter and verify so you find the best experiences.',
    detail: 'Not just any retreat makes it onto Retiru. Our team evaluates every proposal (organizer, program, location and quality) before approving it. The result: a quality selection where you can browse, filter and compare without wasting time on unreliable options.',
    image: '/images/att-seleccion-curada.png',
  },
  {
    icon: Clock,
    title: 'Instant confirmation',
    desc: 'Book online instantly. You receive an email confirmation with all the details of your retreat.',
    detail: 'As soon as you complete payment, you receive an email with the confirmation, exact address, retreat schedule and necessary contact information. No waiting, no "I\u2019ll confirm tomorrow".',
    image: '/images/att-confirmacion-inmediata.png',
  },
];

const COMPARISON = [
  ['Escrow-protected payment', '\u2713', '\u2717', '\u2717'],
  ['KYC-verified organizers', '\u2713', '\u2717', '\u2717'],
  ['Full refund when applicable', '\u2713', 'Depends', '\u2717'],
  ['Dedicated support', '\u2713', '\u2717', '\u2717'],
  ['Verified reviews', '\u2713', '\u2717', 'Unreliable'],
  ['Minimum viable (no pay if not reached)', '\u2713', '\u2717', '\u2717'],
  ['Risk-free booking', '\u2713', '\u2717', '\u2717'],
  ['Curated experiences', '\u2713', '\u2717', '\u2717'],
];

const FAQS = [
  { q: 'Why is it better to book through Retiru?', a: 'Because your payment is protected: it isn\u2019t transferred to the organizer until the event meets the conditions to go ahead. We also documentarily verify every organizer and review each retreat before publication. If anything goes wrong, our support team helps you.' },
  { q: 'Is my money safe?', a: 'Yes. Payment is processed through Stripe (the same gateway used by Uber, Amazon and Shopify) and held securely until the retreat meets minimum requirements. If the event doesn\u2019t take place, you receive a full refund.' },
  { q: 'What happens if the retreat is cancelled?', a: 'If the organizer cancels, you receive a full refund to your payment method. Retiru handles the entire process so you don\u2019t have to chase anyone.' },
  { q: 'How do retreats with a minimum group size work?', a: 'For retreats requiring a minimum number of attendees, you reserve your spot without paying. Once the minimum is reached, you receive an email with a payment link and a deadline. If the minimum isn\u2019t reached, you pay nothing.' },
  { q: 'Can I cancel my booking?', a: 'Yes, according to the cancellation policy that each organizer sets and that is visible on the listing before you book. If a refund applies, you receive the full amount.' },
  { q: 'Are the retreats verified?', a: 'Yes. We verify the organizer\u2019s identity, business registration, civil liability insurance and tax details. Our team also reviews the retreat content before it goes live.' },
  { q: 'What kind of retreats can I find?', a: 'Yoga, meditation, ayurveda, detox, silence, nature, personal growth and more. All in selected destinations across Spain.' },
  { q: 'Can I contact the organizer before booking?', a: 'Yes. Every retreat listing has an \u201CAsk the organizer\u201D button that opens a direct chat within the platform.' },
];

const STEPS = [
  { step: '01', title: 'Explore and compare', desc: 'Search by destination, dates, retreat type or keyword. Compare prices, reviews and programs with all the information clearly displayed.', detail: 'Each listing shows photos, day-by-day schedule, what\u2019s included and excluded, cancellation terms and verified reviews. You have everything you need to decide without searching elsewhere.' },
  { step: '02', title: 'Book with confidence', desc: 'Pay the price shown on the listing via Stripe (Visa, Mastercard and more). Your money stays protected.', detail: 'Payment is held in escrow until the retreat meets the conditions to go ahead. You receive confirmation by email instantly and can contact support if you have any questions.' },
  { step: '03', title: 'Enjoy with peace of mind', desc: 'Receive your confirmation, all retreat details and the exact location. Our team is just a message away.', detail: 'If you need to modify anything, talk to the organizer or manage an issue, our team mediates and helps you every step of the way \u2014 before, during and after the experience.' },
];

export default function ForAttendeesPageEN() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative min-h-[70vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-para-asistentes.png"
            alt="Person meditating at yoga retreat"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] md:via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:via-[rgba(254,253,251,0.8)] max-md:to-[rgba(254,253,251,0.4)]" />
        </div>
        <div className="container-wide relative z-10 py-12 md:py-16">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-terracotta-400 rounded-full" />
              For you, seeking a transformative experience
            </div>
            <h1 className="font-serif text-[clamp(36px,6vw,56px)] leading-[1.2] tracking-[-0.01em] text-foreground mb-5">
              Book your retreat<br />
              <span className="text-terracotta-600">with full confidence</span>
            </h1>
            <p className="text-lg text-[#7a6b5d] leading-[1.7] mb-9 max-w-[540px]">
              On Retiru you won&apos;t find just any retreat: we <strong className="font-semibold text-foreground">verify every organizer</strong>,
              <strong className="font-semibold text-foreground"> protect your payment</strong> and support you throughout the process.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/en/retreats-retiru"
                className="btn-primary bg-terracotta-600 hover:bg-terracotta-700 text-white px-8 py-4 text-base font-semibold"
              >
                Explore retreats
              </Link>
              <a href="#guarantees" className="btn-primary bg-white hover:bg-sand-50 border border-sand-300 px-8 py-4 text-base text-foreground">
                See guarantees
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Guarantees ═══ */}
      <section id="guarantees" className="py-20 bg-cream-100">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3 text-center">
            Your guarantees when booking with Retiru
          </h2>
          <p className="text-[#7a6b5d] max-w-2xl mx-auto text-center mb-5">
            We leave nothing to chance. Every booking on Retiru comes with protections you won&apos;t find if you book directly or through social media.
          </p>
          <p className="text-sm text-[#7a6b5d] max-w-2xl mx-auto text-center mb-12 leading-relaxed">
            We&apos;ve designed every step of the process with your peace of mind in focus: from organizer verification to payment escrow, plus a support team that responds fast and accompanies you from start to finish.
          </p>

          <div className="grid gap-6 md:grid-cols-2 mb-12">
            {GUARANTEES.map(({ icon: Icon, title, desc, detail, accent, image }) => (
              <div key={title} className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition-shadow hover:shadow-soft">
                <div className="relative aspect-[16/10] shrink-0 bg-sand-100">
                  <img src={image} alt={`Visual example: ${title}`} className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${accent}`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-[#7a6b5d]">{desc}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[#7a6b5d]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Comparison ═══ */}
      <section className="py-20">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3 text-center">
            Book on your own or with Retiru?
          </h2>
          <p className="text-[#7a6b5d] max-w-2xl mx-auto text-center mb-5">
            Finding a retreat directly on social media or via bank transfer may seem cheaper,
            but it lacks the guarantees that protect your investment and your experience.
          </p>
          <p className="text-sm text-[#7a6b5d] max-w-2xl mx-auto text-center mb-12 leading-relaxed">
            With Retiru you pay by card, your money is held until the retreat is confirmed, and a support team watches over you. If something goes wrong, you don&apos;t have to chase anyone: we handle the refund for you.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white mb-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-300 bg-sand-50">
                  <th className="py-4 px-5 text-left font-semibold"></th>
                  <th className="py-4 px-5 text-center font-bold text-terracotta-600 text-lg">Retiru</th>
                  <th className="py-4 px-5 text-center text-[#7a6b5d]">Direct booking</th>
                  <th className="py-4 px-5 text-center text-[#7a6b5d]">Social media</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([feature, retiru, direct, social], i) => (
                  <tr key={i} className="border-b border-sand-200 last:border-0">
                    <td className="py-3 px-5 font-medium">{feature}</td>
                    <td className="py-3 px-5 text-center font-semibold text-sage-700">{retiru}</td>
                    <td className="py-3 px-5 text-center text-[#7a6b5d]">{direct}</td>
                    <td className="py-3 px-5 text-center text-[#7a6b5d]">{social}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Escrow visual ═══ */}
      <section className="py-20 bg-gradient-to-br from-sage-800 to-sage-900 text-white">
        <div className="container-narrow text-center">
          <Lock className="mx-auto mb-6" size={48} strokeWidth={1.5} />
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-4">
            Your money, protected until the last moment
          </h2>
          <p className="mx-auto max-w-2xl text-sage-300 leading-relaxed mb-10">
            When you pay on Retiru, the money doesn&apos;t go directly to the organizer. It&apos;s held securely
            until the retreat meets the conditions to take place. If something goes wrong, you get it back.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 mx-auto">
                <CreditCard size={20} className="text-emerald-300" />
              </div>
              <h3 className="font-semibold mb-2">1. Pay via Stripe</h3>
              <p className="text-sm text-sage-300">Visa, Mastercard and more. End-to-end encrypted data.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 mx-auto">
                <Shield size={20} className="text-sky-300" />
              </div>
              <h3 className="font-semibold mb-2">2. Retiru holds the payment</h3>
              <p className="text-sm text-sage-300">The organizer doesn&apos;t receive the funds until the event&apos;s execution is confirmed.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 mx-auto">
                <Award size={20} className="text-amber-300" />
              </div>
              <h3 className="font-semibold mb-2">3. Enjoy with peace of mind</h3>
              <p className="text-sm text-sage-300">If the retreat is cancelled, you get a full refund. No chasing anyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Why Retiru ═══ */}
      <section className="py-20">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3 text-center">
            What Retiru offers you
          </h2>
          <p className="text-[#7a6b5d] max-w-2xl mx-auto text-center mb-5">
            Every detail is designed so your only concern is enjoying the experience.
          </p>
          <p className="text-sm text-[#7a6b5d] max-w-2xl mx-auto text-center mb-12 leading-relaxed">
            Retiru brings verification, protected payment, authentic reviews and a curated selection together in one place. So you don&apos;t have to do your own research or trust blindly: everything is designed so you book with total confidence.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WHY_RETIRU.map(({ icon: Icon, title, desc, detail, image }) => (
              <div key={title} className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition-shadow hover:shadow-soft">
                <div className="relative aspect-[16/10] shrink-0 bg-sand-100">
                  <img src={image} alt={`Visual example: ${title}`} className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-100">
                    <Icon size={24} className="text-terracotta-700" />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-[#7a6b5d]">{desc}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[#7a6b5d]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section className="py-20 bg-cream-100">
        <div className="container-narrow">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold">How does it work?</h2>
          <p className="text-sm text-[#7a6b5d] max-w-xl mx-auto text-center mb-12 leading-relaxed">
            Just three steps to your next transformative experience. No surprises, no fine print, and support at every stage.
          </p>
          <div className="space-y-8">
            {STEPS.map(({ step, title, desc, detail }) => (
              <div key={step} className="flex gap-6 items-start">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta-600 text-lg font-bold text-white">
                  {step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-[#7a6b5d] leading-relaxed">{desc}</p>
                  <p className="mt-2 text-sm text-[#7a6b5d] leading-relaxed">{detail}</p>
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
          <h2 className="font-serif text-3xl md:text-4xl font-bold">Find your next retreat</h2>
          <p className="mx-auto mt-4 max-w-lg text-terracotta-100">
            Yoga, meditation, ayurveda, nature… Verified experiences with secure payment and dedicated support.
            Your wellbeing deserves that peace of mind.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-terracotta-200 leading-relaxed">
            Explore retreats across Spain, compare programs and prices with all the information visible, and book knowing your money and your experience are protected from start to finish.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/en/retreats-retiru" className="inline-block bg-white text-terracotta-700 font-bold px-8 py-4 rounded-xl hover:bg-sand-100 transition-colors">
              Explore retreats
            </Link>
            <Link href="/en/register" className="inline-block bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-xl transition-colors">
              Create free account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
