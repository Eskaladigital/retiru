'use client';

import { useEffect, useState } from 'react';
import { FileText, Shield, CheckCircle } from 'lucide-react';
import type { Locale } from '@/i18n/config';

const COPY: Record<Locale, {
  title: string;
  intro: string;
  readFull: string;
  accept: string;
  processing: string;
  errorAccept: string;
  errorConn: string;
  bullets: { title: string; body: string }[];
  wizardBegin: string;
  wizardContinue: string;
  wizardBack: string;
  stepProgress: (current: number, total: number) => string;
  sectionAckLabel: string;
  finalTitle: string;
  finalIntro: string;
  masterConfirmLabel: string;
}> = {
  es: {
    title: 'Contrato de organizador',
    intro: 'Antes de publicar o crear tu primer evento, lee y acepta el acuerdo con Retiru. Te lo mostramos por apartados; en el último paso confirmarás la aceptación completa.',
    readFull: 'Leer condiciones completas →',
    accept: 'Aceptar contrato y continuar',
    processing: 'Procesando...',
    errorAccept: 'Error al aceptar el contrato',
    errorConn: 'Error de conexión',
    bullets: [
      { title: 'Modelo de comisiones', body: 'Retiru cobra una comisión sobre cada reserva confirmada. La comisión varía según tu volumen de actividad (consulta las condiciones completas).' },
      { title: 'Verificación obligatoria', body: 'Deberás aportar documentación que acredite tu actividad (alta económica, seguro de responsabilidad civil, datos fiscales y bancarios). Tu perfil estará pendiente de homologación hasta que nuestro equipo lo verifique.' },
      { title: 'Revisión de eventos', body: 'Todos los eventos serán revisados por el equipo de Retiru antes de publicarse. Solo podrán aprobarse una vez tu perfil esté verificado.' },
      { title: 'Calidad y responsabilidad', body: 'Te comprometes a ofrecer la experiencia descrita en tu evento, responder a los asistentes en los plazos establecidos y cumplir con la normativa vigente.' },
    ],
    wizardBegin: 'Comenzar',
    wizardContinue: 'Continuar',
    wizardBack: 'Volver',
    stepProgress: (current, total) => `Paso ${current} de ${total}`,
    sectionAckLabel: 'He leído y comprendo este apartado.',
    finalTitle: 'Confirmación final',
    finalIntro: 'Has revisado todos los apartados. Para firmar digitalmente el acuerdo, marca la casilla inferior y pulsa el botón.',
    masterConfirmLabel: 'Confirmo que he leído todos los apartados anteriores y acepto íntegramente el contrato de organizador y las condiciones de servicio de Retiru.',
  },
  en: {
    title: 'Organizer agreement',
    intro: 'Before publishing or creating your first event, read and accept the agreement with Retiru. We show it section by section; at the end you will confirm full acceptance.',
    readFull: 'Read full conditions →',
    accept: 'Accept agreement and continue',
    processing: 'Processing...',
    errorAccept: 'Could not accept the agreement',
    errorConn: 'Connection error',
    bullets: [
      { title: 'Commission model', body: 'Retiru charges a commission on each confirmed booking. The rate depends on your activity volume (see the full conditions).' },
      { title: 'Mandatory verification', body: 'You must provide documentation proving your activity (business registration, liability insurance, tax and bank details). Your profile stays pending until our team verifies it.' },
      { title: 'Event review', body: 'All events are reviewed by the Retiru team before publication. They can only be approved once your profile is verified.' },
      { title: 'Quality and responsibility', body: 'You commit to delivering the experience described, replying to attendees within the agreed timeframes, and complying with applicable regulations.' },
    ],
    wizardBegin: 'Start',
    wizardContinue: 'Continue',
    wizardBack: 'Back',
    stepProgress: (current, total) => `Step ${current} of ${total}`,
    sectionAckLabel: 'I have read and understood this section.',
    finalTitle: 'Final confirmation',
    finalIntro: 'You have reviewed every section. To sign digitally, tick the box below and press the button.',
    masterConfirmLabel: "I confirm that I have read all previous sections and fully accept the organizer agreement and Retiru's terms of service.",
  },
};

export function ContratoOrganizador({ locale = 'es' }: { locale?: Locale }) {
  const c = COPY[locale];
  const condicionesHref = locale === 'en' ? '/en/condiciones' : '/es/condiciones';
  const terminosHref = locale === 'en' ? '/en/legal/terminos' : '/es/legal/terminos';
  const n = c.bullets.length;
  const totalSteps = n + 2;
  const [uiStep, setUiStep] = useState(0);
  const [sectionAck, setSectionAck] = useState(false);
  const [masterAck, setMasterAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSectionAck(false);
  }, [uiStep]);

  async function handleAccept() {
    if (!masterAck) return;
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

  const progressLabel = c.stepProgress(uiStep + 1, totalSteps);
  const sectionIndex = uiStep - 1;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-terracotta-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-terracotta-600" />
        </div>
        <h1 className="font-serif text-3xl text-foreground mb-2">{c.title}</h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#a09383] mb-3">{progressLabel}</p>
      </div>

      {uiStep === 0 && (
        <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
          <p className="text-sm text-[#7a6b5d] leading-relaxed mb-6">{c.intro}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={condicionesHref}
              target="_blank"
              rel="noopener"
              className="text-sm font-medium text-terracotta-600 hover:underline"
            >
              {c.readFull}
            </a>
          </div>
          <button
            type="button"
            onClick={() => setUiStep(1)}
            className="mt-6 w-full bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm"
          >
            {c.wizardBegin}
          </button>
        </div>
      )}

      {uiStep >= 1 && uiStep <= n && (
        <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-terracotta-600 shrink-0" />
            {c.bullets[sectionIndex]?.title}
          </h2>
          <p className="text-sm text-[#7a6b5d] leading-relaxed mb-6">{c.bullets[sectionIndex]?.body}</p>
          <label className="flex items-start gap-3 cursor-pointer group mb-6">
            <input
              type="checkbox"
              checked={sectionAck}
              onChange={(e) => setSectionAck(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-300"
            />
            <span className="text-sm text-[#7a6b5d]">{c.sectionAckLabel}</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setUiStep((s) => Math.max(0, s - 1))}
              className="sm:flex-1 order-2 sm:order-1 py-3 rounded-xl border border-sand-300 text-sm font-semibold text-[#7a6b5d] hover:bg-sand-50 transition-colors"
            >
              {c.wizardBack}
            </button>
            <button
              type="button"
              disabled={!sectionAck}
              onClick={() => setUiStep((s) => s + 1)}
              className="sm:flex-1 order-1 sm:order-2 bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-45 disabled:cursor-not-allowed text-sm"
            >
              {c.wizardContinue}
            </button>
          </div>
        </div>
      )}

      {uiStep === n + 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h2 className="font-serif text-xl text-foreground mb-2">{c.finalTitle}</h2>
            <p className="text-sm text-[#7a6b5d] mb-4">{c.finalIntro}</p>
            <ul className="space-y-2 text-sm text-[#7a6b5d] mb-4">
              {c.bullets.map((b) => (
                <li key={b.title} className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
                  <span><span className="font-medium text-foreground">{b.title}:</span> {b.body}</span>
                </li>
              ))}
            </ul>
            <a
              href={condicionesHref}
              target="_blank"
              rel="noopener"
              className="text-sm font-medium text-terracotta-600 hover:underline inline-block mb-4"
            >
              {c.readFull}
            </a>
          </div>

          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <label className="flex items-start gap-3 cursor-pointer group mb-4">
              <input
                type="checkbox"
                checked={masterAck}
                onChange={(e) => setMasterAck(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-300"
              />
              <span className="text-sm text-[#7a6b5d] leading-relaxed">{c.masterConfirmLabel}</span>
            </label>
            <p className="text-xs text-[#a09383] mb-4 pl-8">
              {locale === 'es' ? (
                <>
                  Texto legal:{' '}
                  <a href={condicionesHref} target="_blank" rel="noopener" className="text-terracotta-600 underline">Condiciones</a>
                  {' · '}
                  <a href={terminosHref} target="_blank" rel="noopener" className="text-terracotta-600 underline">Términos</a>
                </>
              ) : (
                <>
                  Legal:{' '}
                  <a href={condicionesHref} target="_blank" rel="noopener" className="text-terracotta-600 underline">Conditions</a>
                  {' · '}
                  <a href={terminosHref} target="_blank" rel="noopener" className="text-terracotta-600 underline">Terms</a>
                </>
              )}
            </p>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setUiStep(n)}
                className="sm:flex-1 py-3 rounded-xl border border-sand-300 text-sm font-semibold text-[#7a6b5d] hover:bg-sand-50 transition-colors"
              >
                {c.wizardBack}
              </button>
              <button
                type="button"
                disabled={!masterAck || loading}
                onClick={handleAccept}
                className="sm:flex-1 bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-45 disabled:cursor-not-allowed text-sm"
              >
                {loading ? c.processing : c.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
