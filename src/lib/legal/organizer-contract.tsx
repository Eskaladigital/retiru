// ============================================================================
// RETIRU · Contrato del organizador (fuente única)
// Usado por:
//   - src/components/panel/ContratoOrganizador.tsx  (aceptación bloqueante)
//   - src/app/(public)/{es,en}/condiciones/page.tsx (consulta pública)
// Cualquier cambio aquí se refleja automáticamente en los dos sitios.
// ============================================================================

import {
  Shield,
  Wallet,
  Image as ImageIcon,
  MessagesSquare,
  Clock,
  Users,
  RefreshCcw,
  Banknote,
  Lock,
  AlertOctagon,
  PenLine,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import type { Locale } from '@/i18n/config';

export const CONTRACT_VERSION = '1.0 · 2026-04';

export type Clause = {
  icon: LucideIcon;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const CLAUSES_ES: Clause[] = [
  {
    icon: ScrollText,
    title: '1. Objeto y servicio Retiru',
    paragraphs: [
      'Retiru es un marketplace que conecta organizadores de retiros y eventos centrados en yoga, meditación y ayurveda con personas asistentes. La plataforma se encarga de la captación, ficha pública, cobro al asistente y comunicación pre-reserva.',
      'El Organizador publica eventos sin cuota fija de suscripción y mantiene en todo momento la titularidad del contenido y la responsabilidad sobre la prestación del servicio físico (organización, infraestructura, programa, equipo facilitador).',
    ],
  },
  {
    icon: Wallet,
    title: '2. Modelo económico y comisiones escalonadas',
    paragraphs: [
      'El Organizador fija el PVP por persona (precio público final), con un mínimo de 50 €. Ese importe es lo que paga el asistente, sin recargos extra.',
      'Retiru retiene una comisión escalonada calculada sobre el PVP y permanente para cada retiro:',
    ],
    bullets: [
      '1.er retiro con al menos una reserva pagada: 0 % de comisión (el Organizador recibe el 100 %).',
      '2.º retiro con reservas pagadas: 10 % de comisión (90 % para el Organizador).',
      'A partir del 3.º retiro: 20 % de comisión (80 % para el Organizador).',
      'Cada retiro mantiene de forma permanente el nivel de comisión asignado al crearlo. El nivel no se recalcula al subir o bajar el volumen.',
      'No existe cuota mensual ni gastos de publicación. La única remuneración de Retiru en el marketplace es esta comisión.',
    ],
  },
  {
    icon: Shield,
    title: '3. Verificación de identidad y actividad (KYC)',
    paragraphs: [
      'Para publicar el primer evento es obligatorio completar la verificación documental. Tu perfil queda en estado pendiente hasta que nuestro equipo valide cada documento de forma individual.',
      'Documentación requerida:',
    ],
    bullets: [
      'Documento de identidad vigente (DNI, NIE o pasaporte).',
      'Alta en actividad económica: alta de autónomo en la AEAT/Seguridad Social o escritura de constitución y CIF de la sociedad.',
      'Seguro de responsabilidad civil vigente que cubra la actividad organizada.',
      'Datos fiscales (NIF/CIF, razón social y dirección fiscal) acompañados de un certificado o documento acreditativo.',
      'Datos bancarios: IBAN del titular y certificado de titularidad bancaria emitido por la entidad.',
    ],
  },
  {
    icon: ImageIcon,
    title: '4. Calidad y veracidad del contenido',
    paragraphs: [
      'El Organizador se compromete a publicar información veraz, completa y actualizada en cada ficha: programa, instalaciones, alojamiento, comidas, equipo facilitador, qué incluye y qué no incluye, ubicación y precio.',
      'Las imágenes deben ser propias o contar con licencia válida. No se admiten fotografías engañosas, atribuidas a otros centros o que no representen el evento real.',
      'Retiru se reserva el derecho a moderar, solicitar cambios o despublicar contenido que incumpla estas normas, así como a exigir corrección de errores manifiestos detectados por usuarios o por la moderación automática.',
    ],
  },
  {
    icon: MessagesSquare,
    title: '5. Comunicación dentro de la plataforma',
    paragraphs: [
      'Toda la comunicación pre-reserva con asistentes potenciales se realiza a través de la mensajería interna de Retiru. Esto protege al asistente, deja trazabilidad y permite la mediación en caso de incidencia.',
      'En la ficha pública del evento (descripción, programa, incluye, etc.) está prohibido publicar teléfonos móviles, emails personales, perfiles directos del organizador o cualquier otro canal de contacto cuyo objetivo sea desviar al asistente fuera de la plataforma para eludir la comisión.',
      'Tras una reserva confirmada, sí se comparten datos de contacto operativos (logística, llegada, materiales). Cualquier intento de desviar reservas a canales externos para evitar la comisión se considera incumplimiento grave y motivará la suspensión inmediata del perfil, además de la facturación de la comisión correspondiente.',
    ],
  },
  {
    icon: Clock,
    title: '6. Plazos y obligaciones operativas',
    paragraphs: [
      'El Organizador se compromete a operar con diligencia razonable en los siguientes plazos:',
    ],
    bullets: [
      'Confirmación o rechazo de reservas que requieran aprobación manual: 48 horas como máximo desde la solicitud. Pasado ese plazo, Retiru puede cancelar la reserva y reembolsar al asistente.',
      'Respuesta a mensajes de asistentes en mensajería interna: en un plazo razonable, idealmente dentro de las 48 horas hábiles.',
      'Comunicación clara y oportuna ante incidencias (cambios de programa, ubicación, climatología o cualquier modificación relevante respecto a la ficha publicada).',
      'Celebración del evento en la fecha y lugar publicados, salvo causa justificada notificada con la antelación adecuada.',
    ],
  },
  {
    icon: Users,
    title: '7. Mínimo viable y reserva sin pago',
    paragraphs: [
      'Si configuras un mínimo de plazas mayor que uno, los primeros asistentes podrán reservar plaza sin pagar mientras no se alcance ese mínimo (estado «reserva sin pago»).',
      'Cuando se cumple el mínimo, Retiru envía a todos los inscritos un enlace de pago con un plazo máximo de 72 horas (con 24 horas adicionales de gracia si no abonan en el primer plazo). Si tras el plazo no han pagado, sus reservas se cancelan automáticamente.',
      'El Organizador se compromete a celebrar el evento en cuanto se alcance el mínimo viable y los inscritos completen su pago.',
    ],
  },
  {
    icon: RefreshCcw,
    title: '8. Política de cancelación y reembolsos',
    paragraphs: [
      'El Organizador define al crear el evento su política de cancelación (porcentajes y plazos de reembolso aplicables al asistente). Esa política debe ser razonable y queda visible en la ficha pública antes de reservar.',
      'Reglas comunes:',
    ],
    bullets: [
      'Cancelación por el Organizador: el asistente recibe siempre el reembolso íntegro de forma automática.',
      'No confirmación en plazo por el Organizador: el asistente recibe siempre el reembolso íntegro de forma automática.',
      'Cancelación por el asistente: se aplica la política definida por el Organizador. El reembolso se transfiere íntegro al asistente; la compensación de la comisión que correspondería a Retiru se rige por este acuerdo y no se descuenta del reembolso del asistente.',
      'Cancelaciones reiteradas, masivas o sin causa justificada por parte del Organizador constituyen incumplimiento grave.',
    ],
  },
  {
    icon: Banknote,
    title: '9. Pagos al organizador (payouts)',
    paragraphs: [
      'Una vez confirmada una reserva pagada, Retiru retiene la comisión que corresponda al nivel del retiro y abona el neto al Organizador en el IBAN verificado durante el proceso KYC.',
      'El payout se realiza de forma manual según el calendario interno de liquidación, que será comunicado por el equipo de Retiru. En caso de incidencias documentales, sospecha de fraude, disputas con asistentes o reclamaciones bancarias, los pagos pueden quedar en revisión hasta su resolución.',
      'El Organizador es responsable de la facturación, IVA, IRPF y obligaciones fiscales que correspondan a sus ingresos por los retiros publicados, así como de mantener vigentes su alta económica y su seguro de responsabilidad civil.',
    ],
  },
  {
    icon: Lock,
    title: '10. Datos personales y RGPD',
    paragraphs: [
      'El Organizador es corresponsable del tratamiento de los datos personales de los asistentes a sus eventos. Se compromete a tratarlos exclusivamente para la gestión, comunicación y prestación del retiro reservado.',
      'No podrá utilizar los datos de los asistentes para envíos de marketing externo, cesión a terceros ni inclusión en listas comerciales sin consentimiento expreso, libre, previo e informado del asistente.',
      'Todos los aspectos no regulados expresamente aquí se rigen por la Política de privacidad de Retiru.',
    ],
  },
  {
    icon: AlertOctagon,
    title: '11. Suspensión, baja y modificación del contrato',
    paragraphs: [
      'Retiru podrá suspender o cerrar el perfil del Organizador, con o sin previo aviso según la gravedad, ante incumplimientos sustanciales: contenido falso o engañoso, intento de eludir la comisión, cancelaciones reiteradas, quejas reiteradas, vencimiento de seguro o alta económica, prácticas que dañen la confianza en la plataforma o cualquier infracción de la legislación aplicable.',
      'El Organizador puede solicitar la baja en cualquier momento. Las reservas confirmadas existentes deberán respetarse hasta su celebración natural o reembolsarse íntegramente al asistente.',
      'Retiru podrá actualizar este contrato por motivos legales, operativos o de modelo de negocio. Los cambios sustanciales se comunicarán con antelación razonable y, en su caso, requerirán nueva aceptación.',
    ],
  },
  {
    icon: PenLine,
    title: '12. Aceptación electrónica y normativa aplicable',
    paragraphs: [
      'Al pulsar el botón final, se registra electrónicamente tu aceptación: identificador de cuenta, fecha y hora (UTC), versión del contrato y dirección IP, conforme a la Ley 34/2002 de servicios de la sociedad de la información y al Reglamento eIDAS. Esta aceptación tiene valor probatorio en caso de controversia.',
      'Este acuerdo se rige por la legislación española. Para cualquier conflicto, las partes se someten a los juzgados y tribunales competentes según la normativa aplicable de consumidores y usuarios.',
    ],
  },
];

const CLAUSES_EN: Clause[] = [
  {
    icon: ScrollText,
    title: '1. Purpose and Retiru service',
    paragraphs: [
      'Retiru is a marketplace that connects organizers of retreats and events focused on yoga, meditation and ayurveda with attendees. The platform handles acquisition, the public listing, payment from the attendee and pre-booking communication.',
      'The Organizer publishes events with no fixed subscription fee and remains, at all times, owner of the content and responsible for the actual delivery of the experience (logistics, infrastructure, programme, facilitating team).',
    ],
  },
  {
    icon: Wallet,
    title: '2. Economic model and tiered commissions',
    paragraphs: [
      'The Organizer sets the per-person PVP (final public price), with a minimum of €50. That is the amount the attendee pays — no extra surcharges.',
      'Retiru retains a tiered commission calculated on the PVP, permanently set for each retreat:',
    ],
    bullets: [
      '1st retreat with at least one paid booking: 0% commission (the Organizer receives 100%).',
      '2nd retreat with paid bookings: 10% commission (90% to the Organizer).',
      'From the 3rd retreat onward: 20% commission (80% to the Organizer).',
      'Each retreat keeps its commission tier permanently from creation. The tier is not recalculated based on later volume.',
      "There is no monthly fee or publishing cost. This commission is Retiru's only remuneration in the marketplace.",
    ],
  },
  {
    icon: Shield,
    title: '3. Identity and activity verification (KYC)',
    paragraphs: [
      'Completing documentary verification is mandatory before publishing your first event. Your profile remains pending until our team validates each document individually.',
      'Required documentation:',
    ],
    bullets: [
      'Valid identity document (national ID, NIE or passport).',
      'Proof of business activity: self-employment registration with tax/social-security authorities, or articles of incorporation and tax ID for a company.',
      'Valid civil liability insurance covering the activity organized.',
      'Tax data (tax ID, business name, fiscal address) with a certificate or supporting document.',
      'Bank details: account holder IBAN and a bank-issued ownership certificate.',
    ],
  },
  {
    icon: ImageIcon,
    title: '4. Quality and accuracy of content',
    paragraphs: [
      'The Organizer commits to publishing truthful, complete and up-to-date information on each listing: programme, facilities, accommodation, meals, facilitating team, what is included and excluded, location and price.',
      'Images must be your own or properly licensed. Misleading photos, images attributed to other centers or that do not represent the actual event are not allowed.',
      'Retiru reserves the right to moderate, request changes or unpublish content that breaches these rules, and to require correction of clear errors detected by users or by automated moderation.',
    ],
  },
  {
    icon: MessagesSquare,
    title: '5. Communication within the platform',
    paragraphs: [
      'All pre-booking communication with potential attendees happens through Retiru internal messaging. This protects the attendee, leaves a clear audit trail and allows mediation if anything goes wrong.',
      'The public listing of the event (description, programme, includes, etc.) must not contain mobile phones, personal emails, direct organizer profiles or any other contact channel whose purpose is to divert the attendee outside the platform to avoid the commission.',
      'After a confirmed booking, operational contact data (logistics, arrival, materials) is shared. Any attempt to divert bookings to external channels to avoid the commission is considered a serious breach and will trigger immediate suspension of the profile, plus invoicing of the corresponding commission.',
    ],
  },
  {
    icon: Clock,
    title: '6. Operational deadlines and obligations',
    paragraphs: [
      'The Organizer commits to operate with reasonable diligence within these timeframes:',
    ],
    bullets: [
      'Confirmation or rejection of bookings that require manual approval: 48 hours maximum from the request. After that, Retiru may cancel the booking and refund the attendee.',
      'Reply to attendee messages in internal messaging: within a reasonable timeframe, ideally within 48 working hours.',
      'Clear and timely communication on incidents (changes to programme, location, weather or any relevant change versus the published listing).',
      'Holding the event on the published date and location, except for justified causes notified with appropriate advance notice.',
    ],
  },
  {
    icon: Users,
    title: '7. Minimum viable group and no-payment reservation',
    paragraphs: [
      'If you set a minimum group size greater than one, the first attendees can reserve a spot without paying until that minimum is reached (status "reserved without payment").',
      'Once the minimum is met, Retiru sends every registrant a payment link with a maximum 72-hour deadline (plus 24 extra grace hours if not paid within the first window). If they do not pay within that period, their bookings are cancelled automatically.',
      'The Organizer commits to running the event as soon as the minimum viable group is reached and registrants complete their payment.',
    ],
  },
  {
    icon: RefreshCcw,
    title: '8. Cancellation policy and refunds',
    paragraphs: [
      'When creating the event, the Organizer defines the cancellation policy (refund percentages and timeframes that apply to the attendee). That policy must be reasonable and is visible on the public listing before booking.',
      'Common rules:',
    ],
    bullets: [
      'Cancellation by the Organizer: the attendee always receives a full automatic refund.',
      'Failure to confirm in time by the Organizer: the attendee always receives a full automatic refund.',
      "Cancellation by the attendee: the Organizer's policy applies. The refund is transferred to the attendee; any compensation owed to Retiru for its commission is governed by this agreement and is not deducted from the attendee's refund.",
      'Repeated, mass or unjustified cancellations by the Organizer are a serious breach.',
    ],
  },
  {
    icon: Banknote,
    title: '9. Payouts to the organizer',
    paragraphs: [
      'Once a paid booking is confirmed, Retiru retains the commission for that retreat tier and pays the net to the Organizer to the IBAN verified during KYC.',
      "Payouts are processed manually according to Retiru's internal settlement schedule, communicated by the team. In case of documentary issues, suspected fraud, attendee disputes or bank chargebacks, payments may be held until resolution.",
      'The Organizer is responsible for invoicing, VAT, withholding and any tax obligation arising from income obtained from published retreats, and for keeping their business registration and civil liability insurance up to date.',
    ],
  },
  {
    icon: Lock,
    title: '10. Personal data and GDPR',
    paragraphs: [
      'The Organizer is a joint controller of the personal data of attendees to their events. They commit to processing the data exclusively for managing, communicating and delivering the booked retreat.',
      'They may not use attendee data for external marketing, transfer it to third parties or include it in commercial lists without explicit, free, prior and informed consent from the attendee.',
      "Anything not expressly regulated here is governed by Retiru's privacy policy.",
    ],
  },
  {
    icon: AlertOctagon,
    title: '11. Suspension, termination and changes to the agreement',
    paragraphs: [
      "Retiru may suspend or close the Organizer's profile, with or without prior notice depending on severity, in case of substantial breaches: false or misleading content, attempts to bypass the commission, repeated cancellations, repeated complaints, expired insurance or business registration, practices that damage trust in the platform or any breach of applicable law.",
      'The Organizer may request termination at any time. Existing confirmed bookings must be honoured until natural delivery or fully refunded to the attendee.',
      'Retiru may update this agreement for legal, operational or business model reasons. Substantial changes will be communicated with reasonable advance notice and, where appropriate, will require new acceptance.',
    ],
  },
  {
    icon: PenLine,
    title: '12. Electronic acceptance and applicable law',
    paragraphs: [
      'When you press the final button, your acceptance is recorded electronically: account identifier, date and time (UTC), agreement version and IP address, in line with applicable e-commerce and eIDAS regulations. This acceptance has evidential value if any dispute arises.',
      'This agreement is governed by Spanish law. For any dispute, the parties submit to the courts with jurisdiction under applicable consumer law.',
    ],
  },
];

export function getOrganizerContractClauses(locale: Locale): Clause[] {
  return locale === 'en' ? CLAUSES_EN : CLAUSES_ES;
}

/**
 * Renderiza la lista de cláusulas del contrato del organizador.
 * Server-renderable; sin estado interno.
 *
 * `compact` reduce paddings y tamaño de iconos para integrarse en una página
 * pública con otras secciones (p. ej. /es/condiciones).
 */
export function OrganizerContractClauses({
  locale = 'es',
  compact = false,
}: {
  locale?: Locale;
  compact?: boolean;
}) {
  const clauses = getOrganizerContractClauses(locale);
  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {clauses.map((clause) => {
        const Icon = clause.icon;
        return (
          <section
            key={clause.title}
            className={`bg-white border border-sand-200 rounded-2xl ${compact ? 'p-5 md:p-6' : 'p-6 md:p-7'}`}
          >
            <h3 className={`font-serif ${compact ? 'text-base' : 'text-lg'} text-foreground mb-3 flex items-start gap-3`}>
              <span className={`${compact ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center shrink-0`}>
                <Icon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
              </span>
              <span className="pt-1">{clause.title}</span>
            </h3>
            <div className="space-y-3 text-sm text-[#5e5247] leading-relaxed">
              {clause.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {clause.bullets && (
                <ul className="space-y-2 pl-1 mt-2">
                  {clause.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-terracotta-600 font-bold mt-0.5">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
