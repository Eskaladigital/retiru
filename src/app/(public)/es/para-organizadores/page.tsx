// ============================================================================
// RETIRU · PARA CENTROS Y ORGANIZADORES — /es/para-organizadores
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Check, ArrowRight, BarChart3, MessageSquare, QrCode, Users,
  FileText, Star, Shield, Zap, CreditCard, ChevronRight,
  MapPin, Globe, Clock, Phone, Mail, Building2, CalendarPlus,
  Megaphone, BadgeCheck, Sparkles,
} from 'lucide-react';
import { forOrganizersES } from '@/lib/seo/page-metadata';
import { jsonLdFAQ, jsonLdScript } from '@/lib/seo';
export const metadata: Metadata = forOrganizersES;

const CENTER_BENEFITS = [
  { icon: MapPin, title: 'Presencia en el directorio', desc: 'Ficha detallada con horarios, servicios, fotos, reseñas y ubicación en mapa.' },
  { icon: Globe, title: 'Visibilidad SEO', desc: 'Tu centro aparece en búsquedas de Google. Ficha bilingüe ES/EN optimizada.' },
  { icon: Star, title: 'Reseñas verificadas', desc: 'Los usuarios pueden valorar tu centro. Las buenas reseñas te dan más visibilidad.' },
  { icon: BadgeCheck, title: 'Sello de centro verificado', desc: 'Un badge de verificación transmite confianza a potenciales clientes.' },
  { icon: Phone, title: 'Contacto directo', desc: 'Los interesados te contactan sin intermediarios: teléfono, email, web y redes.' },
  { icon: CalendarPlus, title: 'Publica retiros', desc: 'Además del directorio, publica retiros o eventos desde tu perfil de centro.' },
];

const ORGANIZER_FEATURES = [
  { icon: FileText, title: 'Wizard de creación', desc: 'Publica tu retiro paso a paso con previsualización en tiempo real.' },
  { icon: Users, title: 'CRM de asistentes', desc: 'Datos, formularios, notas internas y segmentación de tus asistentes.' },
  { icon: MessageSquare, title: 'Mensajería integrada', desc: 'Chat 1a1 y mensajes masivos con plantillas predefinidas.' },
  { icon: QrCode, title: 'Check-in con QR', desc: 'Lista de asistencia y códigos QR por reserva para el día del retiro.' },
  { icon: BarChart3, title: 'Analíticas', desc: 'Vistas, conversiones, reservas y cancelaciones de cada retiro.' },
  { icon: Star, title: 'Gestión de reseñas', desc: 'Ve y responde públicamente a las reseñas de tus asistentes.' },
];

const FAQS = [
  { q: '¿Hay suscripción o cuota por publicar?', a: 'No: publicar y usar el panel no lleva cuota fija. Además, tu primer retiro es completamente gratis (0 % de comisión); el segundo lleva un 10 %; y a partir del tercero la comisión estándar es del 20 % del PVP. El asistente siempre paga el PVP, sin recargos.' },
  { q: '¿Qué precio debo poner en mi retiro?', a: 'El que quieres cobrar por persona como precio final en la ficha: es el PVP. En el formulario verás el desglose según tu nivel de comisión (0 %, 10 % o 20 %).' },
  { q: '¿Cómo funciona el directorio de centros?', a: 'Tu centro aparece en nuestro directorio con ficha completa: fotos, servicios, horarios, ubicación y reseñas. Los usuarios pueden encontrarte buscando por zona, tipo de disciplina o nombre. Si tu centro ya está en Retiru, puedes reclamarlo desde su ficha. Si no aparece, con cuenta iniciada puedes proponerlo desde «Mis centros»; nuestro equipo lo revisa antes de publicarlo.' },
  { q: '¿Cuánto cuesta aparecer en el directorio?', a: 'El directorio tiene una cuota mensual de 20 €/mes. En la fase de lanzamiento, los centros seleccionados disfrutan de 6 meses de cortesía. Después de ese periodo, quienes quieran mantener su ficha activa pasan a la cuota mensual.' },
  { q: '¿Puedo ser centro y organizador a la vez?', a: 'Sí. Si eres un centro que organiza retiros u otros eventos, puedes tener tu ficha en el directorio y además publicarlos con todas las herramientas del panel.' },
  { q: '¿Cómo cobro a mis asistentes?', a: 'El asistente paga el PVP por la plataforma (o reserva plaza sin pago si tu retiro tiene mínimo de plazas y aún no se ha alcanzado). Retiru retiene la comisión que corresponda según tu nivel (0 %, 10 % o 20 %) y te transfiere el neto según el acuerdo de liquidación.' },
  { q: '¿Necesito verificarme para publicar retiros?', a: 'Sí, en dos frentes. Primero debes aceptar el contrato de organizador en «Mis eventos» para poder crear eventos. Además, para que un retiro llegue a publicarse, nuestro equipo debe homologar tu perfil con la documentación que subas (identidad, alta en actividad económica, seguro de responsabilidad civil, datos fiscales y bancarios) y aprobar el contenido del retiro. Puedes preparar el retiro y enviar la documentación en paralelo; el retiro solo se publica cuando ambas revisiones estén aprobadas.' },
  { q: '¿Puedo crear un retiro antes de estar homologado como organizador?', a: 'Sí. Tras aceptar el contrato puedes crear borradores y enviarlos a revisión mientras subes la documentación. Retiru revisará el retiro, pero no podrá aprobarse ni publicarse hasta que tu perfil de organizador esté verificado documentalmente.' },
  { q: '¿Cómo reclamo o doy de alta mi centro?', a: 'Si tu centro ya está en el directorio, búscalo y usa «Reclamar este centro» (o regístrate si aún no tienes cuenta). Si no está listado, entra en «Mis centros» tras iniciar sesión, elige «Proponer nuevo centro» y localiza el lugar en Google Maps; enviaremos la propuesta a revisión y, al aprobarla, podrás gestionar la ficha.' },
  { q: '¿Y si un asistente cancela?', a: 'Tú configuras la política de cancelación (plazos y porcentajes sobre lo pagado). Si al asistente le corresponde reembolso, se le devuelve ese importe íntegro. La compensación de la comisión de Retiru en esos casos se regula en el acuerdo comercial contigo, no como retención adicional sobre el reembolso del asistente.' },
];

export default function ParaOrganizadoresPage() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sage-800 via-sage-900 to-sage-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(200,90,48,0.15),transparent_70%)]" />
        <div className="container-narrow relative py-20 md:py-32 text-center">
          <span className="inline-block text-sm bg-white/10 text-sage-200 px-4 py-1.5 rounded-full mb-6">
            Para centros y organizadores
          </span>
          <h1 className="font-serif text-4xl font-bold md:text-6xl md:leading-[1.1]">
            Haz crecer tu proyecto<br />
            <span className="text-terracotta-400">con Retiru</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-sage-300 leading-relaxed">
            Si tienes un centro de yoga, meditación o ayurveda, o si organizas retiros y eventos de ese tipo,
            Retiru es tu plataforma. <strong className="font-semibold text-white">Sin suscripción</strong> para publicar.
            Tu <strong className="font-semibold text-white">primer retiro sin comisión</strong> (0&nbsp;%), el segundo al <strong className="font-semibold text-white">10&nbsp;%</strong> y a partir del tercero
            la comisión estándar del <strong className="font-semibold text-white">20&nbsp;%</strong> incluida en el PVP. Sin recargos ocultos para quien reserva.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="#centros" className="btn-primary bg-terracotta-600 hover:bg-terracotta-700 px-8 py-4 text-base">
              Soy un centro
            </a>
            <a href="#organizadores" className="btn-primary bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-4 text-base text-white">
              Organizo retiros o eventos
            </a>
          </div>
        </div>
      </section>

      {/* ═══ CENTROS ═══ */}
      <section id="centros" className="section bg-cream-100">
        <div className="container-wide">
          <div className="flex items-center gap-3 mb-2">
            <Building2 size={28} className="text-sage-700" />
            <span className="text-sm font-bold uppercase tracking-widest text-sage-600">Para centros</span>
          </div>
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3">
            Pon tu centro en el mapa
          </h2>
          <p className="text-muted-foreground max-w-2xl mb-12">
            Si tienes un centro de yoga, meditación o ayurveda,
            te incluimos en nuestro directorio para que miles de personas te encuentren.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {CENTER_BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-sand-200 bg-white p-6 transition-shadow hover:shadow-soft">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100">
                  <Icon size={24} className="text-sage-700" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Centro */}
          <div className="rounded-2xl bg-gradient-to-r from-sage-800 to-sage-900 text-white p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="font-serif text-2xl font-bold mb-3">¿Tu centro ya está en Retiru?</h3>
              <p className="text-sage-300 leading-relaxed max-w-lg">
                Busca tu centro en nuestro directorio y reclámalo para gestionar tu ficha, responder reseñas y publicar eventos.
                Si no aparece, inicia sesión y propón el centro desde «Mis centros» (lo revisamos antes de publicarlo) o escríbenos y te ayudamos.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link
                href="/es/centros-retiru"
                className="btn-primary bg-terracotta-600 hover:bg-terracotta-700 px-8 py-4 text-base text-center"
              >
                <MapPin size={18} className="mr-2 inline" />
                Buscar mi centro
              </Link>
              <Link
                href="/es/contacto"
                className="text-sage-400 text-xs text-center hover:text-sage-200 transition-colors"
              >
                ¿No lo encuentras? Contáctanos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ORGANIZADORES ═══ */}
      <section id="organizadores" className="section">
        <div className="container-wide">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={28} className="text-terracotta-600" />
            <span className="text-sm font-bold uppercase tracking-widest text-terracotta-500">Para organizadores</span>
          </div>
          <h2 className="font-serif text-3xl font-bold md:text-4xl mb-3">
            Publica tus retiros <span className="text-terracotta-600">sin cuota fija</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mb-12">
            Si creas retiros o eventos de yoga, meditación o ayurveda, Retiru te da un panel de gestión completo
            sin suscripción ni pago por alta. Tu <strong className="text-foreground">primer retiro es gratis</strong> (0&nbsp;% de comisión); el segundo al 10&nbsp;%; a partir del tercero, 20&nbsp;% del PVP. El desglose es visible en el formulario antes de publicar.
          </p>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white mb-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-300 bg-sand-50">
                  <th className="py-4 px-5 text-left font-semibold"></th>
                  <th className="py-4 px-5 text-center font-bold text-terracotta-600 text-lg">Retiru</th>
                  <th className="py-4 px-5 text-center text-muted-foreground">BookRetreats</th>
                  <th className="py-4 px-5 text-center text-muted-foreground">Otros</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Suscripción / cuota por publicar', 'No (0 €)', 'Sí / varía', 'Varía'],
                  ['Comisión sobre ventas (PVP)', '0 % → 10 % → 20 %', '20–30 %', '10–25 %'],
                  ['Primer retiro gratis (sin comisión)', '✓', '✗', '✗'],
                  ['Panel de gestión', 'Completo, sin cuota fija', 'Básico', 'Limitado'],
                  ['CRM de asistentes', '✓', '✗', '✗'],
                  ['Mensajería integrada', '✓', 'Limitada', '✗'],
                  ['Check-in con QR', '✓', '✗', '✗'],
                  ['Bilingüe ES/EN', '✓', 'Solo EN', 'Varía'],
                  ['Cuestionarios post-reserva', '✓', '✗', '✗'],
                  ['Analíticas', '✓', 'Básicas', '✗'],
                ].map(([feature, retiru, book, otros], i) => (
                  <tr key={i} className="border-b border-sand-200 last:border-0">
                    <td className="py-3 px-5 font-medium text-foreground">{feature}</td>
                    <td className="py-3 px-5 text-center font-semibold text-sage-700">{retiru}</td>
                    <td className="py-3 px-5 text-center text-muted-foreground">{book}</td>
                    <td className="py-3 px-5 text-center text-muted-foreground">{otros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tiered commission visual */}
          <div className="mb-12 rounded-2xl border-2 border-sand-200 bg-white p-6 md:p-8">
            <h3 className="font-serif text-xl font-bold text-foreground mb-6 text-center">Comisiones progresivas: empieza gratis</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">1.er retiro</p>
                <p className="text-4xl font-bold text-emerald-700">0&nbsp;%</p>
                <p className="text-sm text-emerald-800 mt-2">Sin comisión. Tú recibes el <strong>100&nbsp;%</strong> del PVP.</p>
              </div>
              <div className="rounded-xl bg-sky-50 border border-sky-200 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700 mb-2">2.º retiro</p>
                <p className="text-4xl font-bold text-sky-700">10&nbsp;%</p>
                <p className="text-sm text-sky-800 mt-2">Comisión reducida. Tú recibes el <strong>90&nbsp;%</strong> del PVP.</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">3.er retiro en adelante</p>
                <p className="text-4xl font-bold text-amber-700">20&nbsp;%</p>
                <p className="text-sm text-amber-800 mt-2">Comisión estándar. Tú recibes el <strong>80&nbsp;%</strong> del PVP.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Cada retiro mantiene de forma permanente su nivel de comisión. Sin letra pequeña.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {ORGANIZER_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-sand-200 bg-white p-6 transition-shadow hover:shadow-soft">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-100">
                  <Icon size={24} className="text-terracotta-700" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How it works (organizadores) ═══ */}
      <section id="como-funciona" className="section bg-cream-100">
        <div className="container-narrow">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold">¿Cómo funciona para organizadores?</h2>
          <div className="space-y-8">
            {[
              { step: '01', title: 'Crea tu cuenta', desc: 'Regístrate con tu email y verifica tu cuenta. Desde «Mis eventos» podrás iniciar el alta como organizador.' },
              { step: '02', title: 'Contrato y documentación', desc: 'En «Mis eventos» aceptas el contrato de organizador con Retiru. A continuación puedes subir la documentación requerida (identidad, alta en actividad económica, seguro de responsabilidad civil, datos fiscales y bancarios). Tu perfil queda pendiente de homologación hasta que nuestro equipo lo verifique; en paralelo ya puedes ir preparando tus eventos.' },
              { step: '03', title: 'Crea tu retiro y envíalo a revisión', desc: 'Usa el wizard paso a paso: portada y hasta 8 fotos (la portada es la imagen principal en listados y cabecera de la ficha; el resto forma la galería). Puedes generar la portada con IA o, si no subes fotos, se crea una portada automática al guardar. Añade programa, PVP por persona (con desglose de comisión según tu nivel), mínimo de plazas si aplica y política de cancelación. Cuando esté listo, envía el retiro a revisión.' },
              { step: '04', title: 'Homologación, publicación y reservas', desc: 'Homologamos tu perfil documental y revisamos el retiro por calidad y coherencia. Un retiro solo se publica cuando tu perfil de organizador está verificado y el retiro está aprobado (suelen ser 24-48h en cada frente cuando la documentación está completa). Una vez publicado, los asistentes reservan por la plataforma: Retiru retiene la comisión que corresponda (0 %, 10 % o 20 % según tu nivel) y te liquida el neto según el acuerdo de liquidación.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-6 items-start">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta-600 text-lg font-bold text-white">
                  {step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
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
          <h2 className="font-serif text-3xl font-bold md:text-4xl">Únete a Retiru</h2>
          <p className="mx-auto mt-4 max-w-lg text-terracotta-100">
            Ya seas un centro de yoga, meditación o ayurveda o un organizador de retiros en ese ámbito, Retiru te da las herramientas
            y la visibilidad que necesitas. Publicar no lleva suscripción; tu primer retiro es gratis (0&nbsp;%), el segundo al 10&nbsp;% y a partir del tercero el 20&nbsp;% estándar.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/es/centros-retiru"
              className="btn-primary bg-white text-terracotta-700 hover:bg-sand-100 px-8 py-4 text-base"
            >
              Soy un centro — Buscar mi ficha
            </Link>
            <Link
              href="/es/registro"
              className="btn-primary bg-white/10 hover:bg-white/20 border border-white/30 px-8 py-4 text-base text-white"
            >
              Soy organizador — Crear cuenta
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
