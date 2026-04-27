// ============================================================================
// RETIRU · Contrato del centro (directorio) — fuente única
// Borrador inicial. Aplica a centros que mantienen su ficha en el directorio
// de pago tras los 6 meses de cortesía.
//
// Usado por:
//   - src/app/(public)/{es,en}/legal/contrato-centro/page.tsx (consulta pública)
//   - (futuro) componente de aceptación cuando el centro pase a cuota.
// ============================================================================

import {
  Building2,
  Wallet,
  CreditCard,
  ImageIcon,
  Camera,
  Star,
  MessagesSquare,
  Lock,
  AlertOctagon,
  RefreshCcw,
  PenLine,
  type LucideIcon,
} from 'lucide-react';
import type { Locale } from '@/i18n/config';

export const CENTER_CONTRACT_VERSION = '0.1 · 2026-04 (borrador)';

export type Clause = {
  icon: LucideIcon;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const CLAUSES_ES: Clause[] = [
  {
    icon: Building2,
    title: '1. Objeto y servicio del directorio',
    paragraphs: [
      'Retiru ofrece a los centros de yoga, meditación y ayurveda un servicio de directorio: ficha pública, visibilidad SEO, gestión desde panel, recepción de reseñas, mensajería con interesados y herramientas de comunicación.',
      'El servicio no incluye intermediación en la contratación de las clases, retiros propios o servicios del centro: el centro mantiene su relación comercial directa con sus clientes y conserva la titularidad de su contenido.',
    ],
  },
  {
    icon: Wallet,
    title: '2. Tarifa y periodo de cortesía',
    paragraphs: [
      'La permanencia del centro en el directorio tiene una tarifa de 20 € al mes (IVA no incluido salvo que la factura indique lo contrario).',
      'Los centros incluidos en la fase de lanzamiento disfrutan de un periodo de cortesía de 6 meses desde su incorporación, con todos los beneficios del directorio activos.',
      'Al término del periodo de cortesía, el centro decide entre: (a) activar la suscripción mensual de 20 €/mes para mantener la ficha pública; (b) baja: la ficha se desactiva, salvo que Retiru decida mantenerla en modo informativo dentro del grupo de centros mejor valorados como base de cortesía adicional.',
    ],
  },
  {
    icon: CreditCard,
    title: '3. Pago, facturación y renovación',
    paragraphs: [
      'La cuota mensual se cobra por adelantado al método de pago aportado por el centro. Retiru emite una factura por cada cobro.',
      'La suscripción se renueva automáticamente cada mes mientras el centro no solicite la baja con la antelación indicada en la cláusula 9.',
      'En caso de impago tras dos intentos de cobro, Retiru podrá suspender o despublicar la ficha hasta su regularización, sin perjuicio de reclamar las cantidades adeudadas.',
    ],
  },
  {
    icon: ImageIcon,
    title: '4. Veracidad y calidad de la ficha',
    paragraphs: [
      'El centro se compromete a mantener actualizada y veraz la información publicada en su ficha:',
    ],
    bullets: [
      'Razón social, dirección física y datos de contacto operativos.',
      'Descripción de la actividad, disciplinas y estilos efectivamente impartidos.',
      'Horarios y, en su caso, precios indicativos.',
      'Imágenes propias o con licencia válida; no se admiten fotografías de otros centros, imágenes engañosas o derechos de terceros sin autorización.',
      'Información sobre profesorado y certificaciones, sin atribuirse titulaciones o reconocimientos que no existan.',
    ],
  },
  {
    icon: Camera,
    title: '5. Cesión de derechos de uso del contenido',
    paragraphs: [
      'Mientras el contrato esté vigente, el centro autoriza a Retiru, de forma no exclusiva y revocable, a mostrar su nombre comercial, logotipo, descripción, imágenes, datos de contacto y reseñas dentro de la plataforma Retiru y de los materiales promocionales del directorio (web, emails, redes, sitemap).',
      'Esta autorización no implica cesión de propiedad intelectual: el centro conserva la titularidad sobre su contenido. A la baja, Retiru retirará el contenido de la ficha pública en un plazo razonable.',
    ],
  },
  {
    icon: Star,
    title: '6. Reseñas y derecho de réplica',
    paragraphs: [
      'Las reseñas son contenido publicado por los usuarios bajo su responsabilidad. Retiru modera contenido manifiestamente injurioso, ilegal, falso o que vulnere derechos de terceros, conforme a su política de moderación.',
      'El centro tiene derecho de réplica pública a cualquier reseña a través de la plataforma. No está permitido condicionar la prestación de servicios a la publicación de una reseña, ni inducir o pagar por reseñas falsas.',
    ],
  },
  {
    icon: MessagesSquare,
    title: '7. Contacto con potenciales clientes',
    paragraphs: [
      'Los usuarios pueden contactar al centro a través de los canales publicados en su ficha (mensajería interna, teléfono, email, formulario o web).',
      'Retiru no interviene ni cobra comisión sobre los servicios que el centro contrate directamente con sus clientes (clases, bonos, talleres). La única remuneración del directorio es la cuota mensual de la cláusula 2.',
      'El centro se compromete a tratar las solicitudes recibidas a través de Retiru con diligencia razonable y a no utilizar los datos personales de los usuarios para finalidades distintas de la consulta concreta.',
    ],
  },
  {
    icon: Lock,
    title: '8. Datos personales y RGPD',
    paragraphs: [
      'El tratamiento de datos personales se rige por la Política de privacidad de Retiru. El centro y Retiru actúan como responsables independientes del tratamiento respecto a los datos que cada uno recibe.',
      'El centro se compromete a no utilizar los datos personales obtenidos a través de la plataforma para envíos de marketing externo, cesión a terceros ni inclusión en listas comerciales sin consentimiento expreso, libre, previo e informado del titular.',
      'Retiru opera mecanismos de baja de marketing (opt-out vía link en email y panel `/administrator/mails/bajas`); las solicitudes de baja vinculadas al email del centro se aplican a sus comunicaciones comerciales y se sincronizan con la lista interna `email_suppressions`.',
    ],
  },
  {
    icon: AlertOctagon,
    title: '9. Suspensión, baja y rescisión',
    paragraphs: [
      'Cualquiera de las partes puede solicitar la baja del contrato en cualquier momento, con un preaviso mínimo de un (1) mes. La baja surtirá efecto al final del periodo mensual ya facturado; no se generan nuevos cargos a partir del mes siguiente.',
      'Retiru podrá suspender o rescindir el contrato, con o sin previo aviso según la gravedad, ante incumplimientos sustanciales:',
    ],
    bullets: [
      'Impago reiterado de la cuota mensual.',
      'Contenido falso, engañoso o que vulnere derechos de terceros.',
      'Inducción a reseñas falsas o manipulación de la reputación.',
      'Prácticas que dañen la confianza en el directorio o infrinjan la legislación vigente.',
      'Vencimiento o falta de las autorizaciones, licencias y seguros necesarios para ejercer la actividad anunciada.',
    ],
  },
  {
    icon: RefreshCcw,
    title: '10. Modificación del contrato y de la tarifa',
    paragraphs: [
      'Retiru podrá actualizar el presente contrato y la tarifa mensual por motivos legales, operativos o de modelo de negocio. Los cambios sustanciales (incluida cualquier subida de la tarifa) se comunicarán por email con al menos 30 días de antelación.',
      'Si el centro no acepta los cambios, podrá rescindir el contrato sin penalización antes de que entren en vigor; el silencio o la continuación del uso del servicio implicarán aceptación.',
    ],
  },
  {
    icon: PenLine,
    title: '11. Aceptación electrónica y normativa aplicable',
    paragraphs: [
      'La aceptación de este contrato se registra electrónicamente: identificador del centro, identificador del usuario titular, fecha y hora (UTC), versión del contrato y dirección IP, conforme a la Ley 34/2002 de servicios de la sociedad de la información y al Reglamento eIDAS. Esta aceptación tiene valor probatorio en caso de controversia.',
      'Este acuerdo se rige por la legislación española. Para cualquier conflicto, las partes se someten a los juzgados y tribunales competentes según la normativa aplicable.',
    ],
  },
];

const CLAUSES_EN: Clause[] = [
  {
    icon: Building2,
    title: '1. Purpose and directory service',
    paragraphs: [
      'Retiru offers yoga, meditation and ayurveda centers a directory service: public listing, SEO visibility, dashboard management, reviews, internal messaging with interested users and communication tools.',
      "The service does not include intermediation in the booking of the center's classes, in-house retreats or services: the center keeps its direct commercial relationship with its clients and full ownership of its content.",
    ],
  },
  {
    icon: Wallet,
    title: '2. Fee and courtesy period',
    paragraphs: [
      "The center's presence in the directory has a fee of €20 per month (VAT not included unless the invoice states otherwise).",
      'Centers included in the launch phase enjoy a 6-month courtesy period from their inclusion, with all directory benefits active.',
      'At the end of the courtesy period, the center decides between: (a) activating the €20/month subscription to keep the public listing; (b) opting out, in which case the listing is deactivated, unless Retiru decides to keep it as informational within a curated group of best-rated centers as additional courtesy.',
    ],
  },
  {
    icon: CreditCard,
    title: '3. Payment, invoicing and renewal',
    paragraphs: [
      'The monthly fee is charged in advance to the payment method provided by the center. Retiru issues an invoice for every charge.',
      'The subscription renews automatically every month unless the center requests termination with the notice indicated in clause 9.',
      'After two failed payment attempts, Retiru may suspend or unpublish the listing until the situation is regularized, without prejudice to claiming the amounts owed.',
    ],
  },
  {
    icon: ImageIcon,
    title: '4. Accuracy and quality of the listing',
    paragraphs: [
      'The center commits to keeping the information in its listing accurate and up to date:',
    ],
    bullets: [
      'Legal name, physical address and operational contact details.',
      'Description of activities, disciplines and styles actually taught.',
      'Schedule and, where applicable, indicative prices.',
      'Images that are owned or properly licensed; photos from other centers, misleading images or third-party rights without authorization are not allowed.',
      'Information on instructors and certifications, without claiming qualifications or recognitions that do not exist.',
    ],
  },
  {
    icon: Camera,
    title: '5. License to use the content',
    paragraphs: [
      "While the agreement is in force, the center grants Retiru a non-exclusive, revocable license to display its trade name, logo, description, images, contact data and reviews within the Retiru platform and the directory's promotional materials (web, emails, social, sitemap).",
      "This license does not transfer intellectual property: the center keeps ownership over its content. Upon termination, Retiru will remove the content from the public listing within a reasonable timeframe.",
    ],
  },
  {
    icon: Star,
    title: '6. Reviews and right of reply',
    paragraphs: [
      "Reviews are content published by users under their own responsibility. Retiru moderates content that is clearly defamatory, illegal, false or that infringes third-party rights, in line with its moderation policy.",
      "The center has a public right of reply to any review through the platform. It is not allowed to condition the provision of services to the publication of a review, nor to induce or pay for fake reviews.",
    ],
  },
  {
    icon: MessagesSquare,
    title: '7. Contact with potential clients',
    paragraphs: [
      "Users can contact the center via the channels published on its listing (internal messaging, phone, email, contact form, website).",
      "Retiru does not intervene or charge any commission on services that the center provides directly to its clients (classes, passes, workshops). The only directory remuneration is the monthly fee in clause 2.",
      'The center commits to handling requests received through Retiru with reasonable diligence and not to use the personal data of users for purposes other than the specific enquiry.',
    ],
  },
  {
    icon: Lock,
    title: '8. Personal data and GDPR',
    paragraphs: [
      "Personal data processing is governed by Retiru's privacy policy. The center and Retiru act as independent controllers of the data each receives.",
      'The center commits not to use the personal data obtained through the platform for external marketing, transfer to third parties or inclusion in commercial lists without explicit, free, prior and informed consent from the data subject.',
      "Retiru operates marketing opt-out mechanisms (link in email and admin panel `/administrator/mails/bajas`); opt-out requests linked to the center's email apply to its commercial communications and are synced with the internal `email_suppressions` list.",
    ],
  },
  {
    icon: AlertOctagon,
    title: '9. Suspension, termination and exit',
    paragraphs: [
      'Either party may request termination of the agreement at any time with a minimum notice of one (1) month. Termination takes effect at the end of the monthly period already invoiced; no further charges arise from the following month.',
      'Retiru may suspend or terminate the agreement, with or without prior notice depending on severity, in case of substantial breaches:',
    ],
    bullets: [
      'Repeated failure to pay the monthly fee.',
      'False or misleading content or content that infringes third-party rights.',
      'Induction of fake reviews or reputation manipulation.',
      'Practices that damage trust in the directory or breach applicable law.',
      'Expiry or absence of the authorizations, licenses and insurance needed to carry out the advertised activity.',
    ],
  },
  {
    icon: RefreshCcw,
    title: '10. Changes to the agreement and the fee',
    paragraphs: [
      'Retiru may update this agreement and the monthly fee for legal, operational or business model reasons. Substantial changes (including any fee increase) will be communicated by email with at least 30 days of advance notice.',
      'If the center does not accept the changes, it may terminate the agreement without penalty before they take effect; silence or continued use of the service will imply acceptance.',
    ],
  },
  {
    icon: PenLine,
    title: '11. Electronic acceptance and applicable law',
    paragraphs: [
      'Acceptance of this agreement is recorded electronically: center identifier, identifier of the holder user, date and time (UTC), agreement version and IP address, in line with applicable e-commerce and eIDAS regulations. This acceptance has evidential value if any dispute arises.',
      'This agreement is governed by Spanish law. For any dispute, the parties submit to the courts with jurisdiction under applicable law.',
    ],
  },
];

export function getCenterContractClauses(locale: Locale): Clause[] {
  return locale === 'en' ? CLAUSES_EN : CLAUSES_ES;
}

/**
 * Renderiza la lista de cláusulas del contrato del centro.
 * Server-renderable; sin estado interno.
 */
export function CenterContractClauses({
  locale = 'es',
  compact = false,
}: {
  locale?: Locale;
  compact?: boolean;
}) {
  const clauses = getCenterContractClauses(locale);
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
              <span className={`${compact ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl bg-sage-50 text-sage-700 flex items-center justify-center shrink-0`}>
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
                      <span className="text-sage-700 font-bold mt-0.5">·</span>
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
