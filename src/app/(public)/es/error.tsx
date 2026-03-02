'use client';

// ============================================================================
// RETIRU · Error Boundary (ES)
// ============================================================================

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6 opacity-30">⚠️</div>
        <h2 className="font-serif text-2xl text-foreground mb-3">Algo ha fallado</h2>
        <p className="text-sm text-[#7a6b5d] leading-relaxed mb-6">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-terracotta-700 transition-colors"
          >
            Intentar de nuevo
          </button>
          <a
            href="/es"
            className="inline-flex items-center gap-2 bg-white border border-sand-300 text-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-sand-50 transition-colors"
          >
            Ir al inicio
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && error?.message && (
          <details className="mt-8 text-left bg-red-50 border border-red-200 rounded-xl p-4">
            <summary className="text-xs font-semibold text-red-600 cursor-pointer">Detalles del error (dev)</summary>
            <pre className="mt-2 text-xs text-red-800 whitespace-pre-wrap overflow-auto">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
