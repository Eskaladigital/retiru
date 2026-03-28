// /en/about
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Users, Globe, Shield, Leaf, Target } from 'lucide-react';
import { aboutEN } from '@/lib/seo/page-metadata';

export const metadata: Metadata = aboutEN;

const VALUES = [
  { icon: Heart, title: 'Passion for wellbeing', text: 'We believe you deserve to disconnect, reconnect with yourself and live experiences that transform — in yoga, meditation, ayurveda and whatever truly does you good.' },
  { icon: Shield, title: 'Full transparency', text: 'We break down every euro. No hidden fees or fine print: you know what you pay, when and to whom.' },
  { icon: Users, title: 'Centres & organizers', text: 'They make every experience possible. We give them free tools to publish, manage bookings and talk to guests.' },
  { icon: Globe, title: 'Spain as home', text: 'Ibiza, Mallorca, the coast, the mountains… The peninsula has huge potential for conscious wellbeing, and we want it to shine.' },
  { icon: Leaf, title: 'Positive impact', text: 'We back responsible retreats, more conscious travel and practices that care for people and the environment.' },
  { icon: Target, title: 'Quality within reach', text: 'We look for experiences that add value — from a weekend getaway to longer immersive stays.' },
];

const STATS = [
  { value: '500+', label: 'Retreats in Spain' },
  { value: '9', label: 'Featured destinations' },
  { value: '0%', label: 'Commission for organizers' },
  { value: '20%', label: 'Transparent guest fee' },
];

export default function AboutPageEN() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-sage-50 via-white to-white">
        <div className="container-wide py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="text-center lg:text-left">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-sage-600 mb-4">
                About us
              </span>
              <h1 className="font-serif text-[clamp(32px,5vw,56px)] text-foreground leading-[1.08] mb-5 max-w-3xl mx-auto lg:mx-0">
                Andrea &amp; Roi
              </h1>
              <p className="text-[#7a6b5d] text-lg md:text-[19px] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                We&apos;re a couple of nomads united by something more than fate: a deep passion for
                wellbeing, community and experiences that transform.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-7">
                <span className="rounded-full bg-white border border-sand-200 px-4 py-2 text-sm text-[#7a6b5d] shadow-sm">
                  New Zealand
                </span>
                <span className="rounded-full bg-white border border-sand-200 px-4 py-2 text-sm text-[#7a6b5d] shadow-sm">
                  Kerala
                </span>
                <span className="rounded-full bg-white border border-sand-200 px-4 py-2 text-sm text-[#7a6b5d] shadow-sm">
                  Levante Coast
                </span>
              </div>
            </div>

            <div className="relative w-full max-w-md lg:max-w-none mx-auto">
              <div className="absolute inset-0 bg-terracotta-100 rounded-[2rem] blur-3xl opacity-60 scale-95" aria-hidden />
              <div className="relative aspect-square overflow-hidden rounded-[2rem] shadow-[0_24px_70px_rgba(92,67,45,0.18)] ring-1 ring-sand-200/80">
                <Image
                  src="/images/andrea_y_roi_2.jpeg"
                  alt="Andrea and Roi, founders of Retiru"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our story */}
      <section className="container-wide py-12 md:py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] border border-sand-200/80 shadow-sm p-7 md:p-10 lg:p-12">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600">Our story</span>
            <h2 className="font-serif text-2xl md:text-4xl text-foreground mt-3">
              A project born on the road
            </h2>
          </div>
          <div className="space-y-5 text-[15px] md:text-[16px] text-[#7a6b5d] leading-[1.9]">
            <p>
              We met a few years ago, and since then we&apos;ve walked a path of learning, discovery
              and personal growth together. Yoga, ayurveda, conscious cooking… every training, every
              journey and every encounter has shaped how we understand life: more present, more
              connected and more authentic.
            </p>
            <p>
              The last year was a turning point. We lived in a van travelling New Zealand, collaborating
              on yoga courses, retreats and community events. There we didn&apos;t just learn new
              disciplines, but new ways of living, sharing and caring for ourselves. It was a deeply
              inspiring time, surrounded by people who, like us, believe in a more conscious lifestyle.
            </p>
            <p>
              When we returned, the journey continued in Kerala, India — the cradle of ayurveda — where
              we trained in traditional ayurvedic massage. That experience let us go deeper into the
              body, energy and balance, integrating ancestral knowledge that is now part of our
              philosophy of life.
            </p>
            <div className="py-3">
              <p className="font-serif text-2xl md:text-3xl text-foreground text-center">
                With all of that behind us, Retiru was born.
              </p>
            </div>
            <p>
              We created Retiru to give visibility to wellbeing across the peninsula and to connect more
              people with retreats, centres and experiences that truly add value. We want to bridge the
              gap between those who seek to take care of themselves and the projects that promote a more
              conscious, healthy and connected way of living.
            </p>
            <p>
              We believe wellbeing shouldn&apos;t play second fiddle in our lives. Quite the opposite:
              it should be a priority. That&apos;s why Retiru isn&apos;t just a search engine for
              retreats and centres — it&apos;s also an invitation to pause, reconnect and find spaces
              that do us good.
            </p>
            <p>
              This project is also our first step toward a bigger dream: someday, not too far off, to
              create our own wellness corner on the Levante coast. A place where people can rest,
              reconnect and feel at home.
            </p>
            <p>
              This is only the beginning, and we&apos;re so glad you&apos;re here to be part of the journey.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-sand-100">
        <div className="container-wide py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600">Retiru in numbers</span>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-3">Directory + bookings, with clear rules</h2>
            <p className="text-[15px] text-[#7a6b5d] leading-relaxed">
              We combine a centre map with a retreat marketplace. These figures sum up, in a nutshell, how the platform works today.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="text-center rounded-2xl bg-white border border-sand-200/90 px-4 py-6 shadow-sm"
              >
                <p className="font-serif text-3xl md:text-4xl text-terracotta-600 font-bold tabular-nums">{s.value}</p>
                <p className="text-sm text-[#7a6b5d] mt-2 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container-wide py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-sage-600">What drives us</span>
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-3">Our values</h2>
          <p className="text-[15px] text-[#7a6b5d] leading-relaxed">
            It&apos;s not just about tech: it&apos;s a commitment to people seeking real wellbeing and to those who offer it with care and rigour.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v, i) => {
            const sage = i % 2 === 1;
            return (
              <div
                key={v.title}
                className="bg-white rounded-2xl border border-sand-200 p-6 hover:shadow-soft transition-shadow"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${sage ? 'bg-sage-50' : 'bg-terracotta-50'}`}
                >
                  <v.icon className={`w-5 h-5 ${sage ? 'text-sage-700' : 'text-terracotta-600'}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-[#7a6b5d] leading-relaxed">{v.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who we are */}
      <section className="bg-gradient-to-b from-white to-sage-50/40">
        <div className="container-wide py-12 md:py-16">
          <div className="max-w-4xl mx-auto rounded-[2rem] border border-sand-200 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)]">
              <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[min(520px,70vh)] w-full bg-sand-100">
                <Image
                  src="/images/andrea_y_roi.jpg"
                  alt="Andrea and Roi, founders of Retiru"
                  fill
                  className="object-cover object-[center_25%]"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
              <div className="px-8 py-10 md:px-10 md:py-12 lg:px-12 flex flex-col justify-center text-center md:text-left">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-sage-600">Who we are</span>
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-5">Two people, one shared project</h2>
                <p className="text-[15px] text-[#7a6b5d] leading-[1.85]">
                  Behind Retiru is a story of learning, travel and practice — and a drive to build something honest,
                  useful and beautiful for the world of wellbeing. If you&apos;d like to say hello or share an idea, you can{' '}
                  <Link href="/en/contact" className="text-sage-700 font-medium underline underline-offset-2 hover:text-sage-800">
                    get in touch
                  </Link>
                  .
                </p>
                <p className="mt-8 text-foreground font-medium">
                  Andrea &amp; Roi
                  <span className="text-[#7a6b5d] font-normal"> · Founders of Retiru</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Model */}
      <section className="container-wide py-12 md:py-16">
        <div className="max-w-3xl mx-auto bg-sand-100 rounded-[2rem] border border-sand-200/80 p-8 md:p-10">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600">How pricing works</span>
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-2">Our model</h2>
          <p className="text-[15px] text-[#7a6b5d] leading-relaxed mb-8">
            This is how we split the amount when you book a retreat — no fine print, with the breakdown always visible.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-white border border-sand-200 p-5 md:p-6">
              <p className="font-serif text-3xl text-terracotta-600 font-bold tabular-nums">20%</p>
              <p className="font-semibold text-foreground mt-2">Fee to Retiru</p>
              <p className="text-sm text-[#7a6b5d] mt-2 leading-relaxed">
                Booking management, payments and support. You pay this when you confirm your place.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-sand-200 p-5 md:p-6">
              <p className="font-serif text-3xl text-sage-700 font-bold tabular-nums">80%</p>
              <p className="font-semibold text-foreground mt-2">Payment to the organizer</p>
              <p className="text-sm text-[#7a6b5d] mt-2 leading-relaxed">
                The remainder goes directly to the organizer before the retreat begins.
              </p>
            </div>
          </div>
          <p className="text-[15px] text-[#7a6b5d] leading-[1.8] mb-4">
            Publishing retreats and using the organizer dashboard costs nothing: no commissions or subscription for people who create experiences.
          </p>
          <p className="text-sm text-[#7a6b5d]">
            <Link href="/en/condiciones" className="text-terracotta-700 font-medium underline underline-offset-2 hover:text-terracotta-800">
              Terms &amp; pricing
            </Link>
            {' '}— legal detail and examples.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container-wide pb-12 md:pb-16">
        <div className="bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">Ready for your next step?</h2>
          <p className="text-white/85 mb-8 max-w-xl mx-auto leading-relaxed">
            Browse retreats or explore the directory of yoga, meditation and ayurveda centres. If you host experiences, the dashboard is free.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            <Link href="/en/search" className="inline-flex items-center justify-center gap-2 bg-white text-terracotta-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors">
              Explore retreats
            </Link>
            <Link href="/en/centers-retiru" className="inline-flex items-center justify-center gap-2 border-2 border-white/35 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Browse centres
            </Link>
            <Link href="/en/for-organizers" className="inline-flex items-center justify-center gap-2 border-2 border-white/35 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              For organizers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
