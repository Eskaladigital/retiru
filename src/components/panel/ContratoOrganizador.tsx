'use client';

import { useState } from 'react';
import { FileText, Shield, CheckCircle } from 'lucide-react';

export function ContratoOrganizador() {
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
        setError(data.error || 'Error al aceptar el contrato');
      }
    } catch {
      setError('Error de conexión');
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
        <h1 className="font-serif text-3xl text-foreground mb-2">Contrato de organizador</h1>
        <p className="text-sm text-[#7a6b5d] max-w-md mx-auto">
          Para publicar eventos en Retiru, necesitas aceptar nuestro contrato y condiciones de servicio.
        </p>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-terracotta-600" />
          Resumen del contrato
        </h2>

        <div className="space-y-4 text-sm text-[#7a6b5d]">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Modelo de comisiones</p>
              <p>Retiru cobra una comisión sobre cada reserva confirmada. La comisión varía según tu volumen de actividad (consulta las condiciones completas).</p>
            </div>
          </div>

          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Verificación obligatoria</p>
              <p>Deberás aportar documentación que acredite tu actividad (alta económica, seguro de responsabilidad civil, datos fiscales y bancarios). Tu perfil estará pendiente de homologación hasta que nuestro equipo lo verifique.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Revisión de eventos</p>
              <p>Todos los eventos serán revisados por el equipo de Retiru antes de publicarse. Solo podrán aprobarse una vez tu perfil esté verificado.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Calidad y responsabilidad</p>
              <p>Te comprometes a ofrecer la experiencia descrita en tu evento, responder a los asistentes en los plazos establecidos y cumplir con la normativa vigente.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-sand-200">
          <a
            href="/es/condiciones"
            target="_blank"
            rel="noopener"
            className="text-sm font-medium text-terracotta-600 hover:underline"
          >
            Leer condiciones completas →
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
            He leído y acepto el{' '}
            <a href="/es/condiciones" target="_blank" rel="noopener" className="text-terracotta-600 underline">
              contrato de organizador
            </a>{' '}
            y las{' '}
            <a href="/es/legal/terminos" target="_blank" rel="noopener" className="text-terracotta-600 underline">
              condiciones de servicio
            </a>{' '}
            de Retiru.
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
          {loading ? 'Procesando...' : 'Aceptar contrato y continuar'}
        </button>
      </div>
    </div>
  );
}
