// ============================================================================
// RETIRU · PARA ASISTENTES — /es/para-asistentes
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield, CreditCard, CheckCircle2, Search, Heart, Headphones,
  ChevronRight, Star, Users, Clock, Award, Lock, BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import { forAttendeesES } from '@/lib/seo/page-metadata';
import { jsonLdFAQ, jsonLdScript } from '@/lib/seo';
export const metadata: Metadata = forAttendeesES;

const GUARANTEES = [
  {
    icon: Lock,
    title: 'Pago seguro con retención',
    desc: 'Tu dinero queda protegido hasta que el retiro se confirma. No se transfiere al organizador hasta que se cumplen las condiciones mínimas.',
    detail: 'Utilizamos Stripe como pasarela de pago y un sistema de retención (escrow) que mantiene los fondos bloqueados hasta que el evento cumple los requisitos para celebrarse. Si algo falla, recibes un reembolso automático sin tener que reclamar nada.',
    accent: 'bg-emerald-100 text-emerald-700',
    image: '/images/att-pago-seguro.png',
  },
  {
    icon: BadgeCheck,
    title: 'Eventos verificados',
    desc: 'Cada retiro pasa por un proceso de revisión: verificamos al organizador documentalmente y aprobamos el contenido antes de publicar.',
    detail: 'Comprobamos identidad, actividad económica, seguro de responsabilidad civil y datos fiscales del organizador. Después, nuestro equipo editorial revisa fotos, programa y descripción para asegurar que la información es precisa y de calidad.',
    accent: 'bg-sky-100 text-sky-700',
    image: '/images/att-eventos-verificados.png',
  },
  {
    icon: Headphones,
    title: 'Soporte y asistencia',
    desc: 'Nuestro equipo te acompaña antes, durante y después de la reserva. Chat, email y atención personalizada.',
    detail: 'No estás solo en ningún momento: si tienes dudas sobre un retiro, necesitas cambiar fechas o surge cualquier incidencia, nuestro equipo de soporte responde rápido y gestiona por ti con el organizador cuando haga falta.',
    accent: 'bg-amber-100 text-amber-700',
    image: '/images/att-soporte.png',
  },
  {
    icon: Shield,
    title: 'Política de cancelación transparente',
    desc: 'Cada retiro muestra sus condiciones de cancelación desde el principio. Si te corresponde reembolso, lo recibes íntegro.',
    detail: 'Antes de pagar ves exactamente qué ocurre si cancelas: plazos, porcentajes y método de devolución. Si el organizador cancela el retiro, recibes el 100 % de tu pago sin ningún trámite adicional.',
    accent: 'bg-violet-100 text-violet-700',
    image: '/images/att-cancelacion-transparente.png',
  },
];

const WHY_RETIRU = [
  {
    icon: CheckCircle2,
    title: 'Organizadores verificados',
    desc: 'Identidad, actividad económica, seguro de responsabilidad civil y datos fiscales comprobados por nuestro equipo.',
    detail: 'Antes de publicar cualquier retiro verificamos documentalmente al organizador. Eso elimina estafas, experiencias improvisadas y esa sensación de "¿será fiable?" que acompaña a las reservas por redes sociales.',
    image: '/images/att-organizadores-verificados.png',
  },
  {
    icon: CreditCard,
    title: 'Un solo pago, sin sorpresas',
    desc: 'Pagas el precio que ves en la ficha. Sin recargos ocultos, sin transferencias a desconocidos.',
    detail: 'El precio que muestra la ficha es el total: incluye alojamiento, comidas y actividades según lo descrito. Pagas con tarjeta a través de Stripe y recibes tu factura por email. Cero transferencias raras, cero Bizum a desconocidos.',
    image: '/images/att-pago-unico.png',
  },
  {
    icon: Star,
    title: 'Reseñas reales',
    desc: 'Solo pueden dejar opinión quienes asistieron al retiro. Las valoraciones reflejan experiencias auténticas.',
    detail: 'Nuestro sistema de reseñas verificadas impide opiniones falsas: solo se habilita tras completar la asistencia. Así puedes comparar retiros con confianza total en las puntuaciones.',
    image: '/images/att-resenas-reales.png',
  },
  {
    icon: Users,
    title: 'Mínimo viable garantizado',
    desc: 'En retiros con grupo mínimo, tu plaza queda reservada sin coste hasta que se alcance el mínimo.',
    detail: 'Reservas tu plaza gratis. Si se alcanza el mínimo recibes un enlace de pago; si no se llega al número necesario, no pagas nada y la reserva se libera automáticamente. Sin riesgo, sin compromisos anticipados.',
    image: '/images/att-minimo-viable.png',
  },
  {
    icon: Search,
    title: 'Selección curada',
    desc: 'No publicamos todo: filtramos y verificamos para que encuentres las mejores experiencias.',
    detail: 'En Retiru no entra cualquier retiro. Nuestro equipo evalúa cada propuesta (organizador, programa, ubicación y calidad) antes de aprobarla. El resultado: una selección de calidad donde puedes navegar, filtrar y comparar sin perder tiempo en opciones poco fiables.',
    image: '/images/att-seleccion-curada.png',
  },
  {
    icon: Clock,
    title: 'Confirmación inmediata',
    desc: 'Reserva online al instante. Recibes confirmación por email con todos los detalles de tu retiro.',
    detail: 'En cuanto completas el pago, recibes un email con la confirmación, la dirección exacta, el programa del retiro y la información de contacto necesaria. Sin esperas, sin "te confirmo mañana".',
    image: '/images/att-confirmacion-inmediata.png',
  },
];

const COMPARISON = [
  ['Pago protegido (escrow)', '✓', '✗', '✗'],
  ['Organizadores verificados (KYC)', '✓', '✗', '✗'],
  ['Reembolso íntegro si procede', '✓', 'Depende', '✗'],
  ['Soporte dedicado', '✓', '✗', '✗'],
  ['Reseñas verificadas', '✓', '✗', 'No fiables'],
  ['Mínimo viable (no pagas si no se alcanza)', '✓', '✗', '✗'],
  ['Reserva sin riesgo', '✓', '✗', '✗'],
  ['Selección curada de experiencias', '✓', '✗', '✗'],
];

const FAQS = [
  { q: '¿Por qué es mejor reservar a través de Retiru?', a: 'Porque tu pago queda protegido: no se transfiere al organizador hasta que el evento cumple las condiciones para celebrarse. Además, verificamos documentalmente a cada organizador y revisamos el contenido de cada retiro antes de publicarlo. Si algo no va bien, nuestro equipo de soporte te ayuda.' },
  { q: '¿Mi dinero está seguro?', a: 'Sí. El pago se procesa con Stripe (la misma pasarela de pago que usan Uber, Amazon o Shopify) y queda retenido hasta que el retiro cumple los requisitos mínimos. Si el evento no se celebra, recibes un reembolso completo.' },
  { q: '¿Qué pasa si el retiro se cancela?', a: 'Si el organizador cancela, recibes un reembolso íntegro en tu método de pago. Retiru gestiona todo el proceso para que no tengas que perseguir a nadie.' },
  { q: '¿Cómo funcionan los retiros con grupo mínimo?', a: 'En retiros que requieren un mínimo de asistentes, reservas tu plaza sin pagar. Cuando se alcanza el mínimo, recibes un email con el enlace de pago y un plazo para completarlo. Si no se llega al mínimo, no pagas nada.' },
  { q: '¿Puedo cancelar mi reserva?', a: 'Sí, según la política de cancelación que cada organizador define y que es visible en la ficha antes de reservar. Si te corresponde reembolso, lo recibes íntegro.' },
  { q: '¿Los retiros están verificados?', a: 'Sí. Verificamos la identidad del organizador, su alta en actividad económica, seguro de responsabilidad civil y datos fiscales. Además, nuestro equipo revisa el contenido del retiro antes de publicarlo.' },
  { q: '¿Qué tipo de retiros puedo encontrar?', a: 'Yoga, meditación, ayurveda, detox, silencio, naturaleza, desarrollo personal y más. Todos en destinos seleccionados de España.' },
  { q: '¿Puedo hablar con el organizador antes de reservar?', a: 'Sí. Cada ficha de retiro tiene un botón «Preguntar al organizador» que abre un chat directo dentro de la plataforma.' },
];

const STEPS = [
  { step: '01', title: 'Explora y compara', desc: 'Busca por destino, fechas, tipo de retiro o palabra clave. Compara precios, reseñas y programas con toda la información visible.', detail: 'Cada ficha muestra fotos, programa día a día, qué incluye y qué no, condiciones de cancelación y reseñas verificadas. Tienes todo lo que necesitas para decidir sin buscar por fuera.' },
  { step: '02', title: 'Reserva con seguridad', desc: 'Paga el precio que ves en la ficha vía Stripe (Visa, Mastercard y más). Tu dinero queda protegido.', detail: 'El pago se retiene en escrow hasta que el retiro cumple las condiciones para celebrarse. Recibes la confirmación por email al instante y puedes contactar con soporte si tienes cualquier duda.' },
  { step: '03', title: 'Disfruta con tranquilidad', desc: 'Recibe la confirmación, los detalles del retiro y la ubicación exacta. Nuestro equipo está a un mensaje de distancia.', detail: 'Si necesitas modificar algo, hablar con el organizador o gestionar una incidencia, nuestro equipo media y te ayuda en todo momento, antes, durante y después de la experiencia.' },
];

export default function ParaAsistentesPage() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative min-h-[70vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-para-asistentes.png"
            alt="Persona meditando en retiro de yoga"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] md:via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:via-[rgba(254,253,251,0.8)] max-md:to-[rgba(254,253,251,0.4)]" />
        </div>
        <div className="container-wide relative z-10 py-12 md:py-16">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-terracotta-400 rounded-full" />
              Para ti, que buscas una experiencia transformadora
            </div>
            <h1 className="font-serif text-[clamp(36px,6vw,56px)] leading-[1.2] tracking-[-0.01em] text-foreground mb-5">
              Reserva tu retiro<br />
              <span className="text-terracotta-600">con total garantía</span>
            </h1>
            <p className="text-lg text-[#7a6b5d] leading-[1.7] mb-9 max-w-[540px]">
              En Retiru no encontrarás cualquier retiro: <strong className="font-semibold text-foreground">verificamos a cada organizador</strong>,
              <strong className="font-semibold text-foreground"> protegemos tu pago</strong> y te acompañamos en todo el proceso.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/es/retiros-retiru"
                className="btn-primary bg-terracotta-600 hover:bg-terracotta-700 px-8 py-4 text-base font-semibold"
              >
                Explorar retiros
              </Link>
              <a href="#garantias" className="btn-primary bg-white hover:bg-sand-50 border border-sand-300 px-8 py-4 text-base text-foreground">
                Ver garantías
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Garantías principales ═══ */}
      <section id="garantias" className="section bg-cream-100">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3 text-center">
            Tus garantías al reservar con Retiru
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-center mb-5">
            No dejamos nada al azar. Cada reserva en Retiru viene acompañada de protecciones que no encontrarás si contratas directamente o por redes sociales.
          </p>
          <p className="text-sm text-[#7a6b5d] max-w-2xl mx-auto text-center mb-12 leading-relaxed">
            Hemos diseñado cada paso del proceso pensando en tu tranquilidad: desde la verificación del organizador hasta la retención del pago, pasando por un equipo de soporte que responde rápido y te acompaña de principio a fin.
          </p>

          <div className="grid gap-6 md:grid-cols-2 mb-12">
            {GUARANTEES.map(({ icon: Icon, title, desc, detail, accent, image }, idx) => (
              <div key={title} className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition-shadow hover:shadow-soft">
                <div className="relative aspect-[16/10] shrink-0 bg-sand-100">
                  <Image
                    src={image}
                    alt={`Ejemplo visual: ${title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    {...(idx < 2 ? { priority: true } : { loading: 'lazy' as const })}
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${accent}`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[#7a6b5d]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Comparativa visual ═══ */}
      <section className="section">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3 text-center">
            ¿Reservar por tu cuenta o con Retiru?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-center mb-5">
            Buscar un retiro directamente en redes sociales o por transferencia puede parecer más económico,
            pero carece de las garantías que protegen tu inversión y tu experiencia.
          </p>
          <p className="text-sm text-[#7a6b5d] max-w-2xl mx-auto text-center mb-12 leading-relaxed">
            Con Retiru pagas con tarjeta, tu dinero queda retenido hasta que el retiro se confirma y tienes un equipo de soporte pendiente de ti. Si algo falla, no tienes que perseguir a nadie: gestionamos la devolución por ti.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white mb-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-300 bg-sand-50">
                  <th className="py-4 px-5 text-left font-semibold"></th>
                  <th className="py-4 px-5 text-center font-bold text-terracotta-600 text-lg">Retiru</th>
                  <th className="py-4 px-5 text-center text-muted-foreground">Contratación directa</th>
                  <th className="py-4 px-5 text-center text-muted-foreground">Redes sociales</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([feature, retiru, direct, social], i) => (
                  <tr key={i} className="border-b border-sand-200 last:border-0">
                    <td className="py-3 px-5 font-medium text-foreground">{feature}</td>
                    <td className="py-3 px-5 text-center font-semibold text-sage-700">{retiru}</td>
                    <td className="py-3 px-5 text-center text-muted-foreground">{direct}</td>
                    <td className="py-3 px-5 text-center text-muted-foreground">{social}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Escrow visual ═══ */}
      <section className="section bg-gradient-to-br from-sage-800 to-sage-900 text-white">
        <div className="container-narrow text-center">
          <Lock className="mx-auto mb-6" size={48} strokeWidth={1.5} />
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-4">
            Tu dinero, protegido hasta el último momento
          </h2>
          <p className="mx-auto max-w-2xl text-sage-300 leading-relaxed mb-10">
            Cuando pagas en Retiru, el dinero no va directamente al organizador. Se retiene de forma segura
            hasta que el retiro cumple las condiciones para celebrarse. Si algo falla, se te devuelve.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 mx-auto">
                <CreditCard size={20} className="text-emerald-300" />
              </div>
              <h3 className="font-semibold mb-2">1. Pagas con Stripe</h3>
              <p className="text-sm text-sage-300">Visa, Mastercard y más. Datos cifrados de extremo a extremo.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 mx-auto">
                <Shield size={20} className="text-sky-300" />
              </div>
              <h3 className="font-semibold mb-2">2. Retiru retiene el pago</h3>
              <p className="text-sm text-sage-300">El organizador no recibe el dinero hasta que se confirma la ejecución del evento.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 mx-auto">
                <Award size={20} className="text-amber-300" />
              </div>
              <h3 className="font-semibold mb-2">3. Disfruta con tranquilidad</h3>
              <p className="text-sm text-sage-300">Si el retiro se cancela, recibes reembolso completo. Sin perseguir a nadie.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Por qué Retiru ═══ */}
      <section className="section">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3 text-center">
            Lo que Retiru te ofrece
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-center mb-5">
            Cada detalle está pensado para que tu única preocupación sea disfrutar de la experiencia.
          </p>
          <p className="text-sm text-[#7a6b5d] max-w-2xl mx-auto text-center mb-12 leading-relaxed">
            Retiru reúne verificación, pago protegido, reseñas auténticas y una selección curada en un solo lugar. Así no tienes que investigar por tu cuenta ni confiar a ciegas: todo está diseñado para que reserves con confianza total.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WHY_RETIRU.map(({ icon: Icon, title, desc, detail, image }) => (
              <div key={title} className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition-shadow hover:shadow-soft">
                <div className="relative aspect-[16/10] shrink-0 bg-sand-100">
                  <Image
                    src={image}
                    alt={`Ejemplo visual: ${title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-100">
                    <Icon size={24} className="text-terracotta-700" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[#7a6b5d]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Cómo funciona ═══ */}
      <section className="section bg-cream-100">
        <div className="container-narrow">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold">¿Cómo funciona?</h2>
          <p className="text-sm text-[#7a6b5d] max-w-xl mx-auto text-center mb-12 leading-relaxed">
            Solo tres pasos para vivir tu próxima experiencia transformadora. Sin sorpresas, sin letra pequeña y con soporte en cada etapa.
          </p>
          <div className="space-y-8">
            {STEPS.map(({ step, title, desc, detail }) => (
              <div key={step} className="flex gap-6 items-start">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta-600 text-lg font-bold text-white">
                  {step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#7a6b5d]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQs ═══ */}
      <section className="section">
        <div className="container-narrow">
          <h2 className="mb-10 text-center font-serif text-3xl font-bold">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }, i) => (
              <details key={i} className="group rounded-xl border border-sand-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronRight size={18} className="transition-transform group-open:rotate-90 text-muted-foreground shrink-0 ml-4" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
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
      <section className="section bg-gradient-to-br from-terracotta-600 to-terracotta-700 text-white text-center">
        <div className="container-narrow">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">Encuentra tu próximo retiro</h2>
          <p className="mx-auto mt-4 max-w-lg text-terracotta-100">
            Yoga, meditación, ayurveda, naturaleza… Experiencias verificadas con pago seguro y soporte dedicado.
            Tu bienestar merece esa tranquilidad.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-terracotta-200 leading-relaxed">
            Explora retiros por toda España, compara programas y precios con toda la información visible, y reserva sabiendo que tu dinero y tu experiencia están protegidos de principio a fin.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/es/retiros-retiru"
              className="btn-primary bg-white text-terracotta-700 hover:bg-sand-100 px-8 py-4 text-base"
            >
              Explorar retiros
            </Link>
            <Link
              href="/es/registro"
              className="btn-primary bg-white/10 hover:bg-white/20 border border-white/30 px-8 py-4 text-base text-white"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
