'use client';

import { useState } from 'react';

export function GenerateDescriptionsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    processed: number;
    results: { name: string; status: string; description?: string; error?: string }[];
  } | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/generate-center-descriptions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar');
      setResult(data);
    } catch (err) {
      setResult({
        processed: 0,
        results: [{ name: '', status: 'error', error: err instanceof Error ? err.message : String(err) }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-sage-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-sage-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Generando con IA...
          </>
        ) : (
          <>
            <span>✨</span>
            Generar descripciones con IA
          </>
        )}
      </button>
      {result && (
        <div className="rounded-xl border border-sand-200 bg-white p-4 text-sm">
          <p className="font-semibold text-foreground mb-2">
            {result.processed === 0
              ? 'Todos los centros ya tienen descripción.'
              : `Procesados: ${result.results.filter((r) => r.status === 'ok').length} OK, ${result.results.filter((r) => r.status === 'error').length} errores`}
          </p>
          {result.results.length > 0 && (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {result.results.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={r.status === 'ok' ? 'text-sage-600' : 'text-red-600'}>
                    {r.status === 'ok' ? '✓' : '✗'}
                  </span>
                  <span>
                    {r.name || 'Error'}: {r.status === 'ok' ? 'Descripción generada' : r.error}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
