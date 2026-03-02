// ============================================================================
// RETIRU · HOME — /es  (fiel al diseño HTML aprobado)
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { homeES } from '@/lib/seo/page-metadata';

export const metadata: Metadata = homeES;
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import HeroSearch from '@/components/home/HeroSearch';

/* ── Mock data ─────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { slug: 'yoga', name: 'Yoga', icon: '🧘', count: 127, img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80' },
  { slug: 'meditacion', name: 'Meditación', icon: '🧠', count: 89, img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400&q=80' },
  { slug: 'naturaleza', name: 'Naturaleza', icon: '🌿', count: 94, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80' },
  { slug: 'detox', name: 'Detox', icon: '🍃', count: 52, img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
  { slug: 'gastronomia', name: 'Gastronomía', icon: '🍷', count: 38, img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' },
  { slug: 'aventura', name: 'Aventura', icon: '⛰️', count: 61, img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80' },
];

const EVENTS = [
  {
    slug: 'retiro-yoga-ibiza-junio-2026', title: 'Retiro de Yoga y Meditación frente al mar',
    location: 'Ibiza, Baleares', dates: '15–20 Jun 2026 · 6 días', price: 790,
    rating: 4.9, reviews: 23, spots: 3, spotsLow: true, instant: true, category: 'Yoga',
    img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80',
  },
  {
    slug: 'escapada-detox-sierra-grazalema', title: 'Escapada Detox y Ayuno en plena naturaleza',
    location: 'Sierra de Grazalema, Cádiz', dates: '22–25 Jul 2026 · 4 días', price: 450,
    rating: 4.8, reviews: 15, spots: 8, spotsLow: false, instant: false, category: 'Detox',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
  },
  {
    slug: 'retiro-gastronomico-priorat', title: 'Escapada gastronómica entre viñedos del Priorat',
    location: 'Priorat, Tarragona', dates: '5–8 Sep 2026 · 4 días', price: 650,
    rating: 5.0, reviews: 9, spots: 5, spotsLow: false, instant: true, category: 'Gastronomía',
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  },
];

const DESTINATIONS = [
  { slug: 'ibiza', name: 'Ibiza', count: 34, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' },
  { slug: 'mallorca', name: 'Mallorca', count: 28, img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80' },
  { slug: 'costa-brava', name: 'Costa Brava', count: 19, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' },
  { slug: 'sierra-nevada', name: 'Sierra Nevada', count: 15, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80' },
  { slug: 'pais-vasco', name: 'País Vasco', count: 12, img: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80' },
];

const TESTIMONIALS = [
  { initials: 'MC', name: 'María C.', event: 'Retiro Yoga Ibiza · Jun 2025', text: 'Una experiencia increíble. La reserva fue super fácil y transparente. Sabía exactamente qué estaba pagando en cada momento. El retiro de yoga en Ibiza me cambió la vida.' },
  { initials: 'JL', name: 'Jorge L.', event: 'Organizador · 12 retiros publicados', text: 'Como organizador, Retiru me ha dado todo lo que necesitaba. Panel gratuito, gestión de reservas, check-in con QR... He dejado de usar Excel y WhatsApp para todo.' },
  { initials: 'ST', name: 'Sarah T.', event: 'Meditation Retreat Mallorca · May 2025', text: 'Found this amazing meditation retreat in Mallorca through Retiru. The whole booking process was in English, clear pricing breakdown. Will definitely book again!' },
];

/* ── SVG icon helpers ──────────────────────────────────────────────────── */
const IconSearch = () => <svg className="w-5 h-5 text-[#a09383] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconPin = () => <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconCal = () => <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IconStar = () => <svg className="w-[14px] h-[14px] text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconStarLg = () => <svg className="w-[18px] h-[18px] text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconHeart = () => <svg className="w-[18px] h-[18px] text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
const IconChevron = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>;
const IconCheck = () => <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
const IconShield = () => <svg className="w-[18px] h-[18px] text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconVerified = () => <svg className="w-[18px] h-[18px] text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconHeartsm = () => <svg className="w-[18px] h-[18px] text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;

export default function HomePage() {
  return (
    <>
      <Header locale="es" />
      <main>

        {/* ═══════════════════════════════════════════════════════
            HERO — imagen fondo + overlay lateral
            ═══════════════════════════════════════════════════════ */}
        <section className="relative min-h-[100vh] flex items-center overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80"
              alt="Persona meditando al amanecer"
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient lateral */}
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] md:via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)]
                            max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:via-[rgba(254,253,251,0.8)] max-md:to-[rgba(254,253,251,0.4)]" />
          </div>

          <div className="container-wide relative z-10 py-12 md:py-16">
            <div className="max-w-[620px] md:max-w-[900px]">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200 text-sage-700 text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6 animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                <span className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-[float_2s_ease-in-out_infinite]" />
                +500 retiros en España
              </div>

              {/* Title */}
              <h1 className="font-serif text-[clamp(36px,6vw,60px)] leading-[1.2] tracking-[-0.01em] text-foreground mb-5 max-w-[560px] animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_0.1s_forwards] opacity-0">
                Encuentra tu{' '}
                <span className="inline-flex items-baseline gap-[3px]">
                  <span className="text-terracotta-700 tracking-[-0.02em]">retiru</span>
                  <span className="w-[0.35em] h-[0.35em] bg-terracotta-600 rounded-full animate-[float_3s_ease-in-out_infinite] -mb-0.5" />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-[#7a6b5d] leading-[1.7] mb-9 max-w-[480px] animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_0.2s_forwards] opacity-0">
                Descubre experiencias de yoga, meditación, naturaleza y bienestar en los rincones más especiales de España.
              </p>

              {/* SEARCH BOX */}
              <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated animate-[scaleIn_0.6s_cubic-bezier(0.16,1,0.3,1)_0.4s_forwards] opacity-0">
                <HeroSearch />
              </div>

              {/* TRUST BAR */}
              <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-sand-200 animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_0.5s_forwards] opacity-0">
                <div className="flex items-center gap-2.5 text-sm text-[#7a6b5d]">
                  <div className="w-9 h-9 bg-sage-50 rounded-full flex items-center justify-center shrink-0"><IconShield /></div>
                  Pago seguro
                </div>
                <div className="flex items-center gap-2.5 text-sm text-[#7a6b5d]">
                  <div className="w-9 h-9 bg-sage-50 rounded-full flex items-center justify-center shrink-0"><IconVerified /></div>
                  Organizadores verificados
                </div>
                <div className="flex items-center gap-2.5 text-sm text-[#7a6b5d]">
                  <div className="w-9 h-9 bg-sage-50 rounded-full flex items-center justify-center shrink-0"><IconHeartsm /></div>
                  Precios transparentes
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CATEGORÍAS
            ═══════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Explora por tipo de retiro</h2>
                <p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Encuentra el tipo de retiro que mejor conecta contigo</p>
              </div>
              <Link href="/es/retiros-retiru" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">
                Ver todas <IconChevron />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/es/retiros-retiru?tipo=${c.slug}`} className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer transition-transform duration-[400ms] cubic-bezier(0.16,1,0.3,1) hover:-translate-y-1">
                  <ImageWithFallback
                    src={c.img}
                    alt={c.name}
                    className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.08]"
                    fallbackEmoji="🥤"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.7)] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-[28px] mb-2 drop-shadow-md">{c.icon}</div>
                    <h3 className="font-serif text-lg text-white">{c.name}</h3>
                    <p className="text-[13px] text-white/75 mt-0.5">{c.count} retiros</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            RETIROS POPULARES
            ═══════════════════════════════════════════════════════ */}
        <section className="bg-sand-100 py-12 md:py-16">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Retiros populares</h2>
                <p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Los más reservados por nuestra comunidad</p>
              </div>
              <Link href="/es/buscar" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">
                Ver todos <IconChevron />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {EVENTS.map((e) => (
                <Link key={e.slug} href={`/es/retiro/${e.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1 hover:border-sand-300">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={e.img} alt={e.title} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground">{e.category}</span>
                      {e.instant && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] backdrop-blur-sm text-white">⚡ Confirmación inmediata</span>}
                    </div>
                    <div className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <IconHeart />
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><IconPin /> {e.location}</span>
                      <span className="text-[13px] font-semibold text-foreground flex items-center gap-1"><IconStar /> {e.rating} <span className="font-normal text-[#7a6b5d]">({e.reviews})</span></span>
                    </div>
                    <h3 className="font-serif text-xl leading-[1.3] mb-2 line-clamp-2">{e.title}</h3>
                    <div className="text-sm text-[#7a6b5d] mb-4 flex items-center gap-1.5">
                      <IconCal /> {e.dates}
                    </div>
                    <div className="flex items-end justify-between pt-4 border-t border-sand-200">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span>
                        <span className="text-2xl font-bold text-foreground leading-none mt-0.5">{e.price}€ <span className="text-sm font-normal text-[#7a6b5d]">/persona</span></span>
                      </div>
                      <span className={`text-[13px] font-medium flex items-center gap-1 ${e.spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>
                        {e.spotsLow ? '🔥' : ''} {e.spots} plazas
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CÓMO FUNCIONA
            ═══════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">¿Cómo funciona?</h2>
              <p className="text-base text-[#7a6b5d] mt-2">Reservar tu retiro es sencillo y transparente</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
              {[
                { n: 1, t: 'Explora', d: 'Busca entre cientos de retiros por categoría, destino, fecha o precio. Filtra por lo que más te importa.' },
                { n: 2, t: 'Reserva tu plaza', d: 'Paga solo el 20% como cuota de gestión para asegurar tu plaza. Proceso 100% seguro con Stripe.' },
                { n: 3, t: 'Coordina', d: 'Habla directamente con el organizador por el chat. Rellena el cuestionario y prepara tu experiencia.' },
                { n: 4, t: 'Vive la experiencia', d: 'Paga el 80% restante al organizador antes del retiro y disfruta de una experiencia transformadora.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="text-center px-5 py-8">
                  <div className="w-12 h-12 bg-terracotta-50 border-2 border-terracotta-200 text-terracotta-600 rounded-full flex items-center justify-center font-serif text-xl mx-auto mb-5">
                    {n}
                  </div>
                  <h3 className="font-serif text-lg mb-2">{t}</h3>
                  <p className="text-sm text-[#7a6b5d] leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            TRANSPARENCIA DE PRECIOS
            ═══════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="max-w-[700px] mx-auto bg-white border border-sand-300 rounded-3xl p-10 md:p-14">
              <h3 className="font-serif text-[28px] text-center mb-2">Precios 100% transparentes</h3>
              <p className="text-center text-[#7a6b5d] mb-8">Siempre sabrás exactamente qué pagas y a quién</p>

              <div className="bg-sand-100 rounded-2xl p-6 mb-6">
                <p className="text-xs uppercase tracking-wider font-semibold text-[#a09383] mb-4">Ejemplo: retiro de 500€</p>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[15px] flex items-center gap-2">
                    Cuota de gestión de reserva
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full">Retiru</span>
                  </span>
                  <span className="text-lg font-bold">100€</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-t border-sand-200">
                  <span className="text-[15px] flex items-center gap-2">
                    Pago al organizador
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Organizador</span>
                  </span>
                  <span className="text-lg font-bold">400€</span>
                </div>
                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-foreground">
                  <span className="text-base font-semibold">Precio total del retiro</span>
                  <span className="text-2xl font-bold">500€</span>
                </div>
              </div>

              <p className="text-center text-sm text-[#7a6b5d] leading-relaxed">
                <strong className="text-foreground">Al reservar pagas 100€ a Retiru.</strong> Los 400€ restantes se los pagas directamente al organizador antes del inicio del retiro. Sin costes ocultos, sin sorpresas.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            DESTINOS POPULARES
            ═══════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16 bg-sand-100">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Destinos populares</h2>
                <p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Los lugares más buscados para desconectar</p>
              </div>
              <Link href="/es/destinos" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">
                Ver todos <IconChevron />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
              {DESTINATIONS.map((d) => (
                <Link key={d.slug} href={`/es/destinos/${d.slug}`} className="shrink-0 w-[260px] snap-start rounded-2xl overflow-hidden relative cursor-pointer hover:-translate-y-1 transition-transform duration-300 group">
                  <div className="relative w-full h-[180px]">
                    <ImageWithFallback
                      src={d.img}
                      alt={d.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      fallbackEmoji="🏝️"
                      fallbackSize="md"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.65)] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 px-5">
                    <h3 className="font-serif text-xl text-white">{d.name}</h3>
                    <p className="text-[13px] text-white/80">{d.count} retiros</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CENTROS DE BIENESTAR */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Centros de bienestar</h2>
                <p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Yoga, meditación, wellness y spa en toda España</p>
              </div>
              <Link href="/es/centros-retiru" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">
                Ver directorio <IconChevron />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', city: 'Madrid', rating: 4.9, reviews: 87, services: ['Hatha', 'Vinyasa', 'Ashtanga'], img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=500&q=80' },
                { slug: 'espacio-zen-barcelona', name: 'Espacio Zen Barcelona', type: 'Meditación', city: 'Barcelona', rating: 4.8, reviews: 63, services: ['Zen', 'Mindfulness', 'Silencio'], img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=500&q=80' },
                { slug: 'om-yoga-sevilla', name: 'Om Yoga Sevilla', type: 'Yoga', city: 'Sevilla', rating: 4.9, reviews: 112, services: ['Kundalini', 'Hatha', 'Formación'], img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80' },
              ].map((c) => (
                <Link key={c.slug} href={`/es/centro/${c.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 hover:shadow-elevated hover:-translate-y-1 transition-all duration-[350ms]">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-sage-700 text-white px-2 py-0.5 rounded-full">Centro</span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{c.type}</span>
                    </div>
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">⭐ Destacado</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2 text-[13px]">
                      <span className="text-[#7a6b5d] flex items-center gap-1"><IconPin /> {c.city}</span>
                      <span className="font-semibold flex items-center gap-1"><IconStar /> {c.rating} <span className="font-normal text-[#a09383]">({c.reviews})</span></span>
                    </div>
                    <h3 className="font-serif text-lg leading-[1.3] mb-2">{c.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {c.services.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* TIENDA WELLNESS */}
        <section className="bg-sand-100 py-12 md:py-16">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Tienda <span className="text-terracotta-600">wellness</span></h2>
                <p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Productos seleccionados para tu práctica y bienestar</p>
              </div>
              <Link href="/es/tienda" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">
                Ver tienda <IconChevron />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { slug: 'esterilla-yoga-pro', name: 'Esterilla de Yoga Pro 6mm', price: 49.90, comparePrice: 69.90, badge: 'Bestseller', img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&q=80' },
                { slug: 'cojin-meditacion-zafu', name: 'Cojín de Meditación Zafu', price: 34.90, comparePrice: null, badge: null, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80' },
                { slug: 'extractor-zumos-cold-press', name: 'Extractor de Zumos Cold Press', price: 129.00, comparePrice: null, badge: 'Nuevo', img: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&q=80' },
                { slug: 'set-aceites-esenciales', name: 'Set de 6 Aceites Esenciales', price: 39.90, comparePrice: 49.90, badge: 'Popular', img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
              ].map(p => (
                <Link key={p.slug} href={`/es/tienda/${p.slug}`} className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-0.5 transition-all">
                  <div className="relative aspect-square overflow-hidden bg-sand-50">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {p.badge && <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${p.badge === 'Bestseller' ? 'bg-terracotta-600 text-white' : p.badge === 'Nuevo' ? 'bg-sage-600 text-white' : 'bg-amber-400 text-amber-900'}`}>{p.badge}</span>}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{p.price.toFixed(2).replace('.', ',')}€</span>
                      {p.comparePrice && <span className="text-sm text-[#a09383] line-through">{p.comparePrice.toFixed(2).replace('.', ',')}€</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            TESTIMONIOS
            ═══════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Lo que dicen nuestros asistentes</h2>
              <p className="text-base text-[#7a6b5d] mt-2">Experiencias reales de personas que encontraron su retiro ideal</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white border border-sand-200 rounded-2xl p-8 hover:shadow-soft hover:border-sand-300 transition-all">
                  <div className="flex gap-0.5 mb-4">{Array.from({ length: 5 }).map((_, j) => <IconStarLg key={j} />)}</div>
                  <p className="text-[15px] leading-[1.7] text-foreground italic mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-sage-100 rounded-full flex items-center justify-center text-base font-bold text-sage-700">{t.initials}</div>
                    <div>
                      <p className="text-[15px] font-semibold">{t.name}</p>
                      <p className="text-[13px] text-[#7a6b5d]">{t.event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CTA ORGANIZADORES
            ═══════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sage-800 to-sage-900 px-10 py-16 md:px-16 md:py-20 text-white">
              {/* Dot pattern */}
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="relative z-10 max-w-[600px]">
                <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-wide mb-6">
                  ✨ 100% GRATIS para organizadores
                </div>
                <h2 className="font-serif text-[clamp(28px,4vw,42px)] text-white mb-4">¿Organizas retiros? Publica gratis.</h2>
                <p className="text-[17px] text-white/80 leading-[1.7] mb-8">
                  Sin comisiones, sin suscripciones. Obtén un panel profesional completo para gestionar tus retiros, reservas, asistentes, mensajería y mucho más. Todo gratis.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {['0% comisión', 'Panel completo', 'CRM de asistentes', 'Check-in con QR', 'Mensajería integrada', 'Analíticas'].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm font-medium">
                      <div className="w-6 h-6 bg-white/15 rounded-full flex items-center justify-center shrink-0"><IconCheck /></div>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/es/para-organizadores" className="inline-flex items-center gap-2 bg-white text-sage-800 font-bold text-base px-8 py-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all">
                  Empieza a publicar gratis <IconChevron />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer locale="es" />
    </>
  );
}
