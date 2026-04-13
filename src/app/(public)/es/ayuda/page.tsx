// /es/ayuda — Centro de ayuda
import type { Metadata } from 'next';
import { helpES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = helpES;

const SECTIONS = [
  { title: 'Para asistentes', items: [
    { q: '¿Cómo funciona la reserva?', a: 'En la mayoría de retiros pagas el PVP (precio publicado por persona) en un solo pago seguro con tarjeta (Stripe). Si el retiro tiene un mínimo de plazas y aún no se ha alcanzado, puedes reservar plaza sin pagar hasta que se cumpla el mínimo; después te enviamos un enlace para pagar dentro del plazo. Retiru gestiona la reserva y el reparto con el organizador, sin recargo extra para ti.' },
    { q: '¿Puedo cancelar mi reserva?', a: 'Sí. Cada retiro tiene su política de cancelación (plazos y porcentajes sobre lo que pagaste). Si te corresponde reembolso, recibes ese importe íntegro; no aplicamos una retención extra tipo «cuota no reembolsable» sobre tu devolución.' },
    { q: '¿Cómo contacto al organizador?', a: 'Una vez confirmada tu reserva, tendrás acceso al chat directo con el organizador desde tu panel.' },
    { q: '¿El precio incluye alojamiento?', a: 'Depende de cada retiro. Revisa la sección "Qué incluye" en la ficha del retiro.' },
  ]},
  { title: 'Para organizadores', items: [
    { q: '¿Cuánto cuesta publicar retiros?', a: 'No hay suscripción ni cuota fija. Además, tu primer retiro es completamente gratis (0 % de comisión); el segundo lleva un 10 %; y a partir del tercero la comisión estándar es del 20 % del PVP. El asistente siempre paga el PVP sin recargos.' },
    { q: '¿Cómo empiezo a publicar retiros?', a: 'Crea tu cuenta con email, verifica tu email y crea tu primer retiro desde tu panel. Nuestro equipo lo revisa en 24-48h. Una vez aprobado tu primer retiro, te conviertes en organizador verificado.' },
    { q: '¿Cómo cobro mis retiros?', a: 'El asistente paga el PVP por la plataforma cuando toca el cobro (o reserva sin pago hasta el mínimo de plazas, si lo configuraste). Retiru retiene la comisión según tu nivel (0 %, 10 % o 20 %) y te transfiere el neto según los acuerdos de liquidación vigentes.' },
    { q: '¿Mis retiros pasan revisión?', a: 'Tu primer retiro se revisa para garantizar la calidad (24-48h). Una vez verificado como organizador, los siguientes retiros se publican directamente.' },
    { q: '¿Puedo generar la foto de portada con IA?', a: 'Sí. Al crear o editar un evento puedes subir hasta 8 fotos: una es la portada (listados y cabecera de la ficha) y el resto aparecen en la galería de la ficha pública. Puedes usar «Generar portada con IA» para crear una imagen fotorrealista con GPT Image 1.5 a partir del título y los textos. Si no subes ninguna imagen, al guardar el evento se genera una portada automáticamente (si el servidor tiene configurada la API de OpenAI).' },
  ]},
  { title: 'Para centros', items: [
    { q: '¿Cómo reclamo o propongo mi centro?', a: 'Si ya está en el directorio, búscalo y usa «Reclamar este centro». Si no aparece, inicia sesión, ve a «Mis centros» y «Proponer nuevo centro»: eliges el lugar en Google Maps y nuestro equipo revisa la propuesta antes de publicarla.' },
    { q: '¿Cuánto cuesta estar en el directorio?', a: 'El directorio tiene una cuota de 20 €/mes. En la fase de lanzamiento, los centros seleccionados disfrutan de 6 meses de cortesía. Después, quienes quieran mantener su ficha activa pasan a la cuota mensual.' },
    { q: '¿Qué puedo hacer una vez reclame mi centro?', a: 'Podrás editar tu ficha (fotos, descripción, horarios, servicios), responder a reseñas y publicar retiros y eventos desde tu perfil.' },
  ]},
  { title: 'Pagos y seguridad', items: [
    { q: '¿Es seguro pagar en Retiru?', a: 'Sí. Procesamos todos los pagos con Stripe, el mismo sistema que usan Airbnb, Spotify o Shopify.' },
    { q: '¿Qué métodos de pago aceptáis?', a: 'Tarjeta de crédito y débito (Visa, Mastercard, American Express).' },
    { q: '¿Cómo funciona el reembolso?', a: 'Según la política de cancelación del retiro (sobre el importe total pagado). Si te corresponde, recibes ese importe íntegro en tu tarjeta en unos 5-10 días; no añadimos retenciones extra sobre la devolución.' },
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
          <a href="mailto:contacto@retiru.com" className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">
            Contactar por email
          </a>
        </div>
      </div>
    </div>
  );
}
