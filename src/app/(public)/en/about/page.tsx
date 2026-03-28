// /en/about
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Users, Globe, Shield, Leaf, Target } from 'lucide-react';
import { aboutEN } from '@/lib/seo/page-metadata';

export const metadata: Metadata = aboutEN;

const VALUES = [
  { icon: Heart, title: 'Passion for wellbeing', text: 'We believe everyone deserves to disconnect, reconnect with themselves and live experiences that transform.' },
  { icon: Shield, title: 'Full transparency', text: 'We break down every euro. No hidden fees, no fine print. You always know what you pay and to whom.' },
  { icon: Users, title: 'Community first', text: 'Organizers are our engine. We give them free tools so they can focus on what they do best.' },
  { icon: Globe, title: 'Spain as a destination', text: 'Ibiza, Mallorca, Sierra Nevada, Costa Brava… Spain has everything it takes to be a reference for retreats and wellbeing.' },
  { icon: Leaf, title: 'Positive impact', text: 'We promote responsible retreats, sustainable tourism and practices that care for people and the environment.' },
  { icon: Target, title: 'Accessible excellence', text: 'Valuable experiences within reach for more people — from weekend getaways to longer immersive stays.' },
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
                  src="/images/andrea_y_roi.jpg"
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
        <div className="container-wide py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-serif text-3xl md:text-4xl text-terracotta-600 font-bold">{s.value}</p>
                <p className="text-sm text-[#7a6b5d] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container-wide py-12">
        <h2 className="font-serif text-2xl md:text-3xl mb-8 text-center">Our values</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-sand-200 p-6 hover:shadow-soft transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-terracotta-50 flex items-center justify-center mb-4">
                <v.icon className="w-5 h-5 text-terracotta-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-[#7a6b5d] leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-sage-50">
        <div className="container-wide py-12">
          <h2 className="font-serif text-2xl md:text-3xl mb-8 text-center">The team</h2>
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-semibold text-lg text-foreground">Andrea &amp; Roi</h3>
            <p className="text-sm text-sage-600 mb-3">Founders of Retiru</p>
            <p className="text-[15px] text-[#7a6b5d] leading-relaxed">
              Behind Retiru is a shared story of learning, travel, practice and a drive to build
              something honest, useful and beautiful for the world of wellbeing.
            </p>
          </div>
        </div>
      </section>

      {/* Model */}
      <section className="container-wide py-12">
        <div className="bg-sand-100 rounded-2xl p-8 md:p-10 max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl text-foreground mb-4">Our model</h2>
          <p className="text-[15px] text-[#7a6b5d] leading-[1.8]">
            Guests pay Retiru a 20% booking management fee when they book. The remaining 80% goes
            directly to the organizer. We never charge organizers — their dashboard, CRM, messaging
            and analytics are 100% free.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container-wide pb-12">
        <div className="bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">Ready for your next experience?</h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Discover retreats and centres in Spain&apos;s most beautiful destinations. Yoga, meditation and ayurveda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/en/search" className="inline-flex items-center justify-center gap-2 bg-white text-terracotta-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors">
              Explore retreats
            </Link>
            <Link href="/en/for-organizers" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              For organizers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
