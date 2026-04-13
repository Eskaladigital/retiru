'use client';

import { Shield, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';

interface VerificacionBannerProps {
  organizerStatus: string;
  progress: { submitted: number; approved: number; total: number };
}

export function VerificacionBanner({ organizerStatus, progress }: VerificacionBannerProps) {
  const isRejected = organizerStatus === 'rejected';
  const isSuspended = organizerStatus === 'suspended';

  if (isRejected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Perfil rechazado</p>
            <p className="text-sm text-red-700 mt-1">
              Tu perfil de organizador ha sido rechazado. Revisa los motivos en tu documentación y vuelve a enviar los documentos corregidos.
            </p>
            <Link
              href="/es/panel/verificacion"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800 mt-2"
            >
              Revisar documentación →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Perfil suspendido</p>
            <p className="text-sm text-red-700 mt-1">
              Tu perfil de organizador ha sido suspendido. Contacta con el equipo de Retiru para más información.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pct = progress.total > 0 ? Math.round((progress.approved / progress.total) * 100) : 0;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          {progress.submitted === progress.total ? (
            <Clock className="w-5 h-5 text-amber-600" />
          ) : (
            <Shield className="w-5 h-5 text-amber-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-amber-900">
            {progress.submitted === progress.total
              ? 'Verificación en proceso'
              : 'Pendiente de homologación'}
          </p>
          <p className="text-sm text-amber-800 mt-1">
            {progress.submitted === progress.total
              ? 'Toda tu documentación ha sido enviada. Nuestro equipo la revisará lo antes posible.'
              : 'Sube toda la documentación requerida para que nuestro equipo pueda verificar tu perfil. Mientras tanto, puedes crear eventos, pero solo serán revisados y aprobados una vez tu perfil esté verificado.'}
          </p>

          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-amber-700">{progress.approved} de {progress.total} documentos aprobados</span>
              <span className="font-semibold text-amber-800">{pct}%</span>
            </div>
            <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <Link
            href="/es/panel/verificacion"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 hover:text-amber-900 mt-3"
          >
            {progress.submitted < progress.total ? 'Subir documentación →' : 'Ver estado de verificación →'}
          </Link>
        </div>
      </div>
    </div>
  );
}
