'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Shield, CheckCircle } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import {
  CONTRACT_VERSION,
  OrganizerContractClauses,
} from '@/lib/legal/organizer-contract';

type Copy = {
  title: string;
  badge: string;
  intro: string;
  versionLabel: string;
  partiesTitle: string;
  partiesBody: string;
  readFull: string;
  termsLabel: string;
  privacyLabel: string;
  acceptLabel: string;
  acceptHint: string;
  acceptButton: string;
  acceptingButton: string;
  errorAccept: string;
  errorConn: string;
  acknowledgement: string;
};

const COPY: Record<Locale, Copy> = {
  es: {
    title: 'Contrato del organizador',
    badge: 'Lectura previa antes de tu primer evento',
    intro:
      'Antes de crear y publicar tu primer evento en Retiru, necesitamos que leas y aceptes este acuerdo. Recoge cómo funciona la plataforma, qué se compromete a hacer cada parte, cómo se calcula la remuneración y qué obligaciones asumes como organizador.',
    versionLabel: `Versión ${CONTRACT_VERSION}`,
    partiesTitle: 'Partes del acuerdo',
    partiesBody:
      'Este contrato se celebra entre Retiru (la plataforma marketplace que opera bajo la marca Retiru, en adelante "Retiru") y la persona física o jurídica titular de la cuenta que va a publicar eventos (en adelante el "Organizador"). Al pulsar el botón final, el Organizador acepta íntegramente las cláusulas que figuran a continuación.',
    readFull: 'Ver contrato público completo',
    termsLabel: 'Términos legales',
    privacyLabel: 'Política de privacidad',
    acceptLabel:
      'He leído íntegramente el contrato del organizador y acepto todas sus cláusulas, así como los Términos legales y la Política de privacidad de Retiru.',
    acceptHint:
      'Al marcar la casilla y pulsar el botón se registrará tu aceptación electrónica con fecha, hora e identificador de cuenta. Esta aceptación tiene valor probatorio.',
    acceptButton: 'Aceptar contrato y continuar a verificación',
    acceptingButton: 'Procesando aceptación…',
    errorAccept: 'No se pudo registrar la aceptación del contrato.',
    errorConn: 'Error de conexión. Inténtalo de nuevo.',
    acknowledgement:
      'Una vez aceptado, pasarás al siguiente paso: subir la documentación que acredita tu actividad para que nuestro equipo verifique tu perfil.',
  },
  en: {
    title: 'Organizer agreement',
    badge: 'Read before creating your first event',
    intro:
      'Before creating and publishing your first event on Retiru, we need you to read and accept this agreement. It covers how the platform works, what each party commits to, how revenue is calculated and the obligations you take on as an organizer.',
    versionLabel: `Version ${CONTRACT_VERSION}`,
    partiesTitle: 'Parties to this agreement',
    partiesBody:
      'This agreement is entered into between Retiru (the marketplace platform operating under the Retiru brand, hereafter "Retiru") and the natural or legal person who owns the account publishing events (hereafter the "Organizer"). By pressing the final button, the Organizer fully accepts the clauses below.',
    readFull: 'View the full public agreement',
    termsLabel: 'Legal terms',
    privacyLabel: 'Privacy policy',
    acceptLabel:
      "I have read the entire organizer agreement and accept all its clauses, as well as Retiru's legal terms and privacy policy.",
    acceptHint:
      'Ticking the box and pressing the button records your electronic acceptance with date, time and account identifier. This acceptance has evidential value.',
    acceptButton: 'Accept agreement and continue to verification',
    acceptingButton: 'Processing acceptance…',
    errorAccept: 'We could not record acceptance of the agreement.',
    errorConn: 'Connection error. Please try again.',
    acknowledgement:
      'Once accepted, you will move on to the next step: uploading the documentation that proves your activity, so our team can verify your profile.',
  },
};

export function ContratoOrganizador({ locale = 'es' }: { locale?: Locale }) {
  const c = COPY[locale];
  const router = useRouter();
  const condicionesHref =
    locale === 'en' ? '/en/legal/contrato-organizador' : '/es/legal/contrato-organizador';
  const terminosHref = locale === 'en' ? '/en/legal/terminos' : '/es/legal/terminos';
  const privacidadHref = locale === 'en' ? '/en/legal/privacidad' : '/es/legal/privacidad';
  const verificacionHref = locale === 'en' ? '/en/panel/verificacion' : '/es/panel/verificacion';

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAccept() {
    if (!accepted || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/organizer/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept: true }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(verificacionHref);
        router.refresh();
      } else {
        setError(data.error || c.errorAccept);
        setLoading(false);
      }
    } catch {
      setError(c.errorConn);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-terracotta-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-terracotta-600" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600 mb-2">
          {c.badge}
        </p>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">{c.title}</h1>
        <p className="text-sm text-[#7a6b5d] max-w-2xl mx-auto leading-relaxed">{c.intro}</p>
        <p className="text-[11px] uppercase tracking-wider text-[#a09383] mt-4">{c.versionLabel}</p>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6 md:p-8 mb-6 shadow-soft">
        <h2 className="font-serif text-xl text-foreground mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-terracotta-600" />
          {c.partiesTitle}
        </h2>
        <p className="text-sm text-[#7a6b5d] leading-relaxed">{c.partiesBody}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <a
            href={condicionesHref}
            target="_blank"
            rel="noopener"
            className="text-terracotta-600 font-medium hover:underline"
          >
            {c.readFull} ↗
          </a>
          <a
            href={terminosHref}
            target="_blank"
            rel="noopener"
            className="text-terracotta-600 font-medium hover:underline"
          >
            {c.termsLabel} ↗
          </a>
          <a
            href={privacidadHref}
            target="_blank"
            rel="noopener"
            className="text-terracotta-600 font-medium hover:underline"
          >
            {c.privacyLabel} ↗
          </a>
        </div>
      </div>

      <div className="mb-8">
        <OrganizerContractClauses locale={locale} />
      </div>

      <div className="bg-gradient-to-br from-terracotta-50 to-sand-50 border-2 border-terracotta-200 rounded-2xl p-6 md:p-8 sticky bottom-4 shadow-soft">
        <div className="flex items-start gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-terracotta-600 shrink-0 mt-0.5" />
          <p className="text-sm text-[#5e5247] leading-relaxed">{c.acknowledgement}</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group mb-3 p-3 bg-white rounded-xl border border-sand-200 hover:border-terracotta-300 transition-colors">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-300 shrink-0"
          />
          <span className="text-sm text-foreground font-medium leading-relaxed">{c.acceptLabel}</span>
        </label>

        <p className="text-[11px] text-[#a09383] mb-4 leading-relaxed pl-1">{c.acceptHint}</p>

        {error && (
          <p className="text-sm text-red-600 mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAccept}
          disabled={!accepted || loading}
          className="w-full bg-terracotta-600 text-white font-semibold py-3.5 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            c.acceptingButton
          ) : (
            <>
              {c.acceptButton}
              <span aria-hidden>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
