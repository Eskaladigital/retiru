'use client';

import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Clock, AlertCircle, Download, ExternalLink } from 'lucide-react';

interface Step {
  id: string;
  step: string;
  status: string;
  file_url: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

interface Organizer {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  status: string;
  contract_accepted_at: string | null;
  tax_id: string | null;
  tax_name: string | null;
  tax_address: string | null;
  iban: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  profiles?: { id: string; email: string; full_name: string } | null;
}

const STEP_LABELS: Record<string, string> = {
  identity_doc: 'Documento de identidad',
  economic_activity: 'Alta actividad económica',
  insurance: 'Seguro de responsabilidad civil',
  tax_info: 'Datos fiscales',
  bank_info: 'Datos bancarios',
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: 'text-sage-600', bg: 'bg-sage-100', label: 'Aprobado' },
  submitted: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Enviado' },
  in_review: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'En revisión' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rechazado' },
  pending: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pendiente' },
};

const STEP_ORDER = ['identity_doc', 'economic_activity', 'insurance', 'tax_info', 'bank_info'];

const ORG_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  verified: { label: 'Verificado', cls: 'bg-sage-100 text-sage-700' },
  pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  suspended: { label: 'Suspendido', cls: 'bg-red-100 text-red-700' },
  rejected: { label: 'Rechazado', cls: 'bg-red-50 text-red-600' },
};

export function AdminVerificacionClient({
  organizer,
  steps: initialSteps,
}: {
  organizer: Organizer;
  steps: Step[];
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [orgStatus, setOrgStatus] = useState(organizer.status);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectStepId, setRejectStepId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const sortedSteps = [...steps].sort(
    (a, b) => STEP_ORDER.indexOf(a.step) - STEP_ORDER.indexOf(b.step),
  );

  const allApproved = steps.length > 0 && steps.every((s) => s.status === 'approved');
  const orgBadge = ORG_STATUS_BADGE[orgStatus] || ORG_STATUS_BADGE.pending;

  async function handleStepAction(stepId: string, action: 'approve_step' | 'reject_step', notes?: string) {
    setActing(stepId);
    try {
      const res = await fetch(`/api/admin/organizers/${organizer.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, stepId, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === stepId
              ? { ...s, status: action === 'approve_step' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString(), notes: notes || null }
              : s,
          ),
        );
        if (data.organizer_verified) {
          setOrgStatus('verified');
        }
        setRejectStepId(null);
        setRejectNotes('');
      } else {
        alert(data.error || 'Error');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  async function handleForceVerify() {
    if (!confirm('¿Verificar este organizador directamente? Todos los pasos se marcarán como aprobados.')) return;
    setActing('force');
    try {
      const res = await fetch(`/api/admin/organizers/${organizer.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
      if (res.ok) {
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'approved', reviewed_at: new Date().toISOString() })));
        setOrgStatus('verified');
      } else {
        const data = await res.json();
        alert(data.error || 'Error');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  async function handleDownloadDoc(step: Step) {
    if (!step.file_url) return;
    setDownloading(step.id);
    try {
      const res = await fetch(`/api/admin/organizers/${organizer.id}/doc-url?path=${encodeURIComponent(step.file_url)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(data.error || 'Error obteniendo URL');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <a href="/administrator/organizadores" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Organizadores
      </a>

      {/* Header */}
      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-foreground mb-1">{organizer.business_name}</h1>
            <p className="text-sm text-[#7a6b5d]">
              {organizer.profiles?.full_name} · {organizer.profiles?.email}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${orgBadge.cls}`}>
                {orgBadge.label}
              </span>
              {organizer.contract_accepted_at && (
                <span className="text-xs text-[#a09383]">
                  Contrato aceptado: {new Date(organizer.contract_accepted_at).toLocaleDateString('es-ES')}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {orgStatus !== 'verified' && (
              <button
                onClick={handleForceVerify}
                disabled={acting === 'force'}
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-sage-600 text-white hover:bg-sage-700 transition-colors disabled:opacity-50"
              >
                Verificar directamente
              </button>
            )}
            <a
              href={`/es/organizador/${organizer.slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#7a6b5d] hover:text-foreground px-3 py-2 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors"
            >
              <ExternalLink size={13} />
              Ver perfil
            </a>
          </div>
        </div>

        {/* Tax/bank data */}
        {(organizer.tax_id || organizer.iban) && (
          <div className="mt-4 pt-4 border-t border-sand-200 grid grid-cols-2 gap-4 text-sm">
            {organizer.tax_id && (
              <div>
                <span className="text-xs text-[#a09383] block">NIF/CIF</span>
                <span className="font-medium">{organizer.tax_id}</span>
              </div>
            )}
            {organizer.tax_name && (
              <div>
                <span className="text-xs text-[#a09383] block">Razón social</span>
                <span className="font-medium">{organizer.tax_name}</span>
              </div>
            )}
            {organizer.tax_address && (
              <div className="col-span-2">
                <span className="text-xs text-[#a09383] block">Dirección fiscal</span>
                <span className="font-medium">{organizer.tax_address}</span>
              </div>
            )}
            {organizer.iban && (
              <div className="col-span-2">
                <span className="text-xs text-[#a09383] block">IBAN</span>
                <span className="font-mono font-medium">{organizer.iban}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Steps */}
      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-terracotta-600" />
        Documentación ({steps.filter((s) => s.status === 'approved').length}/{steps.length} aprobados)
      </h2>

      <div className="space-y-3">
        {sortedSteps.map((step) => {
          const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
          const Icon = config.icon;
          const canReview = step.status === 'submitted' || step.status === 'in_review';
          const isActing = acting === step.id;

          return (
            <div key={step.id} className="bg-white border border-sand-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{STEP_LABELS[step.step] || step.step}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      {step.submitted_at && (
                        <span className="text-[11px] text-[#a09383]">
                          Enviado: {new Date(step.submitted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {step.reviewed_at && (
                        <span className="text-[11px] text-[#a09383]">
                          Revisado: {new Date(step.reviewed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    {step.notes && (
                      <p className="text-xs text-[#7a6b5d] mt-2 bg-sand-50 rounded-lg p-2">{step.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step.file_url && (
                    <button
                      onClick={() => handleDownloadDoc(step)}
                      disabled={downloading === step.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#7a6b5d] hover:text-foreground px-2.5 py-1.5 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors disabled:opacity-50"
                    >
                      <Download size={13} />
                      {downloading === step.id ? '...' : 'Ver doc'}
                    </button>
                  )}
                  {canReview && (
                    <>
                      <button
                        onClick={() => handleStepAction(step.id, 'approve_step')}
                        disabled={isActing}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => setRejectStepId(step.id)}
                        disabled={isActing}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allApproved && orgStatus === 'verified' && (
        <div className="mt-6 bg-sage-50 border border-sage-200 rounded-2xl p-5 text-center">
          <CheckCircle className="w-8 h-8 text-sage-600 mx-auto mb-2" />
          <p className="font-semibold text-sage-800">Organizador completamente verificado</p>
          <p className="text-sm text-sage-700 mt-1">Sus eventos pueden ser aprobados y publicados.</p>
        </div>
      )}

      {/* Reject step modal */}
      {rejectStepId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRejectStepId(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl mb-3">Rechazar documento</h3>
            <p className="text-sm text-[#7a6b5d] mb-4">
              Indica el motivo del rechazo. El organizador podrá ver este mensaje y reenviar el documento.
            </p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Motivo del rechazo..."
              className="w-full border border-sand-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 resize-none h-24"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => { setRejectStepId(null); setRejectNotes(''); }}
                className="text-sm px-4 py-2 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleStepAction(rejectStepId, 'reject_step', rejectNotes)}
                disabled={acting === rejectStepId}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
