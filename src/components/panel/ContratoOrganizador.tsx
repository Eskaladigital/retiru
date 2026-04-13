'use client';

import { useState } from 'react';
import { FileText, Shield, CheckCircle } from 'lucide-react';
import type { Locale } from '@/i18n/config';

const COPY: Record<Locale, {
  title: string;
  intro: string;
  summaryTitle: string;
  readFull: string;
  accept: string;
  processing: string;
  errorAccept: string;
  errorConn: string;
  checkboxLead: string;
  checkboxMid: string;
  checkboxTrail: string;
  contractLinkLabel: string;
  termsLinkLabel: string;
  bullets: { title: string; body: string }[];
}> = {
  es: {
    title: 'Contrato de organizador',
    intro: 'Para publicar eventos en Retiru, necesitas aceptar nuestro contrato y condiciones de servicio.',
    summaryTitle: 'Resumen del contrato',
    readFull: 'Leer condiciones completas →',
    accept: 'Aceptar contrato y continuar',
    processing: 'Procesando...',
    errorAccept: 'Error al aceptar el contrato',
    errorConn: 'Error de conexión',
    checkboxLead: 'He leído y acepto el',
    checkboxMid: 'y las',
    checkboxTrail: 'de Retiru.',
    contractLinkLabel: 'contrato de organizador',
    termsLinkLabel: 'condiciones de servicio',
    bullets: [
      { title: 'Modelo de comisiones', body: 'Retiru cobra una comisión sobre cada reserva confirmada. La comisión varía según tu volumen de actividad (consulta las condiciones completas).' },
      { title: 'Verificación obligatoria', body: 'Deberás aportar documentación que acredite tu actividad (alta económica, seguro de responsabilidad civil, datos fiscales y bancarios). Tu perfil estará pendiente de homologación hasta que nuestro equipo lo verifique.' },
      { title: 'Revisión de eventos', body: 'Todos los eventos serán revisados por el equipo de Retiru antes de publicarse. Solo podrán aprobarse una vez tu perfil esté verificado.' },
      { title: 'Calidad y responsabilidad', body: 'Te comprometes a ofrecer la experiencia descrita en tu evento, responder a los asistentes en los plazos establecidos y cumplir con la normativa vigente.' },
    ],
  },
  en: {
    title: 'Organizer agreement',
    intro: 'To publish events on Retiru, you need to accept our organizer agreement and terms of service.',
    summaryTitle: 'Contract summary',
    readFull: 'Read full conditions →',
    accept: 'Accept agreement and continue',
    processing: 'Processing...',
    errorAccept: 'Could not accept the agreement',
    errorConn: 'Connection error',
    checkboxLead: 'I have read and accept the',
    checkboxMid: 'and',
    checkboxTrail: '',
    contractLinkLabel: 'organizer agreement',
    termsLinkLabel: "Retiru's terms of service",
    bullets: [
      { title: 'Commission model', body: 'Retiru charges a commission on each confirmed booking. The rate depends on your activity volume (see the full conditions).' },
      { title: 'Mandatory verification', body: 'You must provide documentation proving your activity (business registration, liability insurance, tax and bank details). Your profile stays pending until our team verifies it.' },
      { title: 'Event review', body: 'All events are reviewed by the Retiru team before publication. They can only be approved once your profile is verified.' },
      { title: 'Quality and responsibility', body: 'You commit to delivering the experience described, replying to attendees within the agreed timeframes, and complying with applicable regulations.' },
    ],
  },
};

export function ContratoOrganizador({ locale = 'es' }: { locale?: Locale }) {
  const c = COPY[locale];
  const condicionesHref = locale === 'en' ? '/en/condiciones' : '/es/condiciones';
  const terminosHref = locale === 'en' ? '/en/legal/terminos' : '/es/legal/terminos';
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAccept() {
    if (!accepted) return;
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
        window.location.reload();
      } else {
        setError(data.error || c.errorAccept);
      }
    } catch {
      setError(c.errorConn);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-terracotta-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-terracotta-600" />
        </div>
        <h1 className="font-serif text-3xl text-foreground mb-2">{c.title}</h1>
        <p className="text-sm text-[#7a6b5d] max-w-md mx-auto">{c.intro}</p>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-terracotta-600" />
          {c.summaryTitle}
        </h2>

        <div className="space-y-4 text-sm text-[#7a6b5d]">
          {c.bullets.map((b) => (
            <div key={b.title} className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{b.title}</p>
                <p>{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-sand-200">
          <a
            href={condicionesHref}
            target="_blank"
            rel="noopener"
            className="text-sm font-medium text-terracotta-600 hover:underline"
          >
            {c.readFull}
          </a>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-300"
          />
          <span className="text-sm text-[#7a6b5d] group-hover:text-foreground transition-colors">
            {locale === 'en' ? (
              <>
                {c.checkboxLead}{' '}
                <a href={condicionesHref} target="_blank" rel="noopener" className="text-terracotta-600 underline">
                  {c.contractLinkLabel}
                </a>{' '}
                {c.checkboxMid}{' '}
                <a href={terminosHref} target="_blank" rel="noopener" className="text-terracotta-600 underline">
                  {c.termsLinkLabel}
                </a>
                .
              </>
            ) : (
              <>
                {c.checkboxLead}{' '}
                <a href={condicionesHref} target="_blank" rel="noopener" className="text-terracotta-600 underline">
                  {c.contractLinkLabel}
                </a>{' '}
                {c.checkboxMid}{' '}
                <a href={terminosHref} target="_blank" rel="noopener" className="text-terracotta-600 underline">
                  {c.termsLinkLabel}
                </a>{' '}
                {c.checkboxTrail}
              </>
            )}
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-600 mt-3">{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={!accepted || loading}
          className="mt-4 w-full bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? c.processing : c.accept}
        </button>
      </div>
    </div>
  );
}
