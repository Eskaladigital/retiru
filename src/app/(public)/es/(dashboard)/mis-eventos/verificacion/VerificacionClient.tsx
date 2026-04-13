'use client';

import { useState, useRef } from 'react';
import { Shield, Upload, CheckCircle, Clock, AlertCircle, XCircle, FileText } from 'lucide-react';

interface Step {
  id: string;
  step: string;
  status: string;
  file_url: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

interface TaxData {
  tax_id: string | null;
  tax_name: string | null;
  tax_address: string | null;
  iban: string | null;
}

const STEP_INFO: Record<string, { title: string; description: string }> = {
  identity_doc: {
    title: 'Documento de identidad',
    description: 'DNI, NIE o pasaporte. Sube una foto o escaneo legible de ambas caras.',
  },
  economic_activity: {
    title: 'Alta en actividad económica',
    description: 'Certificado de alta de autónomo o escritura de constitución de la sociedad.',
  },
  insurance: {
    title: 'Seguro de responsabilidad civil',
    description: 'Póliza vigente de seguro de responsabilidad civil que cubra tu actividad.',
  },
  tax_info: {
    title: 'Datos fiscales',
    description: 'NIF/CIF, razón social y dirección fiscal. Sube un certificado o documento acreditativo.',
  },
  bank_info: {
    title: 'Datos bancarios',
    description: 'IBAN donde recibirás las liquidaciones. Sube un certificado de titularidad bancaria.',
  },
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: 'text-sage-600', bg: 'bg-sage-100', label: 'Aprobado' },
  submitted: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Enviado' },
  in_review: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'En revisión' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rechazado' },
  pending: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pendiente' },
};

const STEP_ORDER = ['identity_doc', 'economic_activity', 'insurance', 'tax_info', 'bank_info'];

export function VerificacionClient({
  organizerStatus,
  steps: initialSteps,
  taxData: initialTaxData,
}: {
  organizerStatus: string;
  steps: Step[];
  taxData: TaxData;
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taxFields, setTaxFields] = useState({
    tax_id: initialTaxData.tax_id || '',
    tax_name: initialTaxData.tax_name || '',
    tax_address: initialTaxData.tax_address || '',
    iban: initialTaxData.iban || '',
  });
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sortedSteps = [...steps].sort(
    (a, b) => STEP_ORDER.indexOf(a.step) - STEP_ORDER.indexOf(b.step),
  );

  const completedCount = steps.filter((s) => s.status === 'approved').length;
  const submittedCount = steps.filter((s) => ['submitted', 'in_review', 'approved'].includes(s.status)).length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  async function handleUpload(stepName: string) {
    const input = fileRefs.current[stepName];
    if (!input?.files?.[0]) return;

    const file = input.files[0];
    setUploading(stepName);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (stepName === 'tax_info') {
        if (taxFields.tax_id) formData.append('tax_id', taxFields.tax_id);
        if (taxFields.tax_name) formData.append('tax_name', taxFields.tax_name);
        if (taxFields.tax_address) formData.append('tax_address', taxFields.tax_address);
      }
      if (stepName === 'bank_info' && taxFields.iban) {
        formData.append('iban', taxFields.iban);
      }

      const res = await fetch(`/api/organizer/verification/${stepName}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSteps((prev) =>
          prev.map((s) =>
            s.step === stepName
              ? { ...s, status: 'submitted', file_url: data.file_url, submitted_at: new Date().toISOString(), notes: null }
              : s,
          ),
        );
      } else {
        setError(data.error || 'Error al subir el documento');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setUploading(null);
      if (input) input.value = '';
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Verificación</h1>
        <p className="text-sm text-[#7a6b5d] mt-1">Completa la verificación para que tus eventos puedan ser aprobados y publicados.</p>
      </div>

      {/* Progress */}
      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-terracotta-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {organizerStatus === 'verified'
                  ? 'Perfil verificado'
                  : organizerStatus === 'rejected'
                    ? 'Perfil rechazado'
                    : 'Estado de verificación'}
              </p>
              <p className="text-xs text-[#a09383]">{completedCount} de {steps.length} documentos aprobados</p>
            </div>
          </div>
          <span className="text-lg font-bold text-terracotta-600">{progress}%</span>
        </div>
        <div className="h-3 bg-sand-200 rounded-full overflow-hidden">
          <div className="h-full bg-terracotta-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        {organizerStatus === 'verified' ? (
          <p className="text-xs text-sage-700 mt-3 bg-sage-50 rounded-lg p-3">
            Tu perfil está verificado. Tus eventos pueden ser aprobados y publicados.
          </p>
        ) : submittedCount === steps.length ? (
          <p className="text-xs text-blue-700 mt-3 bg-blue-50 rounded-lg p-3">
            Toda la documentación ha sido enviada. Nuestro equipo la revisará en 24-48h.
          </p>
        ) : (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 rounded-lg p-3">
            Necesitas enviar todos los documentos para que nuestro equipo pueda verificar tu perfil. Los eventos solo serán aprobados una vez verificado.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {sortedSteps.map((step) => {
          const info = STEP_INFO[step.step] || { title: step.step, description: '' };
          const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
          const Icon = config.icon;
          const isActionable = step.status === 'pending' || step.status === 'rejected';
          const isUploading = uploading === step.step;
          const needsFormData = step.step === 'tax_info' || step.step === 'bank_info';

          return (
            <div
              key={step.id}
              className={`bg-white border rounded-2xl p-6 transition-all ${
                isActionable ? 'border-terracotta-300 shadow-soft' : 'border-sand-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{info.title}</h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#7a6b5d] mb-3">{info.description}</p>

                  {step.status === 'rejected' && step.notes && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-red-700">
                        <span className="font-semibold">Motivo del rechazo:</span> {step.notes}
                      </p>
                    </div>
                  )}

                  {step.file_url && step.status !== 'pending' && (
                    <div className="flex items-center gap-2 text-xs text-[#7a6b5d] mb-3">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Documento enviado{step.submitted_at ? ` el ${new Date(step.submitted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</span>
                    </div>
                  )}

                  {/* Extra form fields for tax_info and bank_info */}
                  {isActionable && needsFormData && (
                    <div className="space-y-3 mb-4">
                      {step.step === 'tax_info' && (
                        <>
                          <input
                            type="text"
                            placeholder="NIF / CIF"
                            value={taxFields.tax_id}
                            onChange={(e) => setTaxFields((p) => ({ ...p, tax_id: e.target.value }))}
                            className="w-full border border-sand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300"
                          />
                          <input
                            type="text"
                            placeholder="Razón social"
                            value={taxFields.tax_name}
                            onChange={(e) => setTaxFields((p) => ({ ...p, tax_name: e.target.value }))}
                            className="w-full border border-sand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300"
                          />
                          <input
                            type="text"
                            placeholder="Dirección fiscal"
                            value={taxFields.tax_address}
                            onChange={(e) => setTaxFields((p) => ({ ...p, tax_address: e.target.value }))}
                            className="w-full border border-sand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300"
                          />
                        </>
                      )}
                      {step.step === 'bank_info' && (
                        <input
                          type="text"
                          placeholder="IBAN (ej: ES00 0000 0000 00 0000000000)"
                          value={taxFields.iban}
                          onChange={(e) => setTaxFields((p) => ({ ...p, iban: e.target.value }))}
                          className="w-full border border-sand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300"
                        />
                      )}
                    </div>
                  )}

                  {isActionable && (
                    <div className="flex gap-3">
                      <input
                        type="file"
                        ref={(el) => { fileRefs.current[step.step] = el; }}
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={() => handleUpload(step.step)}
                      />
                      <button
                        onClick={() => fileRefs.current[step.step]?.click()}
                        disabled={isUploading}
                        className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Subiendo...' : step.status === 'rejected' ? 'Reenviar documento' : 'Subir documento'}
                      </button>
                      <span className="text-xs text-[#a09383] self-center">PDF, JPG, PNG o WebP (máx. 10MB)</span>
                    </div>
                  )}

                  {step.status === 'approved' && (
                    <p className="text-xs text-sage-600 font-medium">Verificado correctamente</p>
                  )}

                  {step.status === 'submitted' && (
                    <p className="text-xs text-blue-600 font-medium">Pendiente de revisión por el equipo de Retiru</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-sand-100 rounded-2xl p-6 text-center">
        <p className="text-sm text-[#7a6b5d] mb-2">¿Tienes dudas sobre el proceso de verificación?</p>
        <a href="/es/ayuda" className="text-sm font-semibold text-terracotta-600 hover:underline">
          Consultar centro de ayuda →
        </a>
      </div>
    </div>
  );
}
