import { Shield, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Datos personales',
    description: 'Nombre completo, dirección y datos de contacto.',
    status: 'completed' as const,
  },
  {
    id: 2,
    title: 'Documento de identidad',
    description: 'DNI, NIE o pasaporte. Ambas caras del documento.',
    status: 'completed' as const,
  },
  {
    id: 3,
    title: 'Datos fiscales',
    description: 'NIF/CIF, dirección fiscal y datos de facturación.',
    status: 'pending' as const,
  },
  {
    id: 4,
    title: 'Datos bancarios',
    description: 'IBAN donde recibirás los pagos del 80% de tus asistentes.',
    status: 'locked' as const,
  },
];

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: 'text-sage-600', bg: 'bg-sage-100', label: 'Completado' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pendiente' },
  in_review: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'En revisión' },
  locked: { icon: AlertCircle, color: 'text-[#a09383]', bg: 'bg-sand-100', label: 'Bloqueado' },
};

export default function VerificacionPage() {
  const completedSteps = STEPS.filter(s => s.status === 'completed').length;
  const progress = Math.round((completedSteps / STEPS.length) * 100);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Verificación</h1>
        <p className="text-sm text-[#7a6b5d] mt-1">Completa la verificación para poder publicar retiros en Retiru.</p>
      </div>

      {/* Progress */}
      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-terracotta-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Estado de verificación</p>
              <p className="text-xs text-[#a09383]">{completedSteps} de {STEPS.length} pasos completados</p>
            </div>
          </div>
          <span className="text-lg font-bold text-terracotta-600">{progress}%</span>
        </div>
        <div className="h-3 bg-sand-200 rounded-full overflow-hidden">
          <div className="h-full bg-terracotta-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        {progress < 100 && (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 rounded-lg p-3">
            Necesitas completar todos los pasos para poder publicar retiros. Los datos se revisan en 24-48h.
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step) => {
          const config = STATUS_CONFIG[step.status];
          const Icon = config.icon;
          const isActionable = step.status === 'pending';

          return (
            <div key={step.id} className={`bg-white border rounded-2xl p-6 transition-all ${isActionable ? 'border-terracotta-300 shadow-soft' : 'border-sand-200'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">Paso {step.id}: {step.title}</h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#7a6b5d] mb-3">{step.description}</p>

                  {isActionable && (
                    <div className="flex gap-3">
                      <button className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-terracotta-700 transition-colors">
                        <Upload className="w-4 h-4" /> Completar paso
                      </button>
                    </div>
                  )}

                  {step.status === 'completed' && (
                    <p className="text-xs text-sage-600 font-medium">Verificado correctamente</p>
                  )}

                  {step.status === 'locked' && (
                    <p className="text-xs text-[#a09383]">Completa los pasos anteriores para desbloquear</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help */}
      <div className="mt-8 bg-sand-100 rounded-2xl p-6 text-center">
        <p className="text-sm text-[#7a6b5d] mb-2">¿Tienes dudas sobre el proceso de verificación?</p>
        <a href="/es/ayuda" className="text-sm font-semibold text-terracotta-600 hover:underline">Consultar centro de ayuda →</a>
      </div>
    </div>
  );
}
