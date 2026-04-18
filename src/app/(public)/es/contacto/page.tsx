import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle, Clock, MapPin, HelpCircle } from 'lucide-react';
import { contactES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = contactES;

const CHANNELS = [
  {
    icon: Mail,
    title: 'Email',
    description: 'Para consultas generales, colaboraciones o soporte técnico.',
    action: 'contacto@retiru.com',
    href: 'mailto:contacto@retiru.com',
    label: 'Enviar email',
  },
  {
    icon: MessageCircle,
    title: 'Chat de soporte',
    description: 'Asistencia en tiempo real para asistentes y organizadores.',
    action: 'Disponible L-V, 9:00–18:00',
    href: '#',
    label: 'Iniciar chat',
  },
  {
    icon: HelpCircle,
    title: 'Centro de ayuda',
    description: 'Respuestas a las preguntas más frecuentes, paso a paso.',
    action: 'FAQ y guías',
    href: '/es/ayuda',
    label: 'Ver centro de ayuda',
  },
];

const FAQ_QUICK = [
  { q: '¿Cómo publico un retiro?', a: 'Crea tu cuenta y verifica tu email. En «Mis eventos» acepta el contrato de organizador, sube la documentación y crea tu retiro; nuestro equipo homologa tu perfil y revisa el retiro antes de publicarlo (suelen ser 24-48h). Resumen en «Para centros y organizadores» y en Ayuda.' },
  { q: '¿Cuánto cuesta usar Retiru?', a: 'Para organizadores, 0 € de suscripción. El primer retiro es gratis (0 % de comisión), el segundo al 10 % y a partir del tercero el 20 % estándar. El asistente paga el PVP publicado sin recargos extra.' },
  { q: '¿Cómo reclamo mi centro?', a: 'Busca tu centro en el directorio, haz clic en "Reclamar este centro" y crea tu cuenta si no la tienes. Verificaremos tu identidad como propietario.' },
  { q: '¿Puedo cancelar una reserva?', a: 'Sí. Cada retiro tiene su política de cancelación (plazos y % sobre lo pagado). Si te corresponde reembolso, lo recibes íntegro; la comisión de Retiru en cancelaciones se regula con el organizador, no como retención extra sobre tu devolución.' },
];

export default function ContactoPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-cream-100 to-white">
        <div className="container-wide py-16 md:py-20 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600 mb-4">Contacto</span>
          <h1 className="font-serif text-[clamp(28px,4.5vw,48px)] text-foreground leading-[1.15] mb-4 max-w-3xl mx-auto">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="text-[#7a6b5d] text-lg max-w-2xl mx-auto leading-relaxed">
            Estamos aquí para asistentes, organizadores y cualquier persona interesada en el mundo de los retiros. Elige el canal que prefieras.
          </p>
        </div>
      </section>

      {/* Canales */}
      <section className="container-wide py-12">
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {CHANNELS.map((ch) => (
            <div key={ch.title} className="bg-white rounded-2xl border border-sand-200 p-6 text-center hover:shadow-soft transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-terracotta-50 flex items-center justify-center mx-auto mb-4">
                <ch.icon className="w-6 h-6 text-terracotta-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{ch.title}</h3>
              <p className="text-sm text-[#7a6b5d] mb-4 leading-relaxed">{ch.description}</p>
              <a
                href={ch.href}
                className="inline-flex items-center justify-center gap-2 bg-terracotta-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-terracotta-700 transition-colors"
              >
                {ch.label}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ rápido */}
      <section className="container-wide py-12">
        <h2 className="font-serif text-2xl mb-6 text-center">Preguntas frecuentes</h2>
        <div className="max-w-2xl mx-auto space-y-3">
          {FAQ_QUICK.map(({ q, a }) => (
            <details key={q} className="group bg-white border border-sand-200 rounded-xl">
              <summary className="flex items-center justify-between p-5 font-semibold text-foreground cursor-pointer [&::-webkit-details-marker]:hidden text-[15px]">
                {q}
                <svg className="w-4 h-4 transition-transform group-open:rotate-90 text-[#a09383] shrink-0 ml-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </summary>
              <p className="px-5 pb-5 text-sm text-[#7a6b5d] leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
        <p className="text-center mt-6">
          <Link href="/es/ayuda" className="text-terracotta-600 font-semibold text-sm hover:underline">Ver todas las preguntas frecuentes →</Link>
        </p>
      </section>

      {/* Redes sociales */}
      <section className="container-wide py-10">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-serif text-2xl mb-2">Síguenos en redes</h2>
          <p className="text-sm text-[#7a6b5d] mb-6">
            Centros destacados, inspiración para retiros y novedades de la comunidad.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://www.facebook.com/retiru.es"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook de Retiru"
              className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-soft hover:border-terracotta-300 transition-all"
            >
              <svg className="w-4 h-4 text-[#1877f2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-7.5h2.5l.375-3h-2.875V8.625c0-.866.24-1.458 1.484-1.458h1.588v-2.68A21.5 21.5 0 0 0 14.267 4.5C12 4.5 10.5 5.884 10.5 8.31v2.19H8v3h2.5V21h3Z"/>
              </svg>
              Facebook
            </a>
            <a
              href="https://www.instagram.com/retiru.es"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Retiru"
              className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-soft hover:border-terracotta-300 transition-all"
            >
              <svg className="w-4 h-4 text-terracotta-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="bg-[#2d2319] text-white/80">
        <div className="container-wide py-10">
          <div className="grid sm:grid-cols-3 gap-8 text-center text-sm">
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 text-terracotta-400" />
              <p className="font-semibold text-white">Horario de atención</p>
              <p>Lunes a Viernes, 9:00 – 18:00 (CET)</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Mail className="w-5 h-5 text-terracotta-400" />
              <p className="font-semibold text-white">Email</p>
              <a href="mailto:contacto@retiru.com" className="hover:text-white transition-colors">contacto@retiru.com</a>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MapPin className="w-5 h-5 text-terracotta-400" />
              <p className="font-semibold text-white">Ubicación</p>
              <p>España</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
