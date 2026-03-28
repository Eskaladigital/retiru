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
      <section className="bg-gradient-to-b from-sage-50 to-white">
        <div className="container-wide py-16 md:py-20 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-sage-600 mb-4">About us</span>
          <h1 className="font-serif text-[clamp(28px,4.5vw,48px)] text-foreground leading-[1.15] mb-6 max-w-3xl mx-auto">
            Andrea &amp; Roi
          </h1>
          <div className="relative w-[min(280px,85vw)] aspect-square mx-auto mb-8 rounded-2xl overflow-hidden shadow-lg ring-1 ring-sand-200/80">
            <Image
              src="/images/andrea_y_roi.jpg"
              alt="Andrea and Roi, founders of Retiru"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 85vw, 280px"
              priority
            />
          </div>
          <p className="text-[#7a6b5d] text-lg max-w-2xl mx-auto leading-relaxed">
            We&apos;re a couple of nomads united by something more than fate: a deep passion for wellbeing, community and experiences that transform.
          </p>
        </div>
      </section>

      <section className="container-wide py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl mb-6">Our story</h2>
          <div className="space-y-4 text-[15px] text-[#7a6b5d] leading-[1.8]">
            <p>
              We met a few years ago, and since then we&apos;ve walked a path of learning and discovery together. Yoga, ayurveda, conscious cooking… every training, every encounter and every journey has shaped how we understand life: more present, more connected, more authentic.
            </p>
            <p>
              The last year was a turning point. We lived in a van travelling New Zealand, collaborating on yoga courses, retreats and community events. There we didn&apos;t just learn new disciplines, but new ways of living, sharing and caring for ourselves. We soaked up ideas, inspiration and people who, like us, believe in a more conscious lifestyle.
            </p>
            <p>
              When we returned, the journey continued in Kerala, India — the cradle of ayurveda — where we trained in traditional ayurvedic massage. That experience let us go deeper into the body, energy and balance, integrating ancestral practices that are now part of our philosophy of life.
            </p>
            <p className="font-medium text-foreground">With all of that behind us, Retiru was born.</p>
            <p>
              We created this space to explore and give visibility to wellbeing across the peninsula, connecting people with retreats, centres and experiences that truly add value. We want to bring wellness to more people, because we firmly believe that caring for yourself shouldn&apos;t be a luxury or an afterthought — it should be a priority.
            </p>
            <p>
              Retiru is also our first step toward a bigger dream: someday, not too far off, to create our own wellness corner on the Levante coast. A place where people can pause, reconnect and feel at home.
            </p>
            <p>This is only the beginning. We&apos;re so glad you&apos;re here to be part of the journey.</p>
          </div>
        </div>
      </section>

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

      <section className="bg-sage-50">
        <div className="container-wide py-12">
          <h2 className="font-serif text-2xl md:text-3xl mb-8 text-center">The team</h2>
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-semibold text-lg text-foreground">Andrea &amp; Roi</h3>
            <p className="text-sm text-sage-600 mb-3">Founders of Retiru</p>
            <p className="text-[15px] text-[#7a6b5d] leading-relaxed">
              We build Retiru from life on the road, with a drive to make wellbeing more visible and accessible across the peninsula.
            </p>
          </div>
        </div>
      </section>

      <section className="container-wide py-12">
        <div className="bg-sand-100 rounded-2xl p-8 md:p-10 max-w-3xl mx-auto mb-12">
          <h2 className="font-serif text-2xl text-foreground mb-4">Our model</h2>
          <p className="text-[15px] text-[#7a6b5d] leading-[1.8]">
            Guests pay Retiru a 20% booking management fee when they book. The remaining 80% goes directly to the organizer. We never charge organizers — their dashboard, CRM, messaging and analytics are 100% free.
          </p>
        </div>
        <div className="bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">Ready for your next experience?</h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Discover retreats and centres in Spain&apos;s most beautiful destinations. Yoga, meditation and ayurveda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/en/search"
              className="inline-flex items-center justify-center gap-2 bg-white text-terracotta-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors"
            >
              Explore retreats
            </Link>
            <Link
              href="/en/for-organizers"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              For organizers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
