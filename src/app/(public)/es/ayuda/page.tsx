// /es/ayuda — Centro de ayuda
import type { Metadata } from 'next';
import Link from 'next/link';
import { helpES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = helpES;

const SECTIONS = [
  { title: 'Para asistentes', items: [
    { q: '¿Cómo funciona la reserva?', a: 'Al reservar pagas el 20% como cuota de gestión a Retiru. El 80% restante se lo pagas directamente al organizador antes del retiro.' },
    { q: '¿Puedo cancelar mi reserva?', a: 'Sí. Cada retiro tiene su propia política de cancelación que puedes ver antes de reservar. La cuota de Retiru (20%) no es reembolsable.' },
    { q: '¿Cómo contacto al organizador?', a: 'Una vez confirmada tu reserva, tendrás acceso al chat directo con el organizador desde tu panel.' },
    { q: '¿El precio incluye alojamiento?', a: 'Depende de cada retiro. Revisa la sección "Qué incluye" en la ficha del retiro.' },
  ]},
  { title: 'Para organizadores', items: [
    { q: '¿Es gratis publicar?', a: 'Sí, 100%. No cobramos comisión ni suscripción. Nuestros ingresos vienen del 20% que paga el asistente.' },
    { q: '¿Cómo me verifico?', a: 'Necesitas subir un documento de identidad y datos fiscales. Lo revisamos en 24-48h.' },
    { q: '¿Cómo cobro a mis asistentes?', a: 'Tú cobras el 80% directamente al asistente antes del retiro, por transferencia o el método que prefieras.' },
    { q: '¿Mis retiros pasan revisión?', a: 'Sí, revisamos cada retiro antes de publicarlo para garantizar la calidad. Normalmente en 24h.' },
  ]},
  { title: 'Pagos y seguridad', items: [
    { q: '¿Es seguro pagar en Retiru?', a: 'Sí. Procesamos todos los pagos con Stripe, el mismo sistema que usan Airbnb, Spotify o Shopify.' },
    { q: '¿Qué métodos de pago aceptáis?', a: 'Tarjeta de crédito y débito (Visa, Mastercard, American Express).' },
    { q: '¿Cómo funciona el reembolso?', a: 'Según la política de cancelación del retiro. Los reembolsos se procesan automáticamente a la tarjeta original en 5-10 días.' },
  ]},
];

export default function AyudaPage() {
  return (
    <div className="container-wide py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2 text-center">Centro de ayuda</h1>
        <p className="text-[#7a6b5d] mb-12 text-center">¿Tienes alguna duda? Aquí encontrarás las respuestas más frecuentes.</p>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-10">
            <h2 className="font-serif text-2xl mb-4">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map(({ q, a }, i) => (
                <details key={i} className="group bg-white border border-sand-200 rounded-xl">
                  <summary className="flex items-center justify-between p-5 font-semibold text-foreground cursor-pointer [&::-webkit-details-marker]:hidden text-[15px]">
                    {q}
                    <svg className="w-4 h-4 transition-transform group-open:rotate-90 text-[#a09383] shrink-0 ml-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-[#7a6b5d] leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-sand-100 rounded-2xl p-8 text-center mt-12">
          <h3 className="font-serif text-xl mb-2">¿No encuentras lo que buscas?</h3>
          <p className="text-sm text-[#7a6b5d] mb-4">Escríbenos y te respondemos en menos de 24h</p>
          <a href="mailto:hola@retiru.es" className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">
            Contactar por email
          </a>
        </div>
      </div>
    </div>
  );
}
