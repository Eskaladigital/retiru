// ============================================================================
// RETIRU · FICHA DE RETIRO — /es/retiro/[slug]
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata, jsonLdEvent, jsonLdBreadcrumb, jsonLdScript } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return generatePageMetadata({
    title: `${title} — Retiro en España`,
    description: `Descubre y reserva ${title}. Retiro de bienestar en España con todo incluido.`,
    locale: 'es',
    path: `/es/retiro/${params.slug}`,
    altPath: `/en/retreat/${params.slug}`,
    ogType: 'website',
    keywords: ['retiro', title.toLowerCase(), 'españa', 'bienestar'],
  });
}
import { Star, MapPin, Calendar, Clock, Users, Globe, Shield, Zap, Heart, Share2, ChevronRight, Check, X as XIcon } from 'lucide-react';

// Mock data — en producción se carga de Supabase
const EVENT = {
  title: 'Retiro de Yoga y Meditación en Ibiza',
  summary: '7 días de práctica en una villa con vistas al mar. Incluye alojamiento, comidas orgánicas y excursiones.',
  description: `Sumérgete en una semana transformadora en una de las villas más exclusivas de Ibiza, rodeada de naturaleza y con vistas al Mediterráneo.

Cada día comenzarás con una sesión de yoga al amanecer frente al mar, seguida de un desayuno orgánico preparado por nuestro chef. Las tardes alternan entre talleres de meditación profunda, paseos por calas secretas y tiempo libre para disfrutar de la piscina infinita.

Este retiro está diseñado para todos los niveles, desde principiantes hasta practicantes avanzados. Nuestros instructores certificados adaptan cada sesión a tus necesidades.`,
  price: 890,
  fee: 178,
  orgAmount: 712,
  dates: { start: '15 Jun 2026', end: '21 Jun 2026' },
  duration: '7 días · 6 noches',
  location: 'Santa Eulalia, Ibiza',
  maxAttendees: 16,
  spotsLeft: 4,
  rating: 4.9,
  reviews: 47,
  confirmation: 'automatic',
  languages: ['Español', 'Inglés'],
  images: [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  ],
  includes: ['Alojamiento en villa compartida', '3 comidas orgánicas al día', '2 sesiones de yoga diarias', 'Meditación guiada', 'Excursión a calas secretas', 'Materiales de yoga', 'Wifi'],
  excludes: ['Vuelos', 'Transporte al aeropuerto', 'Tratamientos de spa opcionales'],
  schedule: [
    { day: 1, title: 'Llegada y bienvenida', items: ['16:00 Check-in', '18:00 Yoga suave de bienvenida', '20:00 Cena y presentaciones'] },
    { day: 2, title: 'Conexión', items: ['07:00 Yoga al amanecer', '09:00 Desayuno', '11:00 Taller de meditación', '13:00 Almuerzo', '16:00 Tiempo libre / Playa', '19:00 Yoga restaurativo', '20:30 Cena'] },
    { day: 7, title: 'Despedida', items: ['07:00 Última sesión de yoga', '09:00 Desayuno de despedida', '11:00 Círculo de cierre', '12:00 Check-out'] },
  ],
  cancellation: { type: 'standard', tiers: [{ days: 30, percent: 100 }, { days: 14, percent: 50 }, { days: 7, percent: 0 }] },
  organizer: { name: 'Ibiza Yoga Retreats', slug: 'ibiza-yoga-retreats', rating: 4.8, reviews: 124, events: 12, image: null, verified: true },
  reviewsList: [
    { name: 'Laura M.', date: 'Mayo 2025', rating: 5, text: 'Una experiencia increíble. Las sesiones de yoga al amanecer frente al mar fueron mágicas. Volveré seguro.' },
    { name: 'Javier P.', date: 'Abril 2025', rating: 5, text: 'Superó todas mis expectativas. El lugar, la comida, los instructores... todo perfecto.' },
    { name: 'Sarah K.', date: 'Marzo 2025', rating: 4, text: 'Great retreat! The villa is stunning and the yoga sessions were exactly what I needed. Only wish it was longer.' },
  ],
};

export default function EventoDetailPage({ params }: { params: { slug: string } }) {
  const e = EVENT;

  return (
    <div>
      {/* ═══ Image Gallery ═══ */}
      <section className="bg-sand-100">
        <div className="container-wide py-4">
          <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2 rounded-2xl overflow-hidden" style={{ maxHeight: '480px' }}>
            <div className="md:col-span-2 md:row-span-2 relative">
              <img src={e.images[0]} alt={e.title} className="h-full w-full object-cover" style={{ minHeight: '300px' }} />
            </div>
            {e.images.slice(1, 5).map((img, i) => (
              <div key={i} className="hidden md:block relative">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Content ═══ */}
      <div className="container-wide py-8">
        <div className="flex gap-10">
          {/* ─── Main content ─── */}
          <div className="flex-1 max-w-3xl">
            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
              <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
              <ChevronRight size={12} />
              <Link href="/es/retiros-retiru" className="hover:text-terracotta-600">Retiros</Link>
              <ChevronRight size={12} />
              <span className="text-foreground">{e.title}</span>
            </nav>

            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="badge-sand">Yoga</span>
                <span className="badge-sand">Meditación</span>
                {e.confirmation === 'automatic' && <span className="badge-sage"><Zap size={12} /> Confirmación inmediata</span>}
              </div>
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">{e.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={15} /> {e.location}</span>
                <span className="flex items-center gap-1"><Calendar size={15} /> {e.dates.start} — {e.dates.end}</span>
                <span className="flex items-center gap-1"><Clock size={15} /> {e.duration}</span>
                <span className="flex items-center gap-1">
                  <Star size={15} className="fill-terracotta-500 text-terracotta-500" />
                  <strong className="text-foreground">{e.rating}</strong> ({e.reviews} reseñas)
                </span>
              </div>
              {/* Actions */}
              <div className="mt-4 flex gap-3">
                <button className="btn-ghost text-sm"><Heart size={16} /> Guardar</button>
                <button className="btn-ghost text-sm"><Share2 size={16} /> Compartir</button>
              </div>
            </div>

            {/* Description */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-semibold">Sobre este retiro</h2>
              <div className="prose prose-sand text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
                {e.description}
              </div>
            </section>

            {/* Includes / Excludes */}
            <section className="mb-10 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-serif text-xl font-semibold">Qué incluye</h3>
                <ul className="space-y-2">
                  {e.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={16} className="mt-0.5 shrink-0 text-sage-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 font-serif text-xl font-semibold">Qué no incluye</h3>
                <ul className="space-y-2">
                  {e.excludes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XIcon size={16} className="mt-0.5 shrink-0 text-sand-400" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Schedule */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-semibold">Programa</h2>
              <div className="space-y-4">
                {e.schedule.map((day) => (
                  <div key={day.day} className="rounded-xl border border-sand-200 p-5">
                    <h4 className="mb-2 font-semibold text-foreground">Día {day.day}: {day.title}</h4>
                    <ul className="space-y-1">
                      {day.items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Organizer */}
            <section className="mb-10 rounded-2xl border border-sand-200 p-6">
              <h2 className="mb-4 font-serif text-2xl font-semibold">Organizador</h2>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 text-xl font-bold text-sage-700">
                  {e.organizer.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{e.organizer.name}</h3>
                    {e.organizer.verified && <Shield size={16} className="text-sage-600" />}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Star size={13} className="fill-terracotta-500 text-terracotta-500" /> {e.organizer.rating} ({e.organizer.reviews} reseñas)</span>
                    <span>{e.organizer.events} retiros</span>
                  </div>
                </div>
              </div>
              <Link href={`/es/organizador/${e.organizer.slug}`} className="btn-outline mt-4 text-sm">
                Ver perfil completo
              </Link>
            </section>

            {/* Cancellation */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-semibold">Política de cancelación</h2>
              <div className="rounded-xl bg-cream-100 p-5">
                <p className="mb-3 text-sm font-medium text-foreground">Cancelación estándar</p>
                <ul className="space-y-2">
                  {e.cancellation.tiers.map((tier, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={`h-2 w-2 rounded-full ${tier.percent === 100 ? 'bg-sage-500' : tier.percent > 0 ? 'bg-yellow-500' : 'bg-red-400'}`} />
                      Más de {tier.days} días antes: reembolso del {tier.percent}%
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">La cuota de gestión de Retiru (20%) no es reembolsable.</p>
              </div>
            </section>

            {/* Reviews */}
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold">Reseñas</h2>
                <div className="flex items-center gap-2">
                  <Star size={20} className="fill-terracotta-500 text-terracotta-500" />
                  <span className="text-xl font-bold">{e.rating}</span>
                  <span className="text-sm text-muted-foreground">· {e.reviews} reseñas</span>
                </div>
              </div>
              <div className="space-y-4">
                {e.reviewsList.map((r, i) => (
                  <div key={i} className="rounded-xl border border-sand-200 p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-100 text-xs font-bold text-sage-700">{r.name[0]}</div>
                        <span className="text-sm font-semibold">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: r.rating }).map((_, j) => (
                          <Star key={j} size={13} className="fill-terracotta-500 text-terracotta-500" />
                        ))}
                        <span className="ml-2 text-xs text-muted-foreground">{r.date}</span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ─── Booking Sidebar (desktop) ─── */}
          <aside className="hidden w-96 shrink-0 lg:block">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-elevated">
                {/* Price */}
                <div className="mb-4 text-center">
                  <span className="text-sm text-muted-foreground">Precio total</span>
                  <p className="text-3xl font-bold text-foreground">{e.price}€ <span className="text-base font-normal text-muted-foreground">/ persona</span></p>
                </div>

                {/* Price breakdown */}
                <div className="mb-6 rounded-xl bg-cream-100 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cuota Retiru (20%)</span>
                    <span className="font-semibold text-terracotta-600">{e.fee}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Al organizador (80%)</span>
                    <span className="font-semibold">{e.orgAmount}€</span>
                  </div>
                  <hr className="border-sand-300" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pagas hoy <strong>{e.fee}€</strong> a Retiru · El resto ({e.orgAmount}€) lo pagas al organizador antes del retiro.
                  </p>
                </div>

                {/* Info */}
                <div className="mb-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} /> {e.dates.start} — {e.dates.end}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={16} /> {e.duration}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} />
                    <span className={e.spotsLeft <= 3 ? 'text-terracotta-600 font-semibold' : ''}>
                      {e.spotsLeft <= 3 ? `¡Solo ${e.spotsLeft} plazas!` : `${e.spotsLeft} plazas disponibles`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe size={16} /> {e.languages.join(', ')}
                  </div>
                  {e.confirmation === 'automatic' && (
                    <div className="flex items-center gap-2 text-sage-600 font-medium">
                      <Zap size={16} /> Confirmación inmediata
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button className="btn-primary w-full py-4 text-base">
                  Reservar plaza · {e.fee}€
                </button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  <Shield size={12} className="inline mr-1" />
                  Pago seguro con Stripe · No se te cobrará aún
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ═══ Sticky CTA mobile ═══ */}
      <div className="sticky-cta lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">{e.price}€</p>
            <p className="text-xs text-muted-foreground">Hoy pagas {e.fee}€</p>
          </div>
          <button className="btn-primary px-8 py-3">
            Reservar plaza · {e.fee}€
          </button>
        </div>
      </div>
    </div>
  );
}
